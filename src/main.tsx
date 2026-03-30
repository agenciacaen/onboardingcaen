import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// [DEBUG] Limpa locks travados do Supabase antes de iniciar o app de maneira resiliente
[...Object.keys(localStorage)]
  .filter(key => key.startsWith('lock:sb-'))
  .forEach(key => localStorage.removeItem(key));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
