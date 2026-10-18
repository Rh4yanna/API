import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    : '/api',
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

export function mensagemErro(erro) {
  const validacoes = erro.response?.data?.errors;
  if (validacoes) return Object.values(validacoes).flat().join(' ');
  return erro.response?.data?.message || 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.';
}
