# Shared Library Catalog

This guide helps contributors find and reuse existing technical helpers under `lib/`. It records their current public entry points and behavior so new code does not introduce a duplicate with different semantics.

## Scope and use

- **[CURRENT]** Concern-oriented helpers live at the `lib/` root, including `date/`, `number/`, `string/`, and `boolean/`.
- **[CURRENT]** The audited tree has no `lib/utils/` or `lib/object/` public helper folder. Do not recreate either as a general-purpose dumping ground; first establish a cohesive concern and verify that its behavior is genuinely shared.
- **[TARGET]** For a concern directory with an `index.ts`, new consumers should import supported exports through that directory's entry point. See [TypeScript conventions](../conventions/typescript.md). Existing implementation-subpath imports do not need to be rewritten as unrelated cleanup.
- Keep business rules in their owning `modules/` domain. A helper belongs in `lib/` only when its behavior is technical and useful across domains.
- Treat source and tests as the implementation contract. This catalog is a discovery aid, not a replacement for reading the helper before use.
- API, authentication, database, and tenant-context helpers have dedicated guidance in the [architecture overview](./overview.md), [identity and access control](./identity-and-access-control.md), and [API and data access conventions](../conventions/api-and-data-access.md).

## Date — `lib/date/`

Public entry point: `@/lib/date` (`lib/date/index.ts`).

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `formatDate(value?)` | Compact date labels in the UI. | Indonesian locale; day, abbreviated month, and year. Missing or invalid values return `-`. Formatting uses the runtime timezone. |
| `formatMediumDate(value)` | Indonesian medium-style date labels. | Uses the runtime timezone. |
| `formatUtcMediumDate(value)` | Medium-style labels that must use UTC. | Same Indonesian medium style, pinned to UTC. |
| `fnsFormatDate(value?, pattern?, locale?)` | Custom date-fns patterns. | Default pattern is `yyyy-MM-dd HH:mm`; optional date-fns locale controls localized month/day names. Missing or invalid values return `-`. |
| `parseExcelDate(pattern?, timeZone?)` | Parse a value from an Excel cell to `Date \| null`. | Returns a parser function. Text uses the supplied pattern and timezone; timezone defaults to `Asia/Jakarta`. Numeric Excel serials retain UTC epoch conversion regardless of the timezone argument. Blank or invalid text/numeric values return `null`; a `Date` input is returned directly, even if that `Date` is invalid. |
| `parseExcelDateToISOString(pattern?, timeZone?)` | Parse an Excel cell to an ISO string. | Same parsing rules as `parseExcelDate`; returns `string \| null`, and invalid `Date` values return `null`. |
| `getDatesBetween(start, end)` | Enumerate inclusive calendar dates. | Uses the host runtime's local timezone and normalizes cloned dates to local midnight. It is not a timezone-aware reporting-range helper. |
| `getReportDateRange(start, end, timezone)` | Convert inclusive calendar dates to report query boundaries. | Uses the supplied store `TimeZone`; returns `startDate` and `endDate` as `Date` values representing the inclusive start and end of those local days. |

Do not substitute one formatter for another based only on the word “date”: output style, locale, invalid-value handling, and timezone behavior differ.

## Number and money — `lib/number/`

Public entry point: `@/lib/number` (`lib/number/index.ts`). It re-exports money helpers from `lib/number/money/index.ts`.

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `formatNumber(value?, maximumFractionDigits?)` | Indonesian-locale decimal display. | Defaults to at most one fraction digit. Missing or falsy values format as zero. |
| `formatPercent(value?, maximumFractionDigits?)` | Display a ratio as a localized percentage. | Uses `Intl.NumberFormat` percent style; pass a ratio such as `0.15` for `15%`. Defaults to at most one fraction digit; missing or falsy values format as zero. |
| `round(value?, precision?)` | Round a number to decimal precision. | Defaults to two digits. Returns `null` for `undefined` or `NaN`; otherwise returns a number. |
| `parseIndonesianNumber(value)` | Parse Indonesian-formatted numeric text, especially imported values. | Removes periods as thousands separators and treats commas as decimal separators. Nullish, empty, or unparseable values become `0`. This is not a locale-neutral parser. |
| `parseMoney(value)` | Compatibility alias for `parseIndonesianNumber`. | Prefer the explicit `parseIndonesianNumber` name in new code. |
| `formatCurrency(value, currency?)` | Format a currency code with Indonesian locale. | Defaults to `IDR`; uses zero fractional digits. |
| `formatIDR(value, options?)` | Format Indonesian rupiah for existing UI/reporting use. | Uses zero fractional digits. `showSymbol: false` omits the currency part. With the currency symbol enabled, a finite `fallback` is used for a nullish runtime value; otherwise that case returns `-`. |

