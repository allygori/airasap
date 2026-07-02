// 1. Tipe bantu untuk deep merge objek dengan struktur $match dinamis
type DeepIntersect<T> = T extends any ? T : never;
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MergeMongoFilters<
  T extends Array<(...args: any[]) => any>,
> = {
  $match: UnionToIntersection<
    {
      [K in keyof T]: T[K] extends (...args: any[]) => {
        $match: infer M;
      }
        ? M
        : never;
    }[number]
  >;
};

// 2. Fungsi runtime dengan logika deep merge (Max depth 3 / aman untuk $match)
export function mergeFilters<
  T extends Array<(...args: any[]) => any>,
>(
  ...funcsWithArgs: {
    [K in keyof T]: [func: T[K], ...args: Parameters<T[K]>];
  }
): MergeMongoFilters<T> {
  const finalResult = { $match: {} } as any;

  for (const item of funcsWithArgs) {
    const [func, ...args] = item;
    const singleResult = func(...args);

    if (
      singleResult &&
      typeof singleResult === 'object' &&
      '$match' in singleResult
    ) {
      const matchObj = singleResult.$match;

      for (const key in matchObj) {
        if (
          Object.prototype.hasOwnProperty.call(
            matchObj,
            key
          )
        ) {
          // Jika key sudah ada (misal ada 2 filter di field yang sama), gabungkan isinya
          if (
            finalResult.$match[key] &&
            typeof matchObj[key] === 'object'
          ) {
            finalResult.$match[key] = {
              ...finalResult.$match[key],
              ...matchObj[key],
            };
          } else {
            // Jika belum ada, langsung masukkan
            finalResult.$match[key] = matchObj[key];
          }
        }
      }
    }
  }

  return finalResult;
}
