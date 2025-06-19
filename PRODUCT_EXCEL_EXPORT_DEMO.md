# 📱 Demo: Chức Năng Xuất Excel Danh Sách Sản Phẩm

## 🎯 Tính Năng Mới

### ✨ **Button "Xuất Excel" cho Sản Phẩm**
- **Vị trí**: Header của danh sách sản phẩm (ProductListV2)
- **Màu sắc**: Outline xanh lá (outline-success variant)
- **Icon**: 📄 (file icon)
- **Tooltip**: "Xuất danh sách sản phẩm ra Excel"

### 📋 **Dữ Liệu Xuất (14 cột)**
Tất cả thông tin sản phẩm với các cột:

1. **STT** - Số thứ tự
2. **Tên sản phẩm** - ProductName
3. **IMEI** - Mã IMEI
4. **Danh mục** - CategoryName
5. **Mã lô hàng** - BatchCode
6. **Ngày nhập** - ImportDate (dd/mm/yyyy)
7. **Giá nhập** - ImportPrice (số)
8. **Giá bán** - SalePrice (số)
9. **Lãi/Lỗ** - Profit/Loss (số)
10. **Trạng thái** - Status (tiếng Việt)
11. **Thông tin khách hàng** - CustomerInfo
12. **Ngày bán** - SoldDate (dd/mm/yyyy)
13. **Ghi chú** - Notes
14. **Ngày tạo** - CreatedAt (dd/mm/yyyy)

## 🔧 Cách Sử Dụng

### **📍 Các Trang Có Chức Năng Xuất Excel:**

#### **1. Trang Nhập Hàng - Tab "Sản phẩm trong lô"**
```
http://localhost:3001/warehouse-v2/import
→ Click tab "📱 Sản phẩm trong lô"
→ Click "📄 Xuất Excel"
```

#### **2. Trang Bán Hàng - Tab "Sản phẩm có thể bán"**
```
http://localhost:3001/warehouse-v2/sales
→ Tab "Sản phẩm có thể bán" (mặc định)
→ Click "📄 Xuất Excel"
```

#### **3. Trang Tồn Kho - Sản phẩm trong lô**
```
http://localhost:3001/warehouse-v2/inventory
→ Click vào một lô hàng
→ Tab "📱 Sản phẩm trong lô"
→ Click "📄 Xuất Excel"
```

## 🎨 **Giao Diện**

### **Header Layout:**
```
[📱 Danh sách sản phẩm]                    [📄 Xuất Excel]
```

### **🍞 Toast Notification:**
- **Success**: "Xuất Excel thành công!" + "File Danh_sach_san_pham_DD-MM-YYYY.xlsx đã được tải xuống"
- **Error**: "Có lỗi xảy ra khi xuất Excel!" + "Vui lòng thử lại sau"

## 📊 **Tính Năng Nâng Cao**

### **🎯 Lọc Dữ Liệu**
- Xuất theo bộ lọc hiện tại:
  - Tìm kiếm theo tên/IMEI
  - Lọc theo trạng thái
  - Lọc theo danh mục
  - Lọc theo lô hàng cụ thể
- Tối đa 1000 records

### **📐 Định Dạng Excel**
- **Cột có độ rộng tối ưu**:
  - STT (5), Tên sản phẩm (20), IMEI (18)
  - Danh mục (15), Mã lô hàng (15), Ngày nhập (12)
  - Giá nhập (15), Giá bán (15), Lãi/Lỗ (12)
  - Trạng thái (12), Thông tin KH (20), Ngày bán (12)
  - Ghi chú (25), Ngày tạo (12)

### **🌐 Localization**
- **Header tiếng Việt**: Tất cả tiêu đề cột bằng tiếng Việt
- **Trạng thái tiếng Việt**: 
  - IN_STOCK → "Còn hàng"
  - SOLD → "Đã bán"
  - DAMAGED → "Hỏng"
  - RETURNED → "Trả lại"
- **Ngày tháng**: Định dạng dd/mm/yyyy

## 🧪 **Test Cases**

