import React from 'react';
import { Wifi, CreditCard as CardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditCardProps {
    balance: number;
    currency?: string;
    cardHolder?: string;
    cardNumber?: string;
    expiryDate?: string;
    variant?: 'primary' | 'dark' | 'glass';
    className?: string;
}

export function CreditCard({
    balance,
    currency = 'IDR',
    cardHolder = 'NUSA EVENT ORGANIZER',
    cardNumber = '•••• •••• •••• 8888',
    expiryDate = '12/28',
    variant = 'primary',
    className,
}: CreditCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'dark':
                return 'bg-slate-900 text-white border-slate-800';
            case 'glass':
                return 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-xl';
            case 'primary':
            default:
                // Complex mesh gradient background
                return 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 shadow-2xl';
        }
    };

    return (
        <div
            className={cn(
                'relative w-full min-h-[180px] sm:min-h-[200px] rounded-2xl p-4 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group flex flex-col justify-between',
                getVariantClasses(),
                className
            )}
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

            {/* Mesh Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

            {/* Card Content */}
            <div className="relative z-10 flex flex-col h-full justify-between gap-3 sm:gap-4">
                {/* Top Row: Chip & Contactless */}
                <div className="flex justify-between items-start">
                    <div className="w-9 h-7 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-sm border border-yellow-500/50 flex items-center justify-center overflow-hidden relative">
                        {/* Chip Detail Lines */}
                        <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md" />
                        <div className="absolute left-[30%] top-0 bottom-0 w-[0.5px] bg-black/20" />
                        <div className="absolute right-[30%] top-0 bottom-0 w-[0.5px] bg-black/20" />
                        <div className="absolute top-[30%] left-0 right-0 h-[0.5px] bg-black/20" />
                        <div className="absolute bottom-[30%] left-0 right-0 h-[0.5px] bg-black/20" />
                    </div>
                    <Wifi className="w-5 h-5 sm:w-7 sm:h-7 text-white/80 rotate-90" />
                </div>

                {/* Middle Row: Balance */}
                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs text-white/60 font-medium tracking-wider mb-0.5">Available Balance</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm break-all">
                        {formatCurrency(balance)}
                    </h3>
                </div>

                {/* Bottom Row: Details */}
                <div className="pt-1">
                    <div className="flex justify-between items-end gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-white/50 font-medium tracking-widest mb-0.5 uppercase">Card Holder</p>
                            <p className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wider text-white/90 uppercase truncate">
                                {cardHolder}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm md:text-base font-mono text-white/80 tracking-widest drop-shadow-sm whitespace-nowrap">
                                {cardNumber}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out z-20 pointer-events-none" />
        </div>
    );
}
