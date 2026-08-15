import Fuse from 'fuse.js';

export const getColIdx = (
  headers: string[],
  name: string
) => {
  return headers.findIndex((h: string) => h === name);
};

export const getColIdxWithFallback = (
  headers: string[],
  name: string
) => {
  // console.log(
  //   `header name: ${name}`,
  //   JSON.stringify(headers, null, 2)
  // );
  let colIdx = headers.findIndex((h: string) => h === name);

  if (colIdx === -1) {
    colIdx = headers.findIndex((h) => h.includes(name));

    if (colIdx === -1) {
      const fuseData = new Fuse(headers, {
        threshold: 0.3,
        includeScore: true,
      });

      const result = fuseData.search(name);

      if (result.length > 0) {
        colIdx = headers.findIndex(
          (h: string) => h === result[0].item
        );
      }
    }
  }

  return colIdx;
};

export const makeProductKey = (
  productId: string,
  variationName?: string
): string => {
  const variation = (variationName || '').trim();
  return variation
    ? `${productId}::${variation}`
    : productId;
};
