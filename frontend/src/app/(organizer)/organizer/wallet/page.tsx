'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Clock, CreditCard as CreditCardIcon, History, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import OrganizerLayout from '@/components/layout/organizer-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from '@/components/wallet/credit-card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';

interface BalanceData {
  balance: {
    id: string;
    organizerId: string;
    balance: number;
    pendingBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    balance: number;
    pendingBalance: number;
    availableBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    recentTransactionsCount: number;
  };
}

export default function WalletPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }
    }
  }, [isInitialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBalance();
    }
  }, [isAuthenticated, user]);

  // Refresh balance when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user) {
        fetchBalance();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && user) {
        fetchBalance();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user]);

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getBalance();
      if (response.success) {
        setBalanceData(response.data);
      } else {
        setError(response.message || 'Failed to fetch balance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isInitialized || isLoading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </OrganizerLayout>
    );
  }

  if (error) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load wallet</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Button onClick={fetchBalance} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  if (!balanceData) {
    return null;
  }

  const { stats } = balanceData;

  return (
    <OrganizerLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Wallet</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of your earnings and payouts</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/organizer/wallet/transactions')}
              className="h-9 text-sm font-medium"
            >
              Transactions
            </Button>
            <Button
              onClick={() => router.push('/organizer/wallet/withdraw')}
              className="h-9 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white"
            >
              Withdraw Funds
            </Button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Card */}
          <div className="lg:col-span-1">
            <CreditCard
              balance={balanceData?.stats?.availableBalance || balanceData?.balance?.balance || 0}
              cardHolder={(user as any)?.name || 'Organizer'}
            />
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Total Earned */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    Lifetime
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Earned</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 tracking-tight">
                    {balanceData?.stats?.totalEarned !== undefined
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(balanceData.stats.totalEarned)
                      : 'Rp 0'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Total Withdrawn */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <CreditCardIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                    Completed
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Withdrawn</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 tracking-tight">
                    {balanceData?.stats?.totalWithdrawn !== undefined
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(balanceData.stats.totalWithdrawn)
                      : 'Rp 0'}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Status */}
        <Card className="shadow-sm border-gray-200 flex flex-col justify-center">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Next Payout</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Manual</span>
            </div>
            <Separator />
            <div className="space-y-3">
              <Link
                href="/organizer/wallet/payout-accounts"
                className="flex items-center justify-between group p-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
                    <CreditCardIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Payout Methods</span>
                    <span className="text-xs text-gray-500">Manage bank accounts</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </Link>

              <Link
                href="/organizer/wallet/transactions"
                className="flex items-center justify-between group p-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">History</span>
                    <span className="text-xs text-gray-500">View all transactions</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900" onClick={() => router.push('/organizer/wallet/transactions')}>
            View All
          </Button>
        </div>

        <Card className="shadow-sm border-gray-200 overflow-hidden">
          {stats.recentTransactionsCount > 0 ? (
            <div className="divide-y divide-gray-100">
              {/* We would map actual transactions here if we had them in the payload, 
                    for now we show a placeholder or summary since the API only returns counts/stats in this endpoint */}
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Recent Transactions</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  You have {stats.recentTransactionsCount} transactions. View your full history to see details.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/organizer/wallet/transactions')}
                >
                  View Transaction History
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                <TrendingUp className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">No transactions yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                When you sell tickets, your earnings will appear here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </OrganizerLayout>
  );
}
