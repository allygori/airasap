# Layout System (Landing Page Builder)

## 1. Concept

Section-based layout (like Shopify)

---

## 2. Example JSON

```json
{
  "version": 1,
  "sections": [
    {
      "type": "hero",
      "props": {
        "title": "Product Title",
        "image": "url"
      }
    },
    {
      "type": "cta",
      "props": {
        "text": "Buy Now"
      }
    }
  ]
}
```

---

## 3. Requirements
- Fully serializable
- Stored in MongoDB
- Version-controlled

---

## 4. Rendering Flow
- Fetch layout JSON
- Map section types → React components
- Render dynamically

---

## 5. Caching Strategy
- Cache per product page
- Invalidate on update