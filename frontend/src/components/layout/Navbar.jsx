import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Pill, Search, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useNotification();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'PATIENT') return '/patient/dashboard';
    if (user.role === 'PHARMACY' || user.role === 'MEDICAL_AGENCY') return '/vendor/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="bg-navy-900 text-white border-b border-navy-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 text-white hover:opacity-95 transition-opacity">
            <div className="w-9 h-9 bg-teal-600 rounded-md flex items-center justify-center text-white shadow-sm">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-wide">MEDICINE FINDER</span>
              <span className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">Availability Platform</span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors ${isActive('/') ? 'text-teal-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`flex items-center gap-1.5 transition-colors ${isActive('/search') ? 'text-teal-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              <Search className="w-4 h-4 text-teal-400" />
              Find Medicine
            </Link>

            {/* Role Portal Shortcut */}
            {isAuthenticated && (
              <Link
                to={getPortalLink()}
                className={`transition-colors ${isActive(getPortalLink()) ? 'text-teal-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                {user?.role === 'ADMIN' ? 'Admin Console' : user?.role === 'PATIENT' ? 'My Portal' : 'Vendor Portal'}
              </Link>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user?.full_name}</div>
                  <div className="text-[10px] text-teal-400 uppercase tracking-wider font-mono">{user?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white text-xs font-medium px-3 py-2 rounded-md transition-colors border border-navy-700"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                  Register Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
