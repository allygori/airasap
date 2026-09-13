import { parse } from 'date-fns';
import { tz } from '@date-fns/tz';

export const stringParser = (val: unknown): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim();
};

export const numberParser = (val: unknown): number => {
  if (val === undefined || val === null || val === '')
    return 0;
  if (typeof val === 'number') return val;
  // Shopee excel values can be strings with dots/commas like "130.000" or "130,00"
  const clean = String(val)
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(clean) || 0;
};

// export const dateParser = (val: unknown): Date | null => {
//   if (!val) return null;
//   if (val instanceof Date) return val;
//   if (typeof val === 'string' || typeof val === 'number') {
//     const d = new Date(val);
//     return isNaN(d.getTime()) ? null : d;
//   }
//   return null;
// };

// export const dateParser = (val: unknown): Date | null => {
//   if (!val) return null;
//   if (val instanceof Date) return val;

//   if (typeof val === 'string') {
//     try {
//       // Memaksa date-fns untuk membaca string "2026-06-02 07:18"
//       // langsung dalam konteks zona waktu Asia/Jakarta (WIB)
//       const parsedLocal = parse(
//         val,
//         'yyyy-MM-dd HH:mm',
//         new Date(),
//         {
//           in: tz('Asia/Jakarta'),
//           // inTimeZone: tz('Asia/Jakarta'),
//         }
//       );

//       return isNaN(parsedLocal.getTime())
//         ? null
//         : parsedLocal;
//     } catch {
//       return null;
//     }
//   }

//   if (typeof val === 'number') {
//     const d = new Date(val);
//     return isNaN(d.getTime()) ? null : d;
//   }

//   return null;
// };

// // usage: dateParser('yyyy-MM-dd HH:mm')
// export const dateParser = (
//   format: string = 'yyyy-MM-dd HH:mm'
// ) => {
//   return (val: unknown): Date | null => {
//     if (!val) return null;
//     if (val instanceof Date) return val;

//     if (typeof val === 'string') {
//       try {
//         // Memaksa date-fns untuk membaca string "2026-06-02 07:18"
//         // langsung dalam konteks zona waktu Asia/Jakarta (WIB)
//         const parsedLocal = parse(val, format, new Date(), {
//           in: tz('Asia/Jakarta'),
//           // inTimeZone: tz('Asia/Jakarta'),
//         });

//         return isNaN(parsedLocal.getTime())
//           ? null
//           : parsedLocal;
//       } catch {
//         return null;
//       }
//     }

//     if (typeof val === 'number') {
//       const d = new Date(val);
//       return isNaN(d.getTime()) ? null : d;
//     }

//     return null;
//   };
// };

// usage: dateParser('yyyy-MM-dd HH:mm')
export const dateParser = (
  format: string = 'yyyy-MM-dd HH:mm'
) => {
  return (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;

    if (typeof val === 'string') {
      try {
        const parsed = parse(val, format, new Date(0), {
          in: tz('Asia/Jakarta'),
        });

        return isNaN(parsed.getTime())
          ? null
          : new Date(parsed);
      } catch {
        return null;
      }
    }

    if (typeof val === 'number') {
      const d = new Date(
        Date.UTC(1899, 11, 30) + val * 24 * 60 * 60 * 1000
      );
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  };
};

// usage: dateParser('yyyy-MM-dd HH:mm')
export const dateParserToISOString = (
  format: string = 'yyyy-MM-dd HH:mm'
) => {
  return (val: unknown): string | null => {
    if (!val) return null;
    if (val instanceof Date) {
      return isNaN(val.getTime())
        ? null
        : val.toISOString();
    }

    if (typeof val === 'string') {
      try {
        const parsed = parse(val, format, new Date(0), {
          in: tz('Asia/Jakarta'),
        });

        return isNaN(parsed.getTime())
          ? null
          : new Date(parsed).toISOString();
      } catch {
        return null;
      }
    }

    if (typeof val === 'number') {
      const d = new Date(
        Date.UTC(1899, 11, 30) + val * 24 * 60 * 60 * 1000
      );
      return isNaN(d.getTime()) ? null : d.toISOString();
    }

    return null;
  };
};

// usage: booleanParser('TRUE', 'FALSE)
export const booleanParser = (
  trueVal: string,
  falseVal: string
) => {
  return (val: unknown): boolean => {
    const s = stringParser(val).toLowerCase();

    if (s === trueVal.toLowerCase()) return true;
    if (s === falseVal.toLowerCase()) return false;
    return false;
  };
};
