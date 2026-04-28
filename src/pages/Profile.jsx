import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/RouteGuards';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { calculateBMI, getBMICategory, calculateAge } from '../lib/utils';

export default function Profile() {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const profile = userProfile?.onboardingData || {};
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');
  const [saving, setSaving] = useState(false);

  const bmi = calculateBMI(profile.currentWeight, profile.height);
  const bmiInfo = getBMICategory(bmi);
  const age = calculateAge(profile.dob);

  const saveName = async () => {
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), { displayName: name, updatedAt: serverTimestamp() }, { merge: true });
      await refreshProfile();
      setEditName(false);
      toast.success('Name updated!');
    } catch { toast.error('Failed to update.'); }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const StatCard = ({ icon, label, value, sub }) => (
    <div className="card p-4 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value || '—'}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className={`text-xs font-medium mt-0.5 ${bmiInfo?.color}`}>{sub}</p>}
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container max-w-3xl">
          {/* Avatar Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-xl text-4xl overflow-hidden">
              {userProfile?.photoURL
                ? <img src={userProfile.photoURL} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-3xl">{(name || user?.email || 'U')[0].toUpperCase()}</span>}
            </div>
            <div className="flex-1 text-center sm:text-left">
              {editName ? (
                <div className="flex gap-2 items-center">
                  <input value={name} onChange={e => setName(e.target.value)} className="input-field text-xl font-bold flex-1" autoFocus />
                  <button onClick={saveName} disabled={saving} className="btn-primary py-2 px-4">Save</button>
                  <button onClick={() => setEditName(false)} className="btn-secondary py-2 px-3">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name || 'Your Name'}</h1>
                  <button onClick={() => setEditName(true)} className="text-slate-400 hover:text-primary-600 transition-colors">✏️</button>
                </div>
              )}
              <p className="text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
              <div className="flex gap-2 mt-3 justify-center sm:justify-start flex-wrap">
                {profile.primaryGoal && <span className="badge-green">{profile.primaryGoal.replace('_', ' ')}</span>}
                {profile.dietType && <span className="badge-amber">{profile.dietType}</span>}
                {age && <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{age} years</span>}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon="📏" label="Height" value={profile.height ? `${profile.height} cm` : null} />
            <StatCard icon="⚖️" label="Current Weight" value={profile.currentWeight ? `${profile.currentWeight} kg` : null} />
            <StatCard icon="🎯" label="Goal Weight" value={profile.goalWeight ? `${profile.goalWeight} kg` : null} />
            <StatCard icon="🧮" label="BMI" value={bmi} sub={bmiInfo?.label} />
          </motion.div>

          {/* Health Info */}
          {(profile.diseases?.length > 0 || profile.allergies?.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card p-6 mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">🏥 Health Information</h2>
              <div className="space-y-3">
                {profile.diseases?.filter(d => d !== 'None').length > 0 && (
                  <div><p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Conditions</p>
                    <div className="flex flex-wrap gap-2">{profile.diseases.filter(d => d !== 'None').map(d => <span key={d} className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{d}</span>)}</div>
                  </div>
                )}
                {profile.allergies?.length > 0 && (
                  <div><p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-2">{profile.allergies.map(a => <span key={a} className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{a}</span>)}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Preferences */}
          {(profile.cuisines?.length > 0 || profile.activityLevel) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card p-6 mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">🍽️ Preferences</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {profile.cuisines?.length > 0 && <div><p className="text-slate-400 mb-1">Cuisines</p><p className="font-medium text-slate-800 dark:text-slate-200">{profile.cuisines.join(', ')}</p></div>}
                {profile.activityLevel && <div><p className="text-slate-400 mb-1">Activity</p><p className="font-medium text-slate-800 dark:text-slate-200">{profile.activityLevel}</p></div>}
                {profile.sleepHours && <div><p className="text-slate-400 mb-1">Sleep</p><p className="font-medium text-slate-800 dark:text-slate-200">{profile.sleepHours}h/night</p></div>}
                {profile.budgetTier && <div><p className="text-slate-400 mb-1">Budget Tier</p><p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{profile.budgetTier}</p></div>}
              </div>
            </motion.div>
          )}

          {/* Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card p-6 mb-6 space-y-2">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-3">⚙️ Settings</h2>
            <button onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="font-medium text-slate-700 dark:text-slate-200">{isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</span>
              <span className="text-slate-400">›</span>
            </button>
            <button onClick={() => navigate('/onboarding')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="font-medium text-slate-700 dark:text-slate-200">📝 Edit Health Profile</span>
              <span className="text-slate-400">›</span>
            </button>
            <button onClick={() => navigate('/generate')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="font-medium text-slate-700 dark:text-slate-200">🔄 Regenerate Diet Plan</span>
              <span className="text-slate-400">›</span>
            </button>
          </motion.div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full py-3.5 rounded-xl border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            🚪 Sign Out
          </button>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
