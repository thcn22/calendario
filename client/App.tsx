import React from "react";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import GerenciarAniversarios from "./pages/GerenciarAniversarios";
import { ProvedorAuth, useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient();

import { motion } from "framer-motion";
function Cabecalho() {
  const { usuario, sair } = useAuth();
  const loc = useLocation();
  const ativo = (p: string) => (loc.pathname === p ? "text-primary" : "text-foreground/80 hover:text-foreground");
  function alternarTema() {
    const el = document.documentElement;
    el.classList.toggle("dark");
  }
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="container flex h-16 items-center justify-between gap-10">
        <a href="https://5c6e9666b56f47129f5e899c904e651d-236c7abd5ee548cd91ea84832.fly.dev/" className="group flex items-center gap-3 select-none">
          {/* Título removido */}
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link to="/" className={ativo("/")}>Calendário</Link>
          <Link to="/gerenciar-aniversarios" className={ativo("/gerenciar-aniversarios")}>Aniversários</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={alternarTema} title="Alternar tema" className="rounded-md px-2 py-1.5 bg-secondary/80 hover:bg-secondary text-foreground/80 shadow-sm border border-border/70 transition">Tema</button>
          {usuario ? (
            <>
              <span className="hidden md:inline text-foreground/70 max-w-[160px] truncate">{usuario.nome} • </span>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }} onClick={sair} className="btn-premium px-4 py-2">Sair</motion.button>
            </>
          ) : (
            <Link to="/login" className={ativo("/login")}>Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
  <div className="min-h-screen text-foreground bg-[radial-gradient(circle_at_20%_20%,hsl(var(--card))_0%,transparent_60%),radial-gradient(circle_at_80%_10%,hsl(var(--secondary))_0%,transparent_55%)]">
      <Cabecalho />
      <main className="container py-8">
    <div className="gradient-border rounded-3xl bg-card/85 backdrop-blur-xl p-5 sm:p-8 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.40)] ring-1 ring-black/5 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/gerenciar-aniversarios" element={<Layout><GerenciarAniversarios /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProvedorAuth>
        <AppContent />
      </ProvedorAuth>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
