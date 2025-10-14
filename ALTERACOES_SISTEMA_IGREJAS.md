# 🏛️ Alterações no Sistema de Cadastro de Igrejas

## 📋 Resumo das Alterações

Este documento descreve as melhorias implementadas no sistema de cadastro de igrejas, incluindo departamentos fixos, órgãos personalizados e geração automática de cores.

---

## ✨ Novas Funcionalidades

### 1. **Departamentos Fixos Pré-definidos**
Toda igreja agora possui automaticamente **9 departamentos fixos** criados no momento do cadastro:

1. DEJEADALPE
2. CRACEADALPE
3. UMADALPE
4. CEADALPE
5. EBD
6. DISCIPULADO
7. ORAÇÃO MISSIONÁRIA
8. CIRCULO DE ORAÇÃO
9. DEPARTAMENTO INFANTIL

### 2. **Sistema de Órgãos Personalizados**
- Possibilidade de adicionar **múltiplos órgãos** à igreja
- Interface intuitiva para adicionar/remover órgãos
- Cada órgão possui nome personalizado
- Órgãos podem ser editados posteriormente

### 3. **Geração Automática de Cores**
- **Cor aleatória** gerada automaticamente ao criar nova igreja
- Botão "🎲" para gerar nova cor aleatória a qualquer momento
- Seletor de cor visual integrado
- Campo de texto para inserção manual do código hexadecimal

---

## 🔧 Alterações Técnicas

### Backend (Server)

#### **Arquivo: `server/data/database-temp.ts`**
- ✅ Adicionados arrays `departamentos` e `orgaos` ao banco de dados
- ✅ Criadas funções CRUD para departamentos:
  - `departamentosDb.criar()`
  - `departamentosDb.buscarPorIgreja()`
  - `departamentosDb.deletarPorIgreja()`
- ✅ Criadas funções CRUD para órgãos:
  - `orgaosDb.criar()`
  - `orgaosDb.buscarPorIgreja()`
  - `orgaosDb.deletarPorIgreja()`

#### **Arquivo: `server/routes/igrejas.ts`**
- ✅ Função `gerarCorAleatoria()` para cores hexadecimais
- ✅ Array `DEPARTAMENTOS_FIXOS` com os 9 departamentos padrão
- ✅ `criarIgreja()`: Cria igreja + departamentos fixos + órgãos personalizados
- ✅ `listarIgrejas()`: Retorna igrejas com departamentos e órgãos vinculados
- ✅ `atualizarIgreja()`: Permite atualizar órgãos da igreja
- ✅ `removerIgreja()`: Remove igreja + departamentos + órgãos (cascade)

### Frontend (Client)

#### **Arquivo: `client/components/agenda/IgrejaModal.tsx`**
- ✅ Novo campo para gerenciar órgãos
- ✅ Interface de adição/remoção de órgãos com ícones Lucide React
- ✅ Botão de geração de cor aleatória (🎲)
- ✅ Estados para gerenciar lista de órgãos
- ✅ Validação para evitar órgãos duplicados
- ✅ Visual melhorado com cards para órgãos cadastrados

#### **Arquivo: `client/lib/api.ts`**
- ✅ Atualizada interface de `criarIgreja()` para aceitar `orgaos?: string[]`
- ✅ Atualizada interface de `atualizarIgreja()` para aceitar `orgaos?: string[]`

### Shared Types

#### **Arquivo: `shared/api.ts`**
- ✅ Nova interface `Departamento`:
  ```typescript
  export interface Departamento {
    id: string;
    nome: string;
    igrejaId: string;
  }
  ```
- ✅ Nova interface `Orgao`:
  ```typescript
  export interface Orgao {
    id: string;
    nome: string;
    igrejaId: string;
  }
  ```
- ✅ Interface `Igreja` atualizada com:
  ```typescript
  export interface Igreja {
    id: string;
    nome: string;
    endereco?: string | null;
    codigoCor?: string | null;
    orgaos?: Orgao[];
    departamentos?: Departamento[];
  }
  ```

---

## 🎯 Como Utilizar

### Criar Nova Igreja

1. Acesse o modal de criação de igreja
2. Preencha o **nome** (obrigatório)
3. Preencha o **endereço** (opcional)
4. A **cor é gerada automaticamente**, mas pode ser alterada:
   - Use o seletor de cor visual
   - Digite o código hexadecimal manualmente
   - Clique no botão 🎲 para gerar nova cor aleatória
5. **Adicione órgãos** (opcional):
   - Digite o nome do órgão no campo
   - Clique em "Adicionar" ou pressione Enter
   - Remova órgãos clicando no ícone ❌
6. Clique em **Salvar**

**Resultado:** Igreja criada com 9 departamentos fixos + órgãos personalizados.

### Editar Igreja Existente

1. Abra o modal de edição da igreja
2. Modifique nome, endereço ou cor conforme necessário
3. **Gerencie órgãos:**
   - Adicione novos órgãos
   - Remova órgãos existentes
4. Os **departamentos fixos permanecem inalterados**
5. Clique em **Atualizar**

---

## 📊 Estrutura de Dados

### Exemplo de Igreja Criada

```json
{
  "id": "1234567890",
  "nome": "Igreja Central",
  "endereco": "Rua das Flores, 123",
  "codigoCor": "#A3D2E8",
  "departamentos": [
    { "id": "dep1", "nome": "DEJEADALPE", "igrejaId": "1234567890" },
    { "id": "dep2", "nome": "CRACEADALPE", "igrejaId": "1234567890" },
    { "id": "dep3", "nome": "UMADALPE", "igrejaId": "1234567890" },
    { "id": "dep4", "nome": "CEADALPE", "igrejaId": "1234567890" },
    { "id": "dep5", "nome": "EBD", "igrejaId": "1234567890" },
    { "id": "dep6", "nome": "DISCIPULADO", "igrejaId": "1234567890" },
    { "id": "dep7", "nome": "ORAÇÃO MISSIONÁRIA", "igrejaId": "1234567890" },
    { "id": "dep8", "nome": "CIRCULO DE ORAÇÃO", "igrejaId": "1234567890" },
    { "id": "dep9", "nome": "DEPARTAMENTO INFANTIL", "igrejaId": "1234567890" }
  ],
  "orgaos": [
    { "id": "org1", "nome": "Banda", "igrejaId": "1234567890" },
    { "id": "org2", "nome": "Coral", "igrejaId": "1234567890" }
  ]
}
```

---

## 🔒 Validações Implementadas

- ✅ Nome da igreja é **obrigatório**
- ✅ Não permite igrejas com **nomes duplicados**
- ✅ Órgãos não podem ter **nomes duplicados** na mesma igreja
- ✅ Cor hexadecimal válida
- ✅ Ao deletar igreja, **remove** todos departamentos e órgãos vinculados

---

## 🚀 Melhorias Futuras Sugeridas

- [ ] Permitir personalizar os departamentos fixos via configuração
- [ ] Adicionar campo de descrição para órgãos
- [ ] Sistema de permissões por departamento
- [ ] Relatórios por departamento/órgão
- [ ] Histórico de alterações em departamentos e órgãos

---

## 📝 Observações

- Os **departamentos fixos** são criados automaticamente e não podem ser removidos individualmente
- Os **órgãos** são completamente gerenciáveis pelo usuário
- A **cor aleatória** ajuda a diferenciar visualmente as igrejas no sistema
- Todas as operações são **transacionais** (se falhar, nada é salvo)

---

**Última atualização:** 13 de outubro de 2025
