# Seller Profit Intelligence Tool — Product Brief

## Vision

Build a lightweight seller intelligence platform for Indonesian marketplace sellers (starting with Shopee) that simplifies messy marketplace reports into easy-to-understand business insights.

This is NOT an accounting ERP.

This is:
- profit visibility
- fee visibility
- marketplace intelligence
- seller insights

Long-term direction:
- seller operating system
- landing page generator
- storefront infrastructure
- distributed commerce ecosystem

But MVP must stay SMALL and SIMPLE.

---

# Core Problem

Marketplace seller data in Indonesia is fragmented and difficult to understand.

Shopee exports:
- multiple Excel files
- fragmented worksheets
- inconsistent terminology
- verbose fee breakdowns
- unclear payout calculations

Most sellers:
- only see gross revenue
- do not understand real payout
- do not know discount leakage
- do not know marketplace fee impact
- do not know true profitability

---

# Initial Goal

Create a FREE tool as:
- lead generator
- dataset collector
- domain learning tool
- seller trust builder

The free tool should:
- accept Shopee Excel reports
- normalize the data
- generate simplified summaries
- generate business insights automatically

---

# Target User

Indonesian marketplace sellers:
- Shopee sellers
- small to medium stores
- mobile-first users
- non-technical
- not accounting-oriented

They care about:
- profit
- payout
- discount impact
- fee impact
- top products
- growth opportunities

They DO NOT care about:
- formal accounting
- debit/credit
- ERP complexity

---

# Product Philosophy

The product should feel like:
> "a smart seller friend"

NOT:
> "enterprise BI dashboard"

---

# MVP Scope

## Supported Marketplace
ONLY:
- Shopee

## Supported Report
ONLY:
- Income report / laporan penghasilan

Do NOT support:
- ads
- affiliate
- TikTok Shop
- Tokopedia
- accounting journals
- real-time sync

---

# User Flow

## 1. Upload Excel File

User uploads Shopee income report.

Accepted format:
- .xlsx

---

## 2. Parse Workbook

Read:
- worksheets
- rows
- relevant columns

Need:
- report type detection
- worksheet normalization

---

## 3. Normalize Data

Convert marketplace-specific structure into internal schema.

Example internal schema:

```ts
type Transaction = {
  orderId: string
  sku?: string
  productName?: string
  quantity?: number

  grossSales: number
  sellerDiscount: number

  marketplaceFee: number
  processingFee: number

  payout: number

  orderDate?: Date
}
```


## 4. User Inputs HPP

User manually inputs:

- average margin
OR
- HPP per SKU

Keep onboarding SIMPLE.

Avoid:

- complex SKU mapping
- massive setup flow

---


## 5. Generate Summary

Core metrics:

- Gross Sales
- Total Discount
- Marketplace Fee
- Processing Fee
- Net Payout

---


## 6. Generate Insight Texts

MOST IMPORTANT FEATURE.

Insights should be:

*   short
    
*   emotional
    
*   actionable
    
*   easy to understand
    

Example insights:

### Discount Leakage

"48% omzet tokomu berubah menjadi diskon."

### Payout Reality

"Omzet Rp2,4jt menghasilkan payout bersih Rp1,1jt."

### Conversion Opportunity

"Masalah utama tokomu kemungkinan traffic, bukan closing."

### Positive Reinforcement

"Conversion rate tokomu cukup kuat."

### Scaling Insight

"Jika traffic naik 2x dengan conversion saat ini, omzet berpotensi meningkat signifikan."

* * *

UI/UX Principles
================

Mobile-first
------------

Target users operate mostly via smartphone.

* * *

Keep UI Extremely Simple
------------------------

Avoid:

*   enterprise dashboard feel
    
*   too many charts
    
*   complex tables
    
*   BI analytics look
    

* * *

Recommended UI Structure
========================

Section 1 — Hero Summary Cards
------------------------------

Large cards:

*   Gross Sales
    
*   Discount
    
*   Marketplace Fee
    
*   Net Payout
    

* * *

Section 2 — Key Insights
------------------------

Example:

⚠️ 48% omzet berubah menjadi diskon.

✅ Conversion rate tokomu cukup kuat.

📈 Masalah utama tokomu kemungkinan traffic, bukan closing.

💡 Beberapa pembeli membeli multiple items dalam satu order.

* * *

Section 3 — Simple Charts
-------------------------

Charts are ONLY visual helpers.

### Allowed charts:

*   Revenue vs Net Payout
    
*   Daily Sales Trend
    
*   Discount Breakdown Donut Chart
    

Avoid:

*   advanced analytics
    
*   crowded dashboards
    

* * *

Section 4 — Detail Tables
-------------------------

Simple tables:

*   Top Orders
    
*   Top Products
    
*   Fee Breakdown
    

* * *

Technical Stack
===============

Frontend
--------

*   Next.js
    
*   Tailwind CSS
    
*   Shadcn/ui
    

Backend
-------

*   Next.js API routes  
    OR
    
*   private Rest APIs
    

Database
--------

*   MongoDB with Mongoose
    

Reason:

*   evolving schema
    
*   semi-structured marketplace data
    

File Storage
------------

Preferred:

*   Cloudflare R2
    

* * *

Parsing Architecture
====================

Recommended Pipeline
--------------------

Upload Excel  
↓  
Detect report type  
↓  
Parse worksheets  
↓  
Normalize data  
↓  
Generate metrics  
↓  
Generate insights  
↓  
Render dashboard

* * *

Important Product Direction
===========================

This product is NOT the final business.

This is:

*   a wedge product
    
*   a seller acquisition engine
    
*   a seller intelligence layer
    

Long-term expansion:

*   seller landing pages
    
*   storefront generator
    
*   seller CRM
    
*   commerce infrastructure
    
*   distributed marketplace ecosystem
    

* * *

What NOT to Build Yet
=====================

Do NOT build:

*   ERP
    
*   accounting system
    
*   double-entry bookkeeping
    
*   ads attribution
    
*   affiliate attribution
    
*   multi-marketplace support
    
*   real-time integrations
    
*   Chrome extension scraping
    
*   AI-heavy features
    

Stay focused.

* * *

Core Product Insight
====================

The real value is NOT charts.

The real value is:

> simplifying messy marketplace data into understandable business insights.

* * *