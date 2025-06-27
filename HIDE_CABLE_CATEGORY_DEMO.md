# 🚫 Ẩn Danh mục Cáp sạc khỏi Sản phẩm có thể Bán

## ✨ Tổng quan
Danh mục **"Cáp sạc"** đã được ẩn khỏi danh sách sản phẩm có thể bán vì cáp sạc chỉ được **bán kèm với điện thoại**, không bán riêng lẻ. Điều này giúp:
- ✅ **Giao diện sạch sẽ** - Chỉ hiển thị sản phẩm chính có thể bán
- ✅ **Tránh nhầm lẫn** - Nhân viên không thể bán cáp sạc riêng lẻ
- ✅ **Quản lý đúng quy trình** - Cáp sạc chỉ bán kèm qua tính năng "Bán kèm cáp sạc"

## 🚀 Cách hoạt động

### 1. API Categories với tham số loại trừ
```bash
# Danh sách đầy đủ (cho admin)
GET /api/categories
→ Bao gồm "Cáp sạc"

# Danh sách cho bán hàng (loại trừ cáp sạc)  
GET /api/categories?excludeCables=true
→ Không có "Cáp sạc"
```

### 2. Stored Procedure lọc sản phẩm
```sql
CREATE PROCEDURE SP_CRM_GetAvailableProducts
    @CategoryID INT = NULL,
    @SearchTerm NVARCHAR(255) = NULL
AS
BEGIN
    SELECT p.*, c.CategoryName, b.BatchCode, b.ImportDate
    FROM CRM_Products p
    INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
    WHERE 
        p.Status = 'IN_STOCK'
        -- 🚫 Loại trừ danh mục cáp sạc
        AND c.CategoryName NOT LIKE '%cáp%'
        AND c.CategoryName NOT LIKE '%cap%'
        AND c.CategoryName NOT LIKE '%Cáp%'
        AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
        AND (@SearchTerm IS NULL OR ...)
    ORDER BY p.CreatedAt DESC;
END
```

### 3. Component tự động sử dụng filter
```javascript
// ProductListV2.tsx
const fetchCategories = async () => {
  // Tự động loại trừ cáp sạc khi fetch categories
  const response = await fetch('/api/categories?excludeCables=true');
  // ...
};
```

## 📋 Demo thực tế

### Test Case 1: **Danh sách Categories**

**Trước khi ẩn**:
```bash
curl "http://localhost:3000/api/categories"
```
```json
{
  "data": [
    {"CategoryID": 9, "CategoryName": "Cáp sạc"},     // ← Có cáp sạc
    {"CategoryID": 1, "CategoryName": "iPhone 16"},
    {"CategoryID": 2, "CategoryName": "iPhone 15"},
    // ...
  ]
}
```

**Sau khi ẩn**:
```bash
curl "http://localhost:3000/api/categories?excludeCables=true"
```
```json
{
  "data": [
    {"CategoryID": 1, "CategoryName": "iPhone 16"},   // ← Không có cáp sạc
    {"CategoryID": 2, "CategoryName": "iPhone 15"},
    // ...
  ]
}
```

### Test Case 2: **Sản phẩm có sẵn để bán**

**Trước khi ẩn**:
```bash
curl "http://localhost:3000/api/products-v2?availableOnly=true"
```
```json
{
  "data": [
    {"ProductName": "Cáp sạc #10", "CategoryName": "Cáp sạc"},  // ← Có cáp sạc
    {"ProductName": "Cáp sạc #9", "CategoryName": "Cáp sạc"},
    {"ProductName": "iPhone 16 Pro Max", "CategoryName": "iPhone 16"}
  ]
}
```

**Sau khi ẩn**:
```bash
curl "http://localhost:3000/api/products-v2?availableOnly=true"
```
```json
{
  "data": [
    {"ProductName": "iPhone 16 Pro Max", "CategoryName": "iPhone 16"}  // ← Chỉ có iPhone
  ]
}
```

