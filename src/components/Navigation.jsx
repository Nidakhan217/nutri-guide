import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⬡', emoji: '🏠', label: 'Dashboard' },
  { to: '/plan', icon: '⬡', emoji: '📋', label: 'My Plan' },
  { to: '/chat', icon: '⬡', emoji: '💬', label: 'Chat' },
  { to: '/progress', icon: '⬡', emoji: '📈', label: 'Progress' },
  { to: '/profile', icon: '⬡', emoji: '👤', label: 'Profile' },
];

export function Sidebar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen fixed left-0 top-0 z-40"
      style={{ background: '#13161f', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-base">🥗</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">NutriAI</p>
            <p className="text-xs text-slate-500 mt-0.5">AI Dietician</p>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
            {userProfile?.photoURL
              ? <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate leading-none">
              {userProfile?.displayName || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2 mt-2">Menu</p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleLogout}
          className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full">
          <span className="text-base w-5 text-center flex-shrink-0">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{ background: '#13161f', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-3 px-4 transition-all duration-200 ${
                isActive ? 'text-primary-400' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