### **Test 1: Xuất sản phẩm có thể bán**
1. Truy cập `/warehouse-v2/sales`
2. Tab "Sản phẩm có thể bán" (mặc định)
3. Click "📄 Xuất Excel"
4. ✅ **Expected**: Chỉ xuất sản phẩm có trạng thái "Còn hàng"

### **Test 2: Xuất sản phẩm trong lô cụ thể**
1. Truy cập `/warehouse-v2/import`
2. Click tab "📱 Sản phẩm trong lô"
3. Chọn một lô hàng
4. Click "📄 Xuất Excel"
5. ✅ **Expected**: Chỉ xuất sản phẩm của lô đã chọn

### **Test 3: Xuất với bộ lọc**
1. Truy cập bất kỳ trang nào có ProductListV2
2. Áp dụng bộ lọc (tìm kiếm, trạng thái, danh mục)
3. Click "📄 Xuất Excel"
4. ✅ **Expected**: Chỉ xuất sản phẩm theo bộ lọc

### **Test 4: Toast notification**
1. Click "📄 Xuất Excel"
2. ✅ **Expected**: Toast xanh xuất hiện ở top-right
3. ✅ **Message**: "Xuất Excel thành công!"
4. ✅ **Auto-dismiss**: Tự động biến mất sau vài giây

## 📱 **Responsive Design**
- **Desktop**: Button hiển thị đầy đủ text "Xuất Excel"
- **Mobile**: Button responsive, icon và text vẫn rõ ràng
- **Tablet**: Layout adapts properly

## 🎯 **Business Value**

### **📊 Báo Cáo Sản Phẩm:**
- **Inventory Report**: Báo cáo tồn kho chi tiết
- **Sales Report**: Báo cáo bán hàng theo sản phẩm
- **Profit Analysis**: Phân tích lãi/lỗ từng sản phẩm
- **Batch Tracking**: Theo dõi sản phẩm theo lô

### **📈 Phân Tích Kinh Doanh:**
- **Product Performance**: Hiệu suất bán hàng từng sản phẩm
- **Category Analysis**: Phân tích theo danh mục
- **Customer Tracking**: Theo dõi thông tin khách hàng
- **Import/Export**: Quản lý nhập xuất

## 🔧 **Technical Implementation**

### **📦 Dependencies:**
- ✅ **xlsx**: Library tạo file Excel
- ✅ **useToast**: Toast notification system

### **🎯 Integration:**
- ✅ **API**: Sử dụng `/api/products-v2` với filters
- ✅ **Responsive**: Bootstrap responsive design
- ✅ **Error Handling**: Try-catch với user feedback

### **⚡ Performance:**
- **Client-side**: Xử lý Excel generation ở client
- **Efficient**: Fetch data với limit 1000
- **Fast**: Không cần server processing

## 🌐 **Multi-Page Support**

### **📍 Available Pages:**
1. **Import Management**: `/warehouse-v2/import` (Tab: Sản phẩm trong lô)
2. **Sales Management**: `/warehouse-v2/sales` (Tab: Sản phẩm có thể bán)
3. **Inventory Management**: `/warehouse-v2/inventory` (Sản phẩm trong lô)

### **🎯 Context-Aware Export:**
- **Import Page**: Xuất sản phẩm của lô đang xem
- **Sales Page**: Xuất chỉ sản phẩm có thể bán (IN_STOCK)
- **Inventory Page**: Xuất sản phẩm của lô đang xem

## 🚀 **Ready for Testing**

### **Dev Server:**
```
http://localhost:3001
Status: ✅ Running successfully
```

### **Test URLs:**
```
📱 Sales: http://localhost:3001/warehouse-v2/sales
📦 Import: http://localhost:3001/warehouse-v2/import
📋 Inventory: http://localhost:3001/warehouse-v2/inventory
```

**🎉 Chức năng xuất Excel cho sản phẩm đã được triển khai hoàn chỉnh trên tất cả các trang liên quan!**

**✨ Người dùng giờ có thể xuất báo cáo sản phẩm chi tiết với toast notification chuyên nghiệp!**
