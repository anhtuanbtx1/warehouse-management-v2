# 📦 Tính năng Chọn Lô Cáp sạc khi Bán hàng

## ✨ Tổng quan
Khi bán hàng có thể **chọn lô cáp sạc cụ thể** và bán sản phẩm cáp sạc từ lô đó theo **đúng giá nhập** của sản phẩm. Điều này giúp:
- ✅ **Quản lý tồn kho chính xác** theo từng lô
- ✅ **Tính toán lãi/lỗ đúng** theo giá thực tế của lô
- ✅ **Linh hoạt giá bán** cáp sạc theo từng lô khác nhau

## 🚀 Cách hoạt động

### 1. API lấy danh sách lô cáp sạc
```bash
GET /api/cable-batches
```

**Response:**
```json
[
  {
    "BatchID": 16,
    "BatchCode": "LOT20250627225725", 
    "AvailableProducts": 1,
    "AvgPrice": 100000,
    "MinPrice": 100000,
    "MaxPrice": 100000,
    "Notes": "Cáp sạc Type-C to Lightning"
  },
  {
    "BatchID": 18,
    "BatchCode": "LOT20250627230227",
    "AvailableProducts": 9, 
    "AvgPrice": 1500000,
    "MinPrice": 1500000,
    "MaxPrice": 1500000
  }
]
```

### 2. Giao diện chọn lô
```
🔌 Bán kèm cáp sạc (+ 100.000 VNĐ vào giá nhập để tính lãi/lỗ)

Chọn lô cáp sạc:
┌─────────────────────────────────────────────────────────────┐
│ LOT20250627225725 - 1 sản phẩm - 100.000 VNĐ/cái          │
│ LOT20250627230227 - 9 sản phẩm - 1.500.000 VNĐ/cái        │
└─────────────────────────────────────────────────────────────┘

📦 Lô LOT20250627225725
• Còn lại: 1 sản phẩm
• Giá: 100.000 - 100.000 VNĐ  
• Trung bình: 100.000 VNĐ
```

### 3. Logic bán hàng
```javascript
// Request
{
  "ProductID": 74,
  "SalePrice": 28000000,
  "IncludeCable": true,
  "CableBatchId": 16,        // ← Chọn lô cụ thể
  "CablePrice": 100000       // ← Giá từ lô được chọn
}

// Tổng tiền hóa đơn = SalePrice + CablePrice
TotalAmount = 28000000 + 100000 = 28100000
```

## 📋 Demo thực tế

### Test Case 1: **Lô cáp sạc giá rẻ** 💰
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 74,
    "SalePrice": 28000000,
    "IncludeCable": true,
    "CableBatchId": 16,
    "CablePrice": 100000
  }'
```

**Kết quả:**
```json
{
  "InvoiceNumber": "HD2025000016",
  "FinalAmount": 28100000,        // ← 28M + 100K
  "ProductName": "iPhone 16 Pro 256GB",
  "ImportPrice": 22000000,
  "Profit": 6000000,              // ← Đã trừ giá cáp sạc
  "CablePrice": 100000,
  "SoldCableId": 55,
  "SoldCableName": "Cáp sạc Type-C to Lightning #1"
}
```

### Test Case 2: **Lô cáp sạc giá cao** 💎
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 75,
    "SalePrice": 30000000,
    "IncludeCable": true,
    "CableBatchId": 18,
    "CablePrice": 1500000
  }'
```

**Kết quả:**
```json
{
  "InvoiceNumber": "HD2025000017", 
  "FinalAmount": 31500000,        // ← 30M + 1.5M
  "ProductName": "iPhone 16 Pro 512GB",
  "ImportPrice": 24000000,
  "Profit": 6000000,              // ← Đã trừ giá cáp sạc đắt
  "CablePrice": 1500000,
  "SoldCableId": 57,
  "SoldCableName": "Cáp sạc #1"
}
```

## 📊 So sánh Lô cáp sạc

| Lô | Mã lô | Tồn kho | Giá/cái | Tổng HĐ | Lãi thực |
|----|-------|---------|---------|---------|----------|
| **Lô 16** | LOT...225725 | 2→1 | 100,000 | 28,100,000 | 6,000,000 |
| **Lô 18** | LOT...230227 | 10→9 | 1,500,000 | 31,500,000 | 6,000,000 |

➡️ **Chênh lệch tổng tiền**: 3,400,000 VNĐ (do giá cáp sạc khác nhau)

## 🎯 Lợi ích

### 📦 **Quản lý tồn kho theo lô**
- Tracking chính xác từng lô cáp sạc
- Biết lô nào bán chạy, lô nào ế

### 💰 **Linh hoạt giá bán**
- Lô cáp sạc rẻ → Tổng hóa đơn thấp hơn
- Lô cáp sạc đắt → Tổng hóa đơn cao hơn
- Tính lãi/lỗ chính xác theo giá thực tế

### 📊 **Báo cáo chi tiết**
- Biết cáp sạc nào đã bán từ lô nào
- Phân tích hiệu quả kinh doanh theo lô

### 🔄 **Tự động hóa thông minh**
- Tự động chọn sản phẩm từ lô được chỉ định
- Cập nhật tồn kho real-time

## 🔧 Hóa đơn chi tiết

### Hóa đơn HD2025000016 (Lô cáp rẻ):
| Sản phẩm | Giá bán | Giá nhập | Lãi/Lỗ |
|----------|---------|----------|---------|
| iPhone 16 Pro 256GB | 28,000,000 | 22,000,000 | +6,000,000 |
| Cáp sạc (Lô 16) | 100,000 | 100,000 | 0 |
| **Tổng cộng** | **28,100,000** | **22,100,000** | **+6,000,000** |

### Hóa đơn HD2025000017 (Lô cáp đắt):
| Sản phẩm | Giá bán | Giá nhập | Lãi/Lỗ |
|----------|---------|----------|---------|
| iPhone 16 Pro 512GB | 30,000,000 | 24,000,000 | +6,000,000 |
| Cáp sạc (Lô 18) | 1,500,000 | 1,500,000 | 0 |
| **Tổng cộng** | **31,500,000** | **25,500,000** | **+6,000,000** |

## ⚠️ Xử lý trường hợp đặc biệt

### Lô hết hàng:
- Hệ thống sẽ thông báo "Lô này đã hết hàng"
- Tự động chuyển sang lô khác có sẵn

### Không chọn lô cụ thể:
- Hệ thống tự động chọn lô có giá thấp nhất
- Ưu tiên lô cũ nhất (FIFO)

## 🔧 Test Commands

### 1. Lấy danh sách lô cáp sạc:
```bash
curl "http://localhost:3000/api/cable-batches"
```

### 2. Bán với lô cáp sạc cụ thể:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 74,
    "SalePrice": 28000000,
    "IncludeCable": true,
    "CableBatchId": 16,
    "CablePrice": 100000
  }'
```

### 3. Kiểm tra tồn kho sau bán:
```bash
curl "http://localhost:3000/api/cable-batches"
```

## 🔮 Tương lai

Có thể mở rộng cho:
- 🎧 **Chọn lô tai nghe** theo thương hiệu
- 📱 **Chọn lô ốp lưng** theo màu sắc
- 🔋 **Chọn lô pin dự phòng** theo dung lượng
- 📦 **Quản lý combo** nhiều phụ kiện

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 27/06/2025  
**Phiên bản**: 1.0
