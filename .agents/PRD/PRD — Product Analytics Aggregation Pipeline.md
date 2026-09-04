# PRD — Product Analytics Aggregation Pipeline

## 1. Context

We have a Next.js 16 application using TypeScript and MongoDB/Mongoose.

The application imports and stores Shopee Seller Center order/financial data.

The primary collection is `orders`.

An order contains order-level information and an `items` array. Each item contains product information and financial metrics such as sales, quantity, COGS/product cost, profit, and potentially Shopee/platform-related costs.

The application needs a reusable MongoDB aggregation pipeline for **Product Analytics**.

The primary use case is a dashboard where users select a date range, usually a monthly period, and the system returns aggregated metrics grouped by product/variation.

---

# 2. Objective

Build a maintainable MongoDB aggregation pipeline that transforms:

```text
orders
  → order-level documents
  → order items
  → normalized item-level financial metrics
  → product-level aggregation
  → product contribution/profitability metrics
  → dashboard-ready result
```

The final grain of the main product dataset must be:

> **1 document = 1 product/variation within the selected date range**

The pipeline should be designed as reusable pipeline stages rather than one large monolithic aggregation function.

---

# 3. Primary Business Questions

The Product Analytics dashboard should help answer:

1. Which products generate the most sales?
2. Which products generate the most profit?
3. Which products have the highest/lowest profit margin?
4. Which products contribute most to total revenue?
5. Which products contribute most to total profit?
6. Which products sell the most units?
7. Which products generate the most profit per unit?
8. Is a high-revenue product actually profitable?
9. Is the business overly dependent on a small number of products?
10. Which products are revenue drivers?
11. Which products are profit drivers?
12. Which products are weak performers?
13. How are product sales/profit changing compared with a previous period?

The system should be designed so additional metrics can be added later without restructuring the entire pipeline.

---

# 4. Important Data Grain

The aggregation has several explicit grains.

### Grain 1 — Order

One MongoDB document:

```text
1 order
```

### Grain 2 — Order Item

After:

```js
{ $unwind: "$items" }
```

the grain becomes:

```text
1 order item
```

### Grain 3 — Product/Variation

After grouping:

```text
1 product/variation for the selected date range
```

The pipeline must clearly preserve this distinction.

Do not accidentally calculate order-level metrics after `$unwind` in a way that causes them to be counted multiple times.

---

# 5. Pipeline Architecture

The pipeline should conceptually follow this sequence:

```text
$match
  ↓
order normalization
  ↓
$unwind items
  ↓
item normalization
  ↓
item financial calculations
  ↓
order-level cost allocation
  ↓
product grouping
  ↓
product-level derived metrics
  ↓
total/contribution calculations
  ↓
ranking/classification
  ↓
final projection
  ↓
sort / pagination if required
```

---

# 6. Stage 1 — Filter Orders

The first stage must filter orders by the requested date range.

Conceptually:

```ts
{
  $match: {
    order_date: {
      $gte: startDate,
      $lt: endDate
    }
  }
}
```

Use half-open intervals:

```text
[startDate, endDate)
```

Do not use `$lte` for `endDate` unless the existing application architecture explicitly requires it.

The pipeline must also support additional tenant/store filters when applicable, for example:

```ts
organization_id
store_id
```

The exact field names must follow the existing codebase.

---

# 7. Stage 2 — Order Normalization

Create a normalized representation of order-level data.

Do not unnecessarily duplicate fields.

The purpose of this stage is to make order-level metrics available before `$unwind`.

Potential normalized fields include:

```text
order_id
order_date
store_id
organization_id

order_sales
order_discount
order_platform_fee
order_shipping_cost
order_other_cost
```

Only use fields that actually exist in the current schema.

IMPORTANT:

Before implementing assumptions about the schema, inspect the existing:

- `Order` schema/model
- `OrderItem` schema/model if present
- import/parser logic
- Shopee Excel mapping
- existing sales/profit aggregation pipelines
- existing TypeScript types

Do not invent field names if equivalent fields already exist.

---

# 8. Stage 3 — Unwind Items

Use:

```js
{
  $unwind: {
    path: "$items",
    preserveNullAndEmptyArrays: false
  }
}
```

After this stage:

```text
1 MongoDB document = 1 order item
```

The order-level identifiers must remain available.

---

# 9. Stage 4 — Item/Product Normalization

