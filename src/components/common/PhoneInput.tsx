import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';
import { formatPhone, onlyDigits } from '@/utils/format';

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function PhoneInput({ value, onValueChange, ...props }: PhoneInputProps) {
  return (
    <Input
      {...props}
      inputMode="tel"
      value={formatPhone(value)}
      onChange={(event) => onValueChange(onlyDigits(event.target.value))}
      placeholder="(00) 00000-0000"
    />
  );
}