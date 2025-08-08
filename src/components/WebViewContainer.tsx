import { useEffect, useRef, useState } from 'react';
import app from '../services/appPlugin';
import { shakeDetector } from '../services/ShakeDetector';

interface WebViewContainerProps {
  url: string;
  onError?: (error: Error) => void;
  onLoadEnd?: () => void;
}

const WebViewContainer: React.FC<WebViewContainerProps> = ({ 
  url, 
  onError, 
  onLoadEnd 
}) => {
  const webViewRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShakeModal, setShowShakeModal] = useState(false);

  // Set up WebView and message handling
  useEffect(() => {
    if (!webViewRef.current) return;

    // Listen for messages from the WebView
    const handleMessage = async (event: MessageEvent) => {
      // Only process messages from our WebView
      if (event.source === webViewRef.current?.contentWindow) {
        if (typeof event.data === 'string') {
          try {
            const parsedMessage = JSON.parse(event.data);
            const { requestId, action, args = {} } = parsedMessage;
            console.log('Received message:', parsedMessage , app);
            if (!requestId || !action) return;

            try {
              const result = await (app as any)[action](args);
              sendResponse(requestId, result);
            } catch (error: any) {
              sendResponse(requestId, null, { 
                message: error.message || 'Unknown error',
                code: error.code 
              });
            }
          } catch (error) {
            console.error('Error processing WebView message:', error);
          }
        }
      }
    };

    // Function to send response back to WebView
    const sendResponse = (requestId: string, result?: any, error?: { message: string; code?: string }) => {
      if (!webViewRef.current?.contentWindow) {
        console.error('WebView reference not set');
        return;
      }

      try {
        const response = JSON.stringify({ requestId, result, error });
        webViewRef.current.contentWindow.postMessage(response, '*');
      } catch (error) {
        console.error('Error sending response to WebView:', error);
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);

    // Clean up on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [webViewRef]);

  // Set up shake detection using ShakeDetector service
  useEffect(() => {
    // Configure shake detector
    shakeDetector.updateOptions({
      threshold: 15,
      timeout: 1000,
      onShake: () => setShowShakeModal(true)
    });
    
    // Start shake detection
    shakeDetector.start();
    
    // Clean up on unmount
    return () => {
      shakeDetector.stop();
    };
  }, []);

  // Handle iframe load events
  const handleLoad = () => {
    setIsLoading(false);
    if (onLoadEnd) onLoadEnd();
    
    // Inject the communication bridge into the WebView
    if (webViewRef.current?.contentWindow) {
      try {
        const script = `
          // Create a bridge class for the web app to communicate with native features
          class AppBridgeClass {
            constructor() {
              this.requestCounter = 0;
              this.listeners = new Map();
              
              // Set up message listener
              window.addEventListener('message', (event) => {
                if (event.source === window.parent) {
                  try {
                    const response = JSON.parse(event.data);
                    if (response.requestId && this.listeners.has(response.requestId)) {
                      const callback = this.listeners.get(response.requestId);
                      this.listeners.delete(response.requestId);
                      
                      if (response.error) {
                        callback(response.error, null);
                      } else {
                        callback(null, response.result);
                      }
                    }
                  } catch (e) {
                    // Not a JSON message or not for us
                  }
                }
              });
            }
            
            call(method, args, callback) {
              const requestId = 'req_' + Date.now() + '_' + (this.requestCounter++);
              
              // Store the callback
              this.listeners.set(requestId, callback);
              
              // Send the request
              window.parent.postMessage(JSON.stringify({
                requestId: requestId,
                action: method,
                args: args
              }), '*');
            }
          }
          
          window.AppBridge = new AppBridgeClass();
          console.log('App bridge and plugin initialized', window.AppBridge);
          console.log(window.parent);
        `;
        
        // Inject the script into the iframe
        const iframeWindow = webViewRef.current.contentWindow;
        const scriptElem = iframeWindow.document.createElement('script');
        scriptElem.textContent = script;
        iframeWindow.document.head.appendChild(scriptElem);
      } catch (err) {
        console.error('Failed to inject bridge script:', err);
      }
    }
  };

  // Handle iframe error
  const handleError = () => {
    const errorMsg = `Failed to load URL: ${url}`;
    setError(errorMsg);
    setIsLoading(false);
    if (onError) onError(new Error(errorMsg));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-100 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <iframe
        ref={webViewRef}
        src={url}
        className={`w-full h-full border-none ${isLoading || error ? 'hidden' : 'block'}`}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
      
      {showShakeModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-20">
          <div className="bg-white rounded-xl p-6 max-w-[80%] shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Shake Detected!</h3>
            <p className="text-gray-600 mb-6">What would you like to do?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Reload
              </button>
              <button 
                onClick={() => setShowShakeModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebViewContainer;
