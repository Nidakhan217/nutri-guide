import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SupportChat from '../components/SupportChat';

const FEATURES = [
  { icon: '🧬', title: 'Medically Aware', desc: 'Accounts for diabetes, PCOS, thyroid, heart conditions and more.' },
  { icon: '🌍', title: 'Culturally Appropriate', desc: 'Supports Indian, Mediterranean, Keto, Vegan, Jain, Halal and more.' },
  { icon: '💬', title: 'AI Chat Assistant', desc: 'Ask your dietician anything, anytime. Swap meals, get tips, modify your plan.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Log your weight, water, and energy. Watch your journey unfold.' },
  { icon: '⚡', title: 'Groq-Powered Speed', desc: 'Get your full 7-day plan in seconds with llama-3.3-70b.' },
  { icon: '📄', title: 'PDF Download', desc: 'Take your plan offline. Print it, share it, own it.' },
];

const STEPS = [
  { num: '01', title: 'Complete Your Profile', desc: '10-step wizard covering your health, lifestyle, preferences and goals.' },
  { num: '02', title: 'AI Generates Your Plan', desc: 'NutriAI crafts a personalized 7-day diet plan just for you.' },
  { num: '03', title: 'Track & Chat', desc: 'Log progress daily and chat with your AI dietician anytime.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f0d]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow">
              <span className="text-lg">🥗</span>
            </div>
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400">NutriAI</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/login')} className="btn-primary py-2 px-5 text-sm">Sign In</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-950/30 dark:to-transparent" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary-200/30 dark:bg-primary-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-accent-200/30 dark:bg-accent-800/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-semibold mb-6">
              ✨ Powered by Groq AI · llama-3.3-70b-versatile
            </span>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
              Your Personal<br />
              <span className="text-gradient">AI Dietician</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Get a clinically-informed, culturally-appropriate, personalized 7-day diet plan in seconds. Medically aware, budget-conscious, and built just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/login')} className="btn-primary text-lg py-4 px-8 shadow-2xl shadow-primary-700/30">
                Sign In →
              </button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl mx-auto text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">🥗</div>
                <div><p className="font-semibold text-slate-900 dark:text-white text-sm">NutriAI</p><p className="text-xs text-green-500">● Generating your plan...</p></div>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Monday Breakfast', meal: 'Masala Oats with flaxseeds & almonds', macro: '320 kcal · P: 14g · C: 45g · F: 9g', color: 'primary' },
                  { day: 'Monday Lunch', meal: 'Quinoa Khichdi with mixed vegetables', macro: '450 kcal · P: 18g · C: 65g · F: 12g', color: 'accent' },
                  { day: 'Monday Dinner', meal: 'Palak Tofu with brown rice & raita', macro: '380 kcal · P: 22g · C: 48g · F: 10g', color: 'sky' },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${item.color === 'primary' ? 'bg-primary-500' : item.color === 'accent' ? 'bg-accent-500' : 'bg-sky-500'}`} />
                    <div>
                      <p className="text-xs text-slate-400">{item.day}</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.meal}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.macro}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to eat better</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Science-backed nutrition advice, tailored to your unique body, culture, and lifestyle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card-hover p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-[#0a0f0d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">How NutriAI Works</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-16">Three simple steps to transform your health</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative">
                <div className="text-6xl font-black text-primary-100 dark:text-primary-900 mb-4">{s.num}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="hidden sm:block absolute top-8 -right-4 text-slate-300 dark:text-slate-700 text-2xl">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary-700 to-primary-900 text-center text-white">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">Ready to transform your nutrition?</h2>
          <p className="text-primary-200 text-lg mb-8 max-w-xl mx-auto">Get your personalized AI diet plan — clinically informed and built just for you.</p>
          <button onClick={() => navigate('/login')} className="bg-white text-primary-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-primary-50 transition-all shadow-2xl hover:-translate-y-1">
            🥗 Sign In to Get Started →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-[#050c08] text-slate-400 text-center py-8 text-sm">
        <p>© 2025 NutriAI · Built with ❤️ using Groq AI · <span className="text-primary-400">llama-3.3-70b-versatile</span></p>
      </footer>

      {/* Floating Support Chat */}
      <SupportChat />
    </div>
  );
}
