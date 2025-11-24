'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Filter, Download, Wallet, CreditCard, X, RotateCw } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BalanceTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string | null;
  description: string;
  createdAt: string;
}

interface Disbursement {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  payoutAccount: {
    id: string;
    accountType: 'BANK_ACCOUNT' | 'E_WALLET';
    accountName: string;
    accountNumber: string;
    bankCode?: string;
    eWalletType?: string;
  };
}

type TabType = 'payouts' | 'balance';

export default function TransactionsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('payouts');
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (activeTab === 'payouts') {
      fetchDisbursements();
    } else {
      fetchTransactions();
    }
  }, [isAuthenticated, user, pagination.page, filters, activeTab]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await ApiService.getBalanceHistory(params);
      if (response.success) {
        setTransactions(response.data.transactions || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDisbursements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await ApiService.getDisbursementHistory(params);
      if (response.success) {
        setDisbursements(response.data.disbursements || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError(response.message || 'Failed to fetch disbursements');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch disbursements');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (activeTab === 'balance') {
        // Export balance transactions
        await ApiService.exportTransactionHistory(format, {
          type: filters.type || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
      } else {
        // TODO: Export disbursements (will be implemented in next phase)
        alert('Export for payout requests will be available soon');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export transactions');
    }
  };

  const handleCancelPayout = async (disbursementId: string) => {
    if (!confirm('Are you sure you want to cancel this payout request? The balance will be unlocked and available for withdrawal again.')) {
      return;
    }

    try {
      setCancellingId(disbursementId);
      setError(null);
      
      const response = await ApiService.cancelDisbursement(disbursementId);
      
      if (response.success) {
        // Refresh disbursements list
        await fetchDisbursements();
        // Show success message (optional)
        alert('Payout request cancelled successfully. Your balance has been unlocked.');
      } else {
        setError(response.message || 'Failed to cancel payout request');
      }
    } catch (err: any) {
      console.error('Cancel payout error:', err);
      setError(err.message || 'Failed to cancel payout request');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRetryPayout = async (disbursementId: string) => {
    if (!confirm('Are you sure you want to retry this failed payout? The balance will be locked again and the payout will be processed.')) {
      return;
    }

    try {
      setRetryingId(disbursementId);
      setError(null);
      
      const response = await ApiService.retryDisbursement(disbursementId);
      
      if (response.success) {
        // Refresh disbursements list
        await fetchDisbursements();
        // Show success message
        alert('Payout retry initiated successfully. The payout is being processed.');
      } else {
        setError(response.message || 'Failed to retry payout');
      }
    } catch (err: any) {
      console.error('Retry payout error:', err);
      setError(err.message || 'Failed to retry payout');
    } finally {
      setRetryingId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-green-600 bg-green-50';
      case 'DEBIT':
        return 'text-red-600 bg-red-50';
      case 'ADJUSTMENT':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getAccountDisplay = (disbursement: Disbursement) => {
    if (disbursement.payoutAccount.accountType === 'BANK_ACCOUNT') {
      return `${disbursement.payoutAccount.accountName} - ${disbursement.payoutAccount.accountNumber}`;
    } else {
      return `${disbursement.payoutAccount.eWalletType} - ${disbursement.payoutAccount.accountNumber}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/organizer/wallet"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="mt-2 text-gray-600">View all your payout requests and balance transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('payouts');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === 'payouts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Payout Requests</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('balance');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === 'balance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>Balance Transactions</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={isLoading || (activeTab === 'payouts' ? disbursements.length === 0 : transactions.length === 0)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={isLoading || (activeTab === 'payouts' ? disbursements.length === 0 : transactions.length === 0)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'payouts' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                      setFilters({ ...filters, startDate: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      setFilters({ ...filters, endDate: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({ ...filters, type: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="CREDIT">Credit</option>
                    <option value="DEBIT">Debit</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                      setFilters({ ...filters, startDate: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      setFilters({ ...filters, endDate: e.target.value });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {activeTab === 'payouts' ? 'payout requests' : 'transactions'}...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : activeTab === 'payouts' ? (
            disbursements.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No payout requests found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {disbursements.map((disbursement) => (
                        <tr key={disbursement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(disbursement.requestedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                -{formatCurrency(disbursement.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getAccountDisplay(disbursement)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(disbursement.status)}`}>
                              {disbursement.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {disbursement.failureReason || (disbursement.completedAt ? `Completed on ${formatDate(disbursement.completedAt)}` : '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {disbursement.status === 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelPayout(disbursement.id)}
                                  disabled={cancellingId === disbursement.id || retryingId === disbursement.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  {cancellingId === disbursement.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3 h-3 mr-1" />
                                      Cancel
                                    </>
                                  )}
                                </Button>
                              )}
                              {disbursement.status === 'FAILED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRetryPayout(disbursement.id)}
                                  disabled={retryingId === disbursement.id || cancellingId === disbursement.id}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                >
                                  {retryingId === disbursement.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                      Retrying...
                                    </>
                                  ) : (
                                    <>
                                      <RotateCw className="w-3 h-3 mr-1" />
                                      Retry
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {transaction.type === 'CREDIT' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(transaction.balanceAfter)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

