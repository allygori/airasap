# Architecture Overview

## 1. Stack

- TypeScript
- Next.js v16.2.4 (App Router)
- MongoDB with Mongoose ODM
- Tailwind CSS v4
- Shadcn UI (dashboard only)
- better-auth

---

## 2. High-Level Structure
```sh
/app
/modules
/engines
/jobs
/lib
/types
```
---


---

## 3. Key Concepts

### Monolithic but Modular
- Single codebase
- Domain-separated logic

---

### API + UI in One Place
- Next.js handles both
- API routes under `/app/api`

---

### Data Flow

Client → API → Modules → DB

---

## 4. Scaling Plan

### Current
- Monolith

### Future
- Extract:
  - Auth service
  - Product service
  - Analytics service