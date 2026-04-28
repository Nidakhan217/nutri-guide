import { Sidebar, BottomNav } from './Navigation';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      <Sidebar />
      <main className="lg:ml-60 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
