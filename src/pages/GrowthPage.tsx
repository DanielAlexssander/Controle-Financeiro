import { useState, useMemo } from 'react';
import {
  Box, Container, Heading, VStack, HStack, Card, CardBody, CardHeader,
  Button, FormControl, FormLabel, Input, NumberInput, NumberInputField,
  useToast, SimpleGrid, Text, IconButton, Flex, Badge, Stat, StatLabel,
  StatNumber, StatHelpText, StatArrow, useColorMode
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FaChartLine, FaCalendarAlt, FaArrowUp, FaArrowDown, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { useFinance } from '../context/FinanceContext';
import { lightColors, darkColors } from '../theme/colors';
import type { MonthlyGrowth } from '../types/index.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export const GrowthPage = () => {
  const { data, addMonthlyGrowth, deleteMonthlyGrowth } = useFinance();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  
  const [monthForm, setMonthForm] = useState<MonthlyGrowth>({ month: '', totalPatrimony: 0 });
  const [editingMonth, setEditingMonth] = useState<string | null>(null);

  const showToast = (title: string, status: 'success' | 'error' | 'warning') => {
    toast({ 
      title, 
      status, 
      duration: 2500, 
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleSubmit = () => {
    if (!monthForm.month || monthForm.totalPatrimony <= 0) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    if (editingMonth) {
      deleteMonthlyGrowth(editingMonth);
      addMonthlyGrowth(monthForm);
      showToast('Mês atualizado com sucesso!', 'success');
      setEditingMonth(null);
    } else {
      const exists = data.monthlyGrowth.find(g => g.month === monthForm.month);
      if (exists) {
        showToast('Este mês já está cadastrado', 'error');
        return;
      }
      addMonthlyGrowth(monthForm);
      showToast('Crescimento mensal adicionado!', 'success');
    }
    setMonthForm({ month: '', totalPatrimony: 0 });
  };

  const sortedGrowth = useMemo(() => {
    return [...data.monthlyGrowth].sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - 
             new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
    });
  }, [data.monthlyGrowth]);

  // Stats calculations
  const stats = useMemo(() => {
    if (sortedGrowth.length === 0) return null;
    
    const lastValue = sortedGrowth[sortedGrowth.length - 1].totalPatrimony;
    const firstValue = sortedGrowth[0].totalPatrimony;
    const totalGrowth = ((lastValue - firstValue) / firstValue) * 100;
    
    let maxGrowth = 0;
    let minGrowth = 0;
    let maxMonth = '';
    let minMonth = '';
    
    const monthlyChanges = sortedGrowth.slice(1).map((g, i) => {
      const change = ((g.totalPatrimony - sortedGrowth[i].totalPatrimony) / sortedGrowth[i].totalPatrimony) * 100;
      if (change > maxGrowth) { maxGrowth = change; maxMonth = g.month; }
      if (change < minGrowth) { minGrowth = change; minMonth = g.month; }
      return change;
    });
    
    const avgGrowth = monthlyChanges.length > 0 
      ? monthlyChanges.reduce((a, b) => a + b, 0) / monthlyChanges.length 
      : 0;
    
    return { totalGrowth, avgGrowth, maxGrowth, maxMonth, minGrowth, minMonth, lastValue };
  }, [sortedGrowth]);

  // Chart data
  const lineChartData = useMemo(() => ({
    labels: sortedGrowth.map(g => g.month),
    datasets: [{
      label: 'Patrimônio',
      data: sortedGrowth.map(g => g.totalPatrimony),
      fill: true,
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
      borderWidth: 3,
      pointBackgroundColor: colors.primary,
      pointBorderColor: colors.bgCard,
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 10,
      tension: 0.4,
    }],
  }), [sortedGrowth, colors]);

  const barChartData = useMemo(() => {
    const changes = sortedGrowth.slice(1).map((g, i) => ({
      month: g.month,
      change: ((g.totalPatrimony - sortedGrowth[i].totalPatrimony) / sortedGrowth[i].totalPatrimony) * 100
    }));
    
    return {
      labels: changes.map(c => c.month),
      datasets: [{
        label: 'Variação %',
        data: changes.map(c => c.change),
        backgroundColor: changes.map(c => c.change >= 0 ? `${colors.success}80` : `${colors.danger}80`),
        borderColor: changes.map(c => c.change >= 0 ? colors.success : colors.danger),
        borderWidth: 2,
        borderRadius: 8,
      }],
    };
  }, [sortedGrowth, colors]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.bgCard,
        titleColor: colors.text,
        bodyColor: colors.textSecondary,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.textMuted, font: { size: 11 } },
      },
      y: {
        grid: { color: colors.border, drawBorder: false },
        ticks: { color: colors.textMuted, font: { size: 11 } },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => `R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => `${context.raw >= 0 ? '+' : ''}${context.raw.toFixed(2)}%`,
        },
      },
    },
  };

  return (
    <Box minH="100vh" bg={colors.bg} pb={10}>
      <Container maxW="1400px" py={8} px={{ base: 4, md: 8 }}>
        <Box mb={8}>
          <Heading size="xl" fontWeight="800" letterSpacing="-0.03em">
            Crescimento Mensal
          </Heading>
          <Text color={colors.textSecondary} mt={1}>
            Acompanhe a evolução do seu patrimônio
          </Text>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
            <Card>
              <CardBody py={4}>
                <Stat>
                  <StatLabel fontSize="xs" color={colors.textMuted}>Patrimônio Atual</StatLabel>
                  <StatNumber fontSize="xl" color={colors.success}>
                    R$ {stats.lastValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody py={4}>
                <Stat>
                  <StatLabel fontSize="xs" color={colors.textMuted}>Crescimento Total</StatLabel>
                  <StatNumber fontSize="xl">
                    <StatArrow type={stats.totalGrowth >= 0 ? 'increase' : 'decrease'} />
                    {stats.totalGrowth.toFixed(1)}%
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody py={4}>
                <Stat>
                  <StatLabel fontSize="xs" color={colors.textMuted}>Média Mensal</StatLabel>
                  <StatNumber fontSize="xl" color={stats.avgGrowth >= 0 ? colors.success : colors.danger}>
                    {stats.avgGrowth >= 0 ? '+' : ''}{stats.avgGrowth.toFixed(2)}%
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody py={4}>
                <Stat>
                  <StatLabel fontSize="xs" color={colors.textMuted}>Melhor Mês</StatLabel>
                  <StatNumber fontSize="xl" color={colors.success}>
                    +{stats.maxGrowth.toFixed(1)}%
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>{stats.maxMonth}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* Form Card */}
          <Card>
            <CardHeader>
              <Flex align="center" gap={2}>
                <FaCalendarAlt color={colors.primary} />
                <Heading size="md" fontWeight="700">
                  {editingMonth ? 'Editar Mês' : 'Novo Registro'}
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Mês/Ano</FormLabel>
                  <Input
                    placeholder="Ex: 01/2024"
                    value={monthForm.month}
                    onChange={(e) => setMonthForm({ ...monthForm, month: e.target.value })}
                  />
                  <Text fontSize="xs" color={colors.textMuted} mt={1}>
                    Formato: MM/AAAA
                  </Text>
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Patrimônio Total (R$)</FormLabel>
                  <NumberInput
                    value={monthForm.totalPatrimony}
                    onChange={(_, val) => setMonthForm({ ...monthForm, totalPatrimony: val || 0 })}
                    min={0}
                  >
                    <NumberInputField placeholder="0,00" />
                  </NumberInput>
                </FormControl>

                <HStack w="100%" spacing={3}>
                  {editingMonth && (
                    <Button 
                      flex={1} 
                      variant="outline" 
                      colorScheme="red"
                      leftIcon={<FaTimes />}
                      onClick={() => {
                        setEditingMonth(null);
                        setMonthForm({ month: '', totalPatrimony: 0 });
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    flex={1} 
                    colorScheme="brand" 
                    leftIcon={editingMonth ? <FaSave /> : <FaPlus />}
                    onClick={handleSubmit}
                  >
                    {editingMonth ? 'Salvar' : 'Adicionar'}
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Charts */}
          <Card gridColumn={{ lg: 'span 2' }}>
            <CardHeader>
              <Flex align="center" gap={2}>
                <FaChartLine color={colors.primary} />
                <Heading size="md" fontWeight="700">Evolução Patrimonial</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              {sortedGrowth.length > 0 ? (
                <Box h="300px">
                  <Line data={lineChartData} options={lineOptions} />
                </Box>
              ) : (
                <Flex h="300px" align="center" justify="center">
                  <Text color={colors.textMuted}>Adicione registros para ver o gráfico</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Bar Chart - Monthly Variation */}
        {sortedGrowth.length > 1 && (
          <Card mt={6}>
            <CardHeader>
              <Heading size="md" fontWeight="700">Variação Mensal (%)</Heading>
            </CardHeader>
            <CardBody>
              <Box h="250px">
                <Bar data={barChartData} options={barOptions} />
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Monthly Records List */}
        {sortedGrowth.length > 0 && (
          <Card mt={6}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" fontWeight="700">Histórico</Heading>
                <Badge colorScheme="purple" borderRadius="full" px={3}>
                  {sortedGrowth.length} registros
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                {sortedGrowth.map((growth, idx) => {
                  const prevValue = idx > 0 ? sortedGrowth[idx - 1].totalPatrimony : growth.totalPatrimony;
                  const change = idx > 0 ? ((growth.totalPatrimony - prevValue) / prevValue) * 100 : 0;
                  
                  return (
                    <Box
                      key={growth.month}
                      p={4}
                      borderRadius="lg"
                      bg={colors.bgInput}
                      borderWidth={1}
                      borderColor={colors.border}
                      transition="all 0.2s"
                      _hover={{ borderColor: colors.primary }}
                    >
                      <Flex justify="space-between" align="start">
                        <Box>
                          <HStack mb={1}>
                            <Text fontWeight="700" fontSize="lg">{growth.month}</Text>
                            {idx > 0 && (
                              <Badge 
                                colorScheme={change >= 0 ? 'green' : 'red'} 
                                borderRadius="full"
                                px={2}
                              >
                                <HStack spacing={1}>
                                  {change >= 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                                  <Text>{Math.abs(change).toFixed(1)}%</Text>
                                </HStack>
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xl" fontWeight="700" color={colors.success}>
                            R$ {growth.totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Text>
                          {idx > 0 && (
                            <Text fontSize="xs" color={colors.textMuted} mt={1}>
                              {change >= 0 ? '+' : ''}R$ {(growth.totalPatrimony - prevValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Text>
                          )}
                        </Box>
                        <VStack spacing={1}>
                          <IconButton 
                            size="sm" 
                            aria-label="Editar"
                            icon={<EditIcon />}
                            variant="ghost"
                            onClick={() => {
                              setMonthForm(growth);
                              setEditingMonth(growth.month);
                            }} 
                          />
                          <IconButton 
                            size="sm" 
                            aria-label="Excluir"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              deleteMonthlyGrowth(growth.month);
                              showToast('Registro excluído', 'success');
                            }} 
                          />
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  );
};
