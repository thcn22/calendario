// Tipos compartilhados entre cliente e servidor (Português - Brasil)

export type PerfilUsuario = "membro" | "lider" | "administrador";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  igrejaId?: string | null;
  dataNascimento?: string | null; // ISO Date (yyyy-MM-dd)
  departamentoId?: string | null;
  orgaoId?: string | null;
}

export interface Departamento {
  id: string;
  nome: string;
  igrejaId: string;
}

export interface Orgao {
  id: string;
  nome: string;
  igrejaId: string;
}

export interface Igreja {
  id: string;
  nome: string;
  endereco?: string | null;
  codigoCor?: string | null; // hexadecimal (ex: #3498db)
  orgaos?: Orgao[];
  departamentos?: Departamento[];
}

export type TipoRecurso = "espaco" | "equipamento";

export interface Recurso {
  id: string;
  nome: string;
  tipo?: TipoRecurso | null;
  estaDisponivel: boolean;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string | null;
  responsavel?: string | null;
  dataHoraInicio: string; // ISO
  dataHoraFim: string; // ISO
  criadoPor: string; // Usuario.id
  igrejaId: string;
  recursoId?: string | null;
  diaInteiro?: boolean;
  departamentoId?: string | null;
  orgaoId?: string | null;
}

export interface LoginRequisicao {
  email: string;
  senha: string;
}

export interface LoginResposta {
  token: string;
  usuario: Pick<Usuario, "id" | "nome" | "email" | "perfil" | "igrejaId">;
}

export interface ErroResposta {
  erro: string;
}

export interface CriarEventoDTO {
  titulo: string;
  descricao?: string | null;
  responsavel?: string | null;
  dataHoraInicio: string;
  dataHoraFim: string;
  igrejaId: string;
  recursoId?: string | null;
  diaInteiro?: boolean;
  departamentoId?: string | null;
  orgaoId?: string | null;
}

export interface AtualizarEventoDTO extends Partial<CriarEventoDTO> {}

export interface AniversarianteDoDia {
  id: string;
  nome: string;
  dataNascimento: string; // yyyy-MM-dd
}

export interface AniversarianteOcorrencia {
  id: string;
  nome: string;
  dia: number; // 1-31
  mes: number; // 1-12
  igrejaId: string;
  departamentoId?: string | null;
  orgaoId?: string | null;
}


export interface Aniversario {
  id: string;
  nome: string;
  dia: number; // 1-31
  mes: number; // 1-12
  ano?: number | null; // ano de nascimento (opcional)
  observacoes?: string | null;
  criadoPor: string; // Usuario.id
  igrejaId: string; // Igreja.id
  departamentoId?: string | null;
  orgaoId?: string | null;
}


export interface CriarAniversarioDTO {
  nome: string;
  dia: number;
  mes: number;
  ano?: number | null;
  igrejaId?: string;
  observacoes?: string | null;
}
