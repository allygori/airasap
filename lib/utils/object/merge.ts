// 1. Mengubah Tuple/Array dari Tipe Data menjadi gabungan objek tunggal (Intersection)
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// 2. Mengambil semua return type dari array fungsi secara dinamis
type AllReturnTypes<
  T extends Array<(...args: any[]) => any>,
> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? R
    : never;
}[number];

// 3. Merekonstruksi objek gabungan secara dinamis berdasarkan key ($match, $group, dll)
type DynamicMergePipeline<
  T extends Array<(...args: any[]) => any>,
> = {
  [Stage in keyof UnionToIntersection<
    AllReturnTypes<T>
  >]: UnionToIntersection<
    Extract<
      AllReturnTypes<T>,
      { [S in Stage]?: any }
    >[Stage]
  >;
};

// 4. Fungsi Runtime Deep Merge Dinamis (Maksimal Depth 3, Finite)
export function mergeObject<
  T extends Array<(...args: any[]) => any>,
>(
  ...funcsWithArgs: {
    [K in keyof T]: [func: T[K], ...args: Parameters<T[K]>];
  }
): DynamicMergePipeline<T> {
  const finalResult: any = {};

  for (const item of funcsWithArgs) {
    const [func, ...args] = item;
    const singleResult = func(...args);

    if (!singleResult || typeof singleResult !== 'object')
      continue;

    // Iterasi setiap stage secara dinamis ($match, $group, $lookup, dll)
    for (const stageKey in singleResult) {
      if (
        Object.prototype.hasOwnProperty.call(
          singleResult,
          stageKey
        )
      ) {
        // Jika stageKey belum ada di hasil akhir, buat objek kosong
        if (!finalResult[stageKey]) {
          finalResult[stageKey] = {};
        }

        const stageContent = singleResult[stageKey];

        if (
          stageContent &&
          typeof stageContent === 'object'
        ) {
          for (const fieldKey in stageContent) {
            if (
              Object.prototype.hasOwnProperty.call(
                stageContent,
                fieldKey
              )
            ) {
              // DEEP MERGE (Level 2/3): Jika fieldKey bentrok dan keduanya berbentuk objek
              if (
                finalResult[stageKey][fieldKey] &&
                typeof finalResult[stageKey][fieldKey] ===
                  'object' &&
                typeof stageContent[fieldKey] === 'object'
              ) {
                finalResult[stageKey][fieldKey] = {
                  ...finalResult[stageKey][fieldKey],
                  ...stageContent[fieldKey],
                };
              } else {
                // Jika tidak bentrok, langsung timpah/masukkan
                finalResult[stageKey][fieldKey] =
                  stageContent[fieldKey];
              }
            }
          }
        }
      }
    }
  }

  return finalResult as DynamicMergePipeline<T>;
}
