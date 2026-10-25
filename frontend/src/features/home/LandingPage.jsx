import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Heart,
  IndianRupee,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Soup,
  Utensils,
  Wallet,
  X
} from 'lucide-react';

const services = [
  {
    icon: Soup,
    title: 'Homemade Daily Tiffin',
    description: 'Comforting, home-style meals prepared fresh for your everyday routine.'
  },
  {
    icon: Utensils,
    title: 'Fresh Lunch and Dinner',
    description: 'Choose lunch, dinner, or both—with each meal tracked separately.'
  },
  {
    icon: ShieldCheck,
    title: 'Hygienic Food Preparation',
    description: 'Thoughtfully prepared meals with care given to cleanliness and quality.'
  },
  {
    icon: Wallet,
    title: 'Affordable Monthly Plans',
    description: 'Clear per-meal pricing, with your applicable rate shared before you order.'
  },
  {
    icon: CalendarCheck,
    title: 'Easy Tiffin Tracking',
    description: 'Keep a simple record of the lunches and dinners you receive each day.'
  },
  {
    icon: IndianRupee,
    title: 'Transparent Monthly Billing',
    description: 'See your meal charges, payments, balance, and payment history together.'
  }
];

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const workspacePath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <section className="landing-hero" id="home">
      <header className="landing-nav">
        <a className="landing-brand" href="#home" aria-label="Trivedi Tiffin Service home">
          <span className="landing-brand-icon"><Soup size={23}/></span>
          <span><b>Trivedi</b><small>Tiffin Service</small></span>
        </a>
        <button
          className="landing-menu-toggle"
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21}/> : <Menu size={21}/>}
        </button>
        <nav className={`landing-nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          {user ? (
            <Link className="landing-nav-signup" to={workspacePath} onClick={() => setMenuOpen(false)}>Dashboard <ArrowRight size={15}/></Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link className="landing-nav-signup" to="/register" onClick={() => setMenuOpen(false)}>Signup <ArrowRight size={15}/></Link>
            </>
          )}
        </nav>
      </header>

      <div className="landing-hero-content">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><Leaf size={15}/> HOMEMADE WITH HEART IN MORADABAD</span>
          <h1>Ghar jaisa khana,<br/><span>har din.</span></h1>
          <p>Fresh, comforting tiffin meals made with care—bringing a little taste of home to your everyday.</p>
          <div className="landing-hero-actions">
            <Link className="landing-button landing-button-primary" to={user ? workspacePath : '/login'}>{user ? 'Go to dashboard' : 'Get Started'} <ArrowRight size={17}/></Link>
            <a className="landing-button landing-button-light" href="#services">Explore Our Services</a>
          </div>
          <div className="landing-hero-note"><Check size={16}/> Lunch and dinner, simply organised</div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-image-frame">
            <img
              // src="https://images.unsplash.com/photo-1631452180539-96aca7d48617?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"

              // https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=85

              // src="https://images.unsplash.com/photo-1680359873864-43e89bf248ac?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"

              src="homepic.jpg"

              alt="A freshly prepared homemade meal with vegetables and rice"
              fetchPriority="high"
              onError={event => { event.currentTarget.style.display = 'none'; }}
            />
            <div className="landing-image-fallback" aria-hidden="true"><Soup size={80}/><span>Made with care</span></div>
            <div className="landing-image-caption"><span className="landing-caption-icon"><Heart size={17} fill="currentColor"/></span><span><b>A little taste of home</b><small>Freshly prepared for your day</small></span></div>
          </div>
          <div className="landing-fresh-badge"><Leaf size={17}/><span>Fresh<br/>every day</span></div>
          <span className="landing-spark landing-spark-one" aria-hidden="true">✳</span>
          <span className="landing-spark landing-spark-two" aria-hidden="true">✳</span>
        </div>
      </div>
      <div className="landing-hero-bottom"><span><MapPin size={15}/> Naveen Nagar, Moradabad</span><span><Clock3 size={15}/> Your daily meals, made simple</span></div>
    </section>
  );
}

export function Services() {
  const { user } = useAuth();
  const workspacePath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <section className="landing-services" id="services">
      <div className="landing-section-heading">
        <span className="landing-kicker"><span className="landing-kicker-dot"/> GOOD FOOD, MADE SIMPLE</span>
        <h2>Everyday meals.<br/><span>Thoughtfully taken care of.</span></h2>
        <p>From your daily tiffin to the monthly account, the little details are easier to manage.</p>
      </div>
      <div className="landing-service-grid">
        {services.map(({ icon: Icon, title, description }, index) => (
          <article className="landing-service-card" key={title} style={{ '--card-index': index }}>
            <span className="landing-service-icon"><Icon size={22}/></span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="landing-card-arrow" aria-hidden="true"><ArrowRight size={16}/></span>
          </article>
        ))}
      </div>
      <div className="landing-services-cta">
        <span className="landing-cta-icon"><Heart size={19}/></span>
        <p><b>{user ? 'Welcome back!' : 'Ready for a taste of home?'}</b><span>{user ? 'Your tiffin account is ready whenever you are.' : 'Create an account to get started with your tiffin service.'}</span></p>
        <Link to={user ? workspacePath : '/login'}>{user ? 'Open dashboard' : 'Get Started'} <ArrowRight size={16}/></Link>
      </div>
    </section>
  );
}

export function Footer() {
  const { user } = useAuth();
  const workspacePath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
  const year = new Date().getFullYear();
  const mapQuery = encodeURIComponent('Naveen Nagar, Moradabad, Uttar Pradesh, India');

  return (
    <footer className="landing-footer">
      <div className="landing-footer-main">
        <div className="landing-footer-brand">
          <a className="landing-brand" href="#home">
            <span className="landing-brand-icon"><Soup size={23}/></span>
            <span><b>Trivedi</b><small>Tiffin Service</small></span>
          </a>
          <p>Fresh, homemade food and thoughtful tiffin service for your everyday life in Moradabad.</p>
          <a className="landing-whatsapp" href="https://wa.me/919286497557" target="_blank" rel="noreferrer">
            <MessageCircle size={17}/> Chat with us on WhatsApp
          </a>
        </div>

        <div className="landing-footer-contact">
          <h2>Get in touch</h2>
          <a href="tel:9286497557"><span className="landing-footer-icon"><MessageCircle size={16}/></span><span><small>Call us</small><b>9286497557</b></span></a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">
            <span className="landing-footer-icon"><MapPin size={16}/></span>
            <span><small>Find us</small><b>Naveen Nagar, Moradabad,<br/>Uttar Pradesh, India</b></span>
            <ArrowRight className="landing-map-arrow" size={15}/>
          </a>
        </div>

        <div className="landing-footer-links">
          <h2>Quick links</h2>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          {user ? <Link to={workspacePath}>Dashboard</Link> : <><Link to="/login">Login</Link><Link to="/register">Signup</Link></>}
        </div>
      </div>
      <div className="landing-footer-bottom">
        <span>© {year} Trivedi Tiffin Service. Made with care in Moradabad.</span>
        <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer"><MapPin size={14}/> Naveen Nagar, Moradabad</a>
      </div>
    </footer>
  );
}
