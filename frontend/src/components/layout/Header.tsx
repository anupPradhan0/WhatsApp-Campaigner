import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { api } from '../../api/client';

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

const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);

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

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{ background: '#111113', borderBottom: '1px solid #27272a' }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-3">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #27272a' }}
            aria-label="Toggle menu"
          >
            {isSidebarOpen
              ? <X className="w-5 h-5" style={{ color: '#f4f4f5' }} />
              : <Menu className="w-5 h-5" style={{ color: '#f4f4f5' }} />
            }
          </button>
          <h1 className="text-lg font-semibold" style={{ color: '#f4f4f5' }}>Dashboard</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Welcome chip — desktop only */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #27272a' }}
          >
            <div>
              <p style={{ fontSize: 11, color: '#71717a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Welcome back</p>
              <p style={{ fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>{userData?.companyName || 'User'}</p>
            </div>
          </div>

          {/* Avatar */}
          <button
            onClick={() => navigate('/manage-business')}
            className="flex-shrink-0 relative group"
            title="View Profile"
          >
            {userData?.image ? (
              <img
                src={userData.image}
                alt={userData.companyName || 'Profile'}
                className="w-9 h-9 rounded-full object-cover transition-transform hover:scale-105"
                style={{ border: '2px solid #16a34a' }}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.companyName || 'U')}&background=16a34a&color=fff&size=128`;
                }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform hover:scale-105"
                style={{ background: '#16a34a', border: '2px solid rgba(22,163,74,0.5)' }}
              >
                {userData?.companyName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'; }}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
