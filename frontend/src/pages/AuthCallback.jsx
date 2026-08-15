import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OmLoader from '../components/common/OmLoader';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('Google authentication failed');
      showToast('Google authentication failed', 'error');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        showToast(`Welcome, ${user.name}!`, 'success');
        navigate('/');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setError('Invalid authentication data');
        showToast('Login failed', 'error');
        navigate('/');
      }
    } else {
      setError('Missing authentication data');
      navigate('/');
    }
  }, [location, navigate, setUser, showToast]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-ink">Authentication Failed</h2>
          <p className="text-ink-soft mt-2">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-full bg-vermilion text-white font-semibold hover:bg-[#a83a0c] transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
        <p className="text-ink-soft">Authenticating with Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;