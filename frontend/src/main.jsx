import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// If hosted at /kacha-gold (e.g. vmoneygold.com/kacha-gold), use "/kacha-gold" basename for clean URLs (no #)
// If in Android APK (Capacitor) or local dev, use "" basename
const isKachaGold = typeof window !== 'undefined' && window.location.pathname.startsWith('/kacha-gold')
const basename = isKachaGold ? '/kacha-gold' : ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
