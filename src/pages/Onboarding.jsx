import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '../components/RouteGuards';

const TOTAL_STEPS = 10;
const GOALS = [
  { value: 'lose_weight', icon: '⚖️', label: 'Lose Weight', desc: 'Reduce body fat healthily' },
  { value: 'gain_muscle', icon: '💪', label: 'Gain Muscle', desc: 'Build lean muscle mass' },
  { value: 'healthy_eating', icon: '🥗', label: 'Healthy Eating', desc: 'Improve overall nutrition' },
  { value: 'post_surgery', icon: '🏥', label: 'Post-Surgery', desc: 'Recovery nutrition plan' },
  { value: 'manage_disease', icon: '🩺', label: 'Manage Disease', desc: 'Diet for health conditions' },
];
const DIET_TYPES = ['🍖 Omnivore','🥕 Vegetarian','🌱 Vegan','🐟 Pescatarian','🥑 Keto','🙏 Jain','☪️ Halal'];
const ALLERGIES = ['Nuts','Dairy','Gluten','Eggs','Soy','Shellfish','Fish','Wheat'];
const DISEASES = ['Diabetes','Thyroid','PCOS','Hypertension','Heart Disease','Kidney Disease','None'];
const CUISINES = ['Indian','Mediterranean','Chinese','Italian','Mexican','Japanese','Continental','Middle Eastern'];
const ACTIVITY_LEVELS = ['Sedentary','Lightly Active','Moderately Active','Very Active','Extra Active'];
const STRESSORS = ['Work','Family','Financial','Health','Social','None'];
const BUDGET_TIERS = [
  { value: 'budget', icon: '💰', label: 'Budget', desc: 'Under ₹200/day' },
  { value: 'moderate', icon: '💰💰', label: 'Moderate', desc: '₹200–₹500/day' },
  { value: 'premium', icon: '💰💰💰', label: 'Premium', desc: '₹500+/day' },
];

