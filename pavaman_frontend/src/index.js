import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "bootstrap/dist/css/bootstrap.min.css";

import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from "./config";

const root = ReactDOM.createRoot(document.getElementById('root'));
// console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);

root.render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);

reportWebVitals();