Create a canonical item-level representation.

Conceptually:

```ts
{
  order_id,
  order_date,

  product_id,
  product_name,

  variation_id,
  variation_name,

  quantity,

  gross_sales,
  discount,
  net_sales,

  cogs,

  platform_fee,
  shipping_cost,
  other_variable_cost,

  profit
}
```

Do not blindly create all of these fields if the underlying schema does not contain them.

Map existing Shopee fields into canonical business concepts.

The analytics layer should not be tightly coupled to Shopee's raw column naming.

---

# 10. Stage 5 — Item Financial Metrics

Calculate normalized financial metrics at item level.

The expected conceptual formulas are:

```text
Gross Sales
= unit price × quantity
```

```text
Net Sales
= Gross Sales - Discounts
```

```text
Gross Profit
= Net Sales - COGS
```

```text
Net Profit
= Gross Profit
  - Platform Fees
  - Shipping Cost
  - Other Variable Costs
```

However:

**Use the existing application's definition of `sales`, `profit`, `COGS`, and Shopee fees if these are already calculated during import.**

Do not silently redefine existing business metrics.

If the existing `profit` field already represents net profit after all relevant costs, use it consistently and document its meaning.

---

# 11. Stage 6 — Order-Level Cost Allocation

Some costs may exist at order level rather than item level.

Examples:

```text
platform fee
shipping subsidy
shipping cost
order-level voucher
other order-level costs
```

These cannot simply be summed after `$unwind`, because that would multiply the same order-level cost by the number of items.

If order-level costs need to be attributed to products, allocate them proportionally.

Default allocation basis:

```text
item net sales / total order net sales
```

Formula:

```text
allocated_cost
=
item_net_sales
/
order_net_sales
×
order_level_cost
```

Example:

```text
Order total net sales = 150,000

Product A = 100,000
Product B = 50,000

Order platform fee = 15,000

Product A allocated fee = 10,000
Product B allocated fee = 5,000
```

Important:

- Prevent division by zero.
- Handle orders with zero/negative net sales safely.
- Do not double-count costs that are already stored at item level.
- Follow existing application/business logic if an allocation method already exists.

If the existing schema stores product-level profit after all relevant costs, do not allocate the same costs again.

---

# 12. Stage 7 — Group by Product/Variation

Group items by the application's canonical product identity.

Preferred conceptual key:

```ts
{
  product_id,
  variation_id
}
```

If the existing application identifies a Shopee SKU using something such as:

```text
shopee_product_id::{variationName}
```

follow the existing canonical identity instead of creating a second competing identity system.

The result should contain aggregated values such as:

```text
quantity
orders
gross_sales
discount
net_sales
cogs
gross_profit
platform_fee
shipping_cost
other_cost
net_profit
```

---

# 13. Order Count

Be careful when calculating orders.

After `$unwind`, this is incorrect:

```js
{
  $sum: 1
}
```

for order count because one order may contain multiple items of the same or different products.

Use a distinct order identifier.

Conceptually:

```text
orders
= number of distinct order_id values
```

Depending on the grouping architecture, use an appropriate `$addToSet`, pre-grouping, or another strategy.

The final product metric should represent:

> Number of unique orders containing the product.

---

# 14. Stage 8 — Product Metrics

After product grouping, calculate:

## Sales

```text
Gross Sales
Discount
Net Sales
```

## Units

```text
Units Sold
```

## Costs

```text
COGS
Platform Fees
Shipping Cost
Other Variable Costs
```

## Profitability

```text
Gross Profit
Net Profit
Gross Margin
Net Margin
Profit per Unit
```

Formulas:

```text
Gross Margin
= Gross Profit / Net Sales
```

```text
Net Margin
= Net Profit / Net Sales
```

```text
Profit per Unit
= Net Profit / Units Sold
```

All divisions must safely handle zero denominators.

Return `0` or `null` according to the existing project's conventions. Do not produce `Infinity` or `NaN`.

---

# 15. Stage 9 — Contribution Metrics

Calculate contribution against the total selected-period product population.

Required metrics:

```text
Sales Contribution
Profit Contribution
Unit Contribution
Order Contribution
```

Formulas:

```text
Sales Contribution
= Product Net Sales / Total Net Sales
```

```text
Profit Contribution
= Product Net Profit / Total Net Profit
```

```text
Unit Contribution
= Product Units / Total Units
```

