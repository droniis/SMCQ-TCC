import { useState } from 'react';
import { ESTADOS } from '../services/constantes';

const FORM_INICIAL = {
  titulo: '',
  descricao: '',
  estado: '',
  municipio: '',
  areaAfetada: 'PEQUENA',
  vento: 'BAIXO',
  zonaUrbana: false,
  pessoasRisco: false,
  latitude: '',
  longitude: ''
};

// Formulário de ocorrência. Entrega a onSubmit os dados já no formato da API.
export default function AlertForm({ onSubmit, loading, erro }) {
  const [form, setForm] = useState(FORM_INICIAL);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm(atual => ({ ...atual, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      municipio: form.municipio.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    });
  };

  return (
    <form className="card formulario" onSubmit={handleSubmit}>
      <label className="rotulo">
        Título
        <input className="campo" name="titulo" value={form.titulo} onChange={handleChange} required />
      </label>
      <label className="rotulo">
        Descrição
        <textarea className="campo" name="descricao" value={form.descricao} onChange={handleChange} rows={3} />
      </label>
      <div className="linha-campos">
        <label className="rotulo">
          Estado
          <select className="campo" name="estado" value={form.estado} onChange={handleChange} required>
            <option value="">Selecione</option>
            {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </label>
        <label className="rotulo">
          Município
          <input className="campo" name="municipio" value={form.municipio} onChange={handleChange} required />
        </label>
      </div>
      <div className="linha-campos">
        <label className="rotulo">
          Área afetada
          <select className="campo" name="areaAfetada" value={form.areaAfetada} onChange={handleChange}>
            <option value="PEQUENA">Pequena</option>
            <option value="MEDIA">Média</option>
            <option value="GRANDE">Grande</option>
          </select>
        </label>
        <label className="rotulo">
          Vento
          <select className="campo" name="vento" value={form.vento} onChange={handleChange}>
            <option value="BAIXO">Baixo</option>
            <option value="MODERADO">Moderado</option>
            <option value="ALTO">Alto</option>
          </select>
        </label>
      </div>
      <div className="linha-campos">
        <label className="rotulo">
          Latitude
          <input className="campo" name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={handleChange} required />
        </label>
        <label className="rotulo">
          Longitude
          <input className="campo" name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={handleChange} required />
        </label>
      </div>
      <label className="opcao">
        <input name="zonaUrbana" type="checkbox" checked={form.zonaUrbana} onChange={handleChange} /> Zona urbana
      </label>
      <label className="opcao">
        <input name="pessoasRisco" type="checkbox" checked={form.pessoasRisco} onChange={handleChange} /> Pessoas em risco
      </label>
      {erro && <p className="mensagem-erro">{erro}</p>}
      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
        {loading ? 'Registrando...' : 'Registrar'}
      </button>
    </form>
  );
}
