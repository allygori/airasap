import { SummaryGroup } from '../types';

export default function parseSummarySheet(sData: unknown[][]) {
  const summary_data: SummaryGroup[] = [];
  let inSummarySection = false;
  let currentGroup: SummaryGroup | null = null;

  for (let i = 0; i < sData.length; i++) {
    const row = sData[i];
    if (!row || row.length === 0) continue;

    if (row[0] && typeof row[0] === 'string' && (row[0].includes('Ringkasan Penghasilan') || row[0].includes('1. Total Pendapatan'))) {
      inSummarySection = true;
      if (row[0].includes('1. Total Pendapatan')) {
        const val = row[row.length - 1];
        currentGroup = { name: row[0], value: typeof val === 'number' ? val : 0, subItems: [] };
        summary_data.push(currentGroup);
      }
      continue;
    }

    if (!inSummarySection) continue;

    if (row[0] && typeof row[0] === 'string' && row[0].includes('Nilai Lainnya')) {
      break;
    }

    const firstCol = row[0];
    const secondCol = row[1];
    const lastCol = row[row.length - 1];
    const value = typeof lastCol === 'number' ? lastCol : 0;

    if (firstCol && typeof firstCol === 'string' && firstCol.trim() !== '') {
      currentGroup = { name: firstCol, value: value, subItems: [] };
      summary_data.push(currentGroup);
    } else if (secondCol && typeof secondCol === 'string' && secondCol.trim() !== '' && currentGroup) {
      currentGroup.subItems.push({ name: secondCol, value: value });
    }
  }

  return summary_data;
}