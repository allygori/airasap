# Files

> Feature guide based on the current File module and its known callers. File metadata management, blob storage, and file parsing are separate responsibilities in the current code.

## Scope and status

- **[CURRENT]** `modules/files` stores tenant-scoped metadata such as original name, MIME type, file type, size, URL, checksum, storage provider/path, uploader, and deletion timestamp.
- **[CURRENT]** The dashboard `/api/v1/dashboard/files` collection route lists metadata and creates a metadata record. It is not a generic multipart upload/download API.
- **[CURRENT]** Upload helpers in `FileService` use Vercel Blob with private access and create metadata records. Provider constants list other providers, but this service's active upload implementation uses Vercel Blob directly; a pluggable storage adapter is not established.
- **[CURRENT]** XLSX parsing is owned by format-specific utilities in `lib/xlsx/` and feature import workflows, not by the File metadata model.

## Current upload and usage flows

- Orders mass uploads call the File service to retain source-file metadata and then parse the uploaded Excel buffer in Orders.
- Completed-Order and released-funds enrichment flows retain source-file references in Order enrichment metadata.
- Products mass upload also stores a source file and parses its Shopee product export in Products.

The helper methods compute SHA-256-derived names and CRC32 checksums. They query for an existing record and then persist a filename with an extension; current code should not be treated as a guaranteed, race-safe deduplication contract.

## Lifecycle and limitations

- **[CURRENT]** The File repository applies tenant filters and supports metadata soft-delete/restore operations. The File service's `remove` and `restore` methods change metadata; they do not delete or restore the remote blob.
- **[CURRENT]** No item-level File route was found under the versioned dashboard File API. The collection route currently exposes GET and POST only.
- **[CURRENT]** `FileService.update` is marked TODO and has no implemented update behavior. Do not assume metadata updates are supported.
- **[OPEN]** Storage-path ownership, provider abstraction, tenant/store scoping of uploaded blobs, retention/deletion policy, and upload-size policy should be made explicit before broadening this into a general-purpose storage capability.
- **[TARGET]** Feature modules should own format parsing and business interpretation. File should provide a clear storage/metadata contract rather than accumulating marketplace parsers or domain-specific import rules.

## Source entry points

- [File service](../../../modules/files/file.service.ts), [repository](../../../modules/files/file.repository.ts), [model](../../../modules/files/file.model.ts), and [schema](../../../modules/files/file.schema.ts)
- [File collection API](../../../app/api/v1/dashboard/files/route.ts)
- [Orders import route](../../../app/api/v1/dashboard/orders/mass-upload/route.ts), [Products import route](../../../app/api/v1/dashboard/products/mass-upload/route.ts), and XLSX utilities under `lib/xlsx/`
- [Orders feature](../orders/README.md) and [Products feature](../products/README.md)
