import * as xlsx from 'xlsx';

const WORKSHEET = 'Penghasilan';
const HEADER_DETECTION_KEY = 'Lihat berdasarkan';

export default function reader(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes(WORKSHEET.toLowerCase())
  );

  if (!sheetName) {
    throw new Error(
      `Format tidak sesuai: worksheet "${WORKSHEET}" di file excel Laporan Dana Dilepas tidak ditemukan.`
    );
  }

  const rows = sheetName
    ? xlsx.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[sheetName],
        { header: 1 }
      )
    : [];

  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      `Kolom ${HEADER_DETECTION_KEY} tidak ditemukan di worksheet "${WORKSHEET}".`
    );
  }

  const headers = rows[headerRowIndex].map((header) =>
    String(header).trim()
  );

  return {
    sheetName: sheetName,
    rows: rows,
    rowLength: rows.length || 0,
    headers: headers,
    headerLength: headers.length || 0,
    headerRowIndex: headerRowIndex,
  };
}
