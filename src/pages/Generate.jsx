import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateDietPlan } from '../lib/groq';
import { parsePlanJSON } from '../lib/utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '../components/RouteGuards';

const loadingMessages = [
  "Analyzing your health profile...",
  "Calculating optimal macros...",
  "Selecting culturally appropriate meals...",
  "Balancing nutrition with your preferences...",
  "Accounting for your medical conditions...",
  "Crafting your personalized 7-day plan...",
  "Almost there — final touches...",
];

export default function Generate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading'); // loading | streaming | done | error
  const [msgIdx, setMsgIdx] = useState(0);
  const [rawStream, setRawStream] = useState('');
  const [plan, setPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') return;
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % loadingMessages.length), 2500);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => { startGeneration(); }, []);

  async function startGeneration() {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists() || !snap.data().onboardingData) {
        toast.error('Please complete onboarding first.');
        navigate('/onboarding');
        return;
      }
      const profile = snap.data().onboardingData;
      setPhase('streaming');

      const raw = await generateDietPlan(profile, (chunk, full) => {
        setRawStream(full);
      });

      const parsed = parsePlanJSON(raw);
      if (!parsed) {
        setPhase('error');
        toast.error('Failed to parse plan. Please try again.');
        return;
      }

      // ✅ Show plan immediately — success is guaranteed at this point
      setPlan(parsed);
      setPhase('done');
      toast.success('Your personalized plan is ready! 🎉');

      // Save to Firestore in the background — failure here must NOT affect the displayed plan
      try {
        await addDoc(collection(db, 'plans', user.uid, 'history'), {
          plan: parsed,
          createdAt: serverTimestamp(),
        });
        await setDoc(
          doc(db, 'users', user.uid),
          { currentPlan: parsed, planGeneratedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (saveErr) {
        // Save failed silently — plan is still shown; user can retry from the Plan page
        console.warn('Plan saved locally but Firestore sync failed:', saveErr?.code || saveErr?.message);
      }
    } catch (err) {
      console.error('Diet plan generation error:', err?.code || err?.message, err);
      setPhase('error');
      toast.error('Generation failed. Please try again.');
    }
  }

  if (phase === 'loading' || phase === 'streaming') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            {/* Animated icon */}
            <div className="relative mx-auto w-32 h-32 mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-dashed border-primary-300 dark:border-primary-700" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-full border-4 border-dashed border-accent-300 dark:border-accent-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl">🥗</motion.span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">NutriAI is crafting your plan</h2>
            <motion.p key={msgIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-slate-500 dark:text-slate-400 mb-6">
              {loadingMessages[msgIdx]}
            </motion.p>

            {phase === 'streaming' && rawStream && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-left max-h-40 overflow-y-auto">
                <p className="text-xs text-slate-400 mb-2 font-medium">Live response...</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap">{rawStream.slice(-500)}</p>
              </div>
            )}

            <div className="flex justify-center gap-1 mt-6">
              {[0,1,2].map(i => (
                <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
              ))}
            </div>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  if (phase === 'error') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <span className="text-6xl mb-4 block">😔</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">We couldn't generate your plan. This might be a temporary issue.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setRawStream('');
                  setMsgIdx(0);
                  setPlan(null);
                  setPhase('loading');
                  startGeneration();
                }}
                className="btn-primary"
              >
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">Go to Dashboard</button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // phase === 'done'
  const days = plan?.days || [];
  const day = days[selectedDay];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d] p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8 mb-6 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
            <h1 className="text-3xl font-bold mb-2">Your Personalized Plan ✨</h1>
            <p className="text-primary-200 mb-4">{plan?.summary}</p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2"><p className="text-xs text-primary-200">Daily Calories</p><p className="text-xl font-bold">{plan?.calories_target} kcal</p></div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2"><p className="text-xs text-primary-200">Protein</p><p className="text-xl font-bold">{plan?.macros?.protein}g</p></div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2"><p className="text-xs text-primary-200">Carbs</p><p className="text-xl font-bold">{plan?.macros?.carbs}g</p></div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2"><p className="text-xs text-primary-200">Fat</p><p className="text-xl font-bold">{plan?.macros?.fat}g</p></div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2"><p className="text-xs text-primary-200">Water Goal</p><p className="text-xl font-bold">{plan?.water_goal}L</p></div>
            </div>
          </motion.div>

          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
            {days.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${i === selectedDay
                  ? 'bg-primary-700 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
                {d.day}
              </button>
            ))}
          </div>

          {/* Meals */}
          {day && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {day.meals?.map((meal, mi) => (
                <MealCardInline key={mi} meal={meal} />
              ))}
            </div>
          )}

          {/* Tips & Supplements */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {plan?.lifestyle_tips?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">💡 Lifestyle Tips</h3>
                <ul className="space-y-2">{plan.lifestyle_tips.map((t, i) => <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400"><span className="text-primary-500 mt-0.5">✓</span>{t}</li>)}</ul>
              </div>
            )}
            {plan?.supplement_suggestions?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">💊 Supplement Suggestions</h3>
                <ul className="space-y-2">{plan.supplement_suggestions.map((s, i) => <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400"><span className="text-accent-500 mt-0.5">•</span>{s}</li>)}</ul>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/chat')} className="btn-primary">💬 Chat with AI</button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">🏠 Dashboard</button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MealCardInline({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="badge-green">{meal.type}</span>
        <span className="text-xs text-slate-400">{meal.prep_time}</span>
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white mb-2">{meal.name}</h4>
      {meal.macros && (
        <div className="flex gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">P: {meal.macros.protein}g</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">C: {meal.macros.carbs}g</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">F: {meal.macros.fat}g</span>
          {meal.macros.calories && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{meal.macros.calories} kcal</span>}
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">
        {open ? 'Hide ingredients ▲' : 'Show ingredients ▼'}
      </button>
      {open && meal.ingredients && (
        <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 space-y-1">
          {meal.ingredients.map((ing, i) => <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5"><span>•</span>{ing}</li>)}
        </motion.ul>
      )}
      {meal.tips && <p className="mt-3 text-xs text-slate-400 italic">💡 {meal.tips}</p>}
    </motion.div>
  );
}
