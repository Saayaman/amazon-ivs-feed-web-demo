import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

import StreamProvider from './contexts/Stream/provider';
import MobileBreakpointProvider from './contexts/MobileBreakpoint/provider';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import 'wicg-inert';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <MobileBreakpointProvider>
        <StreamProvider>
          <Routes>
            <Route path="/" element={<Navigate replace to="/0" />} />
            <Route path="/:id" element={<App />} />
          </Routes>
        </StreamProvider>
      </MobileBreakpointProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
