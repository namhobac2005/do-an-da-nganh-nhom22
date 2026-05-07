import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import axios from 'axios';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
createRoot(document.getElementById('root')!).render(<App />);
