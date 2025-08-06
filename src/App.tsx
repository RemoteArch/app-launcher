import { useState } from 'react';
import WebViewContainer from './components/WebViewContainer';
import AppManager from './components/AppManager';
import { type WebAppConfig } from './services/AppConfig';

function App() {
  const [selectedApp, setSelectedApp] = useState<WebAppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Handle app selection
  const handleAppSelect = (app: WebAppConfig) => {
    setSelectedApp(app);
  };

  // Handle WebView errors
  const handleWebViewError = (error: Error) => {
    setError(`WebView error: ${error.message}`);
    setShowErrorModal(true);
    setSelectedApp(null);
  };

  // Close error modal
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {selectedApp ? (
            <WebViewContainer 
              url={selectedApp.url} 
              onError={handleWebViewError}
            />
      ) : (
        <AppManager onSelectApp={handleAppSelect} />
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Application Error</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseErrorModal}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Dismiss
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
