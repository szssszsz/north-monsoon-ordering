import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import {isReverie} from './edition';
document.documentElement.dataset.edition=isReverie?'reverie':'classic';
if(isReverie)document.title='北境季风｜月下回响';
// Every fresh visit opens on the mountain welcome, including older shared links.
// In-page anchor clicks still work normally after the app mounts.
history.scrollRestoration='manual';
if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
createRoot(document.getElementById('root')!).render(<App/>);
