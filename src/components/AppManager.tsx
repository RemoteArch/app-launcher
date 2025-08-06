import { useState, useEffect } from 'react';
import { appConfig, type WebAppConfig } from '../services/AppConfig';
import { Capacitor } from '@capacitor/core';

interface AppManagerProps {
  onSelectApp: (app: WebAppConfig) => void;
}

const AppManager: React.FC<AppManagerProps> = ({ onSelectApp }) => {
  const [apps, setApps] = useState<WebAppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load app configurations on component mount
  useEffect(() => {
    try {
      const availableApps = appConfig.getApps();
      console.log(availableApps);
      setApps(availableApps);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load app configurations');
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">App Launcher</h1>
      </header>
      
      {loading ? (
        <div className="flex justify-center items-center flex-grow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700">Loading apps...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center flex-grow">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 flex-grow">
            {apps.map(app => (
              <div 
                key={app.id} 
                className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectApp(app)}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl mb-3">
                  {app.icon ? (
                    <img src={app.icon} alt={app.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{app.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="font-medium text-gray-800 text-center">{app.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {app.allowedMethods.length > 0 && (
                    <span>{app.allowedMethods.length} allowed methods</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              This launcher allows you to run web applications with access to native device features.
              Select an app to launch it.
            </p>
            {Capacitor.isNativePlatform() ? (
              <p className="text-xs text-green-600 font-medium">
                Running on {Capacitor.getPlatform()} platform with App plugin
              </p>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                Running in browser mode. Native features may not work.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AppManager;
