import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeFoodWaste(imagePath) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in your .env file. Please add it.');
    }

    // Read the image file
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 
                     imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                     'image/jpeg';

    const prompt = `Analyze this image of food waste. Identify:
1. All food items visible (be specific: e.g., "chicken breast", "mashed potatoes", "mixed vegetables")
2. Estimate the quantity/portion size wasted for each item
3. Assess the condition of the food (e.g., untouched, partially eaten, spoiled)
4. Provide insights on why this waste might have occurred

Respond in JSON format with this structure:
{
  "items": [
    {
      "name": "item name",
      "category": "main dish/side/appetizer/dessert",
      "estimatedAmount": "description of amount",
      "condition": "untouched/partially eaten/spoiled/expired",
      "estimatedValue": estimated value in USD
    }
  ],
  "totalEstimatedValue": total estimated value,
  "estimatedWaste": {
    "weight": "estimated weight in pounds/grams",
    "percentage": "estimated percentage of original portion"
  },
  "notes": "observations and potential reasons for waste"
}

IMPORTANT: Respond ONLY with valid JSON, no additional text before or after.`;

    // Try to list available models via REST API to see what's actually available
    let availableModels = [];
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        if (data.models) {
          availableModels = data.models.map(m => m.name.replace('models/', ''));
          console.log('Available models:', availableModels);
        }
      }
    } catch (err) {
      console.log('Could not list models via REST API, will try default names:', err.message);
    }
    
    // Use Gemini 1.5 Flash (faster) or 1.5 Pro (more accurate)
    // Try different model names if one doesn't work
    // For vision, use models that support multimodal input
    // Note: API key from AI Studio may have limited model access
    let modelNames = [];
    
    // If we got available models, filter to vision-capable ones
    if (availableModels.length > 0) {
      // Filter to models that support vision (typically contain 'pro' or 'flash')
      const visionModels = availableModels.filter(name => 
        (name.includes('pro') || name.includes('flash')) && !name.includes('embedding')
      );
      modelNames = visionModels.length > 0 ? visionModels : availableModels.slice(0, 3);
      console.log('Using models from API:', modelNames);
    } else {
      // Fallback to common model names - try both with and without versions
      modelNames = ['gemini-pro-vision', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-001'];
    }
    
    console.log('Trying models:', modelNames);
    
    let model;
    let lastError;
    let modelContent = null;
    
    // Try each model name until one works
    for (const modelName of modelNames) {
      try {
        // For vision, some models require different config
        const config = {
          model: modelName,
          generationConfig: {
            temperature: 0.4
          }
        };
        
        // Only add JSON response format for models that support it
        if (modelName.includes('1.5')) {
          config.generationConfig.responseMimeType = 'application/json';
        }
        
        model = genAI.getGenerativeModel(config);
        
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        };
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        modelContent = response.text();
        
        // If we get here, the model worked
        console.log(`Successfully used model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        console.log(`Model ${modelName} failed, trying next...`);
        // Try next model
        continue;
      }
    }
    
    // If all models failed, throw the last error
    if (!modelContent) {
      throw new Error(`All model attempts failed. Last error: ${lastError?.message || 'Unknown error'}. Tried models: ${modelNames.join(', ')}`);
    }
    
    const content = modelContent;
    
    // Parse JSON response
    let analysis;
    try {
      // Clean up any markdown code blocks if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', content);
      throw new Error('Failed to parse AI response. The AI did not return valid JSON.');
    }
    
    // Ensure required fields exist with defaults
    if (!analysis.items || !Array.isArray(analysis.items)) {
      analysis.items = [];
    }
    
    if (typeof analysis.totalEstimatedValue !== 'number') {
      analysis.totalEstimatedValue = analysis.items.reduce(
        (sum, item) => sum + (item.estimatedValue || 0), 
        0
      );
    }
    
    if (!analysis.estimatedWaste) {
      analysis.estimatedWaste = {
        weight: 'unknown',
        percentage: 'unknown'
      };
    }
    
    return analysis;
  } catch (error) {
    console.error('Error in AI vision analysis:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Please check your .env file and ensure GEMINI_API_KEY is set correctly. Get your key at https://aistudio.google.com/app/apikey');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('Gemini API quota exceeded. Please check your Google Cloud billing and add credits. Visit https://console.cloud.google.com/ to manage your quota.');
    } else if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('Gemini API access forbidden. Please check your API key permissions and enable the Generative AI API in Google Cloud Console.');
    } else if (error.message?.includes('400') || error.message?.includes('INVALID_ARGUMENT')) {
      throw new Error('Invalid request to Gemini API. Please check the image format and try again.');
    } else if (error.message?.includes('ENOENT')) {
      throw new Error('Image file not found. Please try uploading again.');
    } else if (error.message?.includes('GEMINI_API_KEY is not set')) {
      throw error;
    }
    
    throw new Error(`AI analysis failed: ${error.message || 'Unknown error occurred'}`);
  }
}