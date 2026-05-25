export  const getColIdx = (headers: string[], name: string) => {
  return headers.findIndex((h: string) => h === name);
}
