import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  Mail, 
  PenTool, 
  BarChart3, 
  Key, 
  FileText,
  Send,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Eye
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { apiKey, updateApiKey } = useContext(AuthContext);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [tempApiKey, setTempApiKey] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Navigation items
  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/', active: true },
    { name: 'Email Builder', icon: PenTool, path: '/builder' },
    { name: 'Templates', icon: FileText, path: '/templates' },
    { name: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { name: 'API Keys', icon: Key, path: '/api-keys' },
  ];

  const fetchData = async () => {
    if (!apiKey) return;
    
    setLoading(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      // Fetch analytics
      const analyticsResponse = await axios.get(`${BACKEND_URL}/api/v1/analytics/overview`, { headers });
      setAnalytics(analyticsResponse.data);

      // Fetch recent emails
      const emailsResponse = await axios.get(`${BACKEND_URL}/api/v1/emails?limit=5`, { headers });
      setRecentEmails(emailsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        setShowApiKeyInput(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (apiKey) {
      fetchData();
    }
  }, [apiKey]);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      updateApiKey(tempApiKey.trim());
      setShowApiKeyInput(false);
      setTempApiKey('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'text-green-600 bg-green-100',
      queued: 'text-blue-600 bg-blue-100',
      processing: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
      delivered: 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">EmailPlatform</h1>
            <p className="text-gray-600">Enter your API key to get started</p>
          </div>
          
          <form onSubmit={handleApiKeySubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="ep_xxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Demo API Key:</strong><br />
              <code className="text-xs">ep_yl3J8t1W-xhke-pHR6rAa2qkV9QuwiGgQzPPsuDq_jc</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Mail className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">EmailPlatform</h1>
        </div>
        
        <nav className="mt-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                item.active
                  ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">Welcome back! Here's your email platform overview.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/builder')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Email
              </button>
              <Settings className="h-6 w-6 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Send className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Emails</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.total_emails}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.delivery_rate}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Sent This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.quota_used}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Quota Usage</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.quota_percentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Emails */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent Emails</h3>
                    <Link to="/analytics" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All
                    </Link>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {recentEmails.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No emails sent yet</p>
                      <button
                        onClick={() => navigate('/builder')}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Send your first email
                      </button>
                    </div>
                  ) : (
                    recentEmails.map((email) => (
                      <div key={email.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                            <p className="text-sm text-gray-600">
                              To: {email.recipients[0]?.email} 
                              {email.recipients.length > 1 && ` +${email.recipients.length - 1} more`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                              {email.status}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(email.created_at)}</span>
                            <Eye className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;