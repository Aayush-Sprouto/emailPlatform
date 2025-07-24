import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  ArrowLeft,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Calendar,
  Activity,
  Shield,
  Settings
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ApiKeyManager = () => {
  const { apiKey: currentApiKey, updateApiKey } = useContext(AuthContext);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (currentApiKey) {
      fetchApiKeys();
    }
  }, [currentApiKey]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/api-keys`, {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
    setLoading(false);
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/api-keys?name=${encodeURIComponent(newKeyName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewKeyResult(data);
        setNewKeyName('');
        fetchApiKeys();
      } else {
        alert('Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Error creating API key');
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchApiKeys();
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Error deleting API key');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please configure your API key to manage keys</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Key Management</h1>
              <p className="text-gray-600">Manage your API keys and access tokens</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Key
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Security Best Practices</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Keep your API keys secure and never share them publicly. Delete unused keys regularly and rotate them periodically.
              </p>
            </div>
          </div>
        </div>

        {/* Current API Key Info */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Current Active Key</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">You are currently authenticated with:</p>
                <div className="flex items-center mt-2">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                    {currentApiKey.substring(0, 12)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(currentApiKey, 'Current key')}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    title="Copy current API key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copySuccess === 'Current key' && (
                    <span className="ml-2 text-sm text-green-600">Copied!</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
              <span className="text-sm text-gray-500">{apiKeys.length} keys</span>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No API keys found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first API key
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <div key={key.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Key className="h-4 w-4 text-gray-400 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">{key.name}</h4>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(key.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Last Used:</span> {formatDate(key.last_used)}
                        </div>
                        <div>
                          <span className="font-medium">Permissions:</span> {key.permissions?.join(', ') || 'Default'}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {key.permissions?.map(permission => (
                          <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete API key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            
            <form onSubmit={createApiKey}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, Development, Mobile App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name to help identify this key's purpose
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setNewKeyResult(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Result Modal */}
      {newKeyResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mt-2">API Key Created!</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Important Security Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This is the only time you'll see this key. Copy it now and store it securely.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your New API Key
              </label>
              <div className="flex items-center">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {newKeyResult.key}
                </code>
                <button
                  onClick={() => copyToClipboard(newKeyResult.key, 'New key')}
                  className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Copy API key"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copySuccess === 'New key' && (
                <p className="text-sm text-green-600 mt-1">Copied to clipboard!</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setNewKeyResult(null);
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                I've Saved The Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;