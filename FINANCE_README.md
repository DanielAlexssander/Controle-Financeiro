# Sistema de Controle Financeiro Pessoal

Sistema completo de gestão financeira pessoal desenvolvido com React, TypeScript, Vite e Chakra UI.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visualização completa do patrimônio total
- Conversão entre BRL e USD em tempo real
- Cotações ao vivo de BTC/USD e USD/BRL
- Gráfico de diversificação de investimentos
- Gráfico de crescimento mensal do patrimônio
- Listagem detalhada de bancos e investimentos
- Carteira de criptomoedas com valores em USD

### 🏦 Gerenciamento de Bancos
- Adicionar múltiplos bancos
- Registrar saldo em conta
- Adicionar investimentos dentro de cada banco (ações, CDI, LCI, etc.)
- Editar e excluir bancos e investimentos

### 💰 Carteira de Criptomoedas
- Adicionar criptomoedas (valores sempre em USD)
- Registrar quantidade e preço de compra
- Visualizar valor total investido
- Editar e excluir criptomoedas

### 💳 Controle de Empréstimos
- Registrar empréstimos
- Acompanhar taxa de juros e parcelas mensais
- Editar e excluir empréstimos

### 📈 Crescimento Mensal
- Registrar patrimônio total mês a mês
- Visualizar crescimento percentual entre meses
- Gráfico de evolução patrimonial

### ⚙️ Configurações
- Alternar entre tema claro e escuro
- Exportar dados (backup em JSON)
- Importar dados
- Limpar todos os dados

## 🛠️ Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Chakra UI** - Biblioteca de componentes
- **Recharts** - Gráficos interativos
- **Axios** - Requisições HTTP
- **LocalStorage** - Persistência de dados

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎨 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   └── Navbar.tsx
├── context/         # Contextos React
│   ├── FinanceContext.tsx
│   └── themecontext.tsx
├── hooks/           # Hooks customizados
│   └── useCurrencyRates.ts
├── pages/           # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── ManagePage.tsx
│   ├── GrowthPage.tsx
│   └── ConfigPage.tsx
├── services/        # Serviços e APIs
│   └── api.ts
├── theme/           # Configuração de tema
│   ├── colors.ts
│   └── theme.ts
├── types/           # Tipos TypeScript
│   └── index.ts
└── utils/           # Utilitários
```

## 🔑 APIs Utilizadas

- **CoinMarketCap API** - Cotações de criptomoedas
- **ExchangeRate API** - Conversão USD/BRL

## 💾 Armazenamento

Todos os dados são salvos automaticamente no LocalStorage do navegador. Use a função de exportar dados para criar backups regulares.

## 🎯 Como Usar

1. **Dashboard**: Visualize seu patrimônio total e acompanhe cotações
2. **Gerenciar**: Adicione bancos, criptomoedas, empréstimos e configure diversificação
3. **Crescimento**: Registre o patrimônio total de cada mês
4. **Configurações**: Personalize o tema e gerencie seus dados

## 📝 Notas

- Valores de bancos e empréstimos são em BRL
- Valores de criptomoedas são sempre em USD
- As cotações são atualizadas automaticamente a cada minuto
- A diversificação deve somar 100%
