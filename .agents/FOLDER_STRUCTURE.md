# Folder Structure

## Root
```sh
/app
/modules
/engines
/jobs
/lib
/types
/config
```
---

## /modules

Business logic grouped by domain:
```sh
/modules
  /product
  /user
  /order
```

Each module contains:
- service.ts
- repository.ts
- types.ts

---

## /engines

Complex systems:
```sh
/engines
  /layout-engine
  /ab-testing-engine
  /recommendation-engine
```
---

## /jobs

Background workers:
```sh
/jobs
  /analytics
  /emails
```
---

## /lib

Shared utilities:
- db connection
- helpers

---

## /types

Global types

---

## /app

Next.js routes:
- UI pages
- API endpoints