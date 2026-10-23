import { useEffect, useState } from 'react';
import { Wallet, ReceiptText, CalendarDays } from 'lucide-react';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import { api } from '../../services/api';
import { money, currentMonth, monthLabel } from '../../utils/format';

export default function PaymentsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    let active = true;
    setLoading(true); setError('');
    Promise.all([api.dashboard(month),api.payments(month)]).then(([d,p])=>{
      if(active){setSummary(d.current);setPayments(p.payments);}
    }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[month]);
  return <AppShell><div className="page-heading"><div><span className="eyebrow">PAYMENT RECORDS</span><h1>Billing & payments</h1><p>Review your monthly charges, payments, and remaining balance.</p></div><label className="month-input">Billing month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label></div>
    {error&&<div className="alert error">{error}</div>}
    <div className="stat-grid"><StatCard label="New charges" value={money(summary?.monthlyChargesPaise)} icon={ReceiptText} tone="blue"/><StatCard label="Previous balance" value={money(summary?.openingOutstandingPaise)} icon={CalendarDays} tone="purple"/><StatCard label="Paid this month" value={money(summary?.paidPaise)} icon={Wallet} tone="green"/><StatCard label="Total remaining" value={money(summary?.balancePaise)} hint={summary?.paymentStatus?.replace('_',' ')} icon={CalendarDays} tone="orange"/></div>
    <div className="notice"><b>Total due for {monthLabel(month)}:</b> {money(summary?.totalDuePaise)} <span className={`status-tag ${summary?.paymentStatus==='PAID'?'success':summary?.paymentStatus==='PARTIALLY_PAID'?'warning':'danger'}`}>{summary?.paymentStatus?.replace('_',' ')||'—'}</span></div>
    <section className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">TRANSACTION HISTORY</span><h2>{monthLabel(month)}</h2></div><span className="count-pill">{payments.length} records</span></div>
      {loading?<div className="empty-state" role="status">Loading billing and payment history…</div>:payments.length===0?<div className="empty-state"><div className="empty-icon"><Wallet/></div><b>No payments recorded for this month</b><p>When the administrator records a payment, it will appear here.</p></div>:
      <div className="table-wrap"><table><thead><tr><th>Payment date & time</th><th>Bill month</th><th>Method</th><th>Reference / notes</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>{payments.map(p=><tr key={p._id}><td>{new Date(p.paidAt).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td>{monthLabel(p.billingPeriod)}</td><td><span className="method-tag">{p.method.replace('_',' ')}</span></td><td>{[p.reference,p.note,p.status==='REVERSED'?p.reversalReason:''].filter(Boolean).join(' · ')||'—'}</td><td><span className={`status-tag ${p.status==='CONFIRMED'?'success':'danger'}`}>{p.status==='CONFIRMED'?'COMPLETED':'REVERSED'}</span></td><td className="align-right amount-cell">{money(p.amountPaise)}</td></tr>)}</tbody></table></div>}
    </section>
    <div className="notice"><b>Note:</b> Payments are recorded separately from your bill. Reversed transactions remain visible in the payment history.</div>
  </AppShell>;
}
