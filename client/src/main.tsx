import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const theme = localStorage.getItem('theme')
if (theme === 'light') {
  document.documentElement.classList.add('light')
  document.documentElement.classList.remove('dark')
} else {
  document.documentElement.classList.add('dark')
  document.documentElement.classList.remove('light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