function MultiSelect({ options, value = [], onChange }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${value.includes(opt)
            ? 'border-primary-500 bg-primary-600 text-white'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700'}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function RadioCard({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${value === opt.value
            ? 'border-primary-500 bg-primary-600 text-white'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700'}`}>
          <div className="text-2xl mb-1">{opt.icon}</div>
          <p className={`font-semibold ${value === opt.value ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
          {opt.desc && <p className={`text-xs mt-0.5 ${value === opt.value ? 'text-primary-100' : 'text-slate-500 dark:text-slate-400'}`}>{opt.desc}</p>}
        </button>
      ))}
    </div>
  );
}

function SliderRow({ label, value, onChange, min=1, max=10, unit='' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="label mb-0">{label}</label>
        <span className="font-bold text-primary-700 dark:text-primary-400">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={unit === 'L' ? 0.5 : 1} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-primary-600" />
      <div className="flex justify-between text-xs text-slate-400"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name:'', dob:'', phone:'', sex:'',
    height:'', currentWeight:'', goalWeight:'', bodyType:'',
    primaryGoal:'',
    diseases:[], medications:'', recentSurgeries:'',
    dietType:'', allergies:[], dislikedFoods:'',
    cuisines:[], cookingFreq:'', mealsPerDay:3, mealPrepWilling:'',
    activityLevel:'', exerciseTypes:[], exerciseFreq:'', smoking:'', alcohol:'',
    sleepHours:7, sleepQuality:5, stressLevel:5, primaryStressor:'',
    gutIssues:[], supplements:'', waterIntake:2,
    timeline:'', budgetTier:'', extraNotes:'',
  });

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().onboardingData) {
        setData(d => ({ ...d, ...snap.data().onboardingData }));
        // Always start from step 1 when editing the health profile
        setStep(1);
      }
    });
  }, [user]);

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const tog = (key, val) => update(key, data[key]?.includes(val) ? data[key].filter(v=>v!==val) : [...(data[key]||[]), val]);

  const saveStep = async () => {
    if (!user) return;
    try { await setDoc(doc(db, 'users', user.uid), { onboardingData: data, onboardingStep: step }, { merge: true }); }
    catch {}
  };

  const next = async () => {
    setSaving(true);
    await saveStep();
    setSaving(false);
    if (step < TOTAL_STEPS) { setDirection(1); setStep(s => s + 1); }
    else { await completeOnboarding(); }
  };

  const back = () => { setDirection(-1); setStep(s => Math.max(1, s - 1)); };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { onboardingData: data, onboardingComplete: true, updatedAt: serverTimestamp() }, { merge: true });
      await refreshProfile();
      toast.success('Profile complete! Generating your plan 🎉');
      navigate('/generate');
    } catch { toast.error('Error saving. Please try again.'); }
    finally { setSaving(false); }
  };

  const bmi = data.height && data.currentWeight ? (data.currentWeight / ((data.height/100)**2)).toFixed(1) : null;

  const steps = [
    { title:'Personal Information', subtitle:"Tell us about yourself", icon:'👤', content:(
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input-field" value={data.name} onChange={e=>update('name',e.target.value)} placeholder="Your name" /></div>
          <div><label className="label">Date of Birth</label><input type="date" className="input-field" value={data.dob} onChange={e=>update('dob',e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Phone</label><input type="tel" className="input-field" value={data.phone} onChange={e=>update('phone',e.target.value)} placeholder="+91 98765 43210" /></div>
          <div><label className="label">Biological Sex</label>
            <select className="input-field" value={data.sex} onChange={e=>update('sex',e.target.value)}>
              <option value="">Select...</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
    )},
    { title:'Body Statistics', subtitle:'Your current physique', icon:'📊', content:(
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Height (cm)</label><input type="number" className="input-field" value={data.height} onChange={e=>update('height',e.target.value)} placeholder="170" /></div>
          <div><label className="label">Current Weight (kg)</label><input type="number" className="input-field" value={data.currentWeight} onChange={e=>update('currentWeight',e.target.value)} placeholder="70" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Goal Weight (kg)</label><input type="number" className="input-field" value={data.goalWeight} onChange={e=>update('goalWeight',e.target.value)} placeholder="65" /></div>
          <div><label className="label">Body Type</label>
            <select className="input-field" value={data.bodyType} onChange={e=>update('bodyType',e.target.value)}>
              <option value="">Select...</option><option value="ectomorph">Ectomorph (Lean)</option><option value="mesomorph">Mesomorph (Athletic)</option><option value="endomorph">Endomorph (Stocky)</option>
            </select>
          </div>
        </div>
        {bmi && <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm">BMI: <strong className="text-primary-700 dark:text-primary-400">{bmi}</strong></div>}
      </div>
    )},
    { title:'Primary Goal', subtitle:'What do you want to achieve?', icon:'🎯', content:<RadioCard options={GOALS} value={data.primaryGoal} onChange={v=>update('primaryGoal',v)} /> },
    { title:'Health & Medical', subtitle:'For a safe, appropriate plan', icon:'🏥', content:(
      <div className="space-y-5">
        <div><label className="label">Health Conditions</label><MultiSelect options={DISEASES} value={data.diseases} onChange={v=>update('diseases',v)} /></div>
        <div><label className="label">Current Medications</label><textarea className="input-field resize-none h-20" value={data.medications} onChange={e=>update('medications',e.target.value)} placeholder="e.g., Metformin, Thyronorm..." /></div>
        <div><label className="label">Recent Surgeries</label><input className="input-field" value={data.recentSurgeries} onChange={e=>update('recentSurgeries',e.target.value)} placeholder="e.g., Appendix removal 3 months ago" /></div>
      </div>
    )},
    { title:'Dietary Identity', subtitle:'Your food preferences & restrictions', icon:'🥗', content:(
      <div className="space-y-5">
        <div><label className="label">Diet Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIET_TYPES.map(dt => (
              <button key={dt} type="button" onClick={()=>update('dietType',dt)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${data.dietType===dt?'border-primary-500 bg-primary-600 text-white':'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400'}`}>
                {dt}
              </button>
            ))}
          </div>
        </div>
        <div><label className="label">Food Allergies</label><MultiSelect options={ALLERGIES} value={data.allergies} onChange={v=>update('allergies',v)} /></div>
        <div><label className="label">Foods You Dislike</label><input className="input-field" value={data.dislikedFoods} onChange={e=>update('dislikedFoods',e.target.value)} placeholder="e.g., bitter gourd, mushrooms..." /></div>
      </div>
    )},
    { title:'Cuisine & Cooking', subtitle:'Your kitchen habits', icon:'🍳', content:(
      <div className="space-y-5">
        <div><label className="label">Preferred Cuisines</label><MultiSelect options={CUISINES} value={data.cuisines} onChange={v=>update('cuisines',v)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Cooking Frequency</label>
            <select className="input-field" value={data.cookingFreq} onChange={e=>update('cookingFreq',e.target.value)}>
              <option value="">Select...</option><option>Daily</option><option>Few times/week</option><option>Weekends only</option><option>Rarely</option>
            </select>
          </div>
          <div><label className="label">Meals Per Day</label>
            <select className="input-field" value={data.mealsPerDay} onChange={e=>update('mealsPerDay',Number(e.target.value))}>
              {[2,3,4,5].map(n=><option key={n}>{n} meals</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Meal Prep Willingness</label>
          <div className="flex flex-col gap-2">
            {['Minimal (15 min max)','Moderate (30 min)','Happy to cook (1hr+)'].map(opt=>(
              <button key={opt} type="button" onClick={()=>update('mealPrepWilling',opt)}
                className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${data.mealPrepWilling===opt?'border-primary-500 bg-primary-600 text-white':'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    )},
    { title:'Lifestyle', subtitle:'Your activity & habits', icon:'🏃', content:(
      <div className="space-y-5">
        <div><label className="label">Activity Level</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map(al=>(
              <button key={al} type="button" onClick={()=>update('activityLevel',al)}
                className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${data.activityLevel===al?'border-primary-500 bg-primary-600 text-white':'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400'}`}>
                {al}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Exercise Freq.</label>
            <select className="input-field" value={data.exerciseFreq} onChange={e=>update('exerciseFreq',e.target.value)}>
              <option value="">None</option>{['1x/week','2-3x/week','4-5x/week','Daily'].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label className="label">Smoking</label>
            <select className="input-field" value={data.smoking} onChange={e=>update('smoking',e.target.value)}>
              <option value="">Select</option><option value="no">No</option><option value="yes">Yes</option><option value="quit">Quit</option>
            </select>
          </div>
          <div><label className="label">Alcohol</label>
            <select className="input-field" value={data.alcohol} onChange={e=>update('alcohol',e.target.value)}>
              <option value="">Select</option><option value="never">Never</option><option value="social">Social</option><option value="regular">Regular</option>
            </select>
          </div>
        </div>
      </div>
    )},
    { title:'Sleep & Stress', subtitle:'Mental wellness affects nutrition', icon:'😴', content:(
      <div className="space-y-6">
        <SliderRow label="Sleep Hours per Night" value={data.sleepHours} onChange={v=>update('sleepHours',v)} min={4} max={12} unit="h" />
        <SliderRow label="Sleep Quality (1=Poor, 10=Excellent)" value={data.sleepQuality} onChange={v=>update('sleepQuality',v)} min={1} max={10} />
        <SliderRow label="Stress Level (1=Low, 10=High)" value={data.stressLevel} onChange={v=>update('stressLevel',v)} min={1} max={10} />
        <div><label className="label">Primary Stressor</label>
          <div className="flex flex-wrap gap-2">
            {STRESSORS.map(s=>(
              <button key={s} type="button" onClick={()=>update('primaryStressor',s)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${data.primaryStressor===s?'border-primary-500 bg-primary-600 text-white':'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )},
    { title:'Gut Health & Supplements', subtitle:'Digestive health matters', icon:'🌿', content:(
      <div className="space-y-5">
        <div><label className="label">Gut Issues</label><MultiSelect options={['Bloating','Acidity/GERD','IBS','Constipation','Food Intolerances','None']} value={data.gutIssues} onChange={v=>update('gutIssues',v)} /></div>
        <div><label className="label">Current Supplements</label><textarea className="input-field resize-none h-20" value={data.supplements} onChange={e=>update('supplements',e.target.value)} placeholder="e.g., Vitamin D3, Omega-3..." /></div>
        <SliderRow label="Daily Water Intake" value={data.waterIntake} onChange={v=>update('waterIntake',v)} min={0.5} max={6} unit="L" />
      </div>
    )},
    { title:'Goals & Budget', subtitle:"Last step — let's finalize your plan", icon:'🎊', content:(
      <div className="space-y-5">
        <div><label className="label">Timeline</label>
          <div className="grid grid-cols-2 gap-3">
            {['1 month','3 months','6 months','1 year'].map(t=>(
              <button key={t} type="button" onClick={()=>update('timeline',t)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${data.timeline===t?'border-primary-500 bg-primary-600 text-white':'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div><label className="label">Food Budget</label><RadioCard options={BUDGET_TIERS} value={data.budgetTier} onChange={v=>update('budgetTier',v)} /></div>
        <div><label className="label">Extra notes for your dietician</label><textarea className="input-field resize-none h-24" value={data.extraNotes} onChange={e=>update('extraNotes',e.target.value)} placeholder="Anything specific NutriAI should know..." /></div>
      </div>
    )},
  ];

  const cur = steps[step-1];
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d] flex flex-col">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="text-2xl">🥗</span><span className="font-bold text-primary-700 dark:text-primary-400">NutriAI</span></div>
              <span className="text-sm text-slate-500 font-medium">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div className="bg-gradient-to-r from-primary-500 to-primary-700 h-2 rounded-full" animate={{ width:`${(step/TOTAL_STEPS)*100}%` }} transition={{ duration:0.4 }} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 pt-10 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration:0.3, ease:'easeInOut' }}>
                <div className="card p-8 shadow-lg">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl shadow-lg">{cur.icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{cur.title}</h2>
                      <p className="text-slate-500 dark:text-slate-400">{cur.subtitle}</p>
                    </div>
                  </div>
                  {cur.content}
                  <div className="flex gap-3 mt-8">
                    {step > 1 && <button onClick={back} className="btn-secondary flex-1">← Back</button>}
                    <button onClick={next} disabled={saving} className="btn-primary flex-1">
                      {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : step===TOTAL_STEPS ? 'Generate My Plan 🚀' : 'Continue →'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
