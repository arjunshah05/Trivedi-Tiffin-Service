import { useEffect, useState } from 'react';
import { CalendarDays, IndianRupee, Wallet, Utensils, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import { api } from '../../services/api';
import { money, balanceMoney, currentMonth, previousMonth, monthLabel } from '../../utils/format';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [rate, setRate] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.dashboard(month), api.currentRate()]).then(([d,r]) => {setData(d);setRate(r.rate);}).catch(e => setError(e.message)); }, [month]);
  const current = data?.current;
  const previous = data?.previous;
  const move = (delta) => {
    const [y,m] = month.split('-').map(Number); const d = new Date(y,m-1+delta,1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };
  return <AppShell><div className="page-heading"><div><span className="eyebrow">OVERVIEW</span><h1>Good to see you.</h1><p>Here’s your tiffin activity and billing at a glance.</p></div><div className="month-switch"><button className="icon-button" onClick={()=>move(-1)} aria-label="Previous month"><ChevronLeft/></button><b>{monthLabel(month)}</b><button className="icon-button" onClick={()=>move(1)} aria-label="Next month"><ChevronRight/></button></div></div>
    {error && <div className="alert error">{error}</div>}
    <div className="stat-grid">
      <StatCard label="Tiffins this month" value={current?.totalTiffins ?? '—'} hint={`${current?.lunchCount ?? 0} lunch · ${current?.dinnerCount ?? 0} dinner`} icon={Utensils} tone="green"/>
      <StatCard label="This month’s charge" value={money(current?.chargePaise)} hint="Based on meals marked received" icon={IndianRupee} tone="blue"/>
      <StatCard label="Paid this month" value={money(current?.paidPaise)} hint={`${current?.paymentsCount ?? 0} payment record(s)`} icon={Wallet} tone="orange"/>
      <StatCard label="Balance remaining" value={balanceMoney(current?.balancePaise)} hint={current?.balancePaise > 0 ? 'Amount currently due' : current?.creditCarriedForwardPaise > 0 ? `${money(current.creditCarriedForwardPaise)} credit for next month` : 'No outstanding amount'} icon={CalendarDays} tone="purple"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel monthly-panel"><div className="panel-head"><div><span className="eyebrow">MONTHLY BREAKDOWN</span><h2>{monthLabel(month)}</h2></div><Link className="text-link" to="/calendar">Open calendar <ArrowUpRight size={15}/></Link></div>
        <div className="meal-row"><div className="meal-symbol lunch">L</div><div className="meal-info"><b>Lunch</b><small>Meals marked received</small></div><strong>{current?.lunchCount ?? '—'}</strong></div>
        <div className="meal-row"><div className="meal-symbol dinner">D</div><div className="meal-info"><b>Dinner</b><small>Meals marked received</small></div><strong>{current?.dinnerCount ?? '—'}</strong></div>
        <div className="summary-total"><span>Current monthly charge</span><b>{money(current?.chargePaise)}</b></div>
        <div className="rate-note">Current displayed rate: <b>{money(rate?.amountPaise)}</b> per tiffin</div>
      </section>
      <section className="panel previous-panel"><div className="panel-head"><div><span className="eyebrow">PREVIOUS MONTH</span><h2>{monthLabel(previousMonth(month))}</h2></div><div className="round-icon"><ArrowDownRight size={18}/></div></div>
        <div className="previous-amount">{money(previous?.totalDuePaise)}</div><p className="muted">Total due including any opening balance</p>
        <div className="mini-stats"><div><small>Tiffins</small><b>{previous?.totalTiffins ?? '—'}</b></div><div><small>Paid</small><b>{money(previous?.paidPaise)}</b></div><div><small>Remaining</small><b>{balanceMoney(previous?.balancePaise)}</b></div></div>
        <Link className="button secondary full" to="/payments">View payment history</Link>
      </section>
    </div>
    <div className="tip-banner"><div className="tip-icon"><CalendarDays/></div><div><b>Keep your calendar up to date</b><p>Mark lunch and dinner separately. Only meals marked “Received” are included in your charge.</p></div><Link className="text-link" to="/calendar">Update meals <ArrowUpRight size={15}/></Link></div>
  </AppShell>;
}
