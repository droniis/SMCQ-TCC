import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login. Verifique sua conexão com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--primary-dark)'
    }}>
      <div className="card" style={{ width: '360px', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary-orange)', fontSize: '32px' }}>🌿 SMCQ</h1>
        <p style={{ color: 'var(--gray-medium)', marginBottom: '20px' }}>Sistema de Monitoramento de Queimadas</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #CED4DA' }}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #CED4DA' }}
            required
          />
          {erro && <p style={{ color: 'var(--primary-red)', marginTop: '10px' }}>{erro}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
