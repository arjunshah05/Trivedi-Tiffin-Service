import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './billing.css';
import './auth.css';
import './landing.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App/></StrictMode>
);
