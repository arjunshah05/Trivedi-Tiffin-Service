import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './features/auth/AuthPage';
import DashboardPage from './features/dashboard/DashboardPage';
import CalendarPage from './features/tiffins/CalendarPage';
import PaymentsPage from './features/payments/PaymentsPage';
import { AdminOverview, AdminCustomers, AdminPricing } from './features/admin/AdminPage';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-center"><div className="spinner"/><p>Preparing your workspace…</p></div>;
  return <Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/login'} replace/>;
}
function NotFound() { return <div className="screen-center"><h1>Page not found</h1><p>This page may have moved.</p><a className="button primary" href="/">Go to home</a></div>; }

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<HomeRedirect/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route path="/dashboard" element={<DashboardPage/>}/>
      <Route path="/calendar" element={<CalendarPage/>}/>
      <Route path="/payments" element={<PaymentsPage/>}/>
    </Route>
    <Route element={<ProtectedRoute adminOnly/>}>
      <Route path="/admin" element={<AdminOverview/>}/>
      <Route path="/admin/customers" element={<AdminCustomers/>}/>
      <Route path="/admin/pricing" element={<AdminPricing/>}/>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes></AuthProvider></BrowserRouter>;
}
