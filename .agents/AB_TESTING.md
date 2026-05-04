
---

# 📄 `AB_TESTING.md`

```md
# A/B Testing System

## 1. Concept

Each landing page can have multiple variants.

---

## 2. Structure

```json
{
  "experimentId": "exp_123",
  "variants": [
    { "id": "A", "weight": 50 },
    { "id": "B", "weight": 50 }
  ]
}
```

---

## 3. Flow
1. User visits page
2. Assign variant
3. Store in cookie
4. Track events

---

## 4. Metrics
- Conversion rate
- Clicks
- Bounce rate

## 5. Future
- AI auto-optimization