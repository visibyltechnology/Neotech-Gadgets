import { Navigate, Outlet, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Package, PlusCircle, LogOut, User, Users, ClipboardList, Settings, Menu, X, Tag, Briefcase } from 'lucide-react';
import { auth } from '../../firebase';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wait for auth + Firestore fetch to complete before making access decision
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div style={{ width: 44, height: 44, border: '3px solid #1e293b', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: "/admin", icon: <Package size={18} />, label: "Manage Products", end: true },
    { to: "/admin/categories", icon: <Tag size={18} />, label: "Manage Categories" },
    { to: "/admin/brands", icon: <Briefcase size={18} />, label: "Manage Brands" },
    { to: "/admin/orders", icon: <ClipboardList size={18} />, label: "Customer Orders" },
    { to: "/admin/users", icon: <Users size={18} />, label: "Registered Users" },
    { to: "/admin/new", icon: <PlusCircle size={18} />, label: "Add Product" },
    { to: "/admin/settings", icon: <Settings size={18} />, label: "Site Settings" },
    { to: "/profile", icon: <User size={18} />, label: "My Profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans overflow-x-hidden">
      
      {/* Mobile Header Toggle */}
      <div className="md:hidden bg-brandBlack text-white p-4 flex justify-between items-center z-20 shadow-md border-b border-brandLime/20 shrink-0">
        <div>
          <h2 className="font-black text-lg uppercase tracking-widest text-white">
            MAYJAY <span className="text-brandLime">ADMIN</span>
          </h2>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-300 hover:text-white">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] md:h-screen z-30 w-64 bg-brandBlack border-r border-gray-800 shadow-xl md:shadow-none
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col flex-shrink-0
      `}>
        <div className="p-6 hidden md:block border-b border-gray-800">
          <h2 className="font-black text-2xl uppercase tracking-widest text-white mb-1">
            MAYJAY <span className="text-brandLime">ADMIN</span>
          </h2>
          <p className="text-xs font-medium text-gray-400 break-all">{user.email}</p>
        </div>

        <div className="md:hidden p-6 border-b border-gray-800 mt-16">
           <p className="text-xs font-medium text-gray-400 break-all">{user.email}</p>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-all
                ${isActive 
                  ? 'bg-brandLime text-brandBlack shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-brandLime'}
              `}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={async () => {
              await logout();
              toast.success('Signed out successfully');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-brandLime transition-all"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full max-w-full p-4 md:p-8 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
