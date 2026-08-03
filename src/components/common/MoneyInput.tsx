import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';
import { parseMoney, moneyToInput } from '@/utils/format';

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function MoneyInput({ value, onValueChange, ...props }: MoneyInputProps) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      value={moneyToInput(value)}
      onChange={(event) => onValueChange(parseMoney(event.target.value))}
    />
  );
}