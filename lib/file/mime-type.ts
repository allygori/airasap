export const detectMimeTypeByAB = (
  buffer: ArrayBuffer
): string => {
  const uint8 = new Uint8Array(buffer);

  // Need at least 4 bytes to check standard signatures
  if (uint8.length < 4) return 'application/octet-stream';

  // Read the first 4 bytes and convert them into a Hexadecimal string
  const bytes = Array.from(uint8.subarray(0, 4));
  const hexSignature = bytes
    .map((b) =>
      b.toString(16).padStart(2, '0').toUpperCase()
    )
    .join('');

  // Match the magic numbers against common file formats
  switch (hexSignature) {
    case '504B0304':
    case '504B0506':
    case '504B0708':
      // ⚠️ Note: .xlsx, .docx, and standard .zip all share the same OpenXML standard container format.
      // For accurate distinction without heavy extraction libraries, default to the vendor-specific MIME type
      // or return 'application/zip' if it's a standard compressed archive.
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '89504E47':
      return 'image/png';
    case 'FFD8FF00':
    case 'FFD8FFE0':
    case 'FFD8FFE1':
      return 'image/jpeg';
    case '25504446':
      return 'application/pdf';
    case '47494638':
      return 'image/gif';
    default:
      return 'application/octet-stream'; // Fallback for unrecognized formats
  }
};
