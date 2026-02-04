// Production Log Suppression (Top of file)
const noop = () => {};
console.log = noop;
console.debug = noop;
console.info = noop;
console.warn = noop;
console.error = noop;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)