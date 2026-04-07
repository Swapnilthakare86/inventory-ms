import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './styles/variables.css';
import './styles/Sidebar.css';
import './styles/Header.css';
import './styles/Footer.css';
import './styles/Navbar.css';
import './styles/pages.css';
import './styles/Auth.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { fontSize: 13 } }} />
  </StrictMode>
);
