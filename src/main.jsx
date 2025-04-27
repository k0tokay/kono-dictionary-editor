import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { DictionaryProvider } from './store/DictionaryContext.jsx'
import './index.scss'

createRoot(document.getElementById('root')).render(
  <DictionaryProvider>
    <App />
  </DictionaryProvider>,
)
