# AI Agents Guide

This document defines how AI coding agents should operate within this repository.

---

## 1. Principles

- Prefer **TypeScript types over interfaces**
- Keep logic **modular and reusable**
- Avoid unnecessary abstractions
- Always prioritize **performance and scalability**

---

## 2. Architecture Awareness

This is a **monolithic Next.js application**, but structured to evolve into microservices.

Agents should:
- Keep modules loosely coupled
- Avoid tight dependencies between domains
- Write code that can be extracted later

---

## 3. Folder Responsibilities

- `/modules` → Business logic (core domain)
- `/engines` → Complex systems (layout, A/B testing, AI)
- `/jobs` → Background processing
- `/app` → Next.js routes (UI + API)
- `/lib` → Shared library

---

## 4. Coding Rules

### Types
- Always use:
```ts
type User = {
  id: string
}
```
- Avoid:
```ts
interface User {}
```
---

### API Design
- Use REST (for now)
- Keep endpoints predictable:
  - /api/products
  - /api/orders
---

### Data Handling
- Use Mongoose (MongoDB ODM) friendly patterns
- Avoid joins, prefer embedding when reasonable
---

## 5. Performance Guidelines
- Use caching whenever possible
- Avoid heavy computations in request lifecycle
- Prefer server-side rendering for landing pages
---

## 6. Layout System
- JSON-driven (like Shopify sections)
- Must be:
  - Serializable
  - Versionable
  - Cacheable
---

## 7. A/B Testing (Future)
Agents should design with:
- Variant support
- Traffic splitting
- Analytics hooks
---

## 8. DO NOT
- Introduce unnecessary libraries
- Create tight coupling between modules
- Over-engineer early stage features