export interface Aniversariante {
  id: string;
  nome: string;
  dia: number;
  mes: number;
  ano?: number | null;
  telefone?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Lista de aniversariantes mockados para desenvolvimento
export const aniversariantesMock: Aniversariante[] = [
  {
    id: "1",
    nome: "Maria Silva",
    dia: 15,
    mes: 1,
    ano: 1979,
    telefone: "(11) 99999-9999",
    observacoes: "Gosta de bolo de chocolate",
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: "2", 
    nome: "João Santos",
    dia: 22,
    mes: 3,
    ano: 1986,
    telefone: "(11) 88888-8888",
    observacoes: "",
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: "3",
    nome: "Ana Costa",
    dia: 8,
    mes: 5,
    ano: 1995,
    telefone: "(11) 77777-7777",
    observacoes: "Vegetariana",
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: "4",
    nome: "Carlos Oliveira",
    dia: 12,
    mes: 9,
    ano: 1972,
    telefone: "(11) 66666-6666",
    observacoes: "Alérgico a amendoim",
    criadoEm: new Date(),
    atualizadoEm: new Date()
  }
];

// Função para obter aniversariantes por mês
export function obterAniversariantesPorMes(mes: number): Aniversariante[] {
  return aniversariantesMock.filter(aniversariante => aniversariante.mes === mes);
}

// Função para obter todos os aniversariantes
export function obterTodosAniversariantes(): Aniversariante[] {
  return [...aniversariantesMock];
}

// Função para adicionar aniversariante
export function adicionarAniversariante(aniversariante: Omit<Aniversariante, 'id' | 'criadoEm' | 'atualizadoEm'>): Aniversariante {
  const novoAniversariante: Aniversariante = {
    ...aniversariante,
    id: Date.now().toString(),
    criadoEm: new Date(),
    atualizadoEm: new Date()
  };
  aniversariantesMock.push(novoAniversariante);
  return novoAniversariante;
}

// Função para atualizar aniversariante
export function atualizarAniversariante(id: string, dadosAtualizados: Partial<Aniversariante>): Aniversariante | null {
  const index = aniversariantesMock.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  aniversariantesMock[index] = {
    ...aniversariantesMock[index],
    ...dadosAtualizados,
    atualizadoEm: new Date()
  };
  
  return aniversariantesMock[index];
}

// Função para remover aniversariante
export function removerAniversariante(id: string): boolean {
  const index = aniversariantesMock.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  aniversariantesMock.splice(index, 1);
  return true;
}
