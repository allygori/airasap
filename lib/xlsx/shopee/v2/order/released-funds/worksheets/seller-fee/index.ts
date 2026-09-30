import reader from './reader';
import parser from './parser';

export * from './reader';
export * from './parser';
export * from './map';
export * from './types';

export default function parse(buffer: ArrayBuffer) {
  const { rows, headers, headerRowIndex } = reader(buffer);
  const result = parser(rows, headers, headerRowIndex);

  return result;
}