```text
Order Contribution
= Product Orders / Total Orders
```

Use MongoDB aggregation features such as `$setWindowFields` where appropriate.

Alternative:

Use `$facet` or another architecture if it better fits the existing MongoDB version and codebase.

Do not perform expensive application-side aggregation merely to calculate contribution if MongoDB can calculate it efficiently.

---

# 16. Stage 10 — Ranking

Add product rankings.

At minimum:

```text
sales_rank
profit_rank
units_rank
```

Possible ranking strategy:

```text
1 = highest value
```

For example:

```text
Product A
sales_rank = 1

Product B
sales_rank = 2
```

Use MongoDB-native functionality where practical.

---

# 17. Stage 11 — Product Classification

Create a simple classification layer.

Initial conceptual categories:

```text
Star
Revenue Driver
Profit Driver
Weak
```

Do not hard-code arbitrary business thresholds without documenting them.

Prefer thresholds based on:

- contribution
- margin
- ranking
- configurable parameters

Example conceptual model:

```text
High Sales + High Profit
→ Star

High Sales + Low Profit
→ Revenue Driver

Low Sales + High Profit
→ Profit Driver

Low Sales + Low Profit
→ Weak
```

The exact classification algorithm should be implemented separately from the base aggregation so it can be changed later.

---

# 18. Stage 12 — Product Velocity

For date-range analysis, calculate:

```text
sales_per_day
units_per_day
orders_per_day
profit_per_day
```

Calculate the number of days in the selected date range correctly.

Do not assume every month has 30 days.

For example:

```text
sales_per_day
= net_sales / selected_period_days
```

---

# 19. Growth / Comparison Architecture

Growth metrics should be designed as a separate optional pipeline layer rather than making the base product aggregation unnecessarily complex.

Potential metrics:

```text
sales_growth
profit_growth
units_growth
orders_growth
margin_change
```

The comparison period should normally be the immediately preceding equivalent period.

Example:

```text
Selected:
June 1 – June 30

Comparison:
May 2 – May 31
```

or another appropriate period strategy determined by the product requirements.

Do not implement arbitrary comparison logic without documenting it.

If the current dashboard only requires a single period, keep growth calculation out of the initial implementation.

---

# 20. Dashboard Summary

The product analytics endpoint should eventually support a summary object containing:

```text
total_orders
total_units
gross_sales
discount
net_sales
cogs
gross_profit
platform_fee
shipping_cost
other_variable_cost
net_profit
gross_margin
net_margin
```

And a product dataset containing:

```text
product_id
product_name
variation_id
variation_name

orders
units

gross_sales
discount
net_sales

cogs
gross_profit

platform_fee
shipping_cost
other_variable_cost
net_profit

gross_margin
net_margin
profit_per_unit

sales_contribution
profit_contribution
unit_contribution
order_contribution

sales_rank
profit_rank
units_rank

sales_per_day
units_per_day
profit_per_day

classification
```

Only expose fields that can be calculated reliably from the actual schema.

---

# 21. Recommended MongoDB Pipeline Structure

Do NOT create one giant pipeline file.

Use composable stages/functions.

Conceptual structure:

```text
pipelines/
│
├── shared/
│   ├── match-orders.ts
│   ├── normalize-order.ts
│   ├── unwind-items.ts
│   ├── normalize-item.ts
│   ├── calculate-item-metrics.ts
│   └── allocate-order-costs.ts
│
├── product/
│   ├── group-by-product.ts
│   ├── calculate-metrics.ts
│   ├── calculate-contribution.ts
│   ├── calculate-rank.ts
│   ├── classify-product.ts
│   └── product-analytics.ts
│
└── shared/
    └── types.ts
```

If the existing project already has a different pipeline architecture, adapt to it rather than blindly creating this structure.

---

# 22. Pipeline Composition

The final product pipeline should conceptually look like:

```ts
const pipeline = [
  ...matchOrders(filters),
  ...normalizeOrders(),
  ...unwindItems(),
  ...normalizeItems(),
  ...calculateItemMetrics(),
  ...allocateOrderCosts(),
  ...groupProducts(),
  ...calculateProductMetrics(),
  ...calculateContribution(),
  ...calculateProductRank(),
  ...classifyProducts(),
  ...projectProductAnalytics(),
  ...sortProducts(),
];
```

The exact implementation may differ.

