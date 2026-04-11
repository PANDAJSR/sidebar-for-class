import React from 'react';
import ReactDOM from 'react-dom/client';
import Timer from './Timer';
import '../../css/base.css';
import './Timer.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Timer />
  </React.StrictMode>
);
