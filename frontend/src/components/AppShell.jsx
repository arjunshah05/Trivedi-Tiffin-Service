import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, Wallet, Users, Settings, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../app/AuthContext';

export default function AppShell({ children, admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = admin
    ? [{ to: '/admin', label: 'Overview', icon: Home }, { to: '/admin/customers', label: 'Customers', icon: Users }, { to: '/admin/pricing', label: 'Pricing', icon: Settings }]
    : [{ to: '/dashboard', label: 'Dashboard', icon: Home }, { to: '/calendar', label: 'Tiffin calendar', icon: CalendarDays }, { to: '/payments', label: 'Payments', icon: Wallet }];
  async function signOut() { await logout(); navigate('/login'); }
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><UtensilsCrossed size={21}/></span><span><b>Trivedi</b><small>Tiffin Service</small></span></div>
      <div className="side-label">{admin ? 'ADMIN WORKSPACE' : 'YOUR WORKSPACE'}</div>
      <nav className="side-nav">{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">{user?.fullName?.slice(0,1)?.toUpperCase() || 'T'}</div><div className="user-mini"><b>{user?.fullName}</b><small>{admin ? 'Administrator' : 'Customer'}</small></div><button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={18}/></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div><span className="eyebrow">TRIVEDI TIFFIN SERVICE</span><div className="topbar-title">{admin ? 'Operations console' : 'Your tiffin account'}</div></div><div className="topbar-right"><span className="status-dot"/><span>Account active</span></div></header><div className="page-content">{children}</div></main>
  </div>;
}
