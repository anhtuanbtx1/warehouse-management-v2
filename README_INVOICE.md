# 🧾 Tính Năng In Hóa Đơn - Warehouse Management V2

## 📋 Tổng Quan

Tính năng in hóa đơn cho phép tạo và in hóa đơn bán hàng chuyên nghiệp với đầy đủ thông tin sản phẩm, khách hàng và tính toán lợi nhuận.

## ✨ Tính Năng Chính

### 🎯 **Hóa Đơn Chuyên Nghiệp**
- **Header công ty**: Logo, tên, địa chỉ, MST
- **Thông tin hóa đơn**: Số hóa đơn, ngày bán, nhân viên
- **Thông tin khách hàng**: Tên, SĐT, địa chỉ (hoặc "Khách lẻ")
- **Chi tiết sản phẩm**: Tên, IMEI, loại, lô hàng, giá
- **Tính toán**: Lợi nhuận, tỷ suất, tổng thanh toán
- **Chữ ký**: Khu vực ký tên khách hàng và nhân viên

### 🖨️ **Tối Ưu Cho In Ấn**
- **Format A4**: Tự động điều chỉnh cho giấy A4
- **Print CSS**: CSS riêng cho chế độ in
- **Typography**: Font chữ rõ ràng, dễ đọc
- **Layout**: Bố cục chuyên nghiệp, cân đối

### 💰 **Chuyển Đổi Số Thành Chữ**
- **Tiếng Việt**: Chuyển số tiền thành chữ tiếng Việt
- **Đầy đủ**: Hỗ trợ từ đơn vị đến tỷ
- **Chính xác**: Logic chuyển đổi chuẩn

## 🚀 Cách Sử Dụng

### 1. **Bán Sản Phẩm và In Hóa Đơn**

#### **Bước 1: Truy cập trang Import**
```
http://localhost:3000/warehouse-v2/import
```

#### **Bước 2: Chọn sản phẩm để bán**
- Click tab "Danh sách lô hàng"
- Chọn một lô hàng và click "Xem chi tiết"
- Trong tab "Sản phẩm trong lô", tìm sản phẩm có trạng thái "Còn hàng"
- Click nút **🛒** (Bán) màu xanh

#### **Bước 3: Nhập thông tin bán hàng**
- **Giá bán**: Nhập giá bán (có format tự động: 25000000 → 25.000.000)
- **Phương thức**: Chọn Tiền mặt/Thẻ/Chuyển khoản
- **Xem lợi nhuận**: Hệ thống tự động tính toán và hiển thị

#### **Bước 4: Bán và in hóa đơn**
- Click nút "Bán & In hóa đơn"
- Hệ thống sẽ:
  - Cập nhật trạng thái sản phẩm thành "Đã bán"
  - Tạo hóa đơn tự động
  - Hiển thị modal in hóa đơn

#### **Bước 5: In hóa đơn**
- Modal hóa đơn sẽ hiển thị với đầy đủ thông tin
- Click nút "In hóa đơn" để mở chế độ in
- Sử dụng Ctrl+P hoặc chọn máy in để in

### 2. **Test Tính Năng In Hóa Đơn**

#### **Test với dữ liệu mẫu:**
```
http://localhost:3000/warehouse-v2/test-invoice
```
- **Hóa đơn có khách hàng**: Test với thông tin khách hàng đầy đủ
- **Hóa đơn khách lẻ**: Test với khách hàng không có thông tin

#### **Test với dữ liệu thực từ database:**
```
http://localhost:3000/warehouse-v2/test-sales-invoice
```
- **Dữ liệu thực**: Sử dụng giao dịch thực từ database
- **Tính năng đầy đủ**: Test với dữ liệu bán hàng thực tế

#### **Test trong trang Sales:**
```
http://localhost:3000/warehouse-v2/sales
```
- **Tab "Giao dịch gần đây"**: Click nút "In hóa đơn" trong cột thao tác
- **Dữ liệu thực**: Sử dụng giao dịch đã thực hiện

## 📊 Cấu Trúc Hóa Đơn

### **1. Header Công Ty**
```
🏪 CỬA HÀNG ĐIỆN THOẠI ABC
HÓA ĐƠN BÁN HÀNG

📍 Địa chỉ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
📞 Hotline: 0123.456.789 | ✉️ Email: info@cuahang.com
MST: 0123456789 | Website: www.cuahang.com
```

### **2. Thông Tin Hóa Đơn & Khách Hàng**
```
┌─────────────────────────┬─────────────────────────┐
│ 📄 Thông tin hóa đơn    │ 👤 Thông tin khách hàng │
│ Số hóa đơn: HD2025000010│ Tên: Nguyễn Văn A       │
│ Ngày bán: 18/06/2025    │ SĐT: 0123456789         │
│ Nhân viên: Admin        │ Địa chỉ: 123 ABC...     │
└─────────────────────────┴─────────────────────────┘
```

