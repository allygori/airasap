import productReader from './reader';
import productParser from './parser';

export default function parse(buffer: ArrayBuffer) {
  const data = productReader(buffer);
  const parsedData = productParser(data.rows);

  return parsedData;
}
