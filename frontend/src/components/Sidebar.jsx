import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, LogOut, UserCircle } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path 
    ? 'bg-blue-50 text-[#1976d2]' 
    : 'text-gray-700 hover:bg-gray-100';

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col font-sans shadow-sm z-10">
      
      {/* User Profile Header (Material Style) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
        <UserCircle className="text-gray-400" size={40} />
        <div>
          <h2 className="text-sm font-medium text-gray-900">System User</h2>
          <p className="text-xs text-gray-500">{role.replace('_', ' ')}</p>
        </div>
      </div>
      
      <nav className="flex-1 py-2">
        {(role === 'Administrator' || role === 'Agent') && (
          <Link to="/dashboard" className={`flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
            <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'text-[#1976d2]' : 'text-gray-500'} /> Dashboard
          </Link>
        )}
        {(role === 'Human_Verifier' || role === 'Administrator') && (
          <Link to="/queue" className={`flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors ${isActive('/queue')}`}>
            <Layers size={20} className={location.pathname === '/queue' ? 'text-[#1976d2]' : 'text-gray-500'} /> Triage Queue
          </Link>
        )}
      </nav>

      <div className="border-t border-gray-200 py-2">
        <Link to="/login" className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
          <LogOut size={20} className="text-gray-500" /> Sign out
        </Link>
      </div>
    </div>
  );
}