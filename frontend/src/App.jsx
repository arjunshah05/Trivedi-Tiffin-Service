import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Home, Services, Footer } from './features/home/LandingPage';
import AuthPage from './features/auth/AuthPage';
import DashboardPage from './features/dashboard/DashboardPage';
import CalendarPage from './features/tiffins/CalendarPage';
import PaymentsPage from './features/payments/PaymentsPage';
import { AdminOverview, AdminCustomers, AdminPricing } from './features/admin/AdminPage';

function NotFound() { return <div className="screen-center"><h1>Page not found</h1><p>This page may have moved.</p><a className="button primary" href="/">Go to home</a></div>; }

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<><Home/><Services/><Footer/></>}/>
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
