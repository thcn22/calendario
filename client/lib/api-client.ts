// API client para comunicação com o servidor
import type { Aniversario, Evento, Igreja } from '@shared/api';

const API_BASE = '/api';

// Funções para buscar dados do servidor (para usar no cliente)
export async function buscarAniversarios(): Promise<Aniversario[]> {
  const response = await fetch(`${API_BASE}/aniversarios`);
  if (!response.ok) throw new Error('Erro ao buscar aniversários');
  return response.json();
}

export async function buscarAniversariosPorMes(mes: number): Promise<Aniversario[]> {
  const response = await fetch(`${API_BASE}/aniversarios/mes?mes=${mes}`);
  if (!response.ok) throw new Error('Erro ao buscar aniversários do mês');
  return response.json();
}

export async function buscarEventos(inicio?: string, fim?: string): Promise<Evento[]> {
  let url = `${API_BASE}/eventos`;
  if (inicio && fim) {
    url += `?inicio=${inicio}&fim=${fim}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar eventos');
  return response.json();
}

export async function buscarIgrejas(): Promise<Igreja[]> {
  const response = await fetch(`${API_BASE}/igrejas`);
  if (!response.ok) throw new Error('Erro ao buscar igrejas');
  return response.json();
}