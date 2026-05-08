import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X, MessageSquare,
  LayoutDashboard, Send, Wallet,
  Users, UserCheck,
  BarChart3, Megaphone,
  Newspaper, GitBranch, AlertCircle, Building2,
} from 'lucide-react';
import { menuConfig, type MenuSection } from '../../constants/Roles';
import { getUserRole } from '../../utils/Auth';

const ICONS: Record<string, React.FC<{ size?: number; color?: string; style?: React.CSSProperties }>> = {
  '/home':             LayoutDashboard,
  '/send-whatsapp':    Send,
  '/credits':          Wallet,
  '/manage-reseller':  Users,
  '/manage-users':     UserCheck,
  '/whatsapp-report':  BarChart3,
  '/all-campaign':     Megaphone,
  '/news':             Newspaper,
  '/tree-view':        GitBranch,
  '/complaints':       AlertCircle,
  '/manage-business':  Building2,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const activeItem = location.pathname;
  const userRole = getUserRole();

  const getFilteredMenuSections = (): MenuSection[] => {
    if (!userRole) return [];
    return menuConfig
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.allowedRoles.includes(userRole)),
      }))
      .filter(section => section.items.length > 0);
  };

  const filteredMenuSections = getFilteredMenuSections();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{ background: '#111113', borderRight: '1px solid #27272a' }}
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-64 sm:w-72 lg:w-64 h-screen
          p-4 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto lg:flex-shrink-0
        `}
      >
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
          aria-label="Close menu"
        >
          <X size={15} style={{ color: '#f87171' }} />
        </button>

        {/* Logo */}
        <div
          className="mb-6 p-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#16a34a', boxShadow: '0 0 12px rgba(22,163,74,0.4)' }}
          >
            <MessageSquare size={16} color="#fff" />
          </div>
          <div>
            <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>WhatsApp</p>
            <p style={{ color: '#4ade80', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campaign Manager</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 pb-6">
          {filteredMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <p
                  className="px-2 mb-2 uppercase text-xs font-semibold tracking-wider"
                  style={{ color: '#52525b' }}
                >
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeItem === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                        style={{
                          color: isActive ? '#4ade80' : '#a1a1aa',
                          background: isActive ? 'rgba(22,163,74,0.12)' : 'transparent',
                          borderLeft: isActive ? '2px solid #16a34a' : '2px solid transparent',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.color = '#f4f4f5';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
                          }
                        }}
                      >
                        {(() => {
                          const Icon = ICONS[item.path];
                          return Icon ? <Icon size={16} /> : null;
                        })()}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