`formatCurrency` and `formatIDR` overlap for IDR but have different contracts: use `formatCurrency` for a selected currency code and `formatIDR` when the IDR-specific options are needed.

## String — `lib/string/`

Public entry point: `@/lib/string` (`lib/string/index.ts`).

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `escapeRegex(value)` | Insert literal user/search text into a regular-expression pattern. | Escapes regular-expression metacharacters. It does not validate or limit a search expression by itself. |
| `toTrimmedString(value)` | Normalize imported or unknown scalar values to trimmed text. | Converts non-nullish values with `String(value).trim()`; `null` and `undefined` become `''`. |

## Boolean — `lib/boolean/`

Public entry point: `@/lib/boolean` (`lib/boolean/index.ts`).

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `createBooleanParser(trueValue, falseValue)` | Build a parser for a source-specific pair of boolean tokens, such as spreadsheet `Y`/`N` columns. | Input is converted with `toTrimmedString`, then compared case-insensitively. The configured true token returns `true`; the false token and every unrecognized/empty value return `false`. This is a fallback parser, not validation that rejects unknown values. |

## File — `lib/file/`

Public entry point: `@/lib/file` (`lib/file/index.ts`).

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `calculateSHA256(buffer)` | Content-derived SHA-256 digest. | Accepts `ArrayBuffer`; asynchronously returns lowercase hexadecimal text. |
| `calculateCRC32(buffer)` | CRC-32 checksum used by current file workflows. | Accepts `ArrayBuffer`; returns lowercase hexadecimal text padded to eight characters. |
| `detectMimeTypeByAB(buffer)` | Recognize a small set of file signatures. | Checks leading bytes for XLSX/ZIP, PNG, JPEG, PDF, and GIF; unknown or short input returns `application/octet-stream`. ZIP signatures are reported as XLSX, so this helper does not distinguish XLSX from DOCX or arbitrary ZIP files and is not a security validation step. |
| `size(buffer)` | Read an `ArrayBuffer` byte length. | Returns `buffer.byteLength`. The legacy standalone Profit Intelligence formatter uses it to populate file metadata. |

The file service actively uses SHA-256 and CRC-32. MIME detection and byte-size metadata are used by the legacy standalone Profit Intelligence formatter. Existing direct subpath imports remain untouched; new imports should use the public entry point when it exports the required symbol.

## UI class names — `lib/ui/`

Public entry point: `@/lib/ui` (`lib/ui/index.ts`).

| Export | Use | Contract and behavior |
| --- | --- | --- |
| `cn(...inputs)` | Compose conditional class values and merge conflicting Tailwind classes. | Combines `clsx` with `tailwind-merge`; keep this as UI-only class composition, without domain logic. |

## Product SKU generator — `lib/sku/`

**[CURRENT]** `SkuGenerator` is imported and instantiated by `modules/products/product.service.ts`. Its current placement and use are recorded here so it is not mistaken for an unused helper.

The class accepts a `storeCode`, and exposes `generateParentSKU()` and `generateChildSKU(parentSKU)`. The current implementation generates random uppercase alphanumeric segments; older counter/Base36 logic remains commented in the source and is not the active behavior. This is Products-specific behavior, not a general-purpose sequence or ID generator. Do not infer deterministic sequencing or a cross-domain contract from the class name.

## Spreadsheet imports — `lib/xlsx/`

**[CURRENT]** This tree contains Shopee workbook readers and parsers organized by report and export version. Orders and Products use these parsers to interpret provider-specific columns and rows. Scalar cell conversions should reuse the helpers above where their contracts match; header maps, report layouts, and provider-specific row transformations remain with their spreadsheet parser.

For scalar conversions in XLSX maps, use the relevant shared factory/helper, for example `toTrimmedString`, `parseIndonesianNumber`, `createBooleanParser('Y', 'N')`, or `parseExcelDate('yyyy-MM-dd HH:mm')`. These helpers do not replace source-specific header matching or row parsing.

The parser tree has known duplication and cleanup candidates and is being handled separately. This guide therefore does not declare its internal readers, maps, or matching helpers to be stable shared APIs. Do not create a general plugin/parser framework from the current Shopee-only implementation.

## Choosing or adding a helper

1. Search this catalog and the relevant `lib/<concern>/index.ts` before writing a new helper.
2. Compare behavior, not just names. Locale, timezone, rounding, invalid-value fallback, and matching strategy are part of a helper's contract.
3. Reuse an existing helper when its contract fits. If the behavior is domain-specific, keep it in its owning module or source-specific parser.
4. Add new concern-specific shared code under a cohesive `lib/<concern>/` directory and export the intended public API from its `index.ts`.
5. Update this catalog when a shared API is added, removed, renamed, or its behavior changes. Do not rewrite unrelated existing subpath imports as part of a documentation update.
