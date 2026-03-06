import { useState } from 'react';
import {
  Box, Container, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
  Button, FormControl, FormLabel, Input, VStack, HStack, Card, CardBody,
  IconButton, useToast, NumberInput, NumberInputField, Select, useColorMode
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { useFinance } from '../context/FinanceContext';
import type { Bank, Crypto, Loan, Investment } from '../types/index.js';

export const ManagePage = () => {
  const { data, addBank, updateBank, deleteBank, addCrypto, updateCrypto, deleteCrypto, addLoan, updateLoan, deleteLoan } = useFinance();
  const toast = useToast();

  const [bankForm, setBankForm] = useState<Bank>({ id: '', name: '', balance: 0, investments: [] });
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [investmentForm, setInvestmentForm] = useState<Investment>({ id: '', name: '', amount: 0, type: '' });

  const [cryptoForm, setCryptoForm] = useState<Crypto>({ id: '', symbol: '', amount: 0, purchasePrice: 0 });
  const [editingCrypto, setEditingCrypto] = useState<string | null>(null);

  const [loanForm, setLoanForm] = useState<Loan>({ id: '', name: '', amount: 0, interestRate: 0, dueDate: '' });
  const [editingLoan, setEditingLoan] = useState<string | null>(null);

  const handleBankSubmit = () => {
    if (!bankForm.name || bankForm.balance < 0) {
      toast({ title: 'Preencha todos os campos', status: 'error', duration: 2000 });
      return;
    }
    
    let finalBankForm = { ...bankForm };
    
    if (investmentForm.name || investmentForm.amount > 0 || investmentForm.type) {
      if (investmentForm.name && investmentForm.amount > 0 && investmentForm.type) {
        finalBankForm = {
          ...finalBankForm,
          investments: [...finalBankForm.investments, { ...investmentForm, id: Date.now().toString() }]
        };
        setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
      } else {
        toast({ title: 'Complete ou limpe o campo do investimento', status: 'error', duration: 2000 });
        return;
      }
    }
    
    if (editingBank) {
      updateBank(editingBank, finalBankForm);
      toast({ title: 'Banco atualizado', status: 'success', duration: 2000 });
      setEditingBank(null);
    } else {
      addBank({ ...finalBankForm, id: Date.now().toString() });
      toast({ title: 'Banco adicionado', status: 'success', duration: 2000 });
    }
    setBankForm({ id: '', name: '', balance: 0, investments: [] });
  };

  const handleAddInvestment = () => {
    if (!investmentForm.name || investmentForm.amount <= 0) {
      toast({ title: 'Preencha os dados do investimento', status: 'error', duration: 2000 });
      return;
    }
    setBankForm({
      ...bankForm,
      investments: [...bankForm.investments, { ...investmentForm, id: Date.now().toString() }]
    });
    setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
  };

  const handleCryptoSubmit = () => {
    if (!cryptoForm.symbol || cryptoForm.amount <= 0) {
      toast({ title: 'Preencha todos os campos', status: 'error', duration: 2000 });
      return;
    }
    if (editingCrypto) {
      updateCrypto(editingCrypto, cryptoForm);
      toast({ title: 'Cripto atualizada', status: 'success', duration: 2000 });
      setEditingCrypto(null);
    } else {
      addCrypto({ ...cryptoForm, id: Date.now().toString() });
      toast({ title: 'Cripto adicionada', status: 'success', duration: 2000 });
    }
    setCryptoForm({ id: '', symbol: '', amount: 0, purchasePrice: 0 });
  };

  const handleLoanSubmit = () => {
    if (!loanForm.name || loanForm.amount <= 0) {
      toast({ title: 'Preencha todos os campos', status: 'error', duration: 2000 });
      return;
    }
    if (editingLoan) {
      updateLoan(editingLoan, loanForm);
      toast({ title: 'Empréstimo atualizado', status: 'success', duration: 2000 });
      setEditingLoan(null);
    } else {
      addLoan({ ...loanForm, id: Date.now().toString() });
      toast({ title: 'Empréstimo adicionado', status: 'success', duration: 2000 });
    }
    setLoanForm({ id: '', name: '', amount: 0, interestRate: 0, dueDate: '' });
  };

  return (
    <Container maxW="1200px" py={8}>
      <Heading mb={6}>Gerenciar Finanças</Heading>

      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Bancos</Tab>
          <Tab>Criptomoedas</Tab>
          <Tab>Empréstimos</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>{editingBank ? 'Editar' : 'Adicionar'} Banco</Heading>
                  <VStack spacing={3}>
                    <FormControl>
                      <FormLabel>Nome do Banco</FormLabel>
                      <Input value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Saldo (R$)</FormLabel>
                      <NumberInput value={bankForm.balance} onChange={(_, val) => setBankForm({ ...bankForm, balance: val })}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                      <Heading size="sm" mb={3}>Investimentos</Heading>
                      <VStack spacing={2}>
                        <HStack w="100%">
                          <Input placeholder="Nome (ex: PETR4)" value={investmentForm.name} onChange={(e) => setInvestmentForm({ ...investmentForm, name: e.target.value })} />
                          <Select placeholder="Tipo" value={investmentForm.type} onChange={(e) => setInvestmentForm({ ...investmentForm, type: e.target.value })}>
                            <option value="Renda Variável">Renda Variável</option>
                            <option value="Renda Fixa">Renda Fixa</option>
                            <option value="Cripto">Cripto</option>
                            <option value="Bolsa BR">Bolsa BR</option>
                            <option value="Bolsa EUA">Bolsa EUA</option>
                            <option value="CS2">CS2</option>
                            <option value="Emprestimo">Emprestimo</option>
                          </Select>
                          <NumberInput value={investmentForm.amount} onChange={(_, val) => setInvestmentForm({ ...investmentForm, amount: val })}>
                            <NumberInputField placeholder="Valor" />
                          </NumberInput>
                          <IconButton aria-label="Add" icon={<AddIcon />} onClick={handleAddInvestment} />
                        </HStack>
                        {bankForm.investments.map((inv, idx) => (
                          <HStack key={idx} w="100%" justify="space-between" p={2} bg={useColorMode().colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                            <Box>{inv.name} ({inv.type}) - R$ {inv.amount}</Box>
                            <IconButton size="sm" aria-label="Remove" icon={<DeleteIcon />} onClick={() => setBankForm({ ...bankForm, investments: bankForm.investments.filter((_, i) => i !== idx) })} />
                          </HStack>
                        ))}
                      </VStack>
                    </Box>

                    <Button colorScheme="blue" onClick={handleBankSubmit} w="100%">
                      {editingBank ? 'Atualizar' : 'Adicionar'} Banco
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {data.banks.map(bank => (
                <Card key={bank.id}>
                  <CardBody>
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="sm">{bank.name}</Heading>
                        <Box>Saldo: R$ {bank.balance.toLocaleString('pt-BR')}</Box>
                        {bank.investments.length > 0 && (
                          <Box fontSize="sm" color="gray.600">
                            {bank.investments.length} investimento(s)
                          </Box>
                        )}
                      </Box>
                      <HStack>
                        <IconButton aria-label="Edit" icon={<EditIcon />} onClick={() => { setBankForm(bank); setEditingBank(bank.id); }} />
                        <IconButton aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" onClick={() => deleteBank(bank.id)} />
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>{editingCrypto ? 'Editar' : 'Adicionar'} Criptomoeda</Heading>
                  <VStack spacing={3}>
                    <FormControl>
                      <FormLabel>Símbolo (ex: BTC, ETH)</FormLabel>
                      <Input value={cryptoForm.symbol} onChange={(e) => setCryptoForm({ ...cryptoForm, symbol: e.target.value.toUpperCase() })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Quantidade</FormLabel>
                      <Input 
                        type="number" 
                        step="any"
                        value={cryptoForm.amount} 
                        onChange={(e) => setCryptoForm({ ...cryptoForm, amount: parseFloat(e.target.value) || 0 })} 
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Preço de Compra (USD)</FormLabel>
                      <Input 
                        type="number" 
                        step="any"
                        value={cryptoForm.purchasePrice} 
                        onChange={(e) => setCryptoForm({ ...cryptoForm, purchasePrice: parseFloat(e.target.value) || 0 })} 
                      />
                    </FormControl>
                    <Button colorScheme="blue" onClick={handleCryptoSubmit} w="100%">
                      {editingCrypto ? 'Atualizar' : 'Adicionar'} Cripto
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {data.cryptos.map(crypto => (
                <Card key={crypto.id}>
                  <CardBody>
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="sm">{crypto.symbol}</Heading>
                        <Box>Quantidade: {crypto.amount}</Box>
                        <Box fontSize="sm" color="gray.600">Preço: ${crypto.purchasePrice}</Box>
                      </Box>
                      <HStack>
                        <IconButton aria-label="Edit" icon={<EditIcon />} onClick={() => { setCryptoForm(crypto); setEditingCrypto(crypto.id); }} />
                        <IconButton aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" onClick={() => deleteCrypto(crypto.id)} />
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>{editingLoan ? 'Editar' : 'Adicionar'} Empréstimo Concedido</Heading>
                  <VStack spacing={3}>
                    <FormControl>
                      <FormLabel>Nome da Pessoa</FormLabel>
                      <Input value={loanForm.name} onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Valor Emprestado (R$)</FormLabel>
                      <NumberInput value={loanForm.amount} onChange={(_, val) => setLoanForm({ ...loanForm, amount: val })}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Taxa de Juros (%)</FormLabel>
                      <NumberInput value={loanForm.interestRate} onChange={(_, val) => setLoanForm({ ...loanForm, interestRate: val })}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <Input type="date" value={loanForm.dueDate} onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })} />
                    </FormControl>
                    <Button colorScheme="blue" onClick={handleLoanSubmit} w="100%">
                      {editingLoan ? 'Atualizar' : 'Adicionar'} Empréstimo
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {data.loans.map(loan => (
                <Card key={loan.id}>
                  <CardBody>
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="sm">{loan.name}</Heading>
                        <Box>Valor: R$ {loan.amount.toLocaleString('pt-BR')}</Box>
                        <Box fontSize="sm" color="gray.600">Taxa: {loan.interestRate}% | Vencimento: {loan.dueDate}</Box>
                      </Box>
                      <HStack>
                        <IconButton aria-label="Edit" icon={<EditIcon />} onClick={() => { setLoanForm(loan); setEditingLoan(loan.id); }} />
                        <IconButton aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" onClick={() => deleteLoan(loan.id)} />
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};
