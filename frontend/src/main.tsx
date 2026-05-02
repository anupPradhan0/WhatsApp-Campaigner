
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const API_URL = import.meta.env.VITE_API_URL;

if (API_URL) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.startsWith(API_URL)) {
      const token = localStorage.getItem('token');
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const credentials = init?.credentials ?? 'include';

      return originalFetch(input, { ...init, headers, credentials });
    }

    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <App />
)
