# 🔄 Tính năng Tự động Bán Cáp sạc từ Tồn kho

## ✨ Tổng quan
Khi tick chọn **"Tặng cáp sạc"** trong quá trình bán hàng, hệ thống sẽ:
1. ✅ **Tự động tìm** 1 cáp sạc có sẵn trong kho (giá thấp nhất, cũ nhất)
2. ✅ **Chuyển status** từ IN_STOCK → SOLD
3. ✅ **Ghi vào cùng hóa đơn** với sản phẩm chính
4. ✅ **Cập nhật tồn kho** chính xác

## 🚀 Cách hoạt động

### 1. Logic tìm cáp sạc
```sql
SELECT TOP 1 ProductID, ProductName, IMEI, ImportPrice
FROM CRM_Products p
INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
WHERE c.CategoryName LIKE '%cáp%' AND p.Status = 'IN_STOCK'
ORDER BY p.ImportPrice ASC, p.CreatedAt ASC
```

### 2. Cập nhật cáp sạc được chọn
```sql
UPDATE CRM_Products
SET Status = 'SOLD',
    SalePrice = 0,                    -- Giá bán = 0 (tặng)
    InvoiceNumber = 'HD2025000013',   -- Cùng hóa đơn
    CustomerInfo = 'Tặng kèm sản phẩm chính',
    Notes = '[Tặng kèm hóa đơn HD2025000013]'
WHERE ProductID = @cableId
```

### 3. Thêm vào hóa đơn
```sql
INSERT INTO CRM_SalesInvoiceDetails (
  InvoiceID, ProductID, ProductName, IMEI, SalePrice, TotalPrice
)
VALUES (
  @invoiceId, @cableId, 'Cáp sạc USB-C #1 (Tặng)', 'CAP...', 0, 0
)
```

## 📋 Demo thực tế

### Trước khi bán:
**Tồn kho cáp sạc**: 15 sản phẩm IN_STOCK
```json
[
  {
    "ProductID": 52,
    "ProductName": "Cáp sạc USB-C #1", 
    "Status": "IN_STOCK",
    "ImportPrice": 100000
  },
  // ... 14 cáp khác
]
```

### Test bán hàng có tặng cáp:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 70,
    "SalePrice": 35000000,
    "IncludeCable": true
  }'
```

### Kết quả:
```json
{
  "InvoiceNumber": "HD2025000013",
  "FinalAmount": 35000000,
  "ProductName": "iPhone 16 Pro Max 1TB",
  "ImportPrice": 30000000,
  "Profit": 4900000,           // ← Đã trừ giá cáp sạc
  "CablePrice": 100000,        // ← Giá cáp sạc thực tế
  "SoldCableId": 52,           // ← ID cáp đã bán
  "SoldCableName": "Cáp sạc USB-C #1"
}
```

### Sau khi bán:
**Tồn kho cáp sạc**: 14 sản phẩm IN_STOCK (giảm 1)

**Cáp sạc đã bán**:
```json
{
  "ProductID": 52,
  "ProductName": "Cáp sạc USB-C #1",
  "Status": "SOLD",              // ← Đã chuyển thành SOLD
  "SalePrice": 0,                // ← Giá bán = 0 (tặng)
  "InvoiceNumber": "HD2025000013", // ← Cùng hóa đơn
  "CustomerInfo": "Tặng kèm sản phẩm chính",
  "Notes": "...[Tặng kèm hóa đơn HD2025000013]"
}
```

## 📊 Hóa đơn chi tiết

Hóa đơn **HD2025000013** bao gồm 2 sản phẩm:

| Sản phẩm | Giá bán | Giá nhập | Lãi/Lỗ | Ghi chú |
|----------|---------|----------|---------|---------|
| **iPhone 16 Pro Max 1TB** | 35,000,000 | 30,000,000 | +5,000,000 | Sản phẩm chính |
| **Cáp sạc USB-C #1 (Tặng)** | 0 | 100,000 | -100,000 | Tặng kèm |
| **Tổng cộng** | **35,000,000** | **30,100,000** | **+4,900,000** | **Lãi thực tế** |

## 🎯 Lợi ích

### 📦 **Quản lý tồn kho chính xác**
- Tồn kho cáp sạc được cập nhật real-time
- Không bị "ảo" tồn kho khi tặng cáp

### 📊 **Báo cáo đầy đủ**
- Tracking từng cáp sạc đã tặng
- Hóa đơn chi tiết có cả sản phẩm chính và phụ kiện

### 💰 **Tính toán chính xác**
- Lãi/lỗ phản ánh đúng chi phí thực tế
- Giá cáp sạc được lấy từ sản phẩm thực tế (không ước tính)

### 🔄 **Tự động hóa**
- Không cần chọn cáp sạc thủ công
- Hệ thống tự động chọn cáp giá thấp nhất, cũ nhất

## ⚠️ Xử lý trường hợp đặc biệt

### Không có cáp sạc trong kho:
```json
{
  "SoldCableId": null,
  "SoldCableName": "Cáp sạc (không có trong kho)",
  "CablePrice": 100000  // ← Sử dụng giá mặc định để tính toán
}
```

### Logic fallback:
1. **Ưu tiên**: Cáp sạc thực tế trong kho
2. **Fallback**: Giá trung bình từ API `/api/cable-price`
3. **Default**: 100,000 VNĐ nếu không có dữ liệu

## 🔧 Test Commands

### 1. Kiểm tra tồn kho cáp sạc:
```bash
curl "http://localhost:3000/api/products-v2?categoryId=9&availableOnly=true"
```

### 2. Bán hàng có tặng cáp:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 70,
    "SalePrice": 35000000,
    "IncludeCable": true
  }'
```

### 3. Kiểm tra hóa đơn:
```bash
curl "http://localhost:3000/api/sales?invoiceNumber=HD2025000013"
```

### 4. Kiểm tra cáp đã bán:
```bash
curl "http://localhost:3000/api/products-v2/52"
```

## 🔮 Tương lai

Có thể mở rộng cho các phụ kiện khác:
- 🎧 **Auto-sell tai nghe** khi tặng tai nghe
- 📱 **Auto-sell ốp lưng** khi tặng ốp lưng
- 🔋 **Auto-sell pin dự phòng** khi tặng pin
- 📦 **Combo management** cho nhiều phụ kiện

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 27/06/2025  
**Phiên bản**: 1.0
