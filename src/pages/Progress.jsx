import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/RouteGuards';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, getDayStreak } from '../lib/utils';
import toast from 'react-hot-toast';

const MOODS = ['😔', '😐', '🙂', '😊', '😄'];

function LogModal({ goalWeight, onClose, onSave }) {
  const [form, setForm] = useState({ weight: '', waterGlasses: 0, energyLevel: 3, mood: '🙂', notes: '' });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Log Today's Progress</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Weight (kg)</label>
              <input type="number" className="input-field" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 68.5" step="0.1" /></div>
            <div><label className="label">Water (glasses)</label>
              <select className="input-field" value={form.waterGlasses} onChange={e => setForm(f => ({ ...f, waterGlasses: Number(e.target.value) }))}>
                {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} glasses</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Energy Level</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, energyLevel: n }))}
                  className={`w-10 h-10 rounded-xl border-2 font-bold transition-all ${form.energyLevel === n ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Mood</label>
            <div className="flex gap-3">
              {MOODS.map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, mood: m }))}
                  className={`w-10 h-10 rounded-xl text-2xl transition-all ${form.mood === m ? 'scale-125' : 'opacity-50 hover:opacity-100'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div><label className="label">Notes (optional)</label>
            <textarea className="input-field resize-none h-16" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="How are you feeling?" /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handle} disabled={saving} className="btn-primary flex-1">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Log'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AchievementBadge({ icon, title, desc, earned }) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${earned ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/20' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-sm text-slate-900 dark:text-white">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      {earned && <span className="badge bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300 mt-2">Earned ✓</span>}
    </div>
  );
}

export default function Progress() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [planHistory, setPlanHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const goalWeight = Number(userProfile?.onboardingData?.goalWeight) || 65;
  const startWeight = Number(userProfile?.onboardingData?.currentWeight) || 70;

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [logsSnap, plansSnap] = await Promise.all([
        getDocs(query(collection(db, 'progress', user.uid, 'logs'), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'plans', user.uid, 'history'), orderBy('createdAt', 'desc'))),
      ]);
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.weight));
      setPlanHistory(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
    setLoading(false);
  }

  async function saveLog(form) {
    try {
      await addDoc(collection(db, 'progress', user.uid, 'logs'), { ...form, weight: Number(form.weight), date: serverTimestamp() });
      toast.success('Progress logged! 🎉');
      loadData();
    } catch { toast.error('Failed to save.'); }
  }

  const chartData = logs.map(l => ({
    date: l.date?.toDate ? l.date.toDate().toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }) : '',
    weight: l.weight,
  }));

  const streak = getDayStreak(logs);
  const latestWeight = logs[logs.length - 1]?.weight;
  const startedLosing = latestWeight && latestWeight <= startWeight - 2;
  const waterGoalDays = logs.filter(l => l.waterGlasses >= 7).length;

  const achievements = [
    { icon: '🔥', title: '7-Day Streak', desc: 'Log for 7 consecutive days', earned: streak >= 7 },
    { icon: '💧', title: 'Hydration Hero', desc: 'Reached water goal 5 times', earned: waterGoalDays >= 5 },
    { icon: '⚖️', title: 'First 2kg Lost', desc: 'Lost your first 2 kilograms', earned: startedLosing },
    { icon: '📋', title: 'Plan Warrior', desc: 'Generated 3+ diet plans', earned: planHistory.length >= 3 },
    { icon: '🌅', title: 'Early Bird', desc: '10+ progress entries', earned: logs.length >= 10 },
    { icon: '🏆', title: 'Goal Crusher', desc: 'Reached goal weight!', earned: latestWeight && latestWeight <= goalWeight },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <h1 className="section-title mb-0">Progress Tracker 📈</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary">+ Log Today</button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-64 rounded-2xl" /><div className="skeleton h-48 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Weight Chart */}
              <div className="card p-6">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Weight Over Time</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                      <ReferenceLine y={goalWeight} stroke="#d97706" strokeDasharray="6 3" label={{ value: `Goal: ${goalWeight}kg`, fill: '#d97706', fontSize: 11 }} />
                      <Line type="monotone" dataKey="weight" stroke="#166534" strokeWidth={3} dot={{ fill: '#166534', r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-4xl mb-3">📉</p>
                    <p>No weight logs yet. Start tracking your progress!</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Log First Entry</button>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Current', value: latestWeight ? `${latestWeight} kg` : '—', icon: '⚖️' },
                  { label: 'Streak', value: `${streak} days`, icon: '🔥' },
                  { label: 'Total Logs', value: logs.length, icon: '📋' },
                ].map((s, i) => (
                  <div key={i} className="card p-4 text-center">
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="card p-6">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">🏆 Achievements</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {achievements.map((a, i) => <AchievementBadge key={i} {...a} />)}
                </div>
              </div>

              {/* Plan History */}
              {planHistory.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">📜 Plan History</h2>
                  <div className="space-y-3">
                    {planHistory.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 font-bold text-sm">{planHistory.length - i}</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">Diet Plan</p>
                          <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                        </div>
                        {i === 0 && <span className="ml-auto badge-green">Current</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showModal && <LogModal goalWeight={goalWeight} onClose={() => setShowModal(false)} onSave={saveLog} />}
        </AnimatePresence>
      </AppLayout>
    </ProtectedRoute>
  );
}
