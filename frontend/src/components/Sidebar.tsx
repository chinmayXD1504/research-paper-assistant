'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  LayoutDashboard, 
  Search, 
  UploadCloud, 
  Sparkles, 
  LogOut,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Bookmark
} from 'lucide-react';
import { removeAuthToken } from '@/lib/api';
import { store, UserProfile } from '@/lib/store';

interface SidebarProps {
  onOpenUpload?: () => void;
  paperCount?: number;
}

export default function Sidebar({ onOpenUpload, paperCount = 3 }: SidebarProps) {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: 'researcher@university.edu',
    fullName: 'Researcher Account',
    initials: 'RA',
    roleOrDept: 'Academic Scholar'
  });

  useEffect(() => {
    setUserProfile(store.getUserProfile());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Library Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: paperCount.toString() },
    { label: 'Cross-Paper Search', href: '/search', icon: Search },
  ];

  return (
    <aside className="w-64 bg-[#F3ECE7] border-r border-[#D3C4BE] flex flex-col h-screen fixed left-0 top-0 z-30 shadow-paper-md">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-[#D3C4BE] flex items-center gap-3 bg-[#E8E6D9]/50">
        <div className="w-10 h-10 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center shadow-sm shrink-0 text-[#1c1917]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-tight text-[#1c1917]">
            ResearchAI
          </h1>
          <p className="text-[10px] text-[#57534e] font-bold tracking-wider uppercase flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-[#1c1917]" /> Academic Assistant
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#292524] hover:bg-[#1c1917] active:scale-98 text-[#F4EEE1] font-bold text-xs rounded-2xl transition-all shadow-paper-sm cursor-pointer group"
        >
          <UploadCloud className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-[#E9CCB1]" />
          <span>+ Upload Research PDF</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-[#999999] uppercase tracking-widest px-3 py-1.5">
          Workspace Hub
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] shadow-paper-sm'
                  : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1c1917]' : 'text-[#999999]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-[#EBCFC4] text-[#1c1917] border border-[#D3C4BE] px-2.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Infrastructure Status */}
        <div className="text-[10px] font-bold text-[#999999] uppercase tracking-widest px-3 pt-6 pb-1.5">
          AI Infrastructure
        </div>
        <div className="mx-1 p-3.5 rounded-2xl bg-[#E8E6D9]/70 border border-[#D3C4BE] space-y-2.5 text-[11px]">
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1c1917] font-semibold">
              <Database className="w-3.5 h-3.5 text-[#57534e]" /> Pinecone Vector
            </span>
            <span className="text-[9px] bg-[#E9CCB1] text-[#1c1917] border border-[#C4BDAC] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1c1917]"></span>
              Live Sync
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1c1917] font-semibold">
              <Cpu className="w-3.5 h-3.5 text-[#57534e]" /> Google Gemini
            </span>
            <span className="text-[9px] bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2 py-0.5 rounded-full font-bold">
              1.5 Flash
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1c1917] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#57534e]" /> Privacy Vault
            </span>
            <span className="text-[9px] bg-[#EFEEEE] text-[#1c1917] border border-[#D3C4BE] px-2 py-0.5 rounded-full font-bold">
              Per-User
            </span>
          </div>
        </div>
      </nav>

      {/* Dynamic User Profile Footer */}
      <div className="p-4 border-t border-[#D3C4BE] bg-[#E8E6D9]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-xs font-extrabold text-[#1c1917] shadow-sm shrink-0">
              {userProfile.initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-[#1c1917] truncate">{userProfile.fullName}</p>
              <p className="text-[10px] text-[#57534e] font-semibold truncate">{userProfile.roleOrDept || userProfile.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-[#57534e] hover:text-[#1c1917] rounded-xl hover:bg-[#E4DAC2] transition cursor-pointer shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
