import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X, MessageSquare,
  LayoutDashboard, Send, Wallet,
  Users, UserCheck,
  BarChart3, Megaphone,
  Newspaper, GitBranch, AlertCircle, Building2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { menuConfig, type MenuSection } from '../../constants/Roles';
import { getUserRole } from '../../utils/Auth';

const ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  '/home':            LayoutDashboard,
  '/send-whatsapp':   Send,
  '/credits':         Wallet,
  '/manage-reseller': Users,
  '/manage-users':    UserCheck,
  '/whatsapp-report': BarChart3,
  '/all-campaign':    Megaphone,
  '/news':            Newspaper,
  '/tree-view':       GitBranch,
  '/complaints':      AlertCircle,
  '/manage-business': Building2,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const activeItem = location.pathname;
  const userRole = getUserRole();
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);

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
  const W = collapsed ? 56 : 256;

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
        style={{
          background: '#111113',
          borderRight: '1px solid #27272a',
          width: W,
          minWidth: W,
          transition: 'width 0.25s ease, min-width 0.25s ease',
          position: 'relative',
        }}
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen py-4 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto lg:flex-shrink-0
        `}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
          aria-label="Close menu"
        >
          <X size={15} style={{ color: '#f87171' }} />
        </button>

        {/* Collapse toggle — desktop only, poking out on the right edge */}
        <button
          onClick={() => { setCollapsed(c => !c); setTooltip(null); }}
          className="hidden lg:flex items-center justify-center absolute"
          style={{
            top: 20,
            right: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#27272a',
            border: '1px solid #3f3f46',
            cursor: 'pointer',
            zIndex: 10,
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={11} style={{ color: '#a1a1aa' }} />
            : <ChevronLeft  size={11} style={{ color: '#a1a1aa' }} />
          }
        </button>

        {/* Logo — click to collapse */}
        <div
          onClick={() => { setCollapsed(c => !c); setTooltip(null); }}
          style={{
            background: 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            padding: 12,
            margin: collapsed ? '0 4px 24px' : '0 16px 24px',
            transition: 'margin 0.25s ease',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              background: '#16a34a',
              boxShadow: '0 0 12px rgba(22,163,74,0.4)',
              width: 32, height: 32,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={16} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>WhatsApp</p>
              <p style={{ color: '#4ade80', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Campaign Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            paddingBottom: 24,
            paddingLeft: collapsed ? 4 : 16,
            paddingRight: collapsed ? 4 : 16,
            transition: 'padding 0.25s ease',
          }}
        >
          {filteredMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ marginBottom: 20 }}>
              {section.title && !collapsed && (
                <p style={{ color: '#52525b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 8, marginBottom: 8 }}>
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div style={{ height: 1, background: '#27272a', margin: '0 4px 8px' }} />
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map((item) => {
                  const isActive = activeItem === item.path;
                  const Icon = ICONS[item.path];
                  return (
                    <li
                      key={item.path}
                      onMouseEnter={(e) => {
                        if (collapsed) {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip({ label: item.label, y: rect.top + rect.height / 2 });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <Link
                        to={item.path}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          gap: collapsed ? 0 : 12,
                          padding: collapsed ? '10px 0' : '10px 12px',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          textDecoration: 'none',
                          color: isActive ? '#4ade80' : '#a1a1aa',
                          background: isActive ? 'rgba(22,163,74,0.12)' : 'transparent',
                          borderLeft: isActive ? '2px solid #16a34a' : '2px solid transparent',
                          transition: 'background 0.15s, color 0.15s',
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
                        {Icon && <Icon size={16} />}
                        {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Floating tooltip for collapsed desktop mode */}
      {collapsed && tooltip && (
        <div
          className="hidden lg:block"
          style={{
            position: 'fixed',
            left: 64,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            background: '#27272a',
            color: '#f4f4f5',
            padding: '5px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 9999,
            border: '1px solid #3f3f46',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
};

export default Sidebar;
