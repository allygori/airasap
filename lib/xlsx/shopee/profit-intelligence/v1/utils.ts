export const findValueByLabel = (rows: any[], label: string) => {
  for (const row of rows) {
    if (row.includes(label)) {
      return row[row.length - 1]
    }
  }
}

export const extractFields = (rows: any[], mapping: string) => {
  const result: Record<string, any> = {}

  for (const [key, label] of Object.entries(mapping)) {
    result[key] = findValueByLabel(rows, label as string)
  }

  return result
}