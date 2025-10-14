import type { RequestHandler } from "express";

// Rota de autenticação desabilitada: aplicação opera sem login/roles.
export const login: RequestHandler = (_req, res) => {
  return res.status(404).json({ erro: "Rota de autenticação desabilitada" });
};
