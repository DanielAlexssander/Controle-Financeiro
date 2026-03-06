import { useState } from 'react';
import {
  Container, Heading, VStack, HStack, Card, CardBody,
  Button, FormControl, FormLabel, Input, NumberInput, NumberInputField,
  useToast, SimpleGrid, Text, IconButton
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useFinance } from '../context/FinanceContext';
import type { MonthlyGrowth } from '../types/index.js';

export const GrowthPage = () => {
  const { data, addMonthlyGrowth, deleteMonthlyGrowth } = useFinance();
  const toast = useToast();
  const [monthForm, setMonthForm] = useState<MonthlyGrowth>({ month: '', totalPatrimony: 0 });
  const [editingMonth, setEditingMonth] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!monthForm.month || monthForm.totalPatrimony <= 0) {
      toast({ title: 'Preencha todos os campos', status: 'error', duration: 2000 });
      return;
    }

    if (editingMonth) {
      deleteMonthlyGrowth(editingMonth);
      addMonthlyGrowth(monthForm);
      toast({ title: 'Mês atualizado', status: 'success', duration: 2000 });
      setEditingMonth(null);
    } else {
      const exists = data.monthlyGrowth.find(g => g.month === monthForm.month);
      if (exists) {
        toast({ title: 'Mês já cadastrado', status: 'error', duration: 2000 });
        return;
      }
      addMonthlyGrowth(monthForm);
      toast({ title: 'Crescimento mensal adicionado', status: 'success', duration: 2000 });
    }
    setMonthForm({ month: '', totalPatrimony: 0 });
  };

  const sortedGrowth = [...data.monthlyGrowth].sort((a, b) => {
    const [monthA, yearA] = a.month.split('/');
    const [monthB, yearB] = b.month.split('/');
    return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
  });

  return (
    <Container maxW="1200px" py={8} px={{ base: 4, md: 8 }}>
      <Heading mb={6}>Crescimento Mensal do Patrimônio</Heading>

      <Card mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>{editingMonth ? 'Editar' : 'Adicionar'} Mês</Heading>
          <VStack spacing={4}>
            <VStack spacing={4} w="100%">
              <FormControl>
                <FormLabel>Mês (MM/AAAA)</FormLabel>
                <Input
                  placeholder="01/2024"
                  value={monthForm.month}
                  onChange={(e) => setMonthForm({ ...monthForm, month: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Patrimônio Total (R$)</FormLabel>
                <NumberInput
                  value={monthForm.totalPatrimony}
                  onChange={(_, val) => setMonthForm({ ...monthForm, totalPatrimony: val })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
            <HStack spacing={4} w="100%" flexDir={{ base: 'column', sm: 'row' }}>
              {editingMonth && (
                <Button colorScheme="red" onClick={() => { setEditingMonth(null); setMonthForm({ month: '', totalPatrimony: 0 }); }} flex={1} w="100%" p={2}>
                  Cancelar
                </Button>
              )}
              <Button colorScheme="blue" onClick={handleSubmit} flex={1} w="100%" p={2}>
                {editingMonth ? 'Atualizar' : 'Adicionar'}
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {sortedGrowth.map((growth, idx) => (
          <Card key={idx}>
            <CardBody>
              <HStack justify="space-between" mb={2}>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="lg">{growth.month}</Text>
                  <Text color="green.500" fontSize="xl">
                    R$ {growth.totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                  {idx > 0 && (
                    <Text fontSize="sm" color={growth.totalPatrimony > sortedGrowth[idx - 1].totalPatrimony ? 'green.500' : 'red.500'}>
                      {growth.totalPatrimony > sortedGrowth[idx - 1].totalPatrimony ? '↑' : '↓'}{' '}
                      {((growth.totalPatrimony - sortedGrowth[idx - 1].totalPatrimony) / sortedGrowth[idx - 1].totalPatrimony * 100).toFixed(2)}%
                    </Text>
                  )}
                </VStack>
                <HStack>
                  <IconButton size="sm" aria-label="Edit" icon={<EditIcon />} onClick={() => { setMonthForm(growth); setEditingMonth(growth.month); }} />
                  <IconButton size="sm" aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" onClick={() => deleteMonthlyGrowth(growth.month)} />
                </HStack>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};
