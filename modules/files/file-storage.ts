import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

export type FileStorageProvider = 'local' | 'vercel-blob';

type FileStorageLocation = {
  storage_path: string;
  filename: string;
};

type StoreUploadedFileInput = FileStorageLocation & {
  buffer: ArrayBuffer;
  contentType: string;
};

export type StoredFile = FileStorageLocation & {
  storage_provider: FileStorageProvider;
  url: string;
  content_type: string;
};

const getStoragePathParts = (storagePath: string) => {
  if (
    !storagePath ||
    storagePath.startsWith('/') ||
    storagePath.startsWith('\\')
  ) {
    throw new Error('Lokasi penyimpanan file tidak valid.');
  }

  const parts = storagePath.split(/[\\/]+/);
  if (
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        !/^[a-zA-Z0-9_-]+$/.test(part)
    )
  ) {
    throw new Error('Lokasi penyimpanan file tidak valid.');
  }

  return parts;
};

const assertSafeFilename = (filename: string) => {
  if (
    !filename ||
    path.basename(filename) !== filename ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)
  ) {
    throw new Error(
      'Nama file untuk penyimpanan tidak valid.'
    );
  }
};

const getLocalFilePath = ({
  storage_path,
  filename,
}: FileStorageLocation) => {
  const pathParts = getStoragePathParts(storage_path);
  assertSafeFilename(filename);

  const uploadRoot = path.resolve(process.cwd(), '.upload');
  const filePath = path.resolve(
    uploadRoot,
    ...pathParts,
    filename
  );
  const relativePath = path.relative(uploadRoot, filePath);

  if (
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('Lokasi penyimpanan file tidak valid.');
  }

  return {
    filePath,
    normalizedStoragePath: pathParts.join('/'),
    relativeFilePath: path
      .relative(uploadRoot, filePath)
      .split(path.sep)
      .join('/'),
  };
};

export const getFileStorageProvider =
  (): FileStorageProvider => {
    const configuredProvider =
      process.env.FILE_STORAGE_PROVIDER;

    if (
      configuredProvider &&
      configuredProvider !== 'local' &&
      configuredProvider !== 'vercel-blob'
    ) {
      throw new Error(
        'FILE_STORAGE_PROVIDER harus bernilai local atau vercel-blob.'
      );
    }

    const provider: FileStorageProvider =
      configuredProvider === 'local' ||
      configuredProvider === 'vercel-blob'
        ? configuredProvider
        : process.env.VERCEL === '1'
          ? 'vercel-blob'
          : 'local';

    if (
      process.env.VERCEL === '1' &&
      provider === 'local'
    ) {
      throw new Error(
        'Penyimpanan lokal hanya dapat digunakan di luar deployment Vercel.'
      );
    }

    return provider;
  };

export const hasStoredFile = async (
  location: FileStorageLocation & {
    storage_provider: FileStorageProvider;
  }
) => {
  if (location.storage_provider === 'vercel-blob') {
    return true;
  }

  const { filePath } = getLocalFilePath(location);

  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false;
    }

    throw error;
  }
};

export const storeUploadedFile = async ({
  buffer,
  contentType,
  filename,
  storage_path,
}: StoreUploadedFileInput): Promise<StoredFile> => {
  const provider = getFileStorageProvider();
  const pathParts = getStoragePathParts(storage_path);
  assertSafeFilename(filename);
  const normalizedStoragePath = pathParts.join('/');

  if (provider === 'local') {
    const location = getLocalFilePath({
      storage_path: normalizedStoragePath,
      filename,
    });

    await mkdir(path.dirname(location.filePath), {
      recursive: true,
    });
    await writeFile(
      location.filePath,
      Buffer.from(buffer),
      {
        mode: 0o600,
      }
    );

    return {
      storage_provider: provider,
      storage_path: location.normalizedStoragePath,
      filename,
      url: `local://${location.relativeFilePath}`,
      content_type: contentType,
    };
  }

  const blob = await put(
    `${normalizedStoragePath}/${filename}`,
    buffer,
    {
      access: 'private',
      allowOverwrite: true,
      contentType,
    }
  );

  return {
    storage_provider: provider,
    storage_path: normalizedStoragePath,
    filename,
    url: blob.url,
    content_type: blob.contentType,
  };
};
