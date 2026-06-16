import React from 'react'
import ReactDOM from 'react-dom/client'
// HashRouter keeps routing entirely client-side, so refreshing /read or
// deep-linking works on static hosts like GitHub Pages without 404s.
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
