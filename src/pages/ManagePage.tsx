import { PageHeader } from '../components/PageHeader';
import { BankName } from '../components/BankName';
import { getBankLogo } from '../services/bankLogo';
import { useState } from 'react';
import {
  Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
  Button, FormControl, FormLabel, Input, VStack, HStack, Card, CardBody, CardHeader,
  IconButton, useToast, NumberInput, NumberInputField, Select, useColorMode,
  Text, Badge, Flex, SimpleGrid, Divider, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';
import { LuLandmark, LuBitcoin, LuHandCoins, LuPlus, LuSave, LuX } from 'react-icons/lu';
import { useFinance } from '../context/FinanceContext';
import { lightColors, darkColors } from '../theme/colors';
import type { Bank, Crypto, Loan, Investment } from '../types/index.js';

export const ManagePage = () => {
  const { data, addBank, updateBank, deleteBank, addCrypto, updateCrypto, deleteCrypto, addLoan, updateLoan, deleteLoan } = useFinance();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;

  const [bankForm, setBankForm] = useState<Bank>({ id: '', name: '', balance: 0, investments: [] });
  const bankLogo = getBankLogo(bankForm.name);
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [investmentForm, setInvestmentForm] = useState<Investment>({ id: '', name: '', amount: 0, type: '' });
  const [editingInvestment, setEditingInvestment] = useState<number | null>(null);

  const [cryptoForm, setCryptoForm] = useState<Crypto>({ id: '', symbol: '', amount: 0, purchasePrice: 0 });
  const [editingCrypto, setEditingCrypto] = useState<string | null>(null);

  const [loanForm, setLoanForm] = useState<Loan>({ id: '', name: '', amount: 0, interestRate: 0, dueDate: '' });
  const [editingLoan, setEditingLoan] = useState<string | null>(null);

  const showToast = (title: string, status: 'success' | 'error' | 'warning') => {
    toast({ 
      title, 
      status, 
      duration: 2500, 
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleBankSubmit = () => {
    if (!bankForm.name || bankForm.balance < 0) {
      showToast('Preencha todos os campos', 'error');
      return;
    }
    
    let finalBankForm = { ...bankForm };
    
    if (investmentForm.name || investmentForm.amount > 0 || investmentForm.type) {
      if (investmentForm.name && investmentForm.amount > 0 && investmentForm.type) {
        if (editingInvestment !== null) {
          const updatedInvestments = [...finalBankForm.investments];
          updatedInvestments[editingInvestment] = { ...investmentForm, id: investmentForm.id || Date.now().toString() };
          finalBankForm = { ...finalBankForm, investments: updatedInvestments };
          setEditingInvestment(null);
        } else {
          finalBankForm = {
            ...finalBankForm,
            investments: [...finalBankForm.investments, { ...investmentForm, id: Date.now().toString() }]
          };
        }
        setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
      } else {
        showToast('Complete ou limpe o campo do investimento', 'error');
        return;
      }
    }
    
    if (editingBank) {
      updateBank(editingBank, finalBankForm);
      showToast('Banco atualizado com sucesso!', 'success');
      setEditingBank(null);
    } else {
      addBank({ ...finalBankForm, id: Date.now().toString() });
      showToast('Banco adicionado com sucesso!', 'success');
    }
    setBankForm({ id: '', name: '', balance: 0, investments: [] });
    setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
    setEditingInvestment(null);
  };

  const handleAddInvestment = () => {
    if (!investmentForm.name || investmentForm.amount <= 0 || !investmentForm.type) {
      showToast('Preencha os dados do investimento', 'error');
      return;
    }
    
    if (editingInvestment !== null) {
      const updatedInvestments = [...bankForm.investments];
      updatedInvestments[editingInvestment] = { ...investmentForm, id: investmentForm.id || Date.now().toString() };
      setBankForm({ ...bankForm, investments: updatedInvestments });
      setEditingInvestment(null);
      showToast('Investimento atualizado!', 'success');
    } else {
      setBankForm({
        ...bankForm,
        investments: [...bankForm.investments, { ...investmentForm, id: Date.now().toString() }]
      });
    }
    setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
  };

  const handleCancelEdit = (type: 'bank' | 'crypto' | 'loan') => {
    if (type === 'bank') {
      setEditingBank(null);
      setBankForm({ id: '', name: '', balance: 0, investments: [] });
      setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
      setEditingInvestment(null);
    } else if (type === 'crypto') {
      setEditingCrypto(null);
      setCryptoForm({ id: '', symbol: '', amount: 0, purchasePrice: 0 });
    } else {
      setEditingLoan(null);
      setLoanForm({ id: '', name: '', amount: 0, interestRate: 0, dueDate: '' });
    }
  };

  const handleCryptoSubmit = () => {
    if (!cryptoForm.symbol || cryptoForm.amount <= 0) {
      showToast('Preencha todos os campos', 'error');
      return;
    }
    if (editingCrypto) {
      updateCrypto(editingCrypto, cryptoForm);
      showToast('Cripto atualizada com sucesso!', 'success');
      setEditingCrypto(null);
    } else {
      addCrypto({ ...cryptoForm, id: Date.now().toString() });
      showToast('Cripto adicionada com sucesso!', 'success');
    }
    setCryptoForm({ id: '', symbol: '', amount: 0, purchasePrice: 0 });
  };

  const handleLoanSubmit = () => {
    if (!loanForm.name || loanForm.amount <= 0) {
      showToast('Preencha todos os campos', 'error');
      return;
    }
    if (editingLoan) {
      updateLoan(editingLoan, loanForm);
      showToast('Empréstimo atualizado com sucesso!', 'success');
      setEditingLoan(null);
    } else {
      addLoan({ ...loanForm, id: Date.now().toString() });
      showToast('Empréstimo adicionado com sucesso!', 'success');
    }
    setLoanForm({ id: '', name: '', amount: 0, interestRate: 0, dueDate: '' });
  };

  const investmentTypes = [
    'Renda Variável',
    'Renda Fixa',
    'Cripto',
    'Bolsa BR',
    'Bolsa EUA',
    'CS2',
    'Emprestimo',
  ];

  return (
    <div className="page">
        <PageHeader title="Gerenciar ativos" description="Organize suas contas bancárias, criptomoedas e empréstimos." />

        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList 
            mb={6} 
            overflowX="auto" 
            css={{ '&::-webkit-scrollbar': { display: 'none' } }}
            flexWrap={{ base: 'nowrap', md: 'wrap' }}
          >
            <Tab gap={2} minW="fit-content">
              <LuLandmark /> Bancos
            </Tab>
            <Tab gap={2} minW="fit-content">
              <LuBitcoin /> Criptomoedas
            </Tab>
            <Tab gap={2} minW="fit-content">
              <LuHandCoins /> Empréstimos
            </Tab>
          </TabList>

          <TabPanels>
            {/* Banks Tab */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
                {/* Form Card */}
                <Card>
                  <CardHeader>
                    <Flex align="center" gap={2}>
                      <LuPlus color={colors.primary} />
                      <Heading size="md" fontWeight="700">
                        {editingBank ? 'Editar Banco' : 'Novo Banco'}
                      </Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Nome do Banco</FormLabel>
                        <InputGroup>
                          {bankLogo && (
                            <InputLeftElement pointerEvents="none">
                              <img className="bank-input-icon" src={bankLogo} width="24" height="24" alt="" />
                            </InputLeftElement>
                          )}
                          <Input
                            placeholder="Ex: Nubank, Inter, Itaú..."
                            value={bankForm.name}
                            onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                          />
                        </InputGroup>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Saldo em Conta (R$)</FormLabel>
                        <NumberInput 
                          value={bankForm.balance} 
                          onChange={(_, val) => setBankForm({ ...bankForm, balance: val || 0 })}
                          min={0}
                        >
                          <NumberInputField placeholder="0,00" />
                        </NumberInput>
                      </FormControl>

                      {/* Investments Section */}
                      <Box w="100%" p={4} borderRadius="lg" bg={colors.bgInput} borderWidth={1} borderColor={colors.border}>
                        <Flex justify="space-between" align="center" mb={3}>
                          <Text fontWeight="600" fontSize="sm">Investimentos</Text>
                          <Badge colorScheme="brand" borderRadius="full">
                            {bankForm.investments.length}
                          </Badge>
                        </Flex>
                        
                        <VStack spacing={3}>
                          <Input 
                            size="sm"
                            placeholder="Nome do investimento (ex: PETR4)"
                            value={investmentForm.name} 
                            onChange={(e) => setInvestmentForm({ ...investmentForm, name: e.target.value })} 
                          />
                          <Select 
                            size="sm"
                            placeholder="Tipo de investimento"
                            value={investmentForm.type} 
                            onChange={(e) => setInvestmentForm({ ...investmentForm, type: e.target.value })}
                          >
                            {investmentTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                          <HStack w="100%">
                            <NumberInput 
                              size="sm"
                              flex={1} 
                              value={investmentForm.amount} 
                              onChange={(_, val) => setInvestmentForm({ ...investmentForm, amount: val || 0 })}
                              min={0}
                            >
                              <NumberInputField placeholder="Valor (R$)" />
                            </NumberInput>
                            <IconButton 
                              aria-label={editingInvestment !== null ? "Atualizar" : "Adicionar"}
                              icon={<AddIcon />} 
                              colorScheme={editingInvestment !== null ? "green" : "brand"} 
                              size="sm"
                              onClick={handleAddInvestment} 
                            />
                            {editingInvestment !== null && (
                              <IconButton 
                                aria-label="Cancelar"
                                icon={<CloseIcon />} 
                                colorScheme="red" 
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingInvestment(null);
                                  setInvestmentForm({ id: '', name: '', amount: 0, type: '' });
                                }} 
                              />
                            )}
                          </HStack>
                        </VStack>

                        {bankForm.investments.length > 0 && (
                          <VStack mt={4} spacing={2} align="stretch">
                            <Divider />
                            {bankForm.investments.map((inv, idx) => (
                              <Flex 
                                key={idx} 
                                justify="space-between" 
                                align="center"
                                p={2}
                                borderRadius="md"
                                bg={colors.bgCard}
                              >
                                <Box>
                                  <Text fontSize="sm" fontWeight="500">{inv.name}</Text>
                                  <HStack spacing={2}>
                                    <Badge size="sm" colorScheme="gray">{inv.type}</Badge>
                                    <Text fontSize="xs" color={colors.success}>
                                      R$ {inv.amount.toLocaleString('pt-BR')}
                                    </Text>
                                  </HStack>
                                </Box>
                                <HStack>
                                  <IconButton 
                                    size="xs" 
                                    aria-label="Editar"
                                    icon={<EditIcon />} 
                                    variant="ghost"
                                    onClick={() => {
                                      setInvestmentForm(inv);
                                      setEditingInvestment(idx);
                                    }} 
                                  />
                                  <IconButton 
                                    size="xs" 
                                    aria-label="Remover"
                                    icon={<DeleteIcon />} 
                                    colorScheme="red" 
                                    variant="ghost"
                                    onClick={() => setBankForm({ 
                                      ...bankForm, 
                                      investments: bankForm.investments.filter((_, i) => i !== idx) 
                                    })} 
                                  />
                                </HStack>
                              </Flex>
                            ))}
                          </VStack>
                        )}
                      </Box>

                      <HStack w="100%" spacing={3}>
                        {editingBank && (
                          <Button 
                            flex={1} 
                            variant="outline" 
                            colorScheme="red"
                            leftIcon={<LuX />}
                            onClick={() => handleCancelEdit('bank')}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button 
                          flex={1} 
                          colorScheme="brand"
                          leftIcon={editingBank ? <LuSave /> : <LuPlus />}
                          onClick={handleBankSubmit}
                        >
                          {editingBank ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Banks List */}
                <VStack spacing={4} align="stretch">
                  {data.banks.length === 0 ? (
                    <Card>
                      <CardBody>
                        <div className="empty-state"><span className="empty-icon"><LuLandmark /></span><strong>Nenhum banco cadastrado ainda</strong></div>
                      </CardBody>
                    </Card>
                  ) : (
                    data.banks.map(bank => (
                      <Card key={bank.id}>
                        <CardBody>
                          <Flex justify="space-between" align="start">
                            <Box flex={1}>
                              <HStack mb={1}>
                                <Heading size="sm"><BankName name={bank.name} /></Heading>
                                {bank.investments.length > 0 && (
                                  <Badge colorScheme="brand" borderRadius="full">
                                    {bank.investments.length} inv.
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="lg" fontWeight="700" color={colors.success}>
                                R$ {bank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </Text>
                              {bank.investments.length > 0 && (
                                <Text fontSize="xs" color={colors.textMuted} mt={1}>
                                  Total investido: R$ {bank.investments.reduce((s, i) => s + i.amount, 0).toLocaleString('pt-BR')}
                                </Text>
                              )}
                            </Box>
                            <HStack>
                              <IconButton 
                                aria-label="Editar"
                                icon={<EditIcon />}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setBankForm(bank);
                                  setEditingBank(bank.id);
                                }} 
                              />
                              <IconButton 
                                aria-label="Excluir"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteBank(bank.id);
                                  showToast('Banco excluído', 'success');
                                }} 
                              />
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </VStack>
              </SimpleGrid>
            </TabPanel>

            {/* Crypto Tab */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
                <Card>
                  <CardHeader>
                    <Flex align="center" gap={2}>
                      <LuPlus color={colors.warning} />
                      <Heading size="md" fontWeight="700">
                        {editingCrypto ? 'Editar Criptomoeda' : 'Nova Criptomoeda'}
                      </Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Símbolo</FormLabel>
                        <Input 
                          placeholder="Ex: BTC, ETH, SOL..."
                          value={cryptoForm.symbol} 
                          onChange={(e) => setCryptoForm({ ...cryptoForm, symbol: e.target.value.toUpperCase() })} 
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Quantidade</FormLabel>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="0.00000000"
                          value={cryptoForm.amount || ''} 
                          onChange={(e) => setCryptoForm({ ...cryptoForm, amount: parseFloat(e.target.value) || 0 })} 
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Preço de Compra (USD)</FormLabel>
                        <InputGroup>
                          <InputLeftElement color={colors.textMuted}>$</InputLeftElement>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder="0.00"
                            value={cryptoForm.purchasePrice || ''} 
                            onChange={(e) => setCryptoForm({ ...cryptoForm, purchasePrice: parseFloat(e.target.value) || 0 })} 
                          />
                        </InputGroup>
                      </FormControl>

                      <HStack w="100%" spacing={3}>
                        {editingCrypto && (
                          <Button 
                            flex={1} 
                            variant="outline" 
                            colorScheme="red"
                            leftIcon={<LuX />}
                            onClick={() => handleCancelEdit('crypto')}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button 
                          flex={1} 
                          colorScheme="brand"
                          leftIcon={editingCrypto ? <LuSave /> : <LuPlus />}
                          onClick={handleCryptoSubmit}
                        >
                          {editingCrypto ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <VStack spacing={4} align="stretch">
                  {data.cryptos.length === 0 ? (
                    <Card>
                      <CardBody>
                        <div className="empty-state"><span className="empty-icon"><LuBitcoin /></span><strong>Nenhuma criptomoeda cadastrada ainda</strong></div>
                      </CardBody>
                    </Card>
                  ) : (
                    data.cryptos.map(crypto => (
                      <Card key={crypto.id}>
                        <CardBody>
                          <Flex justify="space-between" align="start">
                            <Box>
                              <Heading size="sm" color={colors.warning}>{crypto.symbol}</Heading>
                              <Text fontSize="sm" color={colors.textSecondary}>
                                {crypto.amount} unidades
                              </Text>
                              <Text fontSize="xs" color={colors.textMuted}>
                                Compra: ${crypto.purchasePrice.toFixed(2)}/un
                              </Text>
                            </Box>
                            <HStack>
                              <IconButton 
                                aria-label="Editar"
                                icon={<EditIcon />}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCryptoForm(crypto);
                                  setEditingCrypto(crypto.id);
                                }} 
                              />
                              <IconButton 
                                aria-label="Excluir"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteCrypto(crypto.id);
                                  showToast('Criptomoeda excluída', 'success');
                                }} 
                              />
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </VStack>
              </SimpleGrid>
            </TabPanel>

            {/* Loans Tab */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
                <Card>
                  <CardHeader>
                    <Flex align="center" gap={2}>
                      <LuPlus color={colors.accent} />
                      <Heading size="md" fontWeight="700">
                        {editingLoan ? 'Editar Empréstimo' : 'Novo Empréstimo'}
                      </Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Nome da Pessoa</FormLabel>
                        <Input 
                          placeholder="Para quem você emprestou?"
                          value={loanForm.name} 
                          onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })} 
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Valor Emprestado (R$)</FormLabel>
                        <NumberInput 
                          value={loanForm.amount} 
                          onChange={(_, val) => setLoanForm({ ...loanForm, amount: val || 0 })}
                          min={0}
                        >
                          <NumberInputField placeholder="0,00" />
                        </NumberInput>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Taxa de Juros (%)</FormLabel>
                        <NumberInput 
                          value={loanForm.interestRate} 
                          onChange={(_, val) => setLoanForm({ ...loanForm, interestRate: val || 0 })}
                          min={0}
                        >
                          <NumberInputField placeholder="0" />
                        </NumberInput>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Data de Vencimento</FormLabel>
                        <Input 
                          type="date" 
                          value={loanForm.dueDate} 
                          onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })} 
                        />
                      </FormControl>

                      <HStack w="100%" spacing={3}>
                        {editingLoan && (
                          <Button 
                            flex={1} 
                            variant="outline" 
                            colorScheme="red"
                            leftIcon={<LuX />}
                            onClick={() => handleCancelEdit('loan')}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button 
                          flex={1} 
                          colorScheme="brand"
                          leftIcon={editingLoan ? <LuSave /> : <LuPlus />}
                          onClick={handleLoanSubmit}
                        >
                          {editingLoan ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <VStack spacing={4} align="stretch">
                  {data.loans.length === 0 ? (
                    <Card>
                      <CardBody>
                        <div className="empty-state"><span className="empty-icon"><LuHandCoins /></span><strong>Nenhum empréstimo cadastrado ainda</strong></div>
                      </CardBody>
                    </Card>
                  ) : (
                    data.loans.map(loan => (
                      <Card key={loan.id}>
                        <CardBody>
                          <Flex justify="space-between" align="start">
                            <Box>
                              <Heading size="sm">{loan.name}</Heading>
                              <Text fontSize="lg" fontWeight="700" color={colors.accent}>
                                R$ {loan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </Text>
                              <HStack spacing={3} mt={1}>
                                {loan.interestRate > 0 && (
                                  <Badge colorScheme="brand" borderRadius="full">
                                    {loan.interestRate}% juros
                                  </Badge>
                                )}
                                {loan.dueDate && (
                                  <Text fontSize="xs" color={colors.textMuted}>
                                    Vence: {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
                                  </Text>
                                )}
                              </HStack>
                            </Box>
                            <HStack>
                              <IconButton 
                                aria-label="Editar"
                                icon={<EditIcon />}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setLoanForm(loan);
                                  setEditingLoan(loan.id);
                                }} 
                              />
                              <IconButton 
                                aria-label="Excluir"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteLoan(loan.id);
                                  showToast('Empréstimo excluído', 'success');
                                }} 
                              />
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </VStack>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
    </div>
  );
};
