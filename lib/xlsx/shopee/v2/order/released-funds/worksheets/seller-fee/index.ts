import reader from './reader';
import parser from './parser';
// import { saveJson } from '@/lib/file/save-json';

export * from './reader';
export * from './parser';
export * from './map';
export * from './types';

export default function parse(buffer: ArrayBuffer) {
  const { rows, headers, headerRowIndex } = reader(buffer);
  const result = parser(rows, headers, headerRowIndex);

  // saveJson(
  //   '.data/json-logs/debug-released-funds-parsed-seller-fee-v2.json',
  //   result
  // );

  return result;
}
