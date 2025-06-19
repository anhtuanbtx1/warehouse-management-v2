# 💰 Demo: Thêm Cột "Giá nhập" và "Lợi nhuận" vào Giao Dịch Bán Hàng

## 🎯 Tính Năng Đã Thực Hiện

### ✨ **Cột Mới Trong Bảng "Giao dịch bán hàng gần đây"**
- **Giá nhập**: Hiển thị giá nhập gốc của sản phẩm
- **Lợi nhuận**: Tính toán và hiển thị lợi nhuận (Giá bán - Giá nhập)
- **Color Coding**: Lợi nhuận dương (xanh), âm (đỏ), không có (xám)

### 📊 **Cấu Trúc Bảng Mới**

#### **Before (8 cột):**
```
| Số hóa đơn | Ngày bán | Sản phẩm | IMEI | Khách hàng | Giá bán | Trạng thái | Thao tác |
```

#### **After (10 cột):**
```
| Số hóa đơn | Ngày bán | Sản phẩm | IMEI | Khách hàng | Giá nhập | Giá bán | Lợi nhuận | Trạng thái | Thao tác |
```

## 🔧 **Technical Implementation**

### **📊 API Updates (route.ts):**
```typescript
// Updated SQL Query
const dataQuery = `
  SELECT 
    i.*,
    d.ProductName,
    d.IMEI,
    d.SalePrice as ProductSalePrice,
    p.ImportPrice,                    // ← NEW
    (d.SalePrice - p.ImportPrice) as Profit  // ← NEW
  FROM CRM_SalesInvoices i
  LEFT JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
  LEFT JOIN CRM_Products p ON d.ProductID = p.ProductID  // ← NEW JOIN
  ${whereClause}
  ORDER BY i.SaleDate DESC, i.CreatedAt DESC
`;

// Updated Interface
interface SalesInvoice {
  // ... existing fields
  ImportPrice?: number;  // ← NEW
  Profit?: number;       // ← NEW
}
```

### **🎨 UI Updates (page.tsx):**
```typescript
// New Table Headers
<th>Giá nhập</th>
<th>Giá bán</th>
<th>Lợi nhuận</th>

// New Table Cells
<td>
  <span className="text-info">
    {sale.ImportPrice ? formatCurrency(sale.ImportPrice) : '-'}
  </span>
</td>
<td>
  <span className="text-success fw-bold">
    {formatCurrency(sale.ProductSalePrice || sale.FinalAmount)}
  </span>
</td>
<td>
  <span className={`fw-bold ${
    sale.Profit && sale.Profit > 0 ? 'text-success' : 
    sale.Profit && sale.Profit < 0 ? 'text-danger' : 'text-muted'
  }`}>
    {sale.Profit ? formatCurrency(sale.Profit) : '-'}
  </span>
</td>
```

## 🎨 **Visual Design**

### **💰 Color Coding:**
- **Giá nhập**: `text-info` (xanh dương) - Thông tin tham khảo
- **Giá bán**: `text-success fw-bold` (xanh lá đậm) - Doanh thu
- **Lợi nhuận**: 
  - `text-success fw-bold` (xanh lá đậm) - Lãi
  - `text-danger fw-bold` (đỏ đậm) - Lỗ
  - `text-muted` (xám) - Không có dữ liệu

### **📱 Responsive Layout:**
- **Desktop**: Hiển thị đầy đủ 10 cột
- **Tablet**: Scroll horizontal để xem tất cả
- **Mobile**: Responsive table với scroll

## 🧪 **Test Cases**

### **Test 1: Hiển thị dữ liệu đầy đủ**
1. Truy cập `/warehouse-v2/sales`
2. Click tab "Giao dịch gần đây"
3. ✅ **Expected**: Thấy cột "Giá nhập" và "Lợi nhuận"
4. ✅ **Data**: Hiển thị đúng giá trị từ database

### **Test 2: Color coding lợi nhuận**
1. Xem các giao dịch có lợi nhuận khác nhau
2. ✅ **Lãi**: Số dương hiển thị màu xanh
3. ✅ **Lỗ**: Số âm hiển thị màu đỏ
4. ✅ **Không có**: Hiển thị "-" màu xám

