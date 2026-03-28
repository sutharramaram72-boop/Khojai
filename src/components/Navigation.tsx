import { Home, Search, PlayCircle, ShoppingBag, PlusCircle, MessageSquare, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Navigation() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: PlayCircle, label: 'Reels', path: '/reels' },
    { icon: PlusCircle, label: 'Create', path: '/create' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="mx-auto flex max-w-lg items-center justify-around rounded-full bg-black/40 p-2 backdrop-blur-2xl border border-white/10 shadow-2xl">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 p-3 rounded-full transition-all duration-300",
                isActive ? "text-primary scale-110 bg-primary/10" : "text-gray-400 hover:text-white"
              )
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-[10px] font-medium uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