The important requirement is:

> Each business transformation should be isolated into a composable and testable unit.

---

# 23. Do Not Over-Abstraction

Do not create an abstraction merely for every `$set`.

Bad:

```text
withFoo()
withBar()
withBaz()
withQux()
```

when those functions provide no meaningful reuse.

Prefer abstractions around meaningful business transformations:

```text
matchOrders()
normalizeItems()
allocateOrderCosts()
groupProducts()
calculateContribution()
calculateProductMetrics()
```

The code should remain readable to a developer familiar with MongoDB aggregation.

---

# 24. TypeScript Requirements

Use the project's existing TypeScript conventions.

If the project prefers:

```ts
type
```

over:

```ts
interface
```

continue using `type`.

Use explicit types for:

```text
ProductAnalyticsFilters
ProductAnalyticsResult
ProductAnalyticsSummary
ProductAnalyticsRow
```

Do not use `any` unless there is a genuine unavoidable boundary.

---

# 25. Filter Type

Create or reuse a filter type conceptually similar to:

```ts
type ProductAnalyticsFilters = {
  startDate: Date;
  endDate: Date;

  organizationId?: string;
  storeId?: string;

  productId?: string;
  categoryId?: string;
};
```

Only include filters that already make sense in the existing application.

Do not introduce unnecessary filters.

---

# 26. Performance Requirements

This pipeline will run against potentially large order datasets.

Therefore:

1. `$match` must happen as early as possible.
2. Date filtering must be index-friendly.
3. Tenant/store filtering must happen before `$unwind`.
4. Avoid unnecessary `$lookup`.
5. Avoid `$project` stages that carry huge unused fields through the pipeline.
6. Avoid repeated `$unwind`.
7. Avoid application-side aggregation for large datasets.
8. Use `$setWindowFields` only when appropriate and supported.
9. Check the generated pipeline using MongoDB `explain()` where practical.
10. Do not introduce N+1 database queries.

---

# 27. Index Requirements

Inspect existing indexes first.

If appropriate, recommend an index around:

```text
organization_id
store_id
order_date
```

The exact index order must be based on actual query patterns and existing indexes.

Do not blindly add indexes without inspecting the current schema.

---

# 28. Testing Requirements

Create unit/integration tests for the aggregation logic.

At minimum test:

### Date filtering

```text
order before start date
order exactly at start date
order exactly at end date
order after end date
```

Expected semantics:

```text
startDate <= orderDate < endDate
```

### Multiple items

One order:

```text
Product A
Product B
Product C
```

Verify:

- sales are correct
- units are correct
- order count is not multiplied
- order-level costs are not multiplied

### Multiple orders

Verify grouping by product.

### Zero sales

Verify no division-by-zero problems.

### Zero quantity

Verify no invalid metrics.

### Order-level costs

Verify allocation is correct.

### Contribution

Verify:

```text
sum(sales_contribution) ≈ 100%
```

and:

```text
sum(unit_contribution) ≈ 100%
```

For profit contribution, be careful with zero/negative total profit.

### Refund/cancellation

If the schema supports them, verify the business rules for:

```text
cancelled orders
returned orders
refunded items
```

Do not invent refund behavior. Inspect existing application logic first.

---

# 29. Important Accounting/Business Rules

Before implementation, inspect the current codebase and determine:

1. What exactly does `sales` mean?
2. What exactly does `profit` mean?
3. Is COGS stored per unit or already multiplied by quantity?
4. Are Shopee fees stored at order or item level?
5. Are discounts seller-funded or platform-funded?
6. Are shipping costs seller costs or already included in profit?
7. How are refunds represented?
8. How are cancelled orders represented?
9. How are free/bonus items represented?
10. Is product identity based on product ID, variation ID, SKU, or a composite key?

Do not change existing accounting semantics while implementing analytics.

If something is ambiguous, document the assumption in code and PRD rather than silently choosing a definition.

---

# 30. Output Contract

The endpoint/service should eventually return something conceptually similar to:

```ts
type ProductAnalyticsResult = {
  summary: ProductAnalyticsSummary;

  products: ProductAnalyticsRow[];

  meta: {
    startDate: Date;
    endDate: Date;
    totalProducts: number;
  };
};
```

The exact API shape should follow the existing project's conventions.

Example:

