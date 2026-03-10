import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  ClipboardList,
  Users,
  Settings,
  BookOpen,
  CalendarDays,
  CalendarX,
  Mail,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  UsersRound
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isSuperAdmin, canManageAttendance } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/aanmelden', icon: UserPlus, label: 'Aanmelden' },
    { to: '/beschikbaar', icon: Calendar, label: 'Beschikbare Studies' },
    { to: '/mijn-aanmeldingen', icon: ClipboardList, label: 'Mijn Aanmeldingen' },
  ];

  const attendanceItem = { to: '/aanwezigheden', icon: Users, label: 'Aanwezigheden' };

  const adminItems = [
    { to: '/admin/klassen', icon: GraduationCap, label: 'Klassen' },
    { to: '/admin/leerlingen', icon: UsersRound, label: 'Leerlingen', superadminOnly: true },
    { to: '/admin/studiesoorten', icon: BookOpen, label: 'Studiesoorten' },
    { to: '/admin/beschikbaarheid', icon: CalendarDays, label: 'Beschikbaarheid' },
    { to: '/admin/uitsluitingen', icon: CalendarX, label: 'Uitsluitingsdata' },
    { to: '/admin/email-templates', icon: Mail, label: 'E-mailtemplates' },
    { to: '/admin/aanmeldingen', icon: ClipboardList, label: 'Alle Aanmeldingen' },
    { to: '/admin/rapporten', icon: FileText, label: 'Rapportage' },
    { to: '/admin/gebruikers', icon: Users, label: 'Gebruikers' },
  ];

  const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={() => {
        setMobileOpen(false);
        onClick?.();
      }}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200',
          'hover:bg-white/10',
          isActive ? 'bg-white/15 text-white font-medium' : 'text-white/80'
        )
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">StudieReg</h1>
            <p className="text-xs text-white/60">Studie Registratie</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {canManageAttendance() && (
          <NavItem {...attendanceItem} />
        )}

        {isAdmin() && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-white/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  adminExpanded && 'rotate-180'
                )}
              />
            </button>
            
            {adminExpanded && (
              <div className="mt-1 ml-4 space-y-1 animate-slideUp">
                {adminItems
                  .filter(item => !item.superadminOnly || isSuperAdmin())
                  .map((item) => (
                    <NavItem key={item.to} {...item} />
                  ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/60 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Uitloggen
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#2E5C5A] text-white shadow-lg"
        data-testid="mobile-menu-toggle"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-[#2E5C5A] transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
