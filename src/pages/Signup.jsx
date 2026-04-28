import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PublicRoute } from '../components/RouteGuards';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

function StrengthBar({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score-1] : 'bg-white/10'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-yellow-400' : score === 3 ? 'text-yellow-300' : 'text-green-400'}`}>
          {labels[score-1]}
        </p>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const watchPassword = watch('password', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: data.email,
        displayName: data.name,
        photoURL: '',
        createdAt: serverTimestamp(),
        onboardingComplete: false,
      });
      toast.success('Account created! Let\'s set up your profile 🎉');
      navigate('/onboarding');
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password is too weak.',
        'auth/invalid-email': 'Invalid email address.',
      };
      toast.error(messages[err.code] || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || '',
        photoURL: cred.user.photoURL || '',
        createdAt: serverTimestamp(),
        onboardingComplete: false,
      }, { merge: true });
      toast.success('Welcome to NutriAI! 🥗');
      navigate('/onboarding');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-accent-600/6 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-900/50 mb-4">
              <span className="text-2xl">🥗</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1">Your AI dietician, personalized for you</p>
          </div>

          {/* Card */}
          <div className="bg-[#1a1d27] border border-white/8 rounded-2xl p-6 shadow-2xl">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              id="google-signup-btn"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 mb-4"
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

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-slate-500 font-medium">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
                <input
                  {...register('name')}
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  {...register('email')}
                  id="signup-email"
                  type="email"
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
                    id="signup-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <StrengthBar password={watchPassword} />
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    {...register('confirm')}
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
              </div>

              <button
                type="submit"
                id="signup-submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-900/30 mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Create Account →'}
              </button>

              <p className="text-xs text-slate-500 text-center pt-1">
                Free forever · No credit card needed
              </p>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </PublicRoute>
  );
}
