'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Settings, FileText, Bot, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/auth.store';

const navigation = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Logs', href: '/logs', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold text-text-primary">FB Bot</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center border border-border">
              <User className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>

        <div className="pt-2 flex items-center justify-between text-xs text-text-secondary border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Online</span>
          </div>
          <span>v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
