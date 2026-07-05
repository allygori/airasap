import orderReader from './reader';
import orderParser from './parser';

export * from './types';

export const shopeeV1AllOrderParser = (
  buffer: ArrayBuffer
) => {
  const data = orderReader(buffer);
  const parsedData = orderParser(data.rows);

  return parsedData;
};
