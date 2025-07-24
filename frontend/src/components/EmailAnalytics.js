import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Mail,
  Send,
  Eye,
  MousePointer,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EmailAnalytics = () => {
  const { apiKey } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (apiKey) {
      fetchAnalytics();
      fetchEmails();
    }
  }, [apiKey, timeRange, statusFilter]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/v1/emails?limit=50`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
    setLoading(false);
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
      delivered: 'text-green-600 bg-green-100',
      bounced: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      sent: Send,
      queued: Calendar,
      processing: Activity,
      failed: AlertTriangle,
      delivered: Mail,
      bounced: TrendingDown
    };
    return icons[status] || Mail;
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please configure your API key to view analytics</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Email Analytics</h1>
              <p className="text-gray-600">Track your email performance and engagement</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {loading && !analytics ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Emails"
                  value={analytics.total_emails}
                  change={12}
                  icon={Mail}
                  color="blue"
                />
                <StatCard
                  title="Sent"
                  value={analytics.sent_emails}
                  change={8}
                  icon={Send}
                  color="green"
                />
                <StatCard
                  title="Delivery Rate"
                  value={`${analytics.delivery_rate}%`}
                  change={-2}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="Bounce Rate"
                  value={`${analytics.bounce_rate}%`}
                  change={-5}
                  icon={AlertTriangle}
                  color="red"
                />
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Email Volume Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Email Volume</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization coming soon</p>
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                  <PieChart className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Recent Emails</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 text-gray-400 mr-2" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                        <option value="bounced">Bounced</option>
                        <option value="queued">Queued</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : emails.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No emails found</p>
                        </td>
                      </tr>
                    ) : (
                      emails.map((email) => {
                        const StatusIcon = getStatusIcon(email.status);
                        return (
                          <tr key={email.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{email.subject}</div>
                              <div className="text-sm text-gray-500">
                                {email.tags.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                    {email.tags[0]}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{email.recipients[0]?.email}</div>
                              {email.recipients.length > 1 && (
                                <div className="text-sm text-gray-500">+{email.recipients.length - 1} more</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {email.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(email.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {email.open_count || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <MousePointer className="h-4 w-4 mr-1" />
                                {email.click_count || 0}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EmailAnalytics;