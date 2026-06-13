# Product Module - CRUD API Documentation

This module provides a complete CRUD implementation for product management with multi-tenancy support using Mongoose v9 and Next.js 16.

## Architecture

- **Model**: `product.model.ts` - Mongoose schema definition with variants support
- **DTO**: `product.dto.ts` - Zod validation schemas for request/response
- **Repository**: `product.repository.ts` - Data access layer with custom queries
- **Service**: `product.service.ts` - Business logic layer
- **Handler**: `product.handler.ts` - HTTP request handlers

## Key Features

✅ Multi-tenant support (organization & store context)
✅ Soft delete functionality (deleted_at)
✅ Product variants management
✅ Pagination & filtering
✅ Search functionality
✅ Bulk operations
✅ Zod validation
✅ Proper error handling

## API Endpoints

### 1. Get All Products (with Pagination & Filtering)
```
GET /api/products?page=1&limit=10&platform=shopee&is_active=true&search=keyword
```

**Query Parameters:**
- `page` (number) - Page number, default: 1
- `limit` (number) - Items per page, default: 10
- `platform` (string) - Filter by platform (optional)
- `is_active` (boolean) - Filter by status (optional)
- `search` (string) - Search by product name or product_id (optional)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 2. Search Products
```
GET /api/products/search?q=laptop
```

**Query Parameters:**
- `q` (string) - Search query (required)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### 3. Get Product by ID
```
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Product Name",
    "product_id": "unique-id",
    "platform": "shopee",
    "variants": [...],
    "is_active": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 4. Create Product
```
POST /api/products
Headers: x-organization-id, x-store-id (optional)
```

**Body:**
```json
{
  "name": "Product Name",
  "product_id": "unique-product-id",
  "platform": "shopee",
  "key": "product-key",
  "is_active": true,
  "variants": [
    {
      "variant_id": "var-1",
      "name": "Size M",
      "product_key": "size-m",
      "price": 100000,
      "quantity": 50,
      "discount": 10,
      "finalPrice": 90000,
      "SKU": "SKU123",
      "GTIN": "1234567890"
    }
  ]
}
```

### 5. Update Product
```
PUT/PATCH /api/products/:id
Headers: x-organization-id, x-store-id (optional)
```

**Body:** (All fields optional)
```json
{
  "name": "Updated Name",
  "is_active": false,
  "variants": [...]
}
```

### 6. Delete Product (Soft Delete)
```
DELETE /api/products/:id
Headers: x-organization-id, x-store-id (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Produk berhasil dihapus",
  "data": {...}
}
```

### 7. Restore Product
```
POST /api/products/:id/restore
Headers: x-organization-id, x-store-id (optional)
```

### 8. Bulk Update Status
```
POST /api/products/bulk-update-status
Headers: x-organization-id, x-store-id (optional)
```

**Body:**
```json
{
  "product_ids": ["id1", "id2", "id3"],
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 produk berhasil diperbarui",
  "data": {
    "success": true,
    "modifiedCount": 3
  }
}
```

### 9. Get Products by Platform
```
GET /api/products/platform/:platform
```

### 10. Get Active Products Only
```
GET /api/products/active
```

## Required Headers

All endpoints require tenant context headers:

```
x-organization-id: organization-uuid (required)
x-store-id: store-uuid (optional)
```

These headers are extracted and used to filter data per tenant.

## Request/Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Optional message",
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "path": "field.name",
      "message": "Validation error"
    }
  ]
}
```

## Error Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Data Model

### Product Schema
```typescript
{
  _id: ObjectId,
  organization: ObjectId,      // From header x-organization-id
  store: ObjectId,             // From header x-store-id
  platform: string,            // enum: PLATFORMS
  name: string,
  product_id: string,          // Unique
  key: string,
  variants: [
    {
      variant_id: string,
      name: string,
      product_key: string,
      price: number,
      quantity: number,
      discount: number,        // 0-100
      finalPrice: number,      // Auto calculated
      SKU: string,
      GTIN: string
    }
  ],
  is_active: boolean,
  deleted_at: Date | null,     // Soft delete
  created_at: Date,
  updated_at: Date
}
```

## Usage Examples

### Example 1: Create product dengan variants
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "x-organization-id: org-123" \
  -H "x-store-id: store-456" \
  -d '{
    "name": "Laptop Gaming",
    "product_id": "laptop-gaming-001",
    "platform": "shopee",
    "key": "laptop-gaming",
    "is_active": true,
    "variants": [
      {
        "variant_id": "var-1",
        "name": "16GB RAM",
        "product_key": "16gb-ram",
        "price": 15000000,
        "quantity": 20,
        "discount": 5,
        "finalPrice": 14250000,
        "SKU": "LAPTOP-001-16GB"
      }
    ]
  }'
```

### Example 2: Search products
```bash
curl -X GET 'http://localhost:3000/api/products/search?q=laptop' \
  -H "x-organization-id: org-123"
```

### Example 3: Get paginated products
```bash
curl -X GET 'http://localhost:3000/api/products?page=1&limit=20&platform=shopee' \
  -H "x-organization-id: org-123"
```

## Service Methods

### ProductService

```typescript
// Get products dengan pagination & filtering
async getProductsWithPagination(filter: ProductFilterDTO)

// Get single product
async getProductById(id: string)

// Get product by product_id
async getProductByProductId(productId: string)

// Create product
async createProduct(dto: CreateProductDTO)

// Update product
async updateProduct(id: string, dto: UpdateProductDTO)

// Soft delete product
async deleteProduct(id: string)

// Restore product
async restoreProduct(id: string)

// Get by platform
async getProductsByPlatform(platform: string)

// Get active only
async getActiveProducts()

// Search
async searchProducts(query: string)

// Bulk update status
async bulkUpdateStatus(dto: BulkUpdateStatusDTO)

// Count by platform
async countProductsByPlatform(platform: string)
```

## Notes

- All timestamps use `created_at` and `updated_at` fields in snake_case
- Variants' `finalPrice` is automatically calculated: `price - (price * discount / 100)`
- Soft delete using `deleted_at` field - deleted products are excluded from queries by default
- Multi-tenancy enforced at repository level using organization & store context
- All inputs validated using Zod schemas
