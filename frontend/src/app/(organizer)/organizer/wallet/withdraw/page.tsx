'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Wallet, Building2, CreditCard as CreditCardIcon, Plus, Loader2 } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import OrganizerLayout from '@/components/layout/organizer-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from '@/components/wallet/credit-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayoutAccount {
  id: string;
  accountType: 'BANK_ACCOUNT' | 'E_WALLET';
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  eWalletType?: string;
  isDefault: boolean;
}

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

export default function WithdrawPage() {
  console.log('🟡 COMPONENT RENDERED');

  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    payoutAccountId: '',
    amount: '',
  });
  const [amountValue, setAmountValue] = useState<number | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<{
    baseFee: number;
    ppn: number;
    totalFee: number;
    netAmount: number;
  } | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);

  const MIN_PAYOUT = 50000;

  // Calculate available balance (must be defined before useEffect)
  const availableBalance = balanceData?.stats?.availableBalance || balanceData?.balance?.balance || 0;

  // Debug: Log amountValue changes
  useEffect(() => {
    console.log('🔵 amountValue changed:', amountValue);
  }, [amountValue]);

  // Fetch fee estimate when amount changes
  useEffect(() => {
    const fetchFeeEstimate = async () => {
      // Only fetch if amount is valid and within limits
      if (!amountValue || amountValue < MIN_PAYOUT) {
        setFeeEstimate(null);
        return;
      }

      if (availableBalance > 0 && amountValue > availableBalance) {
        setFeeEstimate(null);
        return;
      }

      try {
        setIsLoadingFee(true);
        console.log('💰 Fetching fee estimate for amount:', amountValue);
        const response = await ApiService.getFeeEstimate(amountValue);
        console.log('💰 Fee estimate response:', response);

        if (response.success && response.data?.fee) {
          setFeeEstimate(response.data.fee);
          console.log('✅ Fee estimate set:', response.data.fee);
        } else {
          console.warn('⚠️ Fee estimate response invalid:', response);
          setFeeEstimate(null);
        }
      } catch (error) {
        console.error('❌ Error fetching fee estimate:', error);
        setFeeEstimate(null);
      } finally {
        setIsLoadingFee(false);
      }
    };

    // Debounce fee calculation (500ms)
    const timeoutId = setTimeout(() => {
      fetchFeeEstimate();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [amountValue, availableBalance]);

  // Debug: Log component mount
  useEffect(() => {
    console.log('🟡 COMPONENT MOUNTED');
    console.log('🟡 User:', user?.email);
    console.log('🟡 isAuthenticated:', isAuthenticated);
    console.log('🟡 isInitialized:', isInitialized);
    return () => {
      console.log('🟡 COMPONENT UNMOUNTED');
    };
  }, []);

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
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [balanceRes, accountsRes] = await Promise.all([
        ApiService.getBalance(),
        ApiService.getPayoutAccounts(),
      ]);

      if (balanceRes.success) {
        setBalanceData(balanceRes.data);
      }
      if (accountsRes.success) {
        const accountsList = accountsRes.data.accounts || [];
        setAccounts(accountsList);
        // Set default account if available
        const defaultAccount = accountsList.find((a: PayoutAccount) => a.isDefault);
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, payoutAccountId: defaultAccount.id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔵 HANDLE SUBMIT CALLED - BEFORE PREVENT DEFAULT');
    e.preventDefault();
    console.log('🔵 FORM SUBMIT TRIGGERED - AFTER PREVENT DEFAULT');
    console.log('🔵 Form data:', formData);
    console.log('🔵 Amount value:', amountValue);
    console.log('🔵 Available balance:', availableBalance);

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      console.log('🔵 Step 1: Validation started');

      const amount = amountValue || parseFormattedNumber(formData.amount);
      console.log('🔵 Step 2: Amount parsed:', amount);

      if (!amount || amount < MIN_PAYOUT) {
        console.log('❌ Validation failed: Amount too low');
        setError(`Minimum payout amount is Rp ${MIN_PAYOUT.toLocaleString('id-ID')}`);
        setIsSubmitting(false);
        return;
      }

      if (amount > availableBalance) {
        console.log('❌ Validation failed: Amount exceeds balance');
        setError(`Amount cannot exceed available balance of ${formatCurrency(availableBalance)}`);
        setIsSubmitting(false);
        return;
      }

      if (!formData.payoutAccountId) {
        console.log('❌ Validation failed: No payout account selected');
        setError('Please select a payout account');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ All validations passed');

      // Ensure amount is a number, not a formatted string
      const numericAmount = typeof amount === 'string' ? parseFormattedNumber(amount) : amount;

      console.log('🚀 Requesting payout:', {
        payoutAccountId: formData.payoutAccountId,
        amount: numericAmount,
        originalAmount: amount,
        amountType: typeof amount
      });

      console.log('🚀 API call starting...');
      const response = await ApiService.requestPayout({
        payoutAccountId: formData.payoutAccountId,
        amount: numericAmount, // Send numeric value, not formatted string
      });

      console.log('📦 Payout response received:', response);

      if (response.success) {
        console.log('✅ Payout request SUCCESS!', response);
        console.log('✅ Setting success message...');
        setSuccess('Payout request submitted successfully! Redirecting to transactions...');
        setError(null); // Clear any previous errors
        setFormData({ payoutAccountId: formData.payoutAccountId, amount: '' });
        setAmountValue(null);

        // Refresh balance
        try {
          console.log('🔄 Refreshing balance...');
          const balanceRes = await ApiService.getBalance();
          if (balanceRes.success) {
            console.log('✅ Balance refreshed:', balanceRes.data);
            setBalanceData(balanceRes.data);
          } else {
            console.warn('⚠️ Balance refresh failed:', balanceRes);
          }
        } catch (balanceError) {
          console.error('❌ Error refreshing balance:', balanceError);
        }

        // Redirect to transactions page after 2 seconds
        console.log('🔄 Redirecting to transactions page in 2 seconds...');
        setTimeout(() => {
          console.log('🔄 Redirecting now...');
          router.push('/organizer/wallet/transactions');
        }, 2000);
      } else {
        const errorMessage = response.message || (response as any).error || 'Failed to submit payout request';
        console.error('❌ Payout error:', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Payout exception caught:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        responseData: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      const errorMessage = err.response?.data?.message || (err.response?.data as any)?.error || err.message || 'Failed to submit payout request';
      console.error('❌ Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('🔵 Form submit finished, setting isSubmitting to false');
      setIsSubmitting(false);
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

  // Format number to Indonesian format (10000 -> 100.000)
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';

    // Convert to number and format with dots as thousand separators
    const num = parseInt(numbers, 10);
    return num.toLocaleString('id-ID');
  };

  // Parse formatted string to number (100.000 -> 100000)
  const parseFormattedNumber = (value: string): number => {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔵 INPUT CHANGED:', e.target.value);
    const inputValue = e.target.value;
    const formatted = formatNumber(inputValue);
    const parsed = parseFormattedNumber(formatted);

    console.log('🔵 Formatted:', formatted, 'Parsed:', parsed);

    setFormData({ ...formData, amount: formatted });
    setAmountValue(parsed);
  };

  // Debug: Log available balance and button state
  useEffect(() => {
    console.log('🔵 Available balance:', availableBalance);
    console.log('🔵 Accounts:', accounts.length);
    console.log('🔵 Amount value:', amountValue);
    console.log('🔵 Form data:', formData);

    const isButtonDisabled = isSubmitting ||
      availableBalance < MIN_PAYOUT ||
      accounts.length === 0 ||
      !amountValue ||
      amountValue < MIN_PAYOUT ||
      amountValue > availableBalance;

    console.log('🔵 Button disabled?', isButtonDisabled);
    console.log('🔵 Disabled conditions:', {
      isSubmitting,
      'availableBalance < MIN_PAYOUT': availableBalance < MIN_PAYOUT,
      'accounts.length === 0': accounts.length === 0,
      '!amountValue': !amountValue,
      'amountValue < MIN_PAYOUT': amountValue ? amountValue < MIN_PAYOUT : 'N/A',
      'amountValue > availableBalance': amountValue ? amountValue > availableBalance : 'N/A',
    });
  }, [availableBalance, accounts.length, amountValue, formData, isSubmitting]);

  if (!isInitialized || isLoading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="pl-0 hover:pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900 mb-2"
            onClick={() => router.push('/organizer/wallet')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Request Payout</h1>
          <p className="text-gray-500 mt-1">Withdraw your earnings to your bank account or e-wallet</p>
        </div>

        {/* Balance Card */}
        <div className="mb-8">
          <CreditCard
            balance={availableBalance}
            cardHolder={(user as any)?.name || 'Organizer'}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-white border-green-200 text-green-800 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 font-medium">Success</AlertTitle>
            <AlertDescription>
              {success}
              <div className="mt-2">
                <Link href="/organizer/wallet/transactions" className="font-medium underline hover:text-green-900">
                  View payout history
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Payout Form */}
        <Card className="shadow-md border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl">Request Payout</CardTitle>
            <CardDescription>Withdraw your earnings to your bank account</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form
              onSubmit={(e) => {
                console.log('🟢 FORM ONSUBMIT TRIGGERED!');
                handleSubmit(e);
              }}
              className="space-y-8"
            >
              {/* Amount Input - Centered & Large */}
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-center block text-gray-500 font-medium">Enter Amount</Label>
                <div className="relative flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-400 mr-2">Rp</span>
                  <Input
                    id="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className="text-3xl sm:text-4xl font-bold text-gray-900 text-center border-none shadow-none focus-visible:ring-0 p-0 h-auto w-48 sm:w-64 placeholder:text-gray-200 bg-transparent"
                    placeholder="0"
                    required
                    autoComplete="off"
                  />
                </div>
                {/* Min/Max indicators */}
                <div className="flex justify-center gap-4 text-xs text-gray-400 font-medium">
                  <span>Min: {formatCurrency(MIN_PAYOUT)}</span>
                  <span className="text-gray-300">|</span>
                  <span>Max: {formatCurrency(availableBalance)}</span>
                </div>

                {/* Error Messages */}
                {amountValue && amountValue > 0 && (
                  <div className="text-center">
                    {amountValue < MIN_PAYOUT && (
                      <p className="text-sm text-red-500 font-medium bg-red-50 inline-block px-3 py-1 rounded-full">
                        Minimum amount is {formatCurrency(MIN_PAYOUT)}
                      </p>
                    )}
                    {amountValue > availableBalance && (
                      <p className="text-sm text-red-500 font-medium bg-red-50 inline-block px-3 py-1 rounded-full">
                        Amount exceeds available balance
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Account Selector - Grid Layout */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">Destination Account</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setFormData({ ...formData, payoutAccountId: account.id })}
                      className={cn(
                        "relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center space-x-3 group",
                        formData.payoutAccountId === account.id
                          ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        formData.payoutAccountId === account.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
                      )}>
                        {account.accountType === 'BANK_ACCOUNT' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <CreditCardIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate", formData.payoutAccountId === account.id ? "text-blue-900" : "text-gray-900")}>
                          {account.accountName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {account.accountType === 'BANK_ACCOUNT' ? account.accountNumber : account.eWalletType}
                        </p>
                      </div>
                      {account.isDefault && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Default</span>
                        </div>
                      )}
                      {formData.payoutAccountId === account.id && (
                        <div className="absolute bottom-2 right-2 text-blue-500">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Account Card */}
                  <div
                    onClick={() => router.push('/organizer/wallet/payout-accounts')}
                    className="p-4 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 min-h-[88px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Add New Account</span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown - Receipt Style */}
              {amountValue && amountValue >= MIN_PAYOUT && amountValue <= availableBalance && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative overflow-hidden">
                  {isLoadingFee ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  ) : feeEstimate ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Withdrawal Amount</span>
                        <span className="font-medium text-slate-700">{formatCurrency(amountValue)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Service Fee</span>
                        <span>{formatCurrency(feeEstimate.baseFee)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tax (11%)</span>
                        <span>{formatCurrency(feeEstimate.ppn)}</span>
                      </div>

                      <div className="my-3 border-b border-dashed border-slate-300" />

                      <div className="flex justify-between items-end">
                        <span className="font-medium text-slate-900">Total to Receive</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(feeEstimate.netAmount)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Info Alert */}
              <div className="bg-blue-50/50 rounded-xl p-4 flex gap-3 border border-blue-100/50">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900/80">
                  <p className="font-medium text-blue-900 mb-1">Important Note</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
                    <li>Payouts usually take 1-3 business days.</li>
                    <li>Ensure your account details are correct.</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => router.push('/organizer/wallet')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                  disabled={
                    isSubmitting ||
                    availableBalance < MIN_PAYOUT ||
                    accounts.length === 0 ||
                    !amountValue ||
                    amountValue < MIN_PAYOUT ||
                    amountValue > availableBalance
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    'Confirm Payout'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
}
