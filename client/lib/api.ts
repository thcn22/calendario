import type { AtualizarEventoDTO, CriarEventoDTO, Evento, Igreja, LoginRequisicao, LoginResposta, Recurso, Usuario, AniversarianteDoDia, AniversarianteOcorrencia, Aniversario, CriarAniversarioDTO } from "@shared/api";

const BASE = ""; // mesmo host

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json", ...(init?.headers || {}) };
  const resp = await fetch(`${BASE}${url}`, { ...init, headers });
  if (!resp.ok) {
    const txt = await resp.text();
    let msg = txt;
    try { msg = JSON.parse(txt)?.erro || msg; } catch {}
    throw new Error(msg || resp.statusText);
  }
  
  // Se a resposta for 204 (No Content) ou não tiver conteúdo, retorna undefined
  if (resp.status === 204 || resp.headers.get('content-length') === '0') {
    return undefined as T;
  }
  
  return resp.json();
}

export const api = {
  // login removido - aplicação sem autenticação
  listarIgrejas: () => req<Igreja[]>("/api/igrejas"),
  criarIgreja: (dados: { nome: string; endereco?: string | null; codigoCor?: string | null; orgaos?: string[] }) => req<Igreja>("/api/igrejas", { method: "POST", body: JSON.stringify(dados) }),
  atualizarIgreja: (id: string, dados: { nome?: string; endereco?: string | null; codigoCor?: string | null; orgaos?: string[] }) => req<Igreja>(`/api/igrejas/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  removerIgreja: (id: string) => req<void>(`/api/igrejas/${id}`, { method: "DELETE" }),
  listarRecursos: () => req<Recurso[]>("/api/recursos"),
  
  listarUsuarios: () => req<Usuario[]>("/api/usuarios"),
  criarUsuario: (dados: { nome: string; email: string; senha: string; perfil: string; dataNascimento?: string | null; igrejaId?: string | null }) => req<Usuario>("/api/usuarios", { method: "POST", body: JSON.stringify(dados) }),
  removerUsuario: (id: string) => req<void>(`/api/usuarios/${id}`, { method: "DELETE" }),

  listarEventos: (inicio?: string, fim?: string) => {
    const params = inicio && fim ? `?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}` : "";
    return req<Evento[]>(`/api/eventos${params}`);
  },
  criarEvento: (dados: CriarEventoDTO) => req<Evento>("/api/eventos", { method: "POST", body: JSON.stringify(dados) }),
  atualizarEvento: (id: string, dados: AtualizarEventoDTO) => req<Evento>(`/api/eventos/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  removerEvento: (id: string) => req<void>(`/api/eventos/${id}`, { method: "DELETE" }),

  aniversariantes: (dia?: number, mes?: number) => req<AniversarianteDoDia[]>(`/api/usuarios/aniversariantes${dia && mes ? `?dia=${dia}&mes=${mes}` : ""}`),
  aniversariantesMes: (mes: number) => req<AniversarianteOcorrencia[]>(`/api/usuarios/aniversariantes/mes?mes=${mes}`),

  // Aniversários (nova estrutura)
  listarAniversarios: () => req<Aniversario[]>("/api/aniversarios"),
  criarAniversario: (dados: CriarAniversarioDTO) => req<Aniversario>("/api/aniversarios", { method: "POST", body: JSON.stringify(dados) }),
  atualizarAniversario: (id: string, dados: Partial<CriarAniversarioDTO>) => req<Aniversario>(`/api/aniversarios/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  removerAniversario: (id: string) => req<void>(`/api/aniversarios/${id}`, { method: "DELETE" }),
  aniversariosPorMes: (mes: number) => req<AniversarianteOcorrencia[]>(`/api/aniversarios/mes?mes=${mes}`),
};