### **3. Chi Tiết Sản Phẩm**
```
┌─────┬──────────────────────┬─────────────┬─────────┬─────────────┬─────────────┬────┬─────────────┐
│ STT │ Tên sản phẩm         │ IMEI        │ Loại    │ Lô hàng     │ Đơn giá     │ SL │ Thành tiền  │
├─────┼──────────────────────┼─────────────┼─────────┼─────────────┼─────────────┼────┼─────────────┤
│  1  │ iPhone 15 Pro 256GB  │ 356789...   │ iPhone  │ LOT2025...  │ 25.000.000₫ │ 1  │ 25.000.000₫ │
└─────┴──────────────────────┴─────────────┴─────────┴─────────────┴─────────────┴────┴─────────────┘
```

### **4. Tính Toán Lợi Nhuận & Tổng Thanh Toán**
```
┌─────────────────────────┬─────────────────────────┐
│ 📈 Thông tin lợi nhuận  │ 🧮 Tổng thanh toán      │
│ Giá nhập: 20.000.000₫   │ Tổng tiền hàng: 25M₫    │
│ Giá bán: 25.000.000₫    │ Thuế VAT (0%): 0₫       │
│ Lợi nhuận: 5.000.000₫   │ Giảm giá: 0₫            │
│ Tỷ suất LN: 25.0%       │ TỔNG: 25.000.000₫       │
│                         │ (Hai mươi lăm triệu đồng)│
└─────────────────────────┴─────────────────────────┘
```

### **5. Chữ Ký & Footer**
```
┌─────────────────────────┬─────────────────────────┐
│      Khách hàng         │     Người bán hàng      │
│  (Ký và ghi rõ họ tên)  │  (Ký và ghi rõ họ tên)  │
│                         │                         │
│                         │                         │
│  ___________________    │  ___________________    │
└─────────────────────────┴─────────────────────────┘

🎉 Cảm ơn quý khách đã mua hàng! 🎉
✅ Sản phẩm được bảo hành theo chính sách của nhà sản xuất
✅ Quý khách vui lòng kiểm tra kỹ sản phẩm trước khi nhận hàng
✅ Mọi thắc mắc xin liên hệ hotline: 0123.456.789

📅 Hóa đơn được in lúc: 18/06/2025 17:00:00
```

## 🎨 Tính Năng UI/UX

### **1. Format Tiền Tệ Tự Động**
- **Input**: `25000000` → **Display**: `25.000.000`
- **Placeholder**: "Nhập giá bán (VD: 25.000.000)"
- **Helper text**: "Nhập số tiền, hệ thống sẽ tự động thêm dấu phân cách"

### **2. Tính Toán Thời Gian Thực**
- **Lợi nhuận**: Tự động tính khi nhập giá bán
- **Tỷ suất**: Hiển thị % lợi nhuận
- **Màu sắc**: Xanh (lãi), Đỏ (lỗ), Xám (hòa vốn)

### **3. Modal Chuyên Nghiệp**
- **Preview**: Xem trước hóa đơn trước khi in
- **Responsive**: Tự động điều chỉnh theo màn hình
- **Print-ready**: CSS tối ưu cho in ấn

## 🔧 Cấu Hình In Ấn

### **1. Cài Đặt Máy In**
- **Khổ giấy**: A4 (210 × 297 mm)
- **Orientation**: Portrait (dọc)
- **Margins**: 15mm tất cả các cạnh
- **Scale**: 100%

### **2. Cài Đặt Trình Duyệt**
- **Chrome/Edge**: Ctrl+P → More settings → Paper size: A4
- **Firefox**: Ctrl+P → More settings → Format: A4
- **Safari**: Cmd+P → Paper Size: A4

### **3. Lưu PDF**
- **Destination**: Save as PDF
- **Layout**: Portrait
- **Paper size**: A4
- **Margins**: Default

## 📱 Responsive Design

### **Desktop (≥992px)**
- Layout 2 cột cho thông tin
- Font size chuẩn
- Spacing thoải mái

### **Tablet (768px-991px)**
- Layout responsive
- Font size điều chỉnh
- Spacing compact

### **Mobile (<768px)**
- Layout 1 cột
- Font size nhỏ hơn
- Spacing tối ưu

## 🔒 Bảo Mật & Validation

### **1. Input Validation**
- **Giá bán**: Phải > 0
- **Số tiền**: Chỉ cho phép số
- **IMEI**: Unique trong hệ thống

### **2. Data Integrity**
- **Database**: Lưu số nguyên (không format)
- **Display**: Hiển thị có format
- **API**: Gửi/nhận số thuần

### **3. Error Handling**
- **Network**: Xử lý lỗi kết nối
- **Validation**: Hiển thị lỗi cụ thể
- **Fallback**: Giá trị mặc định

## 🚀 Performance

### **1. Lazy Loading**
- Component chỉ load khi cần
- CSS in riêng biệt
- Font optimization

### **2. Memory Management**
- Clean up khi unmount
- Optimize re-renders
- Efficient state updates

### **3. Print Optimization**
- CSS media queries
- Font fallbacks
- Image optimization

## 📞 Hỗ Trợ

### **Liên Hệ**
- **Email**: support@warehouse.com
- **Phone**: 0123.456.789
- **Website**: www.warehouse.com

### **Tài Liệu**
- **API Docs**: `/docs/api`
- **User Guide**: `/docs/user-guide`
- **FAQ**: `/docs/faq`
