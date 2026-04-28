import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/RouteGuards';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getGreeting, getDayStreak } from '../lib/utils';
import toast from 'react-hot-toast';

function SkeletonCard({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

function MacroRing({ protein = 0, carbs = 0, fat = 0 }) {
  const total = protein + carbs + fat || 1;
  const data = [
    { name: 'Fat', value: Math.round((fat / total) * 100), fill: '#0ea5e9' },
    { name: 'Carbs', value: Math.round((carbs / total) * 100), fill: '#d97706' },
    { name: 'Protein', value: Math.round((protein / total) * 100), fill: '#166534' },
  ];
  return (
    <div className="relative h-44">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="45%" outerRadius="85%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f1f5f9' }} />
          <Tooltip formatter={(v) => `${v}%`} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs text-slate-400 font-medium">Macros</p>
      </div>
    </div>
  );
}

function WaterTracker({ glasses, setGlasses }) {
  const MAX = 8;
  const pct = Math.min((glasses / MAX) * 100, 100);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: MAX }).map((_, i) => (
            <button key={i} onClick={() => setGlasses(i < glasses ? i : i + 1)}
              className={`w-8 h-8 rounded-lg text-sm transition-all duration-200 ${i < glasses
                ? 'bg-sky-400 text-white shadow-md scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              💧
            </button>
          ))}
        </div>
        <span className="text-sm font-bold text-sky-500">{glasses}/{MAX}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
      <p className="text-xs text-slate-400">{glasses * 250}ml / {MAX * 250}ml today</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [logs, setLogs] = useState([]);
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        // Load plan
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (uSnap.exists() && uSnap.data().currentPlan) {
          setPlan(uSnap.data().currentPlan);
        }
        // Load progress logs
        const q = query(collection(db, 'progress', user.uid, 'logs'), orderBy('date', 'desc'), limit(30));
        const logsSnap = await getDocs(q);
        const logsData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLogs(logsData);
        // Today's water
        const today = new Date().toDateString();
        const todayLog = logsData.find(l => {
          const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
          return d.toDateString() === today;
        });
        if (todayLog?.waterGlasses) setGlasses(todayLog.waterGlasses);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const streak = getDayStreak(logs);
  const todayMeals = plan?.days?.[0]?.meals?.slice(0, 3) || [];
  const macros = plan?.macros || { protein: 0, carbs: 0, fat: 0 };

  const handleWaterUpdate = async (g) => {
    setGlasses(g);
    try {
      await addDoc(collection(db, 'progress', user.uid, 'logs'), {
        waterGlasses: g, date: serverTimestamp(), type: 'water',
      });
    } catch {}
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonCard className="h-32 lg:col-span-3" />
              <SkeletonCard className="h-64" /><SkeletonCard className="h-64" /><SkeletonCard className="h-64" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Greeting */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 text-[8rem] leading-none select-none">🥗</div>
                <p className="text-primary-200 font-medium">{getGreeting()},</p>
                <h1 className="text-3xl font-bold mt-1">
                  {userProfile?.onboardingData?.name || userProfile?.displayName || 'Friend'} 👋
                </h1>
                <div className="flex items-center gap-6 mt-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                    <p className="text-xs text-primary-200">🔥 Streak</p>
                    <p className="text-2xl font-bold">{streak} days</p>
                  </div>
                  {plan && (
                    <>
                      <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                        <p className="text-xs text-primary-200">⚖️ Current</p>
                        <p className="text-2xl font-bold">{userProfile?.onboardingData?.currentWeight || '—'} kg</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                        <p className="text-xs text-primary-200">🎯 Goal</p>
                        <p className="text-2xl font-bold">{userProfile?.onboardingData?.goalWeight || '—'} kg</p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {!plan ? (
                /* No plan yet */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card p-10 text-center">
                  <div className="text-6xl mb-4">🌱</div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No plan yet</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Complete your profile to get your personalized diet plan.</p>
                  <button onClick={() => navigate('/onboarding')} className="btn-primary">Start Onboarding →</button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Today's Meals */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-white">Today's Meals</h2>
                      <button onClick={() => navigate('/plan')} className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">View full plan →</button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {todayMeals.map((meal, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="badge-green text-xs mb-2 inline-block">{meal.type}</span>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{meal.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{meal.macros?.calories || '—'} kcal · {meal.prep_time}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Macro Chart */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="card p-6">
                    <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Macro Split</h2>
                    <p className="text-xs text-slate-400 mb-2">Daily targets</p>
                    <MacroRing {...macros} />
                    <div className="flex justify-around mt-2 text-sm">
                      <div className="text-center"><div className="w-3 h-3 rounded-full bg-primary-700 mx-auto mb-1" /><p className="text-xs text-slate-500">Protein</p><p className="font-bold text-slate-800 dark:text-white">{macros.protein}g</p></div>
                      <div className="text-center"><div className="w-3 h-3 rounded-full bg-accent-600 mx-auto mb-1" /><p className="text-xs text-slate-500">Carbs</p><p className="font-bold text-slate-800 dark:text-white">{macros.carbs}g</p></div>
                      <div className="text-center"><div className="w-3 h-3 rounded-full bg-sky-400 mx-auto mb-1" /><p className="text-xs text-slate-500">Fat</p><p className="font-bold text-slate-800 dark:text-white">{macros.fat}g</p></div>
                    </div>
                  </motion.div>

                  {/* Water Tracker */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-white">💧 Water Intake</h2>
                      <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">Goal: {plan?.water_goal || 2}L</span>
                    </div>
                    <WaterTracker glasses={glasses} setGlasses={handleWaterUpdate} />
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-2 card p-6">
                    <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: '💬', label: 'Chat with AI', to: '/chat', accent: false },
                        { icon: '📈', label: 'Log Progress', to: '/progress', accent: false },
                        { icon: '📋', label: 'View Full Plan', to: '/plan', accent: true },
                        { icon: '🔄', label: 'New Plan', to: '/generate', accent: false },
                      ].map((a) => (
                        <button key={a.to} onClick={() => navigate(a.to)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all hover:scale-105 ${a.accent
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'}`}>
                          <span className="text-2xl">{a.icon}</span>{a.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
