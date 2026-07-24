import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown, Building2 } from 'lucide-react';
import { api } from '../../api/client';
import { cn } from '../../lib/utils';

interface UserData {
  _id: string;
  email: string;
  role: string;
  companyName: string;
  image?: string;
}

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const fallbackAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=16a34a&color=fff&size=128`;

const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUserData(JSON.parse(userStr)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const name = userData?.companyName || 'User';
  const initial = name.charAt(0).toUpperCase();

  const Avatar = ({ size }: { size: number }) =>
    userData?.image ? (
      <img
        src={userData.image}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-brand"
        onError={e => { e.currentTarget.src = fallbackAvatar(name); }}
      />
    ) : (
      <div
        style={{ width: size, height: size }}
        className="rounded-full flex items-center justify-center text-white font-bold bg-brand border-2 border-[rgba(22,163,74,0.5)]"
      >
        {initial}
      </div>
    );

  return (
    <header className="w-full sticky top-0 z-50 bg-surface border-b border-line">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg transition-colors bg-white/5 border border-line"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-fg" /> : <Menu className="w-5 h-5 text-fg" />}
          </button>
          <h1 className="text-lg font-semibold text-fg">Dashboard</h1>
        </div>

        {/* Right — single profile menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className={cn(
              "flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 transition-colors border",
              menuOpen ? "bg-white/[0.06] border-line-strong" : "bg-transparent border-transparent hover:bg-white/[0.04]",
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar size={36} />
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-[13px] text-fg font-semibold max-w-[160px] truncate">{name}</p>
              <p className="text-[11px] text-fg-muted capitalize">{userData?.role || 'Member'}</p>
            </div>
            <ChevronDown size={16} className={cn("text-fg-muted transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

              <div className="absolute right-0 mt-2 w-64 z-50 bg-surface border border-line rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
                  <Avatar size={40} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-fg font-semibold truncate">{name}</p>
                    <p className="text-[11px] text-fg-muted truncate">{userData?.email || ''}</p>
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/manage-business'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-fg font-medium hover:bg-white/[0.05] transition-colors"
                  >
                    <Building2 size={16} className="text-fg-muted" /> My Business
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-danger font-medium hover:bg-danger-dim transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
