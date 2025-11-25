import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './themes.css';               // <-- new
import { ThemeProvider } from './contexts/ThemeContext'; // <-- new

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