### **Test 3: Format tiền tệ**
1. Kiểm tra format của các cột tiền
2. ✅ **Giá nhập**: Format VND (VD: 15.000.000 ₫)
3. ✅ **Giá bán**: Format VND (VD: 18.000.000 ₫)
4. ✅ **Lợi nhuận**: Format VND (VD: 3.000.000 ₫)

### **Test 4: Responsive design**
1. Test trên các kích thước màn hình khác nhau
2. ✅ **Desktop**: Hiển thị đầy đủ
3. ✅ **Mobile**: Scroll horizontal hoạt động

## 📊 **Business Value**

### **💼 Quản Lý Lợi Nhuận:**
- **Visibility**: Thấy rõ lợi nhuận từng giao dịch
- **Analysis**: Phân tích hiệu quả bán hàng
- **Decision Making**: Quyết định giá bán tốt hơn

### **📈 Báo Cáo Kinh Doanh:**
- **Profit Tracking**: Theo dõi lợi nhuận real-time
- **Cost Analysis**: Phân tích chi phí và doanh thu
- **Performance**: Đánh giá hiệu suất bán hàng

### **🎯 Examples:**
```
Giao dịch 1:
- Giá nhập: 15.000.000 ₫
- Giá bán: 18.000.000 ₫
- Lợi nhuận: 3.000.000 ₫ (20% margin)

Giao dịch 2:
- Giá nhập: 12.000.000 ₫
- Giá bán: 11.500.000 ₫
- Lợi nhuận: -500.000 ₫ (Loss sale)
```

## 🔍 **Data Flow**

### **📊 Database → API → UI:**
```
1. Database Query:
   - JOIN CRM_Products để lấy ImportPrice
   - Calculate Profit = SalePrice - ImportPrice

2. API Response:
   - ImportPrice: number
   - Profit: number (calculated)

3. UI Display:
   - Format currency với VND
   - Apply color coding
   - Show in table columns
```

### **🎯 Data Integrity:**
- **Source**: Dữ liệu từ CRM_Products (ImportPrice)
- **Calculation**: Real-time tính toán lợi nhuận
- **Accuracy**: Đảm bảo tính chính xác của số liệu

## 🌐 **Integration Points**

### **📍 Page Location:**
```
URL: http://localhost:3001/warehouse-v2/sales
Tab: "Giao dịch gần đây"
Component: Recent Sales Table
```

### **🔗 Related Features:**
- **Invoice Print**: Sử dụng dữ liệu lợi nhuận cho hóa đơn
- **Sales Analytics**: Cơ sở cho báo cáo phân tích
- **Product Management**: Liên kết với quản lý sản phẩm

## 🚀 **Ready for Testing**

### **Dev Server:**
```
URL: http://localhost:3001
Status: ✅ Running successfully
Feature: ✅ Profit columns active
```

### **Test Flow:**
1. **Navigate**: `http://localhost:3001/warehouse-v2/sales`
2. **Click**: Tab "Giao dịch gần đây"
3. **Observe**: New columns "Giá nhập" and "Lợi nhuận"
4. **Verify**: Color coding and currency formatting

### **Expected Results:**
- ✅ **New Columns**: "Giá nhập" và "Lợi nhuận" visible
- ✅ **Data Display**: Correct values from database
- ✅ **Color Coding**: Green for profit, red for loss
- ✅ **Currency Format**: Proper VND formatting
- ✅ **Responsive**: Works on all screen sizes

## 📋 **Code Changes Summary**

### **✅ API Updates:**
- Updated SQL query with JOIN to CRM_Products
- Added ImportPrice and Profit calculation
- Updated SalesInvoice interface

### **✅ UI Updates:**
- Added 2 new table columns
- Implemented color coding logic
- Added currency formatting
- Updated responsive design

### **✅ Business Logic:**
- Real-time profit calculation
- Proper data relationships
- Error handling for missing data

**🎉 Tính năng hiển thị "Giá nhập" và "Lợi nhuận" đã được triển khai thành công! Quản lý giờ có thể theo dõi lợi nhuận từng giao dịch một cách trực quan.**

**✨ Bạn có thể test ngay tại `http://localhost:3001/warehouse-v2/sales` → Tab "Giao dịch gần đây"!**
