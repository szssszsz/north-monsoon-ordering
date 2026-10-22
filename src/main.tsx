import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
// Existing printed QR codes end in #reserve. Entry always starts with the welcome;
// anchors clicked after mounting still take guests straight to their chosen section.
history.scrollRestoration='manual';
if(location.hash==='#reserve')history.replaceState(history.state,'',location.pathname+location.search);
createRoot(document.getElementById('root')!).render(<App/>);
