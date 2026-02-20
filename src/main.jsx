import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'

// Note: StrictMode removed due to AbortError issues with Supabase client
// React 18 StrictMode double-mounts components, causing fetch requests to abort
createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)
