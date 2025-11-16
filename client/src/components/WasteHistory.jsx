import { useState, useEffect } from 'react';
import { getWasteHistory } from '../services/api';
import { format } from 'date-fns';

function WasteHistory({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [refreshKey]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getWasteHistory({ limit: 50 });
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Failed to load waste history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Loading waste history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No waste entries yet
        </h3>
        <p className="text-gray-600">
          Start tracking food waste by uploading your first photo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Waste History
      </h2>
      
      <div className="grid gap-4">
        {history.map(entry => (
          <div
            key={entry.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <img
                  src={`http://localhost:3001${entry.image_path}`}
                  alt="Waste entry"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(new Date(entry.timestamp), 'PPp')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Entry #{entry.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">
                      ${parseFloat(entry.total_estimated_value || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Estimated Value</div>
                  </div>
                </div>

                {entry.items && entry.items.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm text-gray-700">Items Wasted:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          {item.name}
                          {item.estimatedValue && (
                            <span className="ml-1">(${parseFloat(item.estimatedValue).toFixed(2)})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.estimated_weight && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Weight:</strong> {entry.estimated_weight}
                  </div>
                )}

                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {entry.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WasteHistory;






