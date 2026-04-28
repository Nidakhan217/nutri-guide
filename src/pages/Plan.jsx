import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/RouteGuards';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="badge-green">{meal.type}</span>
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">⏱ {meal.prep_time}</span>
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{meal.name}</h4>
      {meal.macros && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">🥩 P: {meal.macros.protein}g</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 font-medium">🌾 C: {meal.macros.carbs}g</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-medium">🫒 F: {meal.macros.fat}g</span>
          {meal.macros.calories && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">🔥 {meal.macros.calories} kcal</span>}
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline">
        {open ? '▲ Hide' : '▼ Ingredients'} ({meal.ingredients?.length || 0})
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <ul className="space-y-1.5">
            {meal.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-primary-400 mt-0.5">•</span>{ing}
              </li>
            ))}
          </ul>
          {meal.tips && (
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400 italic">💡 {meal.tips}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function Plan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().currentPlan) {
        setPlan(snap.data().currentPlan);
      }
      setLoading(false);
    });
  }, [user]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const el = document.getElementById('plan-content');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('NutriAI-Diet-Plan.pdf');
      toast.success('PDF downloaded!');
    } catch { toast.error('Download failed.'); }
    setDownloading(false);
  };

  if (loading) return (
    <ProtectedRoute><AppLayout>
      <div className="page-container">
        <div className="space-y-4"><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-12 rounded-xl" /><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div></div>
      </div>
    </AppLayout></ProtectedRoute>
  );

  if (!plan) return (
    <ProtectedRoute><AppLayout>
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-6xl mb-4">🌱</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No plan yet</h2>
          <p className="text-slate-500 mb-6">Complete your profile to generate your personalized plan.</p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary">Start Setup →</button>
        </div>
      </div>
    </AppLayout></ProtectedRoute>
  );

  const days = plan.days || [];
  const day = days[selectedDay];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {/* Plan Summary */}
          <div id="plan-content">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 sm:p-8 text-white mb-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-10 text-[7rem] leading-none">🥗</div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Diet Plan</h1>
                  <p className="text-primary-200">{plan.summary}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadPDF} disabled={downloading}
                    className="bg-white/15 hover:bg-white/25 backdrop-blur text-white px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2">
                    {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '⬇️'} PDF
                  </button>
                  <button onClick={() => navigate('/chat')}
                    className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all">
                    💬 Chat
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
                {[
                  { label: 'Calories', value: `${plan.calories_target} kcal` },
                  { label: 'Protein', value: `${plan.macros?.protein}g` },
                  { label: 'Carbs', value: `${plan.macros?.carbs}g` },
                  { label: 'Fat', value: `${plan.macros?.fat}g` },
                  { label: 'Water', value: `${plan.water_goal}L` },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                    <p className="text-primary-200 text-xs">{s.label}</p>
                    <p className="text-white font-bold text-lg">{s.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
              {days.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(i)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${i === selectedDay
                    ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
                  {d.day}
                </button>
              ))}
            </div>

            {/* Meals Grid */}
            {day && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {day.meals?.map((meal, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <MealCard meal={meal} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tips & Supplements */}
            <div className="grid sm:grid-cols-2 gap-6">
              {plan.lifestyle_tips?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">💡 Lifestyle Tips</h3>
                  <ul className="space-y-2">
                    {plan.lifestyle_tips.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-primary-500 flex-shrink-0">✓</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.supplement_suggestions?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">💊 Supplements</h3>
                  <ul className="space-y-2">
                    {plan.supplement_suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-accent-500 flex-shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Regenerate */}
          <div className="mt-8 text-center">
            <button onClick={() => navigate('/generate')} className="btn-secondary gap-2">
              🔄 Regenerate Plan
            </button>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
