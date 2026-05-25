export const calculateSHA256 = async (buffer: ArrayBuffer): Promise<string> => {
  // Works seamlessly in modern browsers and Node.js runtimes
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Transform byte arrays into a structured hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const calculateCRC32 = (buffer: ArrayBuffer): string => {
  const uint8 = new Uint8Array(buffer);
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < uint8.length; i++) {
    crc ^= uint8[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}