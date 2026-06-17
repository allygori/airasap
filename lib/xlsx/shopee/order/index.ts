import orderReader from './reader';
import orderParser from './parser';

export * from './types';

export default function parse(buffer: ArrayBuffer) {
  const data = orderReader(buffer);
  const parsedData = orderParser(data.rows);

  return parsedData;
}
