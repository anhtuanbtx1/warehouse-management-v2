# 🔌 Tính năng "Tặng Cáp sạc" khi Bán hàng

## ✨ Tổng quan
Khi bán hàng, người dùng có thể check vào option **"Tặng cáp sạc"**. Hệ thống sẽ tự động cộng giá cáp sạc vào giá nhập để tính lãi/lỗ chính xác hơn, trong khi flow bán hàng vẫn hoạt động bình thường.

## 🚀 Cách hoạt động

### 1. Giao diện bán hàng
- ✅ **Checkbox "Tặng cáp sạc"** xuất hiện trong form bán hàng
- ✅ **Hiển thị giá cáp sạc** tự động từ database (trung bình các cáp sạc có sẵn)
- ✅ **Tính toán lãi/lỗ real-time** khi check/uncheck

### 2. Logic tính toán
```javascript
// Không tặng cáp sạc
Lãi = Giá bán - Giá nhập

// Có tặng cáp sạc  
Lãi = Giá bán - (Giá nhập + Giá cáp sạc)
```

### 3. Lưu trữ thông tin
- ✅ **Ghi chú sản phẩm**: Tự động thêm "[Tặng cáp sạc +X VNĐ]"
- ✅ **Hóa đơn**: Lưu thông tin IncludeCable và CablePrice
- ✅ **Tính toán profit**: Đã trừ giá cáp sạc

## 📋 Demo thực tế

### Test Case 1: **Có tặng cáp sạc** 🔌
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 67,
    "SalePrice": 30000000,
    "PaymentMethod": "CASH", 
    "IncludeCable": true
  }'
```

**Kết quả:**
```json
{
  "InvoiceNumber": "HD2025000010",
  "FinalAmount": 30000000,
  "ProductName": "iPhone 16 Pro Max 256GB",
  "ImportPrice": 25000000,
  "Profit": 3966667,        // ← Đã trừ giá cáp sạc
  "CablePrice": 1033333,    // ← Giá cáp sạc tự động
  "IncludeCable": 1
}
```

### Test Case 2: **Không tặng cáp sạc** ❌
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 68,
    "SalePrice": 30000000,
    "PaymentMethod": "CASH",
    "IncludeCable": false
  }'
```

**Kết quả:**
```json
{
  "InvoiceNumber": "HD2025000011", 
  "FinalAmount": 30000000,
  "ProductName": "iPhone 16 Pro Max 512GB",
  "ImportPrice": 25000000,
  "Profit": 5000000,        // ← Không trừ giá cáp sạc
  "CablePrice": 0,
  "IncludeCable": 0
}
```

## 💰 So sánh Lãi/Lỗ

| Trường hợp | Giá bán | Giá nhập | Giá cáp sạc | **Lãi thực tế** | Chênh lệch |
|------------|---------|----------|-------------|-----------------|------------|
| **Không tặng cáp** | 30,000,000 | 25,000,000 | 0 | **5,000,000** | - |
| **Có tặng cáp** | 30,000,000 | 25,000,000 | 1,033,333 | **3,966,667** | -1,033,333 |

➡️ **Chênh lệch**: 1,033,333 VNĐ (chính xác bằng giá cáp sạc)

## 🎯 Lợi ích

### 📊 **Tính toán chính xác**
- Lãi/lỗ phản ánh đúng chi phí thực tế
- Không bị "ảo" lãi khi tặng cáp sạc

### 🔄 **Tự động hóa**
- Giá cáp sạc tự động từ database
- Không cần nhập thủ công

### 📝 **Tracking đầy đủ**
- Ghi chú rõ ràng trên sản phẩm
- Lưu trữ trong hóa đơn để báo cáo

## 🔧 Cài đặt và Test

### 1. Tạo sản phẩm test:
```bash
curl -X POST http://localhost:3000/api/products-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "BatchID": 17,
    "ProductName": "iPhone 16 Pro Max 256GB", 
    "IMEI": "123456789012345",
    "ImportPrice": 25000000,
    "Notes": "Test product for cable gift feature"
  }'
```

### 2. Test bán hàng có tặng cáp:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "ProductID": 67,
    "SalePrice": 30000000,
    "IncludeCable": true
  }'
```

### 3. Kiểm tra kết quả:
```bash
curl "http://localhost:3000/api/products-v2/67"
```

## 🎨 Giao diện

### Checkbox tặng cáp sạc:
```
🔌 Tặng cáp sạc (+ 1.033.333 VNĐ vào giá nhập để tính lãi/lỗ)
💡 Giá nhập sẽ được tính: 25.000.000 + 1.033.333 = 26.033.333
```

### Tính toán lãi/lỗ:
```
Giá nhập (+ cáp sạc)    Giá bán           Lãi/Lỗ
26.033.333 VNĐ         30.000.000 VNĐ    3.966.667 VNĐ (13.2%)
25.000.000 + 1.033.333                   
```

## 🔮 Tương lai

Có thể mở rộng cho các phụ kiện khác:
- 🎧 **Tặng tai nghe**: + giá tai nghe
- 📱 **Tặng ốp lưng**: + giá ốp lưng  
- 🔋 **Tặng pin dự phòng**: + giá pin
- 📦 **Combo phụ kiện**: + tổng giá combo

---
**Tác giả**: Augment Agent  
**Ngày tạo**: 27/06/2025  
**Phiên bản**: 1.0
