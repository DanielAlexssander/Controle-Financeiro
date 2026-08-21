import { useState, useMemo } from 'react';
import {
  Box, Container, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Card, CardBody, CardHeader, Select, HStack, Text, VStack, useColorMode, Icon, Flex, Badge, Divider
} from '@chakra-ui/react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { FaWallet, FaChartLine, FaBitcoin, FaHandHoldingUsd, FaArrowUp, FaArrowDown, FaUniversity } from 'react-icons/fa';
import { useFinance } from '../context/FinanceContext';
import { useCurrencyRates } from '../hooks/useCurrencyRates';
import { useAllCryptoPrices } from '../hooks/useAllCryptoPrices';
import { lightColors, darkColors, getChartColors } from '../theme/colors';
import type { Currency } from '../types/index.js';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  helpText: string;
  iconColor: string;
  bgGradient?: string;
}

const StatCard = ({ icon, label, value, helpText, iconColor, bgGradient }: StatCardProps) => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  
  return (
    <Card 
      position="relative" 
      overflow="hidden"
      _before={bgGradient ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: bgGradient,
      } : undefined}
    >
      <CardBody>
        <Flex align="center" gap={4}>
          <Flex
            align="center"
            justify="center"
            w={14}
            h={14}
            borderRadius="xl"
            bg={`${iconColor}15`}
          >
            <Icon as={icon} boxSize={7} color={iconColor} />
          </Flex>
          <Stat>
            <StatLabel fontSize="sm" fontWeight="500" color={colors.textSecondary}>
              {label}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="700" letterSpacing="-0.02em">
              {value}
            </StatNumber>
            <StatHelpText fontSize="xs" mb={0}>
              {helpText}
            </StatHelpText>
          </Stat>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const Dashboard = () => {
  const { data } = useFinance();
  const { usdToBrl } = useCurrencyRates();
  const { getTotalValue, getCryptoValue } = useAllCryptoPrices(data.cryptos);
  const [currency, setCurrency] = useState<Currency>('BRL');
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const chartColors = getChartColors(colorMode === 'dark');

  const convertValue = (value: number, fromUSD: boolean = false) => {
    if (currency === 'USD') {
      return parseFloat((fromUSD ? value : value / usdToBrl).toFixed(2));
    }
    return parseFloat((fromUSD ? value * usdToBrl : value).toFixed(2));
  };

  const formatCurrency = (value: number) => {
    const symbol = currency === 'BRL' ? 'R$' : '$';
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculations
  const totalBanks = data.banks.reduce((sum, bank) => sum + bank.balance, 0);
  const totalInvestments = data.banks.reduce((sum, bank) => sum + bank.investments.reduce((s, i) => s + i.amount, 0), 0);
  const totalCryptosUSD = getTotalValue();
  const totalLoans = data.loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalPatrimonyBRL = totalBanks + (totalCryptosUSD * usdToBrl) + totalLoans;
  const totalPatrimony = currency === 'BRL' ? totalPatrimonyBRL : totalPatrimonyBRL / usdToBrl;

  // Diversification data
  const investments = data.banks.flatMap(b => b.investments);
  const totalCryptosBRL = totalCryptosUSD * usdToBrl;
  
  const groupedInvestments = investments.reduce((acc, inv) => {
    const type = inv.type || 'Outros';
    acc[type] = (acc[type] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = useMemo(() => {
    const entries = [
      ...Object.entries(groupedInvestments),
      ...(totalCryptosBRL > 0 ? [['Criptomoedas', totalCryptosBRL] as [string, number]] : [])
    ];
    
    return {
      labels: entries.map(([name]) => name),
      datasets: [{
        data: entries.map(([, value]) => value),
        backgroundColor: chartColors.slice(0, entries.length),
        borderColor: colors.bgCard,
        borderWidth: 3,
        hoverBorderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }, [groupedInvestments, totalCryptosBRL, chartColors, colors.bgCard]);

  const totalDiversification = Object.values(groupedInvestments).reduce((a, b) => a + b, 0) + totalCryptosBRL;

  // Growth data
  const growthData = useMemo(() => {
    const monthlyData = data.monthlyGrowth.map(g => ({
      month: g.month,
      value: convertValue(g.totalPatrimony)
    }));

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Patrimônio',
        data: monthlyData.map(d => d.value),
        fill: true,
        backgroundColor: `${colors.primary}20`,
        borderColor: colors.primary,
        borderWidth: 3,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.bgCard,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4,
      }],
    };
  }, [data.monthlyGrowth, currency, colors]);

  // Growth stats
  const growthStats = useMemo(() => {
    if (data.monthlyGrowth.length < 2) return null;
    
    const sorted = [...data.monthlyGrowth].sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - 
             new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
    });
    
    const lastValue = sorted[sorted.length - 1].totalPatrimony;
    const prevValue = sorted[sorted.length - 2].totalPatrimony;
    const change = ((lastValue - prevValue) / prevValue) * 100;
    
    const changes = sorted.slice(1).map((g, i) => 
      ((g.totalPatrimony - sorted[i].totalPatrimony) / sorted[i].totalPatrimony) * 100
    );
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    return { change, avgChange, lastValue };
  }, [data.monthlyGrowth]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.text,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 500 as const },
        },
      },
      tooltip: {
        backgroundColor: colors.bgCard,
        titleColor: colors.text,
        bodyColor: colors.textSecondary,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const percentage = ((value / totalDiversification) * 100).toFixed(1);
            return `${formatCurrency(convertValue(value))} (${percentage}%)`;
          },
        },
      },
    },
  };

  const lineOptions = {
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
        callbacks: {
          label: (context: any) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.textMuted, font: { size: 11 } },
      },
      y: {
        grid: { color: colors.border, drawBorder: false },
        ticks: { 
          color: colors.textMuted, 
          font: { size: 11 },
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <Box minH="100vh" bg={colors.bg} pb={10}>
      <Container maxW="1400px" py={8} px={{ base: 4, md: 8 }}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" fontWeight="800" letterSpacing="-0.03em">
              Dashboard
            </Heading>
            <Text color={colors.textSecondary} mt={1}>
              Visão geral do seu patrimônio
            </Text>
          </Box>
          <Select 
            w="140px" 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as Currency)}
            bg={colors.bgCard}
            borderColor={colors.border}
            fontWeight="600"
            size="md"
          >
            <option value="BRL">BRL (R$)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
          <StatCard
            icon={FaWallet}
            label="Patrimônio Total"
            value={formatCurrency(totalPatrimony)}
            helpText="Todos os ativos"
            iconColor={colors.success}
            bgGradient={colors.gradientSuccess}
          />
          <StatCard
            icon={FaChartLine}
            label="Investimentos"
            value={formatCurrency(convertValue(totalInvestments))}
            helpText={`${investments.length} ativos`}
            iconColor={colors.primary}
            bgGradient={colors.gradientPrimary}
          />
          <StatCard
            icon={FaBitcoin}
            label="Criptomoedas"
            value={formatCurrency(convertValue(totalCryptosUSD, true))}
            helpText={`${data.cryptos.length} moeda(s)`}
            iconColor={colors.warning}
            bgGradient={colors.gradientWarning}
          />
          <StatCard
            icon={FaHandHoldingUsd}
            label="Empréstimos"
            value={formatCurrency(convertValue(totalLoans))}
            helpText={`${data.loans.length} empréstimo(s)`}
            iconColor={colors.accent}
            bgGradient={colors.gradientAccent}
          />
        </SimpleGrid>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
          {/* Banks Card */}
          <Card>
            <CardHeader pb={2}>
              <Flex align="center" gap={3}>
                <Icon as={FaUniversity} color={colors.primary} />
                <Heading size="md" fontWeight="700">Bancos</Heading>
                <Badge colorScheme="purple" borderRadius="full" px={2}>
                  {data.banks.length}
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto" pr={2}>
                {data.banks.length === 0 ? (
                  <Text color={colors.textMuted} textAlign="center" py={8}>
                    Nenhum banco cadastrado
                  </Text>
                ) : (
                  data.banks.map(bank => (
                    <Box 
                      key={bank.id} 
                      p={4} 
                      borderRadius="lg"
                      bg={colors.bgInput}
                      transition="all 0.2s"
                      _hover={{ bg: colors.bgCardHover }}
                    >
                      <Flex justify="space-between" align="center" mb={bank.investments.length > 0 ? 3 : 0}>
                        <Text fontWeight="600">{bank.name}</Text>
                        <Text fontWeight="700" color={colors.success}>
                          {formatCurrency(convertValue(bank.balance))}
                        </Text>
                      </Flex>
                      {bank.investments.length > 0 && (
                        <VStack align="stretch" spacing={2} pl={3} borderLeftWidth={2} borderColor={colors.primary}>
                          {bank.investments.map(inv => (
                            <Flex key={inv.id} justify="space-between" fontSize="sm">
                              <HStack spacing={2}>
                                <Text color={colors.textSecondary}>{inv.name}</Text>
                                <Badge size="sm" colorScheme="gray" borderRadius="md">
                                  {inv.type}
                                </Badge>
                              </HStack>
                              <Text fontWeight="500">
                                {formatCurrency(convertValue(inv.amount))}
                              </Text>
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  ))
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Diversification Chart */}
          <Card>
            <CardHeader pb={2}>
              <Heading size="md" fontWeight="700">Diversificação</Heading>
            </CardHeader>
            <CardBody>
              {pieData.labels.length > 0 ? (
                <Box h="350px" position="relative">
                  <Doughnut data={pieData} options={doughnutOptions} />
                  <VStack
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -70%)"
                    spacing={0}
                  >
                    <Text fontSize="sm" color={colors.textMuted}>Total</Text>
                    <Text fontSize="xl" fontWeight="700">
                      {formatCurrency(convertValue(totalDiversification))}
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <Flex h="350px" align="center" justify="center">
                  <Text color={colors.textMuted}>Adicione investimentos para ver a diversificação</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Growth Chart */}
        {data.monthlyGrowth.length > 0 && (
          <Card mb={8}>
            <CardHeader>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                <Heading size="md" fontWeight="700">Crescimento Mensal</Heading>
                {growthStats && (
                  <HStack spacing={6}>
                    <VStack spacing={0} align="end">
                      <Text fontSize="xs" color={colors.textMuted}>Variação</Text>
                      <HStack spacing={1}>
                        <Icon 
                          as={growthStats.change >= 0 ? FaArrowUp : FaArrowDown} 
                          color={growthStats.change >= 0 ? colors.success : colors.danger}
                          boxSize={3}
                        />
                        <Text 
                          fontWeight="700" 
                          color={growthStats.change >= 0 ? colors.success : colors.danger}
                        >
                          {growthStats.change >= 0 ? '+' : ''}{growthStats.change.toFixed(2)}%
                        </Text>
                      </HStack>
                    </VStack>
                    <Divider orientation="vertical" h={8} />
                    <VStack spacing={0} align="end">
                      <Text fontSize="xs" color={colors.textMuted}>Média</Text>
                      <Text fontWeight="700" color={growthStats.avgChange >= 0 ? colors.success : colors.danger}>
                        {growthStats.avgChange >= 0 ? '+' : ''}{growthStats.avgChange.toFixed(2)}%
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              <Box h="300px">
                <Line data={growthData} options={lineOptions} />
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Crypto Wallet */}
        {data.cryptos.length > 0 && (
          <Card>
            <CardHeader>
              <Flex align="center" gap={3}>
                <Icon as={FaBitcoin} color={colors.warning} />
                <Heading size="md" fontWeight="700">Carteira de Criptomoedas</Heading>
                <Badge colorScheme="orange" borderRadius="full" px={2}>
                  {data.cryptos.length}
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {data.cryptos.map(crypto => {
                  const currentValue = getCryptoValue(crypto.symbol, crypto.amount);
                  const investedValue = crypto.purchasePrice * crypto.amount;
                  const profit = currentValue - investedValue;
                  const profitPercentage = investedValue > 0 ? (profit / investedValue) * 100 : 0;
                  
                  return (
                    <Box 
                      key={crypto.id} 
                      p={4} 
                      borderRadius="lg"
                      bg={colors.bgInput}
                      borderWidth={1}
                      borderColor={colors.border}
                    >
                      <Flex justify="space-between" align="start">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="700" fontSize="lg">{crypto.symbol}</Text>
                            <Badge 
                              colorScheme={profitPercentage >= 0 ? 'green' : 'red'} 
                              borderRadius="full"
                              px={2}
                            >
                              <HStack spacing={1}>
                                <Icon 
                                  as={profitPercentage >= 0 ? FaArrowUp : FaArrowDown} 
                                  boxSize={2} 
                                />
                                <Text>{Math.abs(profitPercentage).toFixed(1)}%</Text>
                              </HStack>
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color={colors.textMuted}>
                            {crypto.amount} unidade(s)
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontWeight="700" color={colors.warning}>
                            ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text fontSize="xs" color={colors.textMuted}>
                            Compra: ${crypto.purchasePrice.toFixed(2)}/un
                          </Text>
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
