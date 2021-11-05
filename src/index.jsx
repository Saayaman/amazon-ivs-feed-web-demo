import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router, Redirect, Route, Switch,
  useLocation
} from "react-router-dom";
import App from './App';
import StreamProvider from './contexts/Stream/provider';
import './index.css';
import * as serviceWorker from './serviceWorker';
const Routes = () => {
  const location = useLocation();

  return (
    <AnimatePresence>
      <Switch location={location} key={location.pathname}>
        <Route exact path="/">
          <Redirect to="/0" />
        </Route>
        <Route path="/:id">
          <motion.div
            className="grid"
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
          >
            <App />
          </motion.div>
        </Route>
      </Switch>
    </AnimatePresence>
  )
}

ReactDOM.render(
  <React.StrictMode>
      <Router>
        <StreamProvider>
          <Routes />
        </StreamProvider>
      </Router>
    </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
