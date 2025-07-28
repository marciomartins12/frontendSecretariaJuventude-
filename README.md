# Sistema de Controle de Ponto - Crono Juventude

Sistema completo de controle de ponto eletrônico para a Secretaria da Juventude, desenvolvido com React + TypeScript no frontend e Node.js + Express + MySQL no backend.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Estilização)
- **Shadcn/ui** (Componentes)
- **React Router** (Navegação)
- **React Hook Form** + **Zod** (Formulários e validação)
- **Lucide React** (Ícones)

### Backend
- **Node.js** + **TypeScript**
- **Express.js** (Framework web)
- **Prisma** (ORM)
- **MySQL** (Banco de dados)
- **JWT** (Autenticação)
- **bcryptjs** (Hash de senhas)
- **Zod** (Validação de dados)

## 📋 Funcionalidades

### 🔐 Autenticação
- Login seguro com JWT
- Sessão persistente
- Proteção de rotas

### 👥 Gestão de Funcionários
- ✅ Cadastro completo de funcionários
- ✅ Edição de dados e escalas
- ✅ Exclusão de funcionários
- ✅ Configuração de dias de trabalho
- ✅ Listagem com filtros

### ⏰ Controle de Ponto
- ✅ Registro automático de entrada/saída
- ✅ Validação de escalas de trabalho
- ✅ Histórico de registros
- ✅ Relatórios por período
- ✅ Dashboard em tempo real

### 📊 Dashboard
- ✅ Visão geral do dia
- ✅ Funcionários escalados
- ✅ Status de ponto (entrada/saída)
- ✅ Registro rápido de ponto

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- **Node.js** 18+
- **MySQL** (XAMPP recomendado)
- **Git**

### 1. Clone o Repositório
```bash
git clone https://github.com/marciomartins12/crono-juventude.git
cd crono-juventude
```

### 2. Configuração do Backend

#### Instalar Dependências
```bash
cd backend
npm install
```

#### Configurar Banco de Dados
1. Inicie o XAMPP (MySQL)
2. Crie o banco de dados:
```sql
CREATE DATABASE crono_juventude;
```

#### Configurar Variáveis de Ambiente
1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure o `.env`:
```env
DATABASE_URL="mysql://root@127.0.0.1:3306/crono_juventude"
JWT_SECRET="crono_juventude_super_secret_jwt_key_2024"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8080"
```

#### Executar Migrações
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Se o prisma:push não funcionar, use o script SQL
mysql -u root crono_juventude < create_tables.sql
```

#### Iniciar Backend
```bash
npm run dev
```
🌐 Backend estará rodando em: `http://localhost:3001`

### 3. Configuração do Frontend

#### Instalar Dependências
```bash
# Volte para a raiz do projeto
cd ..
npm install
```

#### Iniciar Frontend
```bash
npm run dev
```
🌐 Frontend estará rodando em: `http://localhost:8080`

## 🔑 Acesso ao Sistema

### Credenciais Padrão
- **Usuário:** `admin`
- **Senha:** `admin123`

## 📁 Estrutura do Projeto

```
crono-juventude/
├── backend/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares (auth, etc)
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Lógica de negócio
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   └── server.ts        # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma    # Schema do banco
│   └── package.json
├── src/                     # Frontend React
│   ├── components/          # Componentes React
│   ├── context/             # Context API (Auth, Data)
│   ├── pages/               # Páginas da aplicação
│   ├── services/            # Serviços (API)
│   ├── types/               # Tipos TypeScript
│   └── main.tsx             # Entrada da aplicação
├── public/                  # Arquivos estáticos
└── package.json
```

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login do usuário

### Funcionários
- `GET /api/employees` - Listar funcionários
- `GET /api/employees/:id` - Buscar funcionário por ID
- `GET /api/employees/scheduled-today` - Funcionários escalados hoje
- `POST /api/employees` - Criar funcionário
- `PUT /api/employees/:id` - Atualizar funcionário
- `DELETE /api/employees/:id` - Excluir funcionário

### Registros de Ponto
- `GET /api/time-records` - Listar registros
- `GET /api/time-records/today` - Registros de hoje
- `POST /api/time-records` - Criar registro manual
- `POST /api/time-records/clock` - Registrar entrada/saída automática
- `DELETE /api/time-records/:id` - Excluir registro

### Health Check
- `GET /api/health` - Status da API

## 🧪 Scripts Disponíveis

### Frontend
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
```

### Backend
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Compilar TypeScript
npm start            # Executar em produção
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:push      # Aplicar schema no banco
npm run prisma:studio    # Interface do banco
```

## 🚨 Solução de Problemas

### Erro de CORS
- Verifique se o `FRONTEND_URL` no `.env` está correto
- Reinicie o backend após mudanças no `.env`

### Erro de Conexão com Banco
- Verifique se o MySQL está rodando
- Confirme as credenciais no `DATABASE_URL`
- Para XAMPP: usuário `root` sem senha

### Erro de Autenticação
- Verifique se o usuário admin foi criado no banco
- Confirme o hash da senha no banco de dados

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

Desenvolvido para a Secretaria da Juventude

---

⭐ **Sistema Crono Juventude** - Controle de Ponto Eletrônico
