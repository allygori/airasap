// import { parse } from 'date-fns';
// // import { tz } from 'date-fns/tz'; // Fitur bawaan date-fns v4+
// // import { tz } from 'date-fns/timezone'; // Fitur bawaan date-fns v4+
// import { tz } from '@date-fns/tz';

export const getColIdx = (
  headers: string[],
  name: string
) => {
  return headers.findIndex((h: string) => h === name);
};

// export const stringParser = (val: unknown): string => {
//   if (val === undefined || val === null) return '';
//   return String(val).trim();
// };

// export const numberParser = (val: unknown): number => {
//   if (val === undefined || val === null || val === '')
//     return 0;
//   if (typeof val === 'number') return val;
//   // Shopee excel values can be strings with dots/commas like "130.000" or "130,00"
//   const clean = String(val)
//     .replace(/\./g, '')
//     .replace(/,/g, '.');
//   return parseFloat(clean) || 0;
// };

// // export const dateParser = (val: unknown): Date | null => {
// //   if (!val) return null;
// //   if (val instanceof Date) return val;
// //   if (typeof val === 'string' || typeof val === 'number') {
// //     const d = new Date(val);
// //     return isNaN(d.getTime()) ? null : d;
// //   }
// //   return null;
// // };

// // export const dateParser = (val: unknown): Date | null => {
// //   if (!val) return null;
// //   if (val instanceof Date) return val;

// //   if (typeof val === 'string') {
// //     try {
// //       // Menggunakan opsi inTimeZone agar dibaca sebagai waktu lokal WIB saat di-parse
// //       const parsedLocal = parse(val, 'yyyy-MM-dd HH:mm', new Date(), {
// //         inTimeZone: tz('Asia/Jakarta')
// //       });

// //       return isNaN(parsedLocal.getTime()) ? null : parsedLocal;
// //     } catch {
// //       return null;
// //     }
// //   }

// //   if (typeof val === 'number') {
// //     const d = new Date(val);
// //     return isNaN(d.getTime()) ? null : d;
// //   }

// //   return null;
// // };

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

// // usage: booleanParser('TRUE', 'FALSE)
// export const booleanParser = (
//   trueVal: string,
//   falseVal: string
// ) => {
//   return (val: unknown): boolean => {
//     const s = stringParser(val).toLowerCase();

//     if (s === trueVal.toLowerCase()) return true;
//     if (s === falseVal.toLowerCase()) return false;
//     return false;
//   };
// };

export const makeProductKey = (
  productId: string,
  variationName?: string
): string => {
  const variation = (variationName || '').trim();
  return variation
    ? `${productId}::${variation}`
    : productId;
};
