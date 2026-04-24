import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" theme="dark" richColors />
    </BrowserRouter>
  </StrictMode>,
)
