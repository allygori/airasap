import { toTrimmedString } from '@/lib/string';

export const createBooleanParser = (
  trueValue: string,
  falseValue: string
) => {
  return (value: unknown): boolean => {
    const normalizedValue =
      toTrimmedString(value).toLowerCase();

    if (normalizedValue === trueValue.toLowerCase())
      return true;
    if (normalizedValue === falseValue.toLowerCase())
      return false;
    return false;
  };
};
