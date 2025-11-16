function Suggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-6xl mb-4">💡</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No suggestions yet
        </h3>
        <p className="text-gray-600">
          Start tracking food waste to receive AI-powered suggestions!
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'portion_adjustment':
        return '🍽️';
      case 'menu_change':
        return '📝';
      case 'trend_alert':
        return '⚠️';
      case 'best_practice':
        return '💡';
      default:
        return '📌';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          AI Suggestions
        </h2>
        <div className="text-sm text-gray-600">
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              suggestion.priority === 'high' ? 'border-red-500' :
              suggestion.priority === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getTypeIcon(suggestion.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {suggestion.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}
                  >
                    {suggestion.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">
              {suggestion.description}
            </p>

            {suggestion.estimatedSavings && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">Estimated Savings:</span>
                <span className="text-green-600 font-medium">
                  {suggestion.estimatedSavings}
                </span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Type:</span> {suggestion.type.replace('_', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-green-900 mb-2">
          💚 How These Suggestions Work
        </h3>
        <p className="text-sm text-green-800">
          Our AI analyzes your waste patterns over time to identify trends and provide actionable recommendations. 
          Suggestions are prioritized based on potential impact and frequency of waste. 
          Review these regularly and implement changes to reduce food waste and save money!
        </p>
      </div>
    </div>
  );
}

export default Suggestions;






