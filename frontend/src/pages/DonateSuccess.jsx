import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import { Check, X, Heart } from 'lucide-react';

const DonateSuccess = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const transactionUuid = urlParams.get('transaction_uuid');
        const productCode = urlParams.get('product_code');
        const totalAmount = urlParams.get('total_amount');
        const statusParam = urlParams.get('status');
        const donationId = localStorage.getItem('pendingDonationId');
        const pendingAmount = localStorage.getItem('pendingDonationAmount');

        setAmount(pendingAmount || totalAmount || '0');

        if (statusParam === 'success' || statusParam === 'COMPLETE') {
          // Verify with backend
          const response = await api.post('/payment/esewa/verify', {
            transaction_uuid: transactionUuid,
            product_code: productCode,
            total_amount: totalAmount,
            status: statusParam,
            donationId: donationId,
          });

          if (response.data.success) {
            setStatus('success');
            showToast('Payment successful! Thank you for your donation.', 'success');
            localStorage.removeItem('pendingDonationId');
            localStorage.removeItem('pendingDonationAmount');
          } else {
            setStatus('failed');
            showToast('Payment verification failed. Please contact support.', 'error');
          }
        } else {
          setStatus('failed');
          showToast('Payment was not successful. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
        showToast('Payment verification failed. Please contact support.', 'error');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [showToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)" }}>
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink mb-2">Payment Successful!</h2>
            <p className="text-ink-soft">Thank you for your generous donation.</p>
            <p className="text-sm text-ink-soft/60 mt-1">
              Amount: NPR {amount || '0'}
            </p>
            <div className="mt-4 p-3 bg-vermilion/5 rounded-lg border border-vermilion/10">
              <p className="text-xs text-ink-soft/60 flex items-center justify-center gap-1">
                <Heart size={14} className="text-vermilion" />
                May Lord Ram bless you with peace and prosperity.
              </p>
            </div>
            <button
              onClick={() => navigate('/donate')}
              className="mt-6 px-6 py-2.5 rounded-full bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
            >
              Back to Donate
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <X size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink mb-2">Payment Failed</h2>
            <p className="text-ink-soft">Your payment could not be processed.</p>
            <p className="text-sm text-ink-soft/60 mt-1">Please try again or contact support.</p>
            <button
              onClick={() => navigate('/donate')}
              className="mt-6 px-6 py-2.5 rounded-full bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DonateSuccess;