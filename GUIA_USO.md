# 🚀 Guia Rápido de Uso

## Iniciando a Aplicação

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📋 Passo a Passo

### 1️⃣ Primeira Vez - Configurar Diversificação
1. Vá em **Gerenciar** → Aba **Diversificação**
2. Configure as porcentagens (total deve ser 100%):
   - Ações: 30%
   - Criptomoedas: 20%
   - Renda Fixa: 40%
   - Caixa: 10%
3. Clique em **Atualizar Diversificação**

### 2️⃣ Adicionar Bancos
1. Vá em **Gerenciar** → Aba **Bancos**
2. Preencha:
   - Nome do Banco (ex: Banco Inter)
   - Saldo em conta (ex: 5000)
3. Adicione investimentos dentro do banco:
   - Nome: PETR4
   - Tipo: Ação
   - Valor: 3000
4. Clique em **Adicionar Banco**

### 3️⃣ Adicionar Criptomoedas
1. Vá em **Gerenciar** → Aba **Criptomoedas**
2. Preencha:
   - Símbolo: BTC
   - Quantidade: 0.05
   - Preço de Compra (USD): 45000
3. Clique em **Adicionar Cripto**

⚠️ **IMPORTANTE**: Valores de cripto são sempre em USD!

### 4️⃣ Adicionar Empréstimos
1. Vá em **Gerenciar** → Aba **Empréstimos**
2. Preencha:
   - Nome: Financiamento Carro
   - Valor Total: 25000
   - Taxa de Juros: 1.5
   - Parcela Mensal: 850
3. Clique em **Adicionar Empréstimo**

### 5️⃣ Registrar Crescimento Mensal
1. Vá em **Crescimento**
2. Preencha:
   - Mês: 01/2024
   - Patrimônio Total: 35000
3. Clique em **Adicionar**

Repita para cada mês que deseja acompanhar.

### 6️⃣ Visualizar Dashboard
1. Vá em **Dashboard**
2. Selecione a moeda (BRL ou USD) no canto superior direito
3. Veja:
   - ✅ Patrimônio total
   - ✅ Cotações em tempo real (BTC, USD/BRL)
   - ✅ Gráfico de diversificação
   - ✅ Gráfico de crescimento mensal
   - ✅ Detalhes de bancos e criptos

## 🎨 Personalização

### Tema
- Clique no ícone de lua/sol no canto superior direito para alternar entre tema claro e escuro

### Configurações
1. Vá em **Configurações**
2. Opções disponíveis:
   - Alternar tema
   - Exportar dados (backup)
   - Importar dados
   - Limpar todos os dados

## 💾 Backup e Restauração

### Fazer Backup
1. **Configurações** → **Exportar Dados**
2. Arquivo JSON será baixado

### Restaurar Backup
1. **Configurações** → **Importar Dados**
2. Selecione o arquivo JSON
3. Recarregue a página

## 📊 Importar Dados de Exemplo

1. Vá em **Configurações**
2. Clique em **Importar Dados**
3. Selecione o arquivo `example-data.json`
4. Recarregue a página

## 🔄 Conversão de Moedas

- **Bancos e Empréstimos**: Valores em BRL
- **Criptomoedas**: Valores sempre em USD
- **Dashboard**: Escolha visualizar em BRL ou USD
- **Cotações**: Atualizadas automaticamente a cada minuto

## 💡 Dicas

1. **Organize seus investimentos**: Use a seção de investimentos dentro de cada banco para categorizar (CDI, LCI, Ações, etc.)

2. **Acompanhe mensalmente**: Registre seu patrimônio total todo mês para ver o crescimento

3. **Faça backups regulares**: Exporte seus dados mensalmente

4. **Diversificação**: Mantenha a soma em 100% para visualização correta no gráfico

5. **Edição rápida**: Clique no ícone de lápis para editar qualquer item

6. **Exclusão**: Clique no ícone de lixeira para remover itens

## 🐛 Solução de Problemas

**Cotações não atualizam?**
- Verifique sua conexão com internet
- As APIs podem ter limite de requisições

**Dados não salvam?**
- Verifique se o LocalStorage está habilitado no navegador
- Não use modo anônimo/privado

**Gráfico não aparece?**
- Adicione pelo menos 2 meses de crescimento
- Configure a diversificação (total = 100%)

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 💻 Desktop
- 📱 Tablet
- 📱 Mobile
