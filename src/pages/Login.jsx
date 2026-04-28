import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PublicRoute } from '../components/RouteGuards';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      toast.error(messages[err.code] || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Try popup first (best UX)
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome back! 🥗');
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      if (err.code === 'auth/popup-blocked') {
        // Popup was blocked — fall back to redirect (page will reload, PublicRoute handles nav)
        try {
          toast('Redirecting to Google sign-in…', { icon: '🔄' });
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error('Redirect fallback error:', redirectErr);
          toast.error('Google sign-in failed. Please allow popups or try again.');
          setGoogleLoading(false);
        }
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User dismissed — no toast needed
        setGoogleLoading(false);
      } else if (err.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized for Google sign-in.');
        setGoogleLoading(false);
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Google sign-in is not enabled. Please contact support.');
        setGoogleLoading(false);
      } else {
        toast.error('Google sign-in failed. Please try again.');
        setGoogleLoading(false);
      }
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent-600/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-900/50 mb-4">
              <span className="text-2xl">🥗</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to your NutriAI account</p>
          </div>

          {/* Card */}
          <div className="bg-[#1a1d27] border border-white/8 rounded-2xl p-6 shadow-2xl">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              id="google-login-btn"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 mb-4"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-slate-500 font-medium">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  id="login-email"
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    id="login-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/30 mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center text-slate-500 text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </PublicRoute>
  );
}
