# Database Schema (MongoDB)

## Product

```ts
type Product = {
  _id: string
  name: string
  price: number
  layoutId: string
}
```

---

## Layout

```ts
type Layout = {
  _id: string
  version: number
  data: any
}
```

---

## Experiment

```ts
type Experiment = {
  _id: string
  productId: string
  variants: Variant[]
}
```

---

## Event Tracking

```ts
type Event = {
  type: string
  userId?: string
  productId: string
  timestamp: number
}
```

---

