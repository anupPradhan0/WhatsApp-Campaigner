import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X, MessageSquare,
  LayoutDashboard, Send, Wallet,
  Users, UserCheck,
  BarChart3, Megaphone,
  Newspaper, GitBranch, AlertCircle, Building2,
} from 'lucide-react';
import { menuConfig, UserRole, type MenuSection } from '../../constants/Roles';
import { getUserRole } from '../../utils/Auth';
import { cn } from '../../lib/utils';

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
    // Super admin sits at the top of the hierarchy and sees every menu item.
    const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
    return menuConfig
      .map(section => ({
        ...section,
        items: section.items.filter(
          item => isSuperAdmin || item.allowedRoles.includes(userRole)
        ),
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
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen py-4 flex flex-col",
          "bg-surface border-r border-line",
          "transform transition-[transform,width,min-width] duration-300 ease-in-out",
          "overflow-y-auto lg:flex-shrink-0",
          collapsed ? "w-14 min-w-14" : "w-64 min-w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg bg-danger-dim border border-[rgba(248,113,113,0.2)]"
          aria-label="Close menu"
        >
          <X size={15} className="text-danger" />
        </button>


        {/* Logo — click to collapse */}
        <div
          onClick={() => { setCollapsed(c => !c); setTooltip(null); }}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl overflow-hidden cursor-pointer transition-[margin] duration-300 ease-in-out",
            "bg-brand/10 border border-brand/20",
            collapsed ? "justify-center mx-1 mb-6" : "justify-start mx-4 mb-6"
          )}
        >
          <div className="bg-brand shadow-[0_0_12px_rgba(22,163,74,0.4)] w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-fg text-[13px] font-semibold leading-tight whitespace-nowrap">WhatsApp</p>
              <p className="text-brand-light text-[10px] font-medium tracking-[0.08em] uppercase whitespace-nowrap">Campaign Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 pb-6 transition-[padding] duration-300 ease-in-out",
            collapsed ? "px-1" : "px-4"
          )}
        >
          {filteredMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-5">
              {section.title && !collapsed && (
                <p className="text-fg-subtle text-[11px] font-semibold uppercase tracking-[0.1em] pl-2 mb-2">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div className="h-px bg-line mx-1 mb-2" />
              )}
              <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
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
                        className={cn(
                          "flex items-center rounded-lg text-sm font-medium no-underline transition-[background-color,color] duration-150 border-l-2",
                          collapsed ? "justify-center gap-0 py-2.5 px-0" : "justify-start gap-3 py-2.5 px-3",
                          isActive
                            ? "text-brand-light bg-brand-dim border-l-brand"
                            : "text-[#a1a1aa] bg-transparent border-l-transparent hover:bg-white/[0.04] hover:text-fg"
                        )}
                      >
                        {Icon && <Icon size={16} />}
                        {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
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
          className="hidden lg:block fixed left-16 -translate-y-1/2 bg-line text-fg px-2.5 py-[5px] rounded-md text-xs font-medium pointer-events-none z-[9999] border border-line-strong whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          style={{ top: tooltip.y }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
};

export default Sidebar;
