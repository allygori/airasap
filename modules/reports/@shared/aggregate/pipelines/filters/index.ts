export * from './tenant-filter';
export * from './date-filter';
export * from './platform-filter';
export * from './order-status-filter';

// 1. Tipe bantu untuk mengubah Tuple dari objek menjadi satu objek besar (Intersection)
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// 2. Tipe utama untuk mengekstrak return value dari array fungsi dan menggabungkannya
type MergeFunctionResults<
  T extends Array<(...args: any[]) => any>,
> = UnionToIntersection<
  {
    [K in keyof T]: T[K] extends (...args: any[]) => infer R
      ? R
      : never;
  }[number]
>;

/**
 *
 * @param funcsWithArgs
 * @returns
 * @usage
 *
 * const mergedResult = mergeFilters(
 *  [getPlatform, 'Shopee', 101], // Argumen divalidasi ketat oleh TS
 *  [getStatus, true],
 *  [getMetadata]
 * );
 */
export const mergeFilters = <
  T extends Array<(...args: any[]) => any>,
>(
  // Menggunakan rest parameters agar argumen fungsi sangat dinamis
  ...funcsWithArgs: {
    [K in keyof T]: [func: T[K], ...args: Parameters<T[K]>];
  }
): MergeFunctionResults<T> => {
  const result = {};

  for (const item of funcsWithArgs) {
    const [func, ...args] = item;
    Object.assign(result, func(...args));
  }

  return result as MergeFunctionResults<T>;
};
