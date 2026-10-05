import React, { useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, BrainCircuit, LogOut, Droplet, Menu } from 'lucide-react';

export default function DashboardLayout() {
  const { token, user, fetchUser, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-navy text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Droplet className="h-6 w-6 text-blue-400 mr-2" />
          <span className="font-bold text-lg tracking-wider">SMART-NEER</span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <Link 
            to="/" 
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-primary' : 'hover:bg-gray-800'}`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Overview
          </Link>
          {user?.role !== 'PUMP_OPERATOR' && (
            <Link 
              to="/planning" 
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/planning' ? 'bg-primary' : 'hover:bg-gray-800'}`}
            >
              <BrainCircuit className="h-5 w-5 mr-3" />
              AI Planning
            </Link>
          )}
        </div>
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-4 px-2">Logged in as {user?.username} ({user?.role})</div>
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-navy text-white">
          <div className="flex items-center">
            <Droplet className="h-6 w-6 text-blue-400 mr-2" />
            <span className="font-bold">SMART-NEER</span>
          </div>
          <button className="p-2"><Menu className="h-6 w-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
