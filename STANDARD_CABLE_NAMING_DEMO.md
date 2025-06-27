# 🏷️ Tên Sản phẩm Chuẩn cho Cáp sạc

## ✨ Tổng quan
Khi tạo lô hàng cáp sạc, hệ thống sẽ tự động tạo sản phẩm với **tên chuẩn** thay vì sử dụng Notes từ lô hàng. Điều này giúp:
- ✅ **Thống nhất tên sản phẩm** - Tất cả cáp sạc có format tên giống nhau
- ✅ **Dễ quản lý** - Không phụ thuộc vào ghi chú của người nhập
- ✅ **Chuyên nghiệp** - Tên sản phẩm rõ ràng, chuẩn hóa

## 🚀 Format tên chuẩn

### 📝 **Pattern**: `Type-C to Lightning #X`
- **Type-C to Lightning**: Loại cáp sạc chuẩn
- **#X**: Số thứ tự tăng dần trong lô (1, 2, 3, ...)

### 🔢 **Ví dụ trong 1 lô**:
```
Type-C to Lightning #1
Type-C to Lightning #2  
Type-C to Lightning #3
Type-C to Lightning #4
Type-C to Lightning #5
```

## 📋 Demo thực tế

### Test Case 1: **Tạo lô 5 sản phẩm**
```bash
curl -X POST http://localhost:3000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryID": 9,
    "ImportDate": "2025-06-28",
    "TotalQuantity": 5,
    "TotalImportValue": 750000,
    "Notes": "Lô cáp sạc mới với tên chuẩn"
  }'
```

**Kết quả**:
```json
{
  "BatchID": 20,
  "BatchCode": "LOT20250628003339",
  "message": "Lô hàng đã được tạo thành công với 5 sản phẩm cáp sạc tự động"
}
```

**Sản phẩm được tạo**:
```json
[
  {
    "ProductID": 78,
    "ProductName": "Type-C to Lightning #1",    // ← Tên chuẩn
    "IMEI": "CAP1751045564849001",
    "ImportPrice": 150000,
    "Status": "IN_STOCK"
  },
  {
    "ProductID": 79, 
    "ProductName": "Type-C to Lightning #2",    // ← Tên chuẩn
    "IMEI": "CAP1751045564866002",
    "ImportPrice": 150000,
    "Status": "IN_STOCK"
  },
  // ... #3, #4, #5
]
```

### Test Case 2: **Tạo lô thứ 2**
```bash
curl -X POST http://localhost:3000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryID": 9,
    "ImportDate": "2025-06-28", 
    "TotalQuantity": 3,
    "TotalImportValue": 450000,
    "Notes": "Lô cáp sạc thứ 2"
  }'
```

**Sản phẩm được tạo** (số thứ tự reset về 1):
```json
[
  {
    "ProductID": 83,
    "ProductName": "Type-C to Lightning #1",    // ← Reset về #1 cho lô mới
    "BatchCode": "LOT20250628003417"
  },
  {
    "ProductID": 84,
    "ProductName": "Type-C to Lightning #2",
    "BatchCode": "LOT20250628003417"  
  },
  {
    "ProductID": 85,
    "ProductName": "Type-C to Lightning #3",
    "BatchCode": "LOT20250628003417"
  }
]
```

## 🔄 So sánh Trước/Sau

### ❌ **Trước đây** (sử dụng Notes):
```javascript
const productName = body.Notes || 'Cáp sạc';
// Kết quả: "Lô cáp sạc mới với tên chuẩn #1"
//          "Lô cáp sạc mới với tên chuẩn #2"
```

### ✅ **Bây giờ** (tên chuẩn):
```javascript
const standardProductName = `Type-C to Lightning #${i}`;
// Kết quả: "Type-C to Lightning #1"
//          "Type-C to Lightning #2"
```

## 🎯 Lợi ích

### 📊 **Thống nhất dữ liệu**
- Tất cả cáp sạc có format tên giống nhau
- Dễ dàng tìm kiếm và lọc
- Báo cáo chính xác hơn

### 👥 **Dễ sử dụng**
- Nhân viên dễ nhận biết sản phẩm
- Khách hàng hiểu rõ sản phẩm
- Không bị nhầm lẫn với ghi chú

### 🔧 **Quản lý tốt hơn**
- Không phụ thuộc vào input của người dùng
- Tên sản phẩm luôn chuẩn hóa
- Dễ mở rộng cho các loại cáp khác

## 🛠️ Bán hàng với tên mới

### Test bán hàng:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 77,
    "SalePrice": 30000000,
    "IncludeCable": true,
    "CableBatchId": 20,
    "CablePrice": 150000
  }'
```

### Kết quả:
```json
{
  "InvoiceNumber": "HD2025000020",
  "FinalAmount": 30150000,
  "ProductName": "iPhone 16 Pro Max 256GB",
  "SoldCableId": 78,
  "SoldCableName": "Type-C to Lightning #1"    // ← Tên chuẩn trong hóa đơn
}
```

### Hóa đơn chi tiết:
| Sản phẩm | Giá bán | Ghi chú |
|----------|---------|---------|
| iPhone 16 Pro Max 256GB | 30,000,000 | Sản phẩm chính |
| **Type-C to Lightning #1** | **150,000** | **Cáp sạc (tên chuẩn)** |
| **Tổng cộng** | **30,150,000** | |

## 🔧 Technical Details

### Code thay đổi:
```javascript
// Trước
const productName = body.Notes || 'Cáp sạc';
const finalName = `${productName} #${i}`;

// Sau  
const standardProductName = `Type-C to Lightning #${i}`;
```

### Logic đánh số:
- **Trong cùng lô**: #1, #2, #3, #4, #5...
- **Lô mới**: Reset về #1, #2, #3...
- **Mã sản phẩm**: Vẫn unique với timestamp

### Validation:
- ✅ Chỉ áp dụng cho danh mục "Cáp sạc"
- ✅ Tên luôn có format chuẩn
- ✅ Số thứ tự tăng dần chính xác

## 🔮 Tương lai

Có thể mở rộng cho các loại cáp khác:
- 🔌 **USB-C to USB-C #X** - Cáp sạc Android
- ⚡ **Lightning to USB-A #X** - Cáp sạc iPhone cũ
- 🔄 **Wireless Charger #X** - Sạc không dây
- 📱 **MagSafe Cable #X** - Cáp sạc MagSafe

### Template system:
```javascript
const cableTypes = {
  'Type-C': 'Type-C to Lightning',
  'USB-C': 'USB-C to USB-C', 
  'Lightning': 'Lightning to USB-A',
  'Wireless': 'Wireless Charger'
};
```

## 📝 Test Commands

### 1. Tạo lô cáp sạc:
```bash
curl -X POST http://localhost:3000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryID": 9,
    "ImportDate": "2025-06-28",
    "TotalQuantity": 5,
    "TotalImportValue": 750000
  }'
```

### 2. Kiểm tra sản phẩm đã tạo:
```bash
curl "http://localhost:3000/api/products-v2?batchId=20"
```

### 3. Test bán hàng với cáp sạc:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 77,
    "SalePrice": 30000000,
    "IncludeCable": true,
    "CableBatchId": 20,
    "CablePrice": 150000
  }'
```

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 28/06/2025  
**Phiên bản**: 1.0
