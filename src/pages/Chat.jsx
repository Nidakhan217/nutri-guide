import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { streamChatResponse, CHAT_SYSTEM_PROMPT } from '../lib/groq';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/RouteGuards';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SUGGESTED = [
  "Swap Tuesday lunch with something lighter",
  "Make my plan more budget-friendly",
  "I'm craving something sweet — what can I eat?",
  "What's a good pre-workout snack for me?",
  "Can I eat out today? What to order?",
];

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-sm">🥗</span>
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
        ? 'bg-primary-700 text-white rounded-tr-sm'
        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'}`}>
        {msg.content}
        {msg.streaming && <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [systemContext, setSystemContext] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadHistory();
    buildContext();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function buildContext() {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();
      const profile = data?.onboardingData || {};
      const plan = data?.currentPlan || {};
      setSystemContext(`${CHAT_SYSTEM_PROMPT}\n\nUSER PROFILE:\n${JSON.stringify(profile, null, 2)}\n\nCURRENT DIET PLAN:\n${JSON.stringify(plan, null, 2)}`);
    } catch {}
  }

  async function loadHistory() {
    try {
      const q = query(collection(db, 'chats', user.uid, 'messages'), orderBy('createdAt', 'asc'), limit(50));
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs.length ? msgs : [{
        role: 'assistant', content: `Hi! I'm NutriAI, your personal AI dietician. I've reviewed your profile and diet plan. How can I help you today? 🥗`,
      }]);
    } catch {
      setMessages([{ role: 'assistant', content: "Hi! I'm NutriAI. How can I help you with your nutrition today? 🥗" }]);
    }
  }

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || streaming) return;
    setInput('');

    const newMessages = [...messages.filter(m => m.content), { role: 'user', content: userMsg }];
    setMessages(newMessages);

    const aiPlaceholder = { role: 'assistant', content: '', streaming: true };
    setMessages(m => [...m, aiPlaceholder]);
    setStreaming(true);

    try {
      const apiMessages = [
        { role: 'system', content: systemContext || CHAT_SYSTEM_PROMPT },
        ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      ];

      let full = '';
      await streamChatResponse(apiMessages, (chunk, fullText) => {
        full = fullText;
        setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: fullText } : msg));
      });

      const finalMsg = { role: 'assistant', content: full };
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? finalMsg : msg));

      // Save to Firestore
      await addDoc(collection(db, 'chats', user.uid, 'messages'), { role: 'user', content: userMsg, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'chats', user.uid, 'messages'), { role: 'assistant', content: full, createdAt: serverTimestamp() });
    } catch (err) {
      toast.error('Failed to get response. Please try again.');
      setMessages(m => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex flex-col h-screen lg:h-[calc(100vh)] overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white">🥗</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">NutriAI Assistant</h1>
              <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            <AnimatePresence>
              {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="flex-shrink-0 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-700 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask your dietician anything..."
                className="input-field flex-1"
                disabled={streaming}
                id="chat-input"
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || streaming}
                className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed" id="chat-send">
                {streaming ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '→'}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
