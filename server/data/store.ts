import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type { Evento, Igreja, Recurso, Usuario, Aniversario } from "@shared/api";

export type BancoDados = {
  usuarios: Usuario[];
  igrejas: Igreja[];
  recursos: Recurso[];
  eventos: Evento[];
  aniversarios: Aniversario[];
};

// Caminho do arquivo de dados (portável)
const DATA_DIR = path.join(process.cwd(), "server", "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

// Estado em memória (espelho do arquivo)
export const db: BancoDados = {
  usuarios: [],
  igrejas: [],
  recursos: [],
  eventos: [],
  aniversarios: [],
};

function garantirDiretorio() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function salvarDb() {
  garantirDiretorio();
  const tmp = DATA_FILE + ".tmp";
  const payload: BancoDados = {
    usuarios: db.usuarios,
    igrejas: db.igrejas,
    recursos: db.recursos,
    eventos: db.eventos,
    aniversarios: db.aniversarios,
  };
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf-8");
  fs.renameSync(tmp, DATA_FILE);
}

export function carregarDb() {
  try {
    garantirDiretorio();
    if (fs.existsSync(DATA_FILE)) {
      const conteudo = fs.readFileSync(DATA_FILE, "utf-8");
      if (conteudo.trim().length > 0) {
        const dados: BancoDados = JSON.parse(conteudo);
        db.usuarios = Array.isArray(dados.usuarios) ? dados.usuarios : [];
        db.igrejas = Array.isArray(dados.igrejas) ? dados.igrejas : [];
        db.recursos = Array.isArray(dados.recursos) ? dados.recursos : [];
        db.eventos = Array.isArray(dados.eventos) ? dados.eventos : [];
        db.aniversarios = Array.isArray(dados.aniversarios) ? dados.aniversarios : [];
      }
    }
  } catch (e) {
    // Se der erro ao carregar, mantém em memória vazio e continua
  }
}

export function semearDados() {
  // Carregar primeiro caso já exista em disco
  carregarDb();
  if (db.usuarios.length > 0) return; // Já existe base

  // Seed mínimo para permitir login em desenvolvimento
  const igrejaCentral: Igreja = { id: randomUUID(), nome: "Igreja Central", endereco: "Rua Principal, 100", codigoCor: "#8b5e3b" };
  db.igrejas.push(igrejaCentral);

  const projetor: Recurso = { id: randomUUID(), nome: "Projetor Multimidia", tipo: "equipamento", estaDisponivel: true };
  const salaPrincipal: Recurso = { id: randomUUID(), nome: "Salao Principal", tipo: "espaco", estaDisponivel: true };
  const salaJuventude: Recurso = { id: randomUUID(), nome: "Sala Juventude", tipo: "espaco", estaDisponivel: true };
  db.recursos.push(projetor, salaPrincipal, salaJuventude);

  const senhaAdmin = bcrypt.hashSync("admin123", 10);
  const senhaLider = bcrypt.hashSync("lider123", 10);
  const senhaMembro = bcrypt.hashSync("membro123", 10);

  const admin: Usuario = { id: randomUUID(), nome: "Administrador", email: "admin@agendaviva.app", senhaHash: senhaAdmin, perfil: "administrador", igrejaId: igrejaCentral.id, dataNascimento: null } as any;
  const lider: Usuario = { id: randomUUID(), nome: "Líder Central", email: "lider@central.app", senhaHash: senhaLider, perfil: "lider", igrejaId: igrejaCentral.id, dataNascimento: null } as any;
  const membro: Usuario = { id: randomUUID(), nome: "Membro Central", email: "membro@central.app", senhaHash: senhaMembro, perfil: "membro", igrejaId: igrejaCentral.id, dataNascimento: null } as any;
  db.usuarios.push(admin, lider, membro);

  salvarDb();
}

export function sobrepoeIntervalo(aInicio: Date, aFim: Date, bInicio: Date, bFim: Date) {
  return aInicio < bFim && aFim > bInicio;
}

export function ehConflito(evento: Evento, outro: Evento) {
  if (evento.igrejaId !== outro.igrejaId) return false;
  const mesmoRecursoOuEspacoPrincipal = (evento.recursoId ?? "__principal__") === (outro.recursoId ?? "__principal__");
  if (!mesmoRecursoOuEspacoPrincipal) return false;
  return sobrepoeIntervalo(new Date(evento.dataHoraInicio), new Date(evento.dataHoraFim), new Date(outro.dataHoraInicio), new Date(outro.dataHoraFim));
}

export function gerarId() {
  return randomUUID();
}
