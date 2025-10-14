import "dotenv/config";
import express from "express";
import cors from "cors";
import { inicializarDatabase } from "./data/database-temp";
import { autenticarToken } from "./middleware/auth";
import { listarEventos, criarEvento, atualizarEvento, removerEvento } from "./routes/eventos";
import { listarIgrejas, criarIgreja, atualizarIgreja, removerIgreja } from "./routes/igrejas";
import { listarRecursos, criarRecurso, atualizarRecurso, removerRecurso } from "./routes/recursos";
import { listarUsuarios, criarUsuario, atualizarUsuario, removerUsuario, aniversariantesDoDia, aniversariantesDoMes } from "./routes/usuarios";
import { listarAniversarios, criarAniversario, atualizarAniversario, removerAniversario, aniversariosPorMes } from "./routes/aniversarios";
import { gerarPDFCalendario } from "./routes/pdf";

export function createServer() {
  const app = express();

  // DEBUG: monkey-patch registro de rotas para identificar entradas inválidas
  // Remover/ajustar após diagnosticar o problema
  try {
    const methods = ["get", "post", "put", "delete", "use", "patch", "all"] as const;
    for (const m of methods) {
      const orig = (app as any)[m]?.bind(app);
      if (!orig) continue;
      (app as any)[m] = (...args: any[]) => {
        try {
          const pathArg = args[0];
          // loga tipo e valor resumido para evitar poluição
          if (typeof pathArg === 'string') {
            console.log(`[ROUTE DEBUG] registering ${m.toUpperCase()} -> ${pathArg}`);
          } else if (Array.isArray(pathArg)) {
            console.log(`[ROUTE DEBUG] registering ${m.toUpperCase()} -> array(${pathArg.length})`);
          } else {
            console.log(`[ROUTE DEBUG] registering ${m.toUpperCase()} -> type:${typeof pathArg}`);
          }
        } catch (err) {
          console.log('[ROUTE DEBUG] error while logging route', err);
        }
        return orig(...args);
      };
    }
  } catch (err) {
    console.log('Failed to install route debug hooks', err);
  }

  // Debug temporário: intercepta registros de rotas para identificar padrões inválidos
  // (remover após diagnóstico)
  try {
    const anyApp: any = app;
    const origGet = anyApp.get;
    const origPost = anyApp.post;
    const origUse = anyApp.use;

    anyApp.get = function (path: any, ...args: any[]) {
      try {
        const info = Array.isArray(path) ? JSON.stringify(path) : String(path);
        console.log('[DEBUG] app.get registering ->', info, ' (type:', typeof path, ', ctor:', path?.constructor?.name, ')');
      } catch (e) {
        console.log('[DEBUG] app.get registering -> <unserializable path>');
      }
      return origGet.call(this, path, ...args);
    };

    anyApp.post = function (path: any, ...args: any[]) {
      try {
        const info = Array.isArray(path) ? JSON.stringify(path) : String(path);
        console.log('[DEBUG] app.post registering ->', info, ' (type:', typeof path, ', ctor:', path?.constructor?.name, ')');
      } catch (e) {
        console.log('[DEBUG] app.post registering -> <unserializable path>');
      }
      return origPost.call(this, path, ...args);
    };

    anyApp.use = function (path: any, ...args: any[]) {
      // app.use can be called with (fn) or (path, fn)
      if (typeof path === 'string' || path instanceof RegExp) {
        console.log('[DEBUG] app.use registering ->', path);
      } else {
        console.log('[DEBUG] app.use registering -> <function/middleware>');
      }
      return origUse.call(this, path, ...args);
    };
  } catch (e) {
    console.log('[DEBUG] falha ao instrumentar app para debug de rotas', e);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Inicializar banco de dados SQLite
  inicializarDatabase();

    // Graceful shutdown (sem fecharDatabase para banco temporário)
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Graceful shutdown...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    process.exit(0);
  });

  // Saúde
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  // Autenticação (removida - aplicação funciona sem login)

  // Público
  app.get("/api/usuarios/aniversariantes", aniversariantesDoDia);
  app.get("/api/usuarios/aniversariantes/mes", aniversariantesDoMes);
  app.get("/api/aniversarios/mes", aniversariosPorMes);
  app.get("/api/igrejas", listarIgrejas);
  app.get("/api/recursos", listarRecursos);

  // Eventos (autenticado)
  app.get("/api/eventos", listarEventos);
  app.post("/api/eventos", criarEvento);
  app.put("/api/eventos/:id", atualizarEvento);
  app.delete("/api/eventos/:id", removerEvento);

  // Admin/Líder para recursos
  app.post("/api/recursos", criarRecurso);
  app.put("/api/recursos/:id", atualizarRecurso);
  app.delete("/api/recursos/:id", removerRecurso);

  // Admin para igrejas e usuários
  app.post("/api/igrejas", criarIgreja);
  app.put("/api/igrejas/:id", atualizarIgreja);
  app.delete("/api/igrejas/:id", removerIgreja);

  // Admin/Líder para usuários (aniversariantes)
  app.get("/api/usuarios", listarUsuarios);
  app.post("/api/usuarios", criarUsuario);
  app.put("/api/usuarios/:id", atualizarUsuario);
  app.delete("/api/usuarios/:id", removerUsuario);

  // Admin/Líder para aniversários
  app.get("/api/aniversarios", listarAniversarios);
  app.post("/api/aniversarios", criarAniversario);
  app.put("/api/aniversarios/:id", atualizarAniversario);
  app.delete("/api/aniversarios/:id", removerAniversario);

  // Geração de PDF
  app.post("/api/gerar-pdf", gerarPDFCalendario);

  return app;
}
