# Reports

> Feature guide based on the current reporting routes and aggregation code. Reports are derived views over operational data, not a separate accounting ledger.

## Scope and status

- **[CURRENT]** The Reports module builds aggregate views from Order documents. Its repository explicitly matches both Organization and Store before applying each report pipeline.
- **[CURRENT]** The module does not persist generated report documents; report results are calculated for the requested period and returned to the caller.
- **[CURRENT]** Reports consume imported Order fields such as dates, statuses, fees, line items, product costs, and settlement values. Metric completeness therefore depends on the quality and coverage of those source fields.
- **[CURRENT]** Customer analytics group Order buyer identifiers/usernames for reporting. This does not mean a persistent Customer domain module exists.

## Current report families

The dashboard exposes POST report routes for:

- Sales and financial metrics.
- Product sales/analytics.
- Order performance and status.
- Overview/dashboard metrics.
- Cancellation analysis.
- Customer activity/retention summaries.
- Voucher analysis.
- Operational status and cancellation summaries.

Requests provide `startDate` and `endDate`; supported period modes include fixed calendar periods and an explicit range. Product and Order reports can compare the requested period with a previous equivalent period. Response schemas include report-specific summaries, daily/grouped rows, and metadata; they are not interchangeable across report types.

## Calculation and scope boundaries

- **[CURRENT]** Aggregations read Orders and are tenant-filtered by Organization and Store in `ReportRepository`. A valid context requires both IDs.
- **[CURRENT]** Most report methods obtain timezone from the selected Store (falling back to WIB). `generateSalesReport` currently passes `Asia/Jakarta` directly; do not assume timezone behavior is uniform across every report path.
- **[CURRENT]** Some reports expose data-quality/coverage fields and some return comparison periods. Check the report-specific schema and aggregation before interpreting a metric as available in every report.
- **[TARGET]** Reports may compose cross-domain read models, but should remain read-oriented and should not write Orders or Finance state. See [Module Boundaries](../../docs/architecture/module-boundaries.md).
- **[CURRENT]** These reports are operational analytics based on Order data. Do not present them as finalized Finance statements or as a reconciliation against posted journals unless a specific report is verified to use the Finance ledger.

## Source entry points

- [Report service](../../../modules/reports/report.service.ts), [repository](../../../modules/reports/report.repository.ts), and [response/request schemas](../../../modules/reports/report.schema.ts)
- Aggregations under `modules/reports/overview/`, `orders/`, `product/`, `customer/`, `operation/`, `sales/`, `cancellation/`, and `voucher/`
- Dashboard routes under [`app/api/v1/dashboard/reports/`](../../../app/api/v1/dashboard/reports/route.ts)
- [Orders feature](../orders/README.md), [Business Logic](../../docs/conventions/business-logic.md), and [Module Boundaries](../../docs/architecture/module-boundaries.md)
