import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Utensils, BarChart2, MessageCircle } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/train', icon: Dumbbell, label: 'Train' },
  { to: '/fuel', icon: Utensils, label: 'Fuel' },
  { to: '/body', icon: BarChart2, label: 'Body' },
  { to: '/coach', icon: MessageCircle, label: 'Coach' },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ background: '#141414', borderTop: '1px solid rgba(201,150,58,0.15)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-gold' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
