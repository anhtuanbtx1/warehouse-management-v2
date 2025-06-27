# 🔌 Tính năng Tự động Tạo Sản phẩm Cáp sạc

## ✨ Tổng quan
Khi tạo lô hàng với danh mục **"Cáp sạc"**, hệ thống sẽ tự động tạo số lượng sản phẩm tương ứng với số lượng nhập, giúp tiết kiệm thời gian và tăng hiệu quả quản lý.

## 🚀 Cách hoạt động

### 1. Tạo lô hàng cáp sạc
```bash
POST /api/import-batches
{
  "CategoryID": 9,           // ID của danh mục "Cáp sạc"
  "ImportDate": "2025-06-27",
  "TotalQuantity": 5,        // Số lượng cáp sạc nhập
  "TotalImportValue": 500000,
  "Notes": "Cáp sạc iPhone Lightning"
}
```

### 2. Hệ thống tự động tạo sản phẩm
- ✅ **5 sản phẩm** được tạo tự động
- ✅ **Mã sản phẩm** duy nhất: `CAP{timestamp}{số thứ tự}`
- ✅ **Tên sản phẩm**: "Cáp sạc iPhone Lightning #1", "#2", "#3"...
- ✅ **Giá nhập**: Tự động tính từ tổng giá trị / số lượng
- ✅ **Trạng thái**: IN_STOCK (sẵn sàng bán)

## 📋 Kết quả Demo

### Lô hàng được tạo:
```json
{
  "BatchID": 15,
  "BatchCode": "LOT20250627225655",
  "CategoryName": "Cáp sạc",
  "TotalQuantity": 3,
  "ImportPrice": 100000,
  "message": "Lô hàng đã được tạo thành công với 3 sản phẩm cáp sạc tự động"
}
```

### Sản phẩm được tạo tự động:
```json
[
  {
    "ProductID": 52,
    "ProductName": "Cáp sạc USB-C #1",
    "IMEI": "CAP1751039760803001",
    "ImportPrice": 100000,
    "Status": "IN_STOCK",
    "Notes": "Tự động tạo từ lô hàng LOT20250627225655"
  },
  {
    "ProductID": 53,
    "ProductName": "Cáp sạc USB-C #2", 
    "IMEI": "CAP1751039760821002",
    "ImportPrice": 100000,
    "Status": "IN_STOCK"
  },
  {
    "ProductID": 54,
    "ProductName": "Cáp sạc USB-C #3",
    "IMEI": "CAP1751039760831003", 
    "ImportPrice": 100000,
    "Status": "IN_STOCK"
  }
]
```

## 🔧 Cài đặt và Test

### 1. Setup danh mục cáp sạc:
```bash
curl -X POST http://localhost:3000/api/setup-cable-category
```

### 2. Tạo lô hàng cáp sạc:
```bash
curl -X POST http://localhost:3000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryID": 9,
    "ImportDate": "2025-06-27", 
    "TotalQuantity": 5,
    "TotalImportValue": 500000,
    "Notes": "Cáp sạc iPhone Lightning"
  }'
```

### 3. Kiểm tra sản phẩm đã tạo:
```bash
curl "http://localhost:3000/api/products-v2?batchId={BatchID}"
```

## 🎯 Lợi ích

### ⚡ Tiết kiệm thời gian
- Không cần tạo từng sản phẩm cáp sạc một cách thủ công
- Tự động sinh mã sản phẩm duy nhất

### 📊 Quản lý chính xác
- Đảm bảo số lượng sản phẩm = số lượng nhập
- Tracking đầy đủ từ lô hàng đến từng sản phẩm

### 🔄 Linh hoạt
- Chỉ áp dụng cho danh mục "Cáp sạc"
- Các danh mục khác vẫn hoạt động bình thường

## 📝 Ghi chú kỹ thuật

### Validation mã sản phẩm:
- **IMEI điện thoại**: 15 số (ví dụ: 123456789012345)
- **Mã cáp sạc**: CAP + số (ví dụ: CAP1751039760803001)

### Logic phát hiện danh mục:
```javascript
if (categoryName.toLowerCase().includes('cáp') || 
    categoryName.toLowerCase().includes('cap') ||
    categoryName.includes('Cáp')) {
  // Tự động tạo sản phẩm
}
```

## 🔮 Tương lai
Có thể mở rộng cho các danh mục khác như:
- 🎧 Tai nghe
- 🔋 Pin dự phòng  
- 📱 Ốp lưng
- 🔌 Sạc không dây

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 27/06/2025  
**Phiên bản**: 1.0
