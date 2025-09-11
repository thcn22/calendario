# 📅 Calendário - Sistema de Gestão de Agenda para Igrejas

Sistema completo de gestão de calendários, eventos e aniversários desenvolvido especificamente para organizações religiosas, com foco na facilidade de uso e portabilidade.

## 🚀 Funcionalidades Principais

### 📊 **Gestão Completa**
- **Usuários**: Sistema de autenticação com perfis (Administrador, Líder, Membro)
- **Igrejas**: Gestão de múltiplas organizações
- **Eventos**: Calendário completo com agendamento de atividades
- **Aniversários**: Controle de aniversariantes com lembretes
- **Recursos**: Gestão de equipamentos e espaços

### 📄 **Relatórios PDF Avançados**
- **Calendários Mensais**: Layouts profissionais organizados
- **Calendários Anuais**: Visão completa do ano
- **Relatórios de Aniversários**: Listas detalhadas por mês
- **Exportação sem deformações**: PDFs de alta qualidade

### 🗃️ **Banco de Dados Portável**
- **SQLite integrado**: Para máxima portabilidade
- **Sistema JSON temporário**: Funcionando atualmente
- **Fácil migração**: Entre diferentes computadores
- **Backup automático**: Dados sempre seguros

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Express.js + Node.js
- **Database**: SQLite (better-sqlite3) + JSON temporário
- **PDF**: @react-pdf/renderer
- **Build**: Vite + PNPM
- **UI**: Radix UI + Lucide Icons

## 📦 Instalação e Uso

### **Pré-requisitos**
- Node.js 18+ 
- PNPM (recomendado)

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/calendario.git
cd calendario

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

### **Acesso**
- **Local**: http://localhost:8080
- **Rede**: http://192.168.0.243:8080

## 🏗️ Estrutura do Projeto

```
📁 client/              # Frontend React
├── 📁 components/      # Componentes UI
├── 📁 pages/          # Páginas da aplicação
├── 📁 lib/            # Utilitários e APIs
└── 📁 hooks/          # Hooks customizados

📁 server/              # Backend Express
├── 📁 data/           # Banco de dados
├── 📁 routes/         # Rotas da API
└── 📁 middleware/     # Middlewares

📁 shared/              # Tipos compartilhados
└── api.ts             # Interfaces comuns
```

## 🗄️ Banco de Dados

### **Tabelas Principais**
- **usuarios**: Autenticação e perfis
- **igrejas**: Organizações
- **eventos**: Calendário de atividades
- **aniversarios**: Controle de aniversariantes
- **recursos**: Equipamentos e espaços

### **Portabilidade**
- Arquivo único SQLite (`vibe-landing.db`)
- Sistema JSON como fallback (`db-temp.json`)
- Fácil backup e migração

## 📄 Geração de PDFs

### **Tipos de Relatórios**
- **Mensal**: `gerarRelatorioPDFMensal(ano, mes, igrejaId)`
- **Anual**: `gerarRelatorioPDFAnual(ano, igrejaId)`
- **Aniversários**: `gerarRelatorioPDF(igrejaId)`

### **Recursos PDF**
- Layouts profissionais
- Cores personalizáveis por igreja
- Headers e footers automáticos
- Qualidade sem deformações

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build para produção
pnpm start        # Servidor de produção
pnpm typecheck    # Verificação TypeScript
pnpm test         # Executar testes
```

## 🚀 Deploy

### **Opções de Deploy**
- **Netlify**: Deploy automático via Git
- **Vercel**: Integração completa
- **Servidor próprio**: Build estático + Node.js

### **Build para Produção**
```bash
pnpm build
pnpm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma [Issue](https://github.com/SEU_USUARIO/calendario/issues)
- Envie um email para: seu-email@exemplo.com

---

**Desenvolvido com ❤️ para facilitar a gestão de atividades religiosas**