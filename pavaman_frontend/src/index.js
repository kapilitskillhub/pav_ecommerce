import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "bootstrap/dist/css/bootstrap.min.css";

import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
const CLIENT_ID = "608603119335-ogp6iqcf7eq1md35247je2p5pkelji38.apps.googleusercontent.com";
root.render(
  <GoogleOAuthProvider clientId = {CLIENT_ID} >

  <React.StrictMode>
    <App />
  </React.StrictMode>
  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