```json
{
  "summary": {
    "orders": 1250,
    "units": 3480,
    "netSales": 85200000,
    "cogs": 42100000,
    "grossProfit": 43100000,
    "platformFee": 12800000,
    "netProfit": 30300000,
    "grossMargin": 0.506,
    "netMargin": 0.356
  },
  "products": [
    {
      "productId": "...",
      "productName": "...",
      "variationId": "...",
      "variationName": "...",
      "orders": 250,
      "units": 500,
      "netSales": 12000000,
      "netProfit": 4800000,
      "netMargin": 0.4,
      "salesContribution": 0.141,
      "profitContribution": 0.158,
      "salesRank": 1,
      "profitRank": 2
    }
  ]
}
```

---

# 31. Implementation Strategy

Implement in phases.

## Phase 1 — Inspect

Before changing code:

- inspect the order schema
- inspect item schema/types
- inspect Shopee import/parser logic
- inspect existing aggregation pipelines
- inspect existing folder conventions
- inspect indexes
- inspect current metric definitions

Provide a short summary of findings.

Do not modify code during this inspection phase.

## Phase 2 — Base Pipeline

Implement:

```text
$match
→ $unwind
→ normalization
→ item metrics
→ product grouping
```

Verify results.

## Phase 3 — Profitability

Implement:

```text
COGS
Gross Profit
Platform Fees
Shipping
Net Profit
Margin
Profit / Unit
```

Only according to the existing business definitions.

## Phase 4 — Contribution

Implement:

```text
Sales Contribution
Profit Contribution
Unit Contribution
Order Contribution
```

## Phase 5 — Ranking

Implement:

```text
Sales Rank
Profit Rank
Units Rank
```

## Phase 6 — Classification

Implement:

```text
Star
Revenue Driver
Profit Driver
Weak
```

Keep classification logic isolated and configurable.

## Phase 7 — Summary

Return:

```text
summary
products
meta
```

## Phase 8 — Tests

Add tests covering the edge cases described above.

---

# 32. Important Constraints

Do NOT:

- rewrite the existing order schema without necessity
- change existing profit/accounting definitions
- create unnecessary collections
- denormalize data prematurely
- perform aggregation in JavaScript after fetching all orders
- create N+1 queries
- hard-code arbitrary business thresholds without documenting them
- introduce an ORM solely for this feature
- create an enormous monolithic aggregation function
- assume Shopee field names without inspecting the importer/schema
- count orders incorrectly after `$unwind`
- double-count order-level costs
- ignore refunds/cancellations if the current application already supports them

---

# 33. Expected Developer Deliverable

After implementation, provide:

1. Files created/modified.
2. Explanation of the pipeline stages.
3. Explanation of every financial metric.
4. Explanation of order-level cost allocation.
5. Explanation of contribution calculation.
6. Explanation of ranking/classification.
7. MongoDB indexes used/recommended.
8. Tests added.
9. Any assumptions discovered from the existing schema.
10. Any metrics that cannot currently be calculated because required source data does not exist.

Do not hide assumptions.

---

# 34. Definition of Done

The implementation is considered complete when:

- Product analytics can be filtered by date range.
- Tenant/store filtering works according to the existing architecture.
- Products are correctly grouped.
- Multiple items in one order do not inflate order counts.
- Order-level costs are not double-counted.
- Sales metrics are correct.
- COGS metrics are correct.
- Profit metrics are correct according to existing business definitions.
- Margin metrics are safe from division by zero.
- Contribution metrics are correct.
- Product ranking works.
- The aggregation is modular and readable.
- Tests cover important edge cases.
- No unnecessary schema changes are introduced.
- The resulting structure is suitable for future sales/customer/inventory analytics.

---

# 35. Future Extensions

The architecture should leave room for:

```text
Product Analytics
├── Sales
├── Profitability
├── Contribution
├── Product Growth
├── Product Velocity
├── Product Classification
├── Product Opportunity Score
│
├── Customer Analytics
├── Inventory Analytics
├── SKU Analytics
└── Sourcing Analytics
```

Eventually the Product Analytics system may feed a higher-level decision system:

```text
Historical Sales
       ↓
Product Performance
       ↓
Profitability
       ↓
Demand / Velocity
       ↓
Opportunity Score
       ↓
SKU Expansion / Sourcing Decision
```

Do not implement these future features unless explicitly requested. The current task is to establish a solid and extensible Product Analytics aggregation foundation.