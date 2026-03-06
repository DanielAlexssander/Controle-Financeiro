import { useState } from 'react';
import {
  Box, Container, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Card, CardBody, Select, HStack, Text, VStack, useColorMode, Icon
} from '@chakra-ui/react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaWallet, FaChartLine, FaBitcoin, FaHandHoldingUsd } from 'react-icons/fa';
import { useFinance } from '../context/FinanceContext';
import { useCurrencyRates } from '../hooks/useCurrencyRates';
import { useAllCryptoPrices } from '../hooks/useAllCryptoPrices';
import type { Currency } from '../types/index.js';

export const Dashboard = () => {
  const { data } = useFinance();
  const { usdToBrl } = useCurrencyRates();
  const { getTotalValue, getCryptoValue } = useAllCryptoPrices(data.cryptos);
  const [currency, setCurrency] = useState<Currency>('BRL');
  const { colorMode } = useColorMode();

  const convertValue = (value: number, fromUSD: boolean = false) => {
    if (currency === 'USD') {
      return parseFloat((fromUSD ? value : value / usdToBrl).toFixed(2));
    }
    return parseFloat((fromUSD ? value * usdToBrl : value).toFixed(2));
  };

  const totalBanks = data.banks.reduce((sum, bank) => sum + bank.balance, 0);
  const totalInvestments = data.banks.reduce((sum, bank) => sum + bank.investments.reduce((s, i) => s + i.amount, 0), 0);
  const totalCryptosUSD = getTotalValue();
  const totalLoans = data.loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalPatrimonyBRL = totalBanks + (totalCryptosUSD * usdToBrl) + totalLoans;
  const totalPatrimony = currency === 'BRL' ? totalPatrimonyBRL : totalPatrimonyBRL / usdToBrl;

  const investments = data.banks.flatMap(b => b.investments);
  const totalInvestmentsValue = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCryptosBRL = totalCryptosUSD * usdToBrl;
  const total = totalInvestmentsValue + totalCryptosBRL;

  const groupedInvestments = investments.reduce((acc, inv) => {
    const type = inv.type || 'Outros';
    acc[type] = (acc[type] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const colors = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#DD6B20', '#38B2AC', '#D53F8C'];
  const pieData = [
    ...Object.entries(groupedInvestments).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    })),
    ...(totalCryptosBRL > 0 ? [{ name: 'Criptomoedas', value: totalCryptosBRL, color: '#F6AD55' }] : [])
  ];

  const growthData = data.monthlyGrowth.map(g => ({
    month: g.month,
    value: convertValue(g.totalPatrimony)
  }));

  return (
    <Container maxW="1400px" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Controle Financeiro</Heading>
        <Select w="150px" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
          <option value="BRL">BRL (R$)</option>
          <option value="USD">USD ($)</option>
        </Select>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <HStack spacing={4}>
              <Icon as={FaWallet} boxSize={8} color="green.500" />
              <Stat>
                <StatLabel>Patrimônio Total</StatLabel>
                <StatNumber color="green.500">
                  {currency === 'BRL' ? 'R$' : '$'} {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </StatNumber>
                <StatHelpText>Total</StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack spacing={4}>
              <Icon as={FaChartLine} boxSize={8} color="purple.500" />
              <Stat>
                <StatLabel>Total em Investimentos</StatLabel>
                <StatNumber color="purple.500">
                  {currency === 'BRL' ? 'R$' : '$'} {convertValue(totalInvestments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </StatNumber>
                <StatHelpText>Dentro dos bancos</StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack spacing={4}>
              <Icon as={FaBitcoin} boxSize={8} color="orange.500" />
              <Stat>
                <StatLabel>Total em Cripto</StatLabel>
                <StatNumber color="orange.500">
                  {currency === 'BRL' ? 'R$' : '$'} {convertValue(totalCryptosUSD, true).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </StatNumber>
                <StatHelpText>{data.cryptos.length} moeda(s)</StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack spacing={4}>
              <Icon as={FaHandHoldingUsd} boxSize={8} color="teal.500" />
              <Stat>
                <StatLabel>Empréstimos Concedidos</StatLabel>
                <StatNumber color="teal.500">
                  {currency === 'BRL' ? 'R$' : '$'} {convertValue(totalLoans).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </StatNumber>
                <StatHelpText>{data.loans.length} empréstimo(s)</StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Bancos</Heading>
            <VStack align="stretch" spacing={3}>
              {data.banks.map(bank => (
                <Box key={bank.id} p={3} borderWidth={1} borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">{bank.name}</Text>
                    <Text color="green.500">
                      {currency === 'BRL' ? 'R$' : '$'} {convertValue(bank.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </HStack>
                  {bank.investments.length > 0 && (
                    <VStack align="stretch" mt={2} pl={4} spacing={1}>
                      {bank.investments.map(inv => (
                        <HStack key={inv.id} justify="space-between" fontSize="sm">
                          <Text color="gray.500">{inv.name} ({inv.type})</Text>
                          <Text>{currency === 'BRL' ? 'R$' : '$'} {convertValue(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Diversificação</Heading>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    label={(entry) => `${entry.name}: ${((entry.value / total) * 100).toFixed(1)}%`}
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => value ? `${currency === 'BRL' ? 'R$' : '$'} ${convertValue(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${((value / total) * 100).toFixed(1)}%)` : ''} />
                  <Legend formatter={(value: any, entry: any) => `${value}: ${((entry.payload.value / total) * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text color="gray.500">Adicione investimentos para ver a diversificação</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {growthData.length > 0 && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Crescimento Mensal</Heading>
            {growthData.length > 1 && (
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                <Box p={3} borderWidth={1} borderRadius="md">
                  <Text fontSize="sm" color="gray.500">Variação Último Mês</Text>
                  <Text fontSize="xl" fontWeight="bold" color={growthData[growthData.length - 1].value > growthData[growthData.length - 2].value ? 'green.500' : 'red.500'}>
                    {growthData[growthData.length - 1].value > growthData[growthData.length - 2].value ? '+' : ''}
                    {(((growthData[growthData.length - 1].value - growthData[growthData.length - 2].value) / growthData[growthData.length - 2].value) * 100).toFixed(2)}%
                  </Text>
                </Box>
                <Box p={3} borderWidth={1} borderRadius="md">
                  <Text fontSize="sm" color="gray.500">Média de Crescimento</Text>
                  <Text fontSize="xl" fontWeight="bold" color={growthData[growthData.length - 1].value > growthData[growthData.length - 2].value ? 'green.500' : 'red.500'}>
                    {(() => {
                      const changes = growthData.slice(1).map((g, i) => ((g.value - growthData[i].value) / growthData[i].value) * 100);
                      const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
                      return `${avg > 0 ? '+' : ''}${avg.toFixed(2)}%`;
                    })()}
                  </Text>
                </Box>
                <Box p={3} borderWidth={1} borderRadius="md">
                  <Text fontSize="sm" color="gray.500">Patrimônio do Mês</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.500">
                    {currency === 'BRL' ? 'R$' : '$'} {convertValue(data.monthlyGrowth[data.monthlyGrowth.length - 1].totalPatrimony).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Box>
              </SimpleGrid>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? '#444' : '#ccc'} />
                <XAxis dataKey="month" stroke={colorMode === 'dark' ? '#fff' : '#000'} />
                <YAxis stroke={colorMode === 'dark' ? '#fff' : '#000'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colorMode === 'dark' ? '#2D3748' : '#fff' }} 
                  formatter={(value: any) => (currency === 'BRL' ? 'R$ ' : '$ ') + parseFloat(value).toFixed(2)}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3182CE" strokeWidth={2} name="Patrimônio" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={6} mt={8}>
        

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Carteira de Criptomoedas</Heading>
            <VStack align="stretch" spacing={3}>
              {data.cryptos.map(crypto => (
                <Box key={crypto.id} p={3} borderWidth={1} borderRadius="md">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{crypto.symbol}</Text>
                      <Text fontSize="sm" color="gray.500">{crypto.amount} unidade(s)</Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Text color="orange.500">
                        ${getCryptoValue(crypto.symbol, crypto.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        ${crypto.purchasePrice.toFixed(2)}/un
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
};