## 🎯 Lợi ích

### 👥 **Cho Nhân viên Bán hàng**
- Giao diện sạch sẽ, chỉ hiển thị sản phẩm chính
- Không thể nhầm lẫn bán cáp sạc riêng lẻ
- Tập trung vào sản phẩm chính (điện thoại)

### 📊 **Cho Quản lý**
- Kiểm soát quy trình bán hàng chặt chẽ
- Cáp sạc chỉ bán kèm, không bán lẻ
- Báo cáo chính xác hơn

### 🔧 **Cho Hệ thống**
- Logic rõ ràng, tách biệt sản phẩm chính và phụ kiện
- Dễ bảo trì và mở rộng
- Performance tốt hơn (ít dữ liệu hiển thị)

## 🔄 Quy trình Bán hàng

### ❌ **Không thể làm**: Bán cáp sạc riêng lẻ
```
1. Vào danh sách sản phẩm
2. Không thấy cáp sạc nào
3. Không thể chọn bán cáp sạc riêng
```

### ✅ **Cách đúng**: Bán cáp sạc kèm điện thoại
```
1. Chọn sản phẩm iPhone
2. Click "Bán"
3. Check "🔌 Bán kèm cáp sạc"
4. Chọn lô cáp sạc
5. Bán hàng → Cả iPhone và cáp sạc được bán
```

## 🛠️ Cài đặt và Test

### 1. Tạo stored procedure:
```bash
curl -X POST "http://localhost:3000/api/setup-procedures"
```

### 2. Test danh sách categories (có cáp sạc):
```bash
curl "http://localhost:3000/api/categories"
```

### 3. Test danh sách categories (không có cáp sạc):
```bash
curl "http://localhost:3000/api/categories?excludeCables=true"
```

### 4. Test sản phẩm có sẵn để bán:
```bash
curl "http://localhost:3000/api/products-v2?availableOnly=true"
```

### 5. Tạo sản phẩm iPhone để test:
```bash
curl -X POST http://localhost:3000/api/products-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "BatchID": 17,
    "ProductName": "iPhone 16 Pro Max 256GB",
    "IMEI": "123456789012350", 
    "ImportPrice": 25000000
  }'
```

## 📊 So sánh Trước/Sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Categories trong filter** | 8 danh mục (có Cáp sạc) | 7 danh mục (không có Cáp sạc) |
| **Sản phẩm có thể bán** | iPhone + Cáp sạc | Chỉ iPhone |
| **Bán cáp sạc riêng** | Có thể (sai quy trình) | Không thể (đúng quy trình) |
| **Bán cáp sạc kèm** | Có thể | Có thể (qua tính năng riêng) |

## ⚠️ Lưu ý quan trọng

### 🔍 **Cáp sạc vẫn tồn tại**
- Cáp sạc vẫn có trong database
- Vẫn có thể xem qua API không filter
- Vẫn có thể bán kèm qua tính năng chuyên biệt

### 🛡️ **Chỉ ẩn khỏi giao diện bán hàng**
- Admin vẫn có thể xem tất cả sản phẩm
- Báo cáo vẫn bao gồm cáp sạc
- Quản lý tồn kho vẫn đầy đủ

### 🔧 **Có thể tùy chỉnh**
- Thêm parameter `excludeCables=false` để hiển thị lại
- Có thể áp dụng cho danh mục khác
- Dễ dàng bật/tắt tính năng

## 🔮 Tương lai

Có thể mở rộng cho các phụ kiện khác:
- 🎧 **Ẩn tai nghe** (chỉ bán kèm)
- 📱 **Ẩn ốp lưng** (chỉ bán kèm)  
- 🔋 **Ẩn pin dự phòng** (chỉ bán kèm)
- 📦 **Quản lý phụ kiện** tổng thể

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 28/06/2025  
**Phiên bản**: 1.0
