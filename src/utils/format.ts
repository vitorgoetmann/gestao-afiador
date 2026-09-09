import { format, parseISO, startOfDay, startOfMonth, startOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateTime(value: string) {
  return format(parseISO(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatDateOnly(value: string) {
  return format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ''}`);
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ''}`);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function sanitizeText(value: string) {
  return value.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeSearchTerm(value: string) {
  return value
    .replace(/[,%().\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function parseMoney(value: string) {
  const digits = value.replace(/\D/g, '');
  return Number(digits) / 100;
}

export function moneyToInput(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function groupByDate<T extends { created_at: string }>(items: T[], formatter: (date: Date) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = formatter(parseISO(item.created_at));
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

export function inToday(date: string) {
  const current = parseISO(date);
  return isWithinInterval(current, { start: startOfDay(new Date()), end: new Date() });
}

export function inWeek(date: string) {
  const current = parseISO(date);
  return isWithinInterval(current, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: new Date() });
}

export function inMonth(date: string) {
  const current = parseISO(date);
  return isWithinInterval(current, { start: startOfMonth(new Date()), end: new Date() });
}
