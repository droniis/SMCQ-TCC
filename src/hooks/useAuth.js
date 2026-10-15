import { useState } from 'react';
import { login as apiLogin } from '../services/api';

// A sessão é válida se existe um token e ele ainda não expirou (campo exp do JWT)
export function sessaoValida() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function lerUsuario() {
  const userData = localStorage.getItem('user');
  try {
    return sessaoValida() && userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

// O usuário ainda está com a senha provisória (troca obrigatória antes de usar o sistema)
export function senhaProvisoriaPendente() {
  return Boolean(lerUsuario()?.senhaProvisoria);
}

export function useAuth() {
  const [user, setUser] = useState(lerUsuario);

  const login = async (email, senha) => {
    const response = await apiLogin(email, senha);
    const { token, usuario } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(usuario));
    setUser(usuario);
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Depois de editar o perfil ou trocar a senha: guarda os dados novos do usuário logado
  const atualizarUsuario = (dados) => {
    const novo = { ...(lerUsuario() || {}), ...dados };
    localStorage.setItem('user', JSON.stringify(novo));
    setUser(novo);
    return novo;
  };

  return { user, login, logout, atualizarUsuario };
}
