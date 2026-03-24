import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWalletBalanceRequest, chargeWalletRequest, ApiError } from '../lib/api';
import { toast } from 'sonner';

export default function Billing() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [amount, setAmount] = useState('');
  const [charging, setCharging] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.token) return;
      try {
        const data = await getWalletBalanceRequest(user.token);
        setBalance(data.balance);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [user?.token]);

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (!user?.token || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setCharging(true);
      const response = await chargeWalletRequest(user.token, numAmount);
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        toast.error("Failed to initiate payment");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-8 md:mb-10">Billing</h1>

        {/* Wallet Section */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 uppercase">My Wallet</h2>
          <div className="bg-[#1D6076]/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#1D6076]/10">
            <div>
              <p className="text-gray-500 text-sm mb-1">Current Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-bold text-[#1D6076]">
                  {loadingBalance ? "..." : (balance ?? 0).toFixed(2)}
                </span>
                <span className="text-sm font-medium text-gray-400">EGP</span>
              </div>
            </div>
            
            {!showTopUp ? (
              <button 
                onClick={() => setShowTopUp(true)}
                className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-semibold hover:bg-[#2a7a94] transition-all"
              >
                Top Up Balance
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="Amount (EGP)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 md:w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6076] focus:border-transparent"
                  />
                  <button 
                    onClick={handleTopUp}
                    disabled={charging}
                    className="bg-[#EBA050] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4832a] transition-all disabled:opacity-50"
                  >
                    {charging ? "..." : "Charge"}
                  </button>
                </div>
                <button 
                  onClick={() => setShowTopUp(false)}
                  className="text-gray-400 text-xs text-center hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved Cards Section (Placeholder / Removed for Kashier simplify) */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="text-xs font-bold text-gray-900 tracking-wider">SAVED CARDS</h2>
          </div>
          <div className="border border-gray-200 rounded-2xl p-5 md:p-6 flex items-center gap-3">
            <CreditCard size={20} className="text-gray-400 md:w-6 md:h-6" strokeWidth={2} />
            <span className="text-gray-500 text-sm md:text-base">Card data is managed securely by Kashier</span>
          </div>
        </div>
      </div>
    </div>
  );
}