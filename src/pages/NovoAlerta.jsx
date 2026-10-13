import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAlerta } from '../services/api';

const campo = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #CED4DA' };
const rotulo = { display: 'block', marginTop: '8px', color: 'var(--gray-medium)', fontSize: '14px' };

export default function NovoAlerta() {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    areaAfetada: 'PEQUENA',
    vento: 'BAIXO',
    zonaUrbana: false,
    pessoasRisco: false,
    latitude: '',
    longitude: ''
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm(atual => ({ ...atual, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await createAlerta({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
      navigate('/alertas');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar ocorrência');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: 'var(--primary-dark)', marginBottom: '24px' }}>Registrar Ocorrência</h2>
      <form className="card" style={{ maxWidth: '600px' }} onSubmit={handleSubmit}>
        <label style={rotulo}>
          Título
          <input name="titulo" value={form.titulo} onChange={handleChange} style={campo} required />
        </label>
        <label style={rotulo}>
          Descrição
          <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3} style={campo} />
        </label>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ ...rotulo, flex: 1 }}>
            Área afetada
            <select name="areaAfetada" value={form.areaAfetada} onChange={handleChange} style={campo}>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
          </label>
          <label style={{ ...rotulo, flex: 1 }}>
            Vento
            <select name="vento" value={form.vento} onChange={handleChange} style={campo}>
              <option value="BAIXO">Baixo</option>
              <option value="MODERADO">Moderado</option>
              <option value="ALTO">Alto</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ ...rotulo, flex: 1 }}>
            Latitude
            <input name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={handleChange} style={campo} required />
          </label>
          <label style={{ ...rotulo, flex: 1 }}>
            Longitude
            <input name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={handleChange} style={campo} required />
          </label>
        </div>
        <label style={{ display: 'block', margin: '8px 0' }}>
          <input name="zonaUrbana" type="checkbox" checked={form.zonaUrbana} onChange={handleChange} /> Zona urbana
        </label>
        <label style={{ display: 'block', margin: '8px 0' }}>
          <input name="pessoasRisco" type="checkbox" checked={form.pessoasRisco} onChange={handleChange} /> Pessoas em risco
        </label>
        {erro && <p style={{ color: 'var(--primary-red)', marginTop: '10px' }}>{erro}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </div>
  );
}
