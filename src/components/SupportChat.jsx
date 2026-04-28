import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const KB = {
  welcome: {
    id: 'welcome',
    text: "👋 Hi! I'm NutriAI Support. How can I help you today?",
    quickReplies: [
      { label: '🔐 Sign In / Login', next: 'signin' },
      { label: '🆕 Create Account', next: 'signup' },
      { label: '🔑 Forgot Password', next: 'forgot_password' },
      { label: '🥗 How does NutriAI work?', next: 'how_it_works' },
      { label: '📋 Diet Plan Help', next: 'diet_plan' },
      { label: '👤 Profile Help', next: 'profile_help' },
    ],
  },
  signin: {
    id: 'signin',
    text: "To sign in to NutriAI:\n\n1️⃣ Click **Sign In** on the top-right of the page\n2️⃣ Enter your registered **email & password**\n3️⃣ Click **Sign In** — you'll be taken to your dashboard\n\nIf you don't have an account yet, you'll need to register first.",
    quickReplies: [
      { label: '🔑 Forgot my password', next: 'forgot_password' },
      { label: '🆕 I need to create an account', next: 'signup' },
      { label: '❌ Sign-in error help', next: 'signin_error' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  signin_error: {
    id: 'signin_error',
    text: "Common sign-in issues & fixes:\n\n🔴 **Wrong password** — Try resetting it using 'Forgot Password'\n🔴 **Email not found** — Make sure you're using the email you signed up with\n🔴 **Account not verified** — Check your inbox for a verification email\n🔴 **Browser issue** — Try clearing cookies or using a different browser\n\nStill stuck?",
    quickReplies: [
      { label: '🔑 Reset my password', next: 'forgot_password' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  signup: {
    id: 'signup',
    text: "Creating your NutriAI account is easy:\n\n1️⃣ Click **Sign In** on the landing page\n2️⃣ Switch to the **Sign Up** tab on the login screen\n3️⃣ Enter your **name, email & password**\n4️⃣ Click **Create Account**\n5️⃣ You'll be taken to the **Health Profile questionnaire** (10 quick steps)\n6️⃣ After completing it, your **personalized diet plan** is generated! 🎉",
    quickReplies: [
      { label: '📋 About the questionnaire', next: 'questionnaire' },
      { label: '🔐 I already have an account', next: 'signin' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  forgot_password: {
    id: 'forgot_password',
    text: "To reset your password:\n\n1️⃣ Go to the **Sign In** page\n2️⃣ Click **'Forgot Password?'** below the login form\n3️⃣ Enter your registered **email address**\n4️⃣ Check your inbox for a **password reset email** from NutriAI\n5️⃣ Click the link in the email and set a **new password**\n\n📧 Don't see the email? Check your **spam/junk folder**.",
    quickReplies: [
      { label: '🔐 Try signing in again', next: 'signin' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  how_it_works: {
    id: 'how_it_works',
    text: "NutriAI works in 3 simple steps:\n\n**Step 1 — Complete Your Profile** 📝\nAnswer a 10-step health questionnaire covering your goals, diet, lifestyle & medical history.\n\n**Step 2 — Get Your AI Plan** 🤖\nOur Groq-powered AI generates a personalized 7-day diet plan in seconds — tailored to you.\n\n**Step 3 — Track & Chat** 💬\nLog your daily progress, track water intake, and chat with your AI dietician anytime for meal swaps or tips.",
    quickReplies: [
      { label: '📋 About the diet plan', next: 'diet_plan' },
      { label: '💬 About AI Chat', next: 'ai_chat' },
      { label: '📊 About Progress Tracking', next: 'progress' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  diet_plan: {
    id: 'diet_plan',
    text: "Your NutriAI diet plan includes:\n\n🗓️ **7-day personalized meal plan** with breakfast, lunch & dinner\n🔢 **Calorie & macro breakdown** (protein, carbs, fat)\n🏥 **Medically aware** — accounts for diabetes, PCOS, thyroid & more\n🌍 **Culturally appropriate** — Indian, Mediterranean, Vegan, Keto, etc.\n📄 **PDF export** — download and print your plan\n\nTo **regenerate** your plan, go to Profile → Regenerate Diet Plan.",
    quickReplies: [
      { label: '✏️ Edit my health profile', next: 'edit_profile' },
      { label: '🔄 How to regenerate plan', next: 'regenerate' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  ai_chat: {
    id: 'ai_chat',
    text: "The **AI Chat** feature lets you:\n\n💬 Ask your dietician anything — meal swaps, portion sizes, nutrition tips\n🔄 Request recipe alternatives for any meal in your plan\n📅 Get advice on managing cravings or eating out\n💡 Get context-aware suggestions based on your health profile\n\nAccess it from the **Chat** section in your dashboard sidebar.",
    quickReplies: [
      { label: '📋 About the diet plan', next: 'diet_plan' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  progress: {
    id: 'progress',
    text: "The **Progress Tracker** helps you:\n\n⚖️ Log your **daily weight** to track changes over time\n💧 Track your **water intake** with a glass-by-glass tracker\n⚡ Monitor your **energy levels** day by day\n📈 View trend **charts** to see your journey unfold\n\nFind it in the **Progress** section of your dashboard.",
    quickReplies: [
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  questionnaire: {
    id: 'questionnaire',
    text: "The health questionnaire has **10 steps**:\n\n1. Personal Information (name, DOB, sex)\n2. Body Statistics (height, weight, BMI)\n3. Primary Goal (weight loss, muscle gain, etc.)\n4. Health & Medical (conditions, medications)\n5. Dietary Identity (diet type, allergies)\n6. Cuisine & Cooking (preferred foods, meal prep)\n7. Lifestyle (activity level, exercise, habits)\n8. Sleep & Stress\n9. Gut Health & Supplements\n10. Goals & Budget\n\nYour answers are saved at each step — you can always edit from your Profile.",
    quickReplies: [
      { label: '✏️ Edit my profile', next: 'edit_profile' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  profile_help: {
    id: 'profile_help',
    text: "Managing your NutriAI profile:\n\n**View Profile** — Click your avatar/name in the sidebar\n**Edit Name** — Click the ✏️ pencil icon next to your name\n**Edit Health Profile** — Profile → Edit Health Profile (starts from Step 1)\n**Dark/Light Mode** — Profile → Switch to Dark/Light Mode\n**Sign Out** — Profile → Sign Out button at the bottom",
    quickReplies: [
      { label: '✏️ Edit health questionnaire', next: 'edit_profile' },
      { label: '🔐 Sign out help', next: 'signout' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  edit_profile: {
    id: 'edit_profile',
    text: "To edit your Health Profile:\n\n1️⃣ Sign in and go to your **Dashboard**\n2️⃣ Click **Profile** in the sidebar (bottom-left)\n3️⃣ Scroll to the **Settings** section\n4️⃣ Click **Edit Health Profile** ✏️\n5️⃣ You'll be taken to **Step 1** of the questionnaire\n6️⃣ Update any answers and click **Continue** through each step\n7️⃣ On the last step, click **Generate My Plan** to regenerate your diet plan",
    quickReplies: [
      { label: '🔄 Regenerate without editing', next: 'regenerate' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  regenerate: {
    id: 'regenerate',
    text: "To regenerate your diet plan without changing your profile:\n\n1️⃣ Go to your **Dashboard**\n2️⃣ Click **New Plan** in the Quick Actions section, OR\n3️⃣ Go to **Profile → Regenerate Diet Plan**\n\nThis will create a fresh 7-day plan using your existing health profile. Your old plan will be replaced.",
    quickReplies: [
      { label: '✏️ Edit profile first', next: 'edit_profile' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
  signout: {
    id: 'signout',
    text: "To sign out of NutriAI:\n\n1️⃣ Go to your **Profile** page (sidebar)\n2️⃣ Scroll to the bottom\n3️⃣ Click the red **🚪 Sign Out** button\n\nYour data and plan are saved — you can sign back in anytime.",
    quickReplies: [
      { label: '🔐 Sign back in', next: 'signin' },
      { label: '🏠 Back to main menu', next: 'welcome' },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      triggerBotResponse('welcome');
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Hide pulse after 6s
  useEffect(() => {
    const t = setTimeout(() => setShowPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  };

  const triggerBotResponse = (nodeId) => {
    const node = KB[nodeId];
    if (!node) return;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({ from: 'bot', text: node.text, quickReplies: node.quickReplies });
    }, 700);
  };

  const handleQuickReply = (reply) => {
    addMessage({ from: 'user', text: reply.label });
    triggerBotResponse(reply.next);
  };

  // Simple keyword matching for free-text input
  const matchIntent = (text) => {
    const t = text.toLowerCase();
    if (t.match(/sign.?in|log.?in|login/)) return 'signin';
    if (t.match(/sign.?up|register|create.{0,10}account/)) return 'signup';
    if (t.match(/forgot|reset|password/)) return 'forgot_password';
    if (t.match(/how.{0,10}work|what.{0,10}nutriai|about/)) return 'how_it_works';
    if (t.match(/diet.{0,10}plan|meal.{0,10}plan|generate/)) return 'diet_plan';
    if (t.match(/chat|ai.{0,10}chat|talk/)) return 'ai_chat';
    if (t.match(/progress|track|weight|water/)) return 'progress';
    if (t.match(/profile|edit.{0,10}profile|health.{0,10}profile/)) return 'profile_help';
    if (t.match(/questionnaire|quiz|steps|form/)) return 'questionnaire';
    if (t.match(/edit|update|change.{0,10}plan/)) return 'edit_profile';
    if (t.match(/regenerat|new.{0,10}plan/)) return 'regenerate';
    if (t.match(/sign.?out|logout|log.?out/)) return 'signout';
    if (t.match(/error|issue|problem|not.{0,5}work/)) return 'signin_error';
    return null;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage({ from: 'user', text: trimmed });
    setInput('');
    const intent = matchIntent(trimmed);
    if (intent) {
      triggerBotResponse(intent);
    } else {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMessage({
          from: 'bot',
          text: "I'm not sure I understood that. Here are some things I can help you with:",
          quickReplies: KB.welcome.quickReplies,
        });
      }, 700);
    }
  };

  // Format bot text — bold via **text** pattern, newlines to <br>
  const formatText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part === '\n') return <br key={i} />;
      return part;
    });
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!open && showPulse && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap"
            >
              💬 Need help?
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(o => !o)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-2xl shadow-primary-700/40 flex items-center justify-center text-2xl relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Open support chat"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>✕</motion.span>
            ) : (
              <motion.span key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>💬</motion.span>
            )}
          </AnimatePresence>
          {/* Pulse ring */}
          {!open && showPulse && (
            <span className="absolute inset-0 rounded-full border-2 border-primary-400 animate-ping opacity-60" />
          )}
        </motion.button>
      </div>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🥗</div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm leading-tight">NutriAI Support</p>
                <p className="text-primary-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online · Instant replies
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors text-lg leading-none focus:outline-none"
                aria-label="Close chat"
              >✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-[#0f1117] scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.from === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.from === 'bot' ? formatText(msg.text) : msg.text}
                  </div>

                  {/* Quick replies */}
                  {msg.from === 'bot' && msg.quickReplies?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.next}
                          onClick={() => handleQuickReply(qr)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all font-medium whitespace-nowrap"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 block"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-3 py-3 flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 text-sm px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
