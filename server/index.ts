import "dotenv/config";
import express from "express";
import cors from "cors";
import { semearDados } from "./data/store";
import { autenticarToken, exigirPerfil } from "./middleware/auth";
import { login } from "./routes/autenticacao";
import { listarEventos, criarEvento, atualizarEvento, removerEvento } from "./routes/eventos";
import { listarIgrejas, criarIgreja, atualizarIgreja, removerIgreja } from "./routes/igrejas";
import { listarRecursos, criarRecurso, atualizarRecurso, removerRecurso } from "./routes/recursos";
import { listarUsuarios, criarUsuario, atualizarUsuario, removerUsuario, aniversariantesDoDia, aniversariantesDoMes } from "./routes/usuarios";
import { listarAniversarios, criarAniversario, atualizarAniversario, removerAniversario, aniversariosPorMes } from "./routes/aniversarios";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Seed
  semearDados();

  // Saúde
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  // Autenticação
  app.post("/api/autenticacao/login", login);

  // Público
  app.get("/api/usuarios/aniversariantes", aniversariantesDoDia);
  app.get("/api/usuarios/aniversariantes/mes", aniversariantesDoMes);
  app.get("/api/aniversarios/mes", aniversariosPorMes);
  app.get("/api/igrejas", listarIgrejas);
  app.get("/api/recursos", listarRecursos);

  // Eventos (autenticado)
  app.get("/api/eventos", autenticarToken, listarEventos);
  app.post("/api/eventos", autenticarToken, criarEvento);
  app.put("/api/eventos/:id", autenticarToken, atualizarEvento);
  app.delete("/api/eventos/:id", autenticarToken, removerEvento);

  // Admin/Líder para recursos
  app.post("/api/recursos", autenticarToken, exigirPerfil("administrador", "lider"), criarRecurso);
  app.put("/api/recursos/:id", autenticarToken, exigirPerfil("administrador", "lider"), atualizarRecurso);
  app.delete("/api/recursos/:id", autenticarToken, exigirPerfil("administrador", "lider"), removerRecurso);

  // Admin para igrejas e usuários
  app.post("/api/igrejas", autenticarToken, exigirPerfil("administrador"), criarIgreja);
  app.put("/api/igrejas/:id", autenticarToken, exigirPerfil("administrador"), atualizarIgreja);
  app.delete("/api/igrejas/:id", autenticarToken, exigirPerfil("administrador"), removerIgreja);

  // Admin/Líder para usuários (aniversariantes)
  app.get("/api/usuarios", autenticarToken, exigirPerfil("administrador", "lider"), listarUsuarios);
  app.post("/api/usuarios", autenticarToken, exigirPerfil("administrador", "lider"), criarUsuario);
  app.put("/api/usuarios/:id", autenticarToken, exigirPerfil("administrador", "lider"), atualizarUsuario);
  app.delete("/api/usuarios/:id", autenticarToken, exigirPerfil("administrador", "lider"), removerUsuario);

  // Admin/Líder para aniversários
  app.get("/api/aniversarios", autenticarToken, exigirPerfil("administrador", "lider"), listarAniversarios);
  app.post("/api/aniversarios", autenticarToken, exigirPerfil("administrador", "lider"), criarAniversario);
  app.put("/api/aniversarios/:id", autenticarToken, exigirPerfil("administrador", "lider"), atualizarAniversario);
  app.delete("/api/aniversarios/:id", autenticarToken, exigirPerfil("administrador", "lider"), removerAniversario);

  return app;
}
