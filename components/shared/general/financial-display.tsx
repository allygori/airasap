import { ElementType, JSX, ReactNode } from 'react';
import { cn } from '@/lib/utils/ui';

type FinancialDisplayProps = {
  value: number;
  formatter?: (v: number) => ReactNode;
  color?: 'red' | 'green' | 'yellow' | 'blue' | null;
  fallback?: number | string;
  showSign?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  Prefix?: ElementType;
  className?: string;
};

const FinancialDisplay = ({
  value,
  // fallback = 0,
  formatter,
  color,
  showSign = false,
  Prefix,
  prefix,
  suffix,
  className = '',
}: FinancialDisplayProps) => {
  const getColor = () => {
    if (color) {
      return {
        red: 'text-destructive',
        green: 'text-constructive',
        yellow: 'text-yellow-500',
        blue: 'text-blue-500',
      }[color];
    }

    if (value < 0) return 'text-destructive';
    if (value > 0) return 'text-constructive';

    return 'text-foreground';
  };

  const getSign = () => {
    return value < 0 ? '-' : value > 0 ? '+' : '';
  };

  return (
    <div className="flex flex-row items-center">
      {Prefix ? (
        <Prefix className={cn(getColor(), 'mr-1 size-3')} />
      ) : null}
      {prefix ? prefix : null}
      <span className={cn(getColor())}>
        {showSign ? getSign() : ''}
      </span>
      <span className={cn(getColor(), className)}>
        {typeof formatter === 'function'
          ? formatter(value)
          : value}
      </span>
      {suffix ? suffix : null}
    </div>
  );
};

export default FinancialDisplay;
