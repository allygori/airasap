// export const FILE_TYPES = [
//   'image',
//   'document',
//   'audio',
//   'video',
//   'archive',
//   'executable',
//   'other',
// ];

export const FILE_TYPES = {
  IMAGE: {
    label: 'Image',
    value: 'image',
  },
  DOC: {
    label: 'Document',
    value: 'document',
  },
  AUDIO: {
    label: 'Audio',
    value: 'audio',
  },
  VIDEO: {
    label: 'Video',
    value: 'video',
  },
  ARCHIVE: {
    label: 'Archive',
    value: 'archive',
  },
  EXE: {
    label: 'Executable',
    value: 'executable',
  },
  OTHER: {
    label: 'Other',
    value: 'other',
  },
};

export const FILE_TYPES_KV = {
  IMAGE: 'image',
  DOC: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  ARCHIVE: 'archive',
  EXE: 'executable',
  OTHER: 'other',
};

export const STORAGE_PROVIDERS = {
  R2: {
    label: 'Cloudflare R2',
    value: 'cloudflare-r2',
  },
  VERCEL: {
    label: 'Vercel Blob',
    value: 'vercel-blob',
  },
  S3: {
    label: 'AWS S3',
    value: 'aws-s3',
  },
  LOCAL: {
    label: 'Local',
    value: 'local',
  },
};

export const STORAGE_PROVIDERS_KV = {
  R2: 'cloudflare-r2',
  VERCEL: 'vercel-blob',
  S3: 'aws-s3',
  LOCAL: 'local',
};
