<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Project: Pasaria (Online Marketplace MVP)


## 1. Project Overview

This project is a hybrid **Marketplace + Landing Page Platform** designed for the Indonesian market.

Core idea:
- Product discovery via brand page
- Product detail = high-converting landing page (no distractions)
- Landing page builder (section-based like Shopify)
- A/B testing system
- Conversion analytics
- AI-assisted product optimization
- Future-ready for AI agents as a buyer (API-first communication)

Path examples:
- `pasaria.id/[brand]/[product-1]`
- `pasaria.id/[brand]/[product-2]`
- `pasaria.id/[brand]/[product-n]`

---

## 2. Target Users

### Sellers
- MSMEs (Indonesia)
- Brand owners
- Digital Marketers
- Dropshippers

### Buyers
- Mobile-first users
- Price-sensitive
- Influenced by visual + trust signals

---

## 3. Key Features

### Marketplace (Discovery Layer)
- Product listing
- Search & filtering
- Categories

### Landing Page Mode
- No distractions
- High conversion UI
- Custom sections (JSON-driven layout)

### Seller Dashboard
- Product management
- Analytics
- A/B testing (future)

---

## 4. Core Differentiation

- Marketplace + Landing Page hybrid
- AI-agent friendly data structure
- Section-based layout system
- Conversion-first UX

---

## 5. Metrics

- Conversion Rate (CR)
- Click-through Rate (CTR)
- Average Order Value (AOV)
- Seller Retention

---

## 6. Constraints

- Monolithic architecture (Next.js)
- MongoDB with Mongoose ODM (flexible schema for layout system)
- Fast page load (critical)

---

## 7. Challenges

- Competing with large marketplaces
- Seller acquisition
- Performance bottlenecks from dynamic pages

---

## 8. Future Expansion

- Microservices architecture
- AI agents integration
- Multi-channel commerce