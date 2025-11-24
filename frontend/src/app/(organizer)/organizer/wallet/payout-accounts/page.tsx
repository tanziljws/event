'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Check, X, Building2, CreditCard, AlertCircle, MoreVertical } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import OrganizerLayout from '@/components/layout/organizer-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface PayoutAccount {
  id: string;
  accountType: 'BANK_ACCOUNT' | 'E_WALLET';
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  eWalletType?: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function PayoutAccountsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [eWallets, setEWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PayoutAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    accountType: 'BANK_ACCOUNT' as 'BANK_ACCOUNT' | 'E_WALLET',
    accountName: '',
    accountNumber: '',
    bankCode: '',
    eWalletType: '',
  });

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
      fetchAccounts();
      fetchAvailableOptions();
    }
  }, [isAuthenticated, user]);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getPayoutAccounts();
      if (response.success) {
        setAccounts(response.data.accounts || []);
      } else {
        setError(response.message || 'Failed to fetch accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableOptions = async () => {
    try {
      const [banksRes, eWalletsRes] = await Promise.all([
        ApiService.getAvailableBanks(),
        ApiService.getAvailableEWallets(),
      ]);
      if (banksRes.success) {
        setBanks(banksRes.data.banks || []);
      }
      if (eWalletsRes.success) {
        setEWallets(eWalletsRes.data.eWallets || []);
      }
    } catch (err) {
      console.error('Failed to fetch available options:', err);
    }
  };

  const handleOpenDialog = (account?: PayoutAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        accountType: account.accountType,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        bankCode: account.bankCode || '',
        eWalletType: account.eWalletType || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        accountType: 'BANK_ACCOUNT',
        accountName: '',
        accountNumber: '',
        bankCode: '',
        eWalletType: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingAccount) {
        await ApiService.updatePayoutAccount(editingAccount.id, formData);
      } else {
        await ApiService.createPayoutAccount(formData);
      }
      await fetchAccounts();
      setIsDialogOpen(false);
      setEditingAccount(null);
      setFormData({
        accountType: 'BANK_ACCOUNT',
        accountName: '',
        accountNumber: '',
        bankCode: '',
        eWalletType: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await ApiService.deletePayoutAccount(id);
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await ApiService.setDefaultPayoutAccount(id);
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to set default account');
    }
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

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Accounts</h1>
            <p className="text-gray-500 mt-1">Manage your bank and e-wallet accounts for payouts</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  account.accountType === 'BANK_ACCOUNT' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                )}>
                  {account.accountType === 'BANK_ACCOUNT' ? (
                    <Building2 className="w-6 h-6" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 -mr-2 -mt-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {!account.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(account.id)}>
                        <Check className="mr-2 h-4 w-4" /> Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleOpenDialog(account)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate" title={account.accountName}>
                    {account.accountName}
                  </h3>
                  {account.isDefault && (
                    <span className="shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {account.accountType === 'BANK_ACCOUNT' ? (
                    <>
                      {banks.find(b => b.code === account.bankCode)?.name || account.bankCode}
                    </>
                  ) : (
                    <>
                      {account.eWalletType}
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400 font-mono pt-1">
                  {account.accountNumber}
                </p>
              </div>

              {/* Verified Badge */}
              {account.isVerified && (
                <div className="absolute bottom-5 right-5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    <Check className="w-3 h-3" /> Verified
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Account Card */}
          <button
            onClick={() => handleOpenDialog()}
            className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 min-h-[180px] text-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Add New Account</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-[150px]">Link a bank account or e-wallet</p>
          </button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-visible gap-0 border-0 shadow-2xl bg-transparent">
            <div className="bg-white rounded-lg overflow-hidden w-full h-full flex flex-col">
              {/* Dynamic Header Background */}
              <div className="h-32 w-full bg-slate-950 relative flex items-center justify-center z-20 shrink-0">
                <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                {/* Live Preview Card */}
                <div className="relative w-[70%] shadow-2xl rounded-2xl z-30 mt-16">
                  <div className={cn(
                    "aspect-[1.586/1] rounded-2xl p-6 flex flex-col justify-between text-white relative overflow-hidden transition-colors duration-500 ring-1 ring-white/10",
                    formData.accountType === 'BANK_ACCOUNT'
                      ? "bg-gradient-to-br from-slate-800 to-slate-900"
                      : (formData.eWalletType === 'DANA' ? 'bg-gradient-to-br from-[#118EEA] to-[#0B63A5]' :
                        formData.eWalletType === 'OVO' ? 'bg-gradient-to-br from-[#4C3494] to-[#322261]' :
                          formData.eWalletType === 'GOPAY' ? 'bg-gradient-to-br from-[#00AED6] to-[#008CAC]' :
                            formData.eWalletType === 'SHOPEEPAY' ? 'bg-gradient-to-br from-[#EE4D2D] to-[#C23618]' :
                              formData.eWalletType === 'LINKAJA' ? 'bg-gradient-to-br from-[#E32026] to-[#B3191E]' : 'bg-gradient-to-br from-blue-600 to-blue-700')
                  )}>
                    {/* Card Shine */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                    <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-45 pointer-events-none" />

                    <div className="flex justify-between items-start z-10">
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm opacity-90 flex items-center justify-center">
                        <div className="w-6 h-4 border border-yellow-600/30 rounded-[2px]" />
                      </div>
                      {formData.accountType === 'BANK_ACCOUNT' ? (
                        <Building2 className="w-6 h-6 opacity-90" />
                      ) : (
                        <span className="font-bold tracking-wider opacity-100 text-lg drop-shadow-md">
                          {formData.eWalletType || 'E-WALLET'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 z-10">
                      <p className="text-[10px] uppercase tracking-widest opacity-80">Account Number</p>
                      <p className="font-mono text-lg sm:text-xl tracking-widest drop-shadow-md truncate">
                        {formData.accountNumber || '•••• •••• ••••'}
                      </p>
                    </div>

                    <div className="z-10">
                      <p className="text-[10px] uppercase tracking-widest opacity-80">Account Holder</p>
                      <p className="font-medium tracking-wide uppercase truncate drop-shadow-md">
                        {formData.accountName || 'YOUR NAME'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-24 pb-6 px-6 sm:px-8 bg-white relative z-10">
                <DialogHeader className="mb-5">
                  <DialogTitle className="text-xl text-center">{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                  <DialogDescription className="text-center">
                    Enter your details to receive payouts
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Account Type Selector */}
                  <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountType: 'BANK_ACCOUNT' })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        formData.accountType === 'BANK_ACCOUNT'
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Building2 className="w-4 h-4" /> Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountType: 'E_WALLET' })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        formData.accountType === 'E_WALLET'
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <CreditCard className="w-4 h-4" /> E-Wallet
                    </button>
                  </div>

                  {formData.accountType === 'BANK_ACCOUNT' && (
                    <div className="space-y-2">
                      <Label htmlFor="bank">Select Bank</Label>
                      <Select
                        value={formData.bankCode}
                        onValueChange={(value) => setFormData({ ...formData, bankCode: value })}
                      >
                        <SelectTrigger id="bank" className="h-11 rounded-xl">
                          <SelectValue placeholder="Choose your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.accountType === 'E_WALLET' && (
                    <div className="space-y-2">
                      <Label>Select E-Wallet</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {eWallets.map((ewallet) => (
                          <div
                            key={ewallet.code}
                            onClick={() => setFormData({ ...formData, eWalletType: ewallet.code })}
                            className={cn(
                              "cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:shadow-md",
                              formData.eWalletType === ewallet.code
                                ? (ewallet.code === 'DANA' ? 'border-[#118EEA] bg-[#118EEA]/5' :
                                  ewallet.code === 'OVO' ? 'border-[#4C3494] bg-[#4C3494]/5' :
                                    ewallet.code === 'GOPAY' ? 'border-[#00AED6] bg-[#00AED6]/5' :
                                      ewallet.code === 'SHOPEEPAY' ? 'border-[#EE4D2D] bg-[#EE4D2D]/5' :
                                        'border-blue-500 bg-blue-50')
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                              ewallet.code === 'DANA' ? 'bg-[#118EEA]' :
                                ewallet.code === 'OVO' ? 'bg-[#4C3494]' :
                                  ewallet.code === 'GOPAY' ? 'bg-[#00AED6]' :
                                    ewallet.code === 'SHOPEEPAY' ? 'bg-[#EE4D2D]' :
                                      'bg-gray-400'
                            )}>
                              {ewallet.code.substring(0, 1)}
                            </div>
                            <span className={cn(
                              "text-xs font-medium",
                              formData.eWalletType === ewallet.code ? "text-gray-900" : "text-gray-500"
                            )}>{ewallet.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">
                        {formData.accountType === 'BANK_ACCOUNT' ? 'Account Number' : 'Phone Number'}
                      </Label>
                      <Input
                        id="number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder={formData.accountType === 'BANK_ACCOUNT' ? '1234567890' : '0812...'}
                        className="h-11 rounded-xl font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Account Holder Name</Label>
                      <Input
                        id="name"
                        value={formData.accountName}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "rounded-xl text-white shadow-lg transition-all duration-300 hover:scale-[1.02]",
                        formData.accountType === 'BANK_ACCOUNT'
                          ? "bg-slate-900 hover:bg-slate-800"
                          : (formData.eWalletType === 'DANA' ? 'bg-[#118EEA] hover:bg-[#0B63A5]' :
                            formData.eWalletType === 'OVO' ? 'bg-[#4C3494] hover:bg-[#322261]' :
                              formData.eWalletType === 'GOPAY' ? 'bg-[#00AED6] hover:bg-[#008CAC]' :
                                formData.eWalletType === 'SHOPEEPAY' ? 'bg-[#EE4D2D] hover:bg-[#C23618]' :
                                  formData.eWalletType === 'LINKAJA' ? 'bg-[#E32026] hover:bg-[#B3191E]' : 'bg-blue-600 hover:bg-blue-700')
                      )}
                    >
                      {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                      {editingAccount ? 'Update Account' : 'Save Account'}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OrganizerLayout>
  );
}

