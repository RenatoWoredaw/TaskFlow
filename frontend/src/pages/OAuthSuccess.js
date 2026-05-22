import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      api.get('/auth/me').then(({ data }) => {
        login(token, data);
        navigate('/dashboard');
      });
    } else {
      navigate('/login');
    }
  }, []);
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Signing you in...</div>;
}
