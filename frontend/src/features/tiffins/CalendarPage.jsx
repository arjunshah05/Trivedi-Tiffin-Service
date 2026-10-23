import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, CircleHelp, Info } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { api } from '../../services/api';
import { currentMonth, monthLabel, money } from '../../utils/format';

export default function CalendarPage() {
  const [month, setMonth] = useState(currentMonth());
  const [entries, setEntries] = useState([]);
  const [rate, setRate] = useState(7500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const [e,r] = await Promise.all([api.tiffins(month), api.currentRate()]); setEntries(e.entries); setRate(r.rate.amountPaise); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [month]);
  const entryMap = useMemo(() => new Map(entries.map(e => [`${e.serviceDate}:${e.mealType}`, e.status])), [entries]);
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const receivedCount = entries.filter(e => e.status === 'RECEIVED').length;
  async function setStatus(date, meal, status) {
    const key = `${date}:${meal}`;
    setSaving(key); setError('');
    try { await api.setTiffin(date, meal, status); await load(); }
    catch (e) { setError(e.message); } finally { setSaving(''); }
  }
  function move(delta) { const d = new Date(year, monthNumber - 1 + delta, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }
  return <AppShell><div className="page-heading"><div><span className="eyebrow">MEAL TRACKER</span><h1>Your tiffin calendar</h1><p>Record lunch and dinner for each day. Your bill updates automatically.</p></div><div className="month-switch"><button className="icon-button" onClick={()=>move(-1)} aria-label="Previous month"><ChevronLeft/></button><b>{monthLabel(month)}</b><button className="icon-button" onClick={()=>move(1)} aria-label="Next month"><ChevronRight/></button></div></div>
    <div className="calendar-summary"><div><span className="eyebrow">MEALS RECEIVED</span><strong>{receivedCount}</strong><small>in {monthLabel(month)}</small></div><div><span className="eyebrow">ESTIMATED CHARGE</span><strong>{money(receivedCount*rate)}</strong><small>{money(rate)} per meal</small></div><div className="legend"><span><i className="legend-dot received"/> Received</span><span><i className="legend-dot missed"/> Not received</span><span><i className="legend-dot unrecorded"/> Unrecorded</span></div></div>
    {error && <div className="alert error">{error}</div>}
    <section className="panel calendar-panel"><div className="calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}</div>
      {loading ? <div className="loading-line">Loading calendar…</div> : <div className="calendar-grid">
        {Array.from({length:firstDay},(_,i)=><div className="calendar-blank" key={`blank-${i}`}/>)}
        {Array.from({length:days},(_,i)=>{
          const day=i+1; const date=`${month}-${String(day).padStart(2,'0')}`;
          const today = date === new Date().toLocaleDateString('en-CA');
          const future = date > new Date().toLocaleDateString('en-CA');
          const lunch=entryMap.get(`${date}:LUNCH`); const dinner=entryMap.get(`${date}:DINNER`);
          return <div className={`calendar-day ${today?'today':''}`} key={date}><div className="day-top"><span>{day}</span>{today&&<small>Today</small>}</div>
            {['LUNCH','DINNER'].map(meal=>{
              const status=entryMap.get(`${date}:${meal}`);
              const state=status==='RECEIVED'?'received':status==='NOT_RECEIVED'?'missed':'unrecorded';
              return <div className={`meal-control ${state}`} key={meal}>
                <span className="meal-label">{meal==='LUNCH'?'Lunch':'Dinner'}</span>
                <div className="meal-actions">
                  <button title={`${meal}: Received`} aria-label={`${date} ${meal}: mark received`} disabled={future||saving===`${date}:${meal}`} className={status==='RECEIVED'?'selected':''} onClick={()=>setStatus(date,meal,'RECEIVED')}><Check size={13}/></button>
                  <button title={`${meal}: Not received`} aria-label={`${date} ${meal}: mark not received`} disabled={future||saving===`${date}:${meal}`} className={status==='NOT_RECEIVED'?'selected':''} onClick={()=>setStatus(date,meal,'NOT_RECEIVED')}><X size={13}/></button>
                </div>
              </div>;
            })}
          </div>;
        })}
      </div>}
      <div className="calendar-foot"><Info size={15}/> Unrecorded meals are not charged. Future dates are disabled until the service date.</div>
    </section>
  </AppShell>;
}
