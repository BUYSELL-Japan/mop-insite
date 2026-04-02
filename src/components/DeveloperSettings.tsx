import React, { useState, useEffect } from 'react';
import { Lock, X, CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { validateEnv, createGeoJsonUrl } from '../utils/envValidation';

const DEFAULT_GEOJSON_URL = validateEnv().VITE_GEOJSON_URL;

interface DeveloperSettingsProps {
  currentUrl: string;
  onUpdate: (newUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  bucketName: string;
  objectUrl: string;
}

const INITIAL_FORM_STATE: FormState = {
  bucketName: '',
  objectUrl: DEFAULT_GEOJSON_URL
};

const CORRECT_PASSWORD = 'bigringer2010';
const SUCCESS_MESSAGE_DURATION = 2000;

export default function DeveloperSettings({ 
  currentUrl, 
  onUpdate, 
  isOpen, 
  onClose 
}: DeveloperSettingsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);

  const resetForm = () => {
    setPassword('');
    setError(null);
    setSuccess(false);
    setFormData(INITIAL_FORM_STATE);
    setIsAuthenticated(false);
    
    try {
      localStorage.removeItem('geojsonUrl');
    } catch (err) {
      console.error('Failed to clear local storage:', err);
    }
  };

  const handleAuthentication = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
      
      try {
        const url = new URL(currentUrl);
        setFormData({
          bucketName: '',
          objectUrl: currentUrl
        });
      } catch {
        setFormData(INITIAL_FORM_STATE);
      }
    } else {
      setError('Incorrect password');
    }
  };

  const validateFormData = (): boolean => {
    if (!formData.objectUrl.trim()) {
      setError('Please fill in all fields');
      return false;
    }

    try {
      new URL(formData.objectUrl);
    } catch {
      setError('Invalid URL format');
      return false;
    }

    return true;
  };

  const validateGeoJSON = async (data: unknown): Promise<boolean> => {
    if (!data || typeof data !== 'object' || !('features' in data) || !Array.isArray((data as any).features)) {
      throw new Error('Invalid GeoJSON format');
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateFormData()) return;

    try {
      const url = createGeoJsonUrl(formData.objectUrl);

      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to access URL: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      await validateGeoJSON(data);
      
      onUpdate(formData.objectUrl);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        resetForm();
      }, SUCCESS_MESSAGE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate URL');
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      objectUrl: url
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Developer Settings
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleAuthentication} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter developer password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Authenticate
            </button>
          </form>
        ) : (
          <>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                Current Configuration
              </h3>
              <p className="text-xs text-gray-600 break-all">
                <span className="font-medium">URL:</span> {DEFAULT_GEOJSON_URL}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="objectUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  New GeoJSON URL
                </label>
                <input
                  type="url"
                  id="objectUrl"
                  value={formData.objectUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/data.geojson"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the full URL to your GeoJSON file
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Map data updated successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Map Data
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}