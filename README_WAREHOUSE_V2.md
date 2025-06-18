# Hệ thống Quản lý Kho hàng V2 - Chuyên biệt cho Điện thoại

## Tổng quan dự án

Hệ thống quản lý kho hàng V2 được thiết kế đặc biệt cho việc quản lý sản phẩm điện thoại có IMEI. Hệ thống tập trung vào việc quản lý theo lô hàng và theo dõi từng sản phẩm cụ thể thông qua IMEI.

## 🎯 **Business Rules đã được áp dụng**

### **1. Phiếu nhập kho (Lô hàng)**
- **Mã lô hàng**: Tự động generate theo format `LOT + YYYYMMDDHHMMSS`
- **Ngày nhập**: Chọn ngày hôm nay
- **Số lượng**: Tổng số lượng sản phẩm trong lô
- **Giá trị**: Tổng số tiền nhập của lô hàng
- **Danh mục**: Chọn từ danh mục có sẵn (VD: iPhone 16, Samsung Galaxy S24)

### **2. Sản phẩm**
- **Tên sản phẩm**: VD: iPhone 16 Pro Max 256GB
- **Mã máy (IMEI)**: Mã IMEI duy nhất của điện thoại (15 số)
- **Giá nhập**: Giá trị sản phẩm khi nhập
- **Giá bán**: Mặc định = 0, cập nhật khi bán
- **Thuộc lô hàng**: Liên kết với lô hàng đã tạo
- **Trạng thái**: IN_STOCK, SOLD, DAMAGED, RETURNED

### **3. Xuất kho (Bán hàng)**
- **Hiển thị**: Chỉ những sản phẩm có trạng thái IN_STOCK
- **Thông tin**: Tên sản phẩm, IMEI, giá bán
- **Quy trình**: Nhập giá bán → In hóa đơn → Cập nhật trạng thái SOLD
- **Hóa đơn**: Tự động tạo số hóa đơn theo format `HD + YYYYMMDD + 001`

### **4. Tồn kho**
- **Báo cáo theo lô hàng**: Mã lô, ngày nhập, số lượng nhập/xuất/tồn
- **Tính toán lãi/lỗ**: (Tổng tiền bán - Tổng tiền nhập) theo lô
- **Thống kê**: Tỷ lệ lợi nhuận, sản phẩm bán chạy

## 🗄️ **Cấu trúc Database V2**

### **Bảng chính**
- `CRM_Categories`: Danh mục sản phẩm (iPhone 16, Samsung S24...)
- `CRM_ImportBatches`: Lô hàng nhập (thay thế ImportOrders)
- `CRM_Products`: Sản phẩm cụ thể với IMEI
- `CRM_SalesInvoices`: Hóa đơn bán hàng
- `CRM_SalesInvoiceDetails`: Chi tiết hóa đơn
- `CRM_Customers`: Khách hàng
- `CRM_Users`: Người dùng hệ thống
- `CRM_ProductStatusHistory`: Lịch sử thay đổi trạng thái
- `CRM_SystemSettings`: Cấu hình hệ thống

### **Stored Procedures chính**
- `SP_CRM_CreateImportBatch`: Tạo lô hàng mới
- `SP_CRM_AddProductToBatch`: Thêm sản phẩm vào lô
- `SP_CRM_GetAvailableProducts`: Lấy sản phẩm có thể bán
- `SP_CRM_SellProduct`: Bán sản phẩm và tạo hóa đơn
- `SP_CRM_GetInventoryReport`: Báo cáo tồn kho theo lô
- `SP_CRM_GetBatchProductDetails`: Chi tiết sản phẩm trong lô

### **Functions hỗ trợ**
- `FN_CRM_GenerateBatchCode()`: Tạo mã lô hàng tự động
- `FN_CRM_GenerateInvoiceNumber()`: Tạo số hóa đơn tự động

### **Triggers tự động**
- `TR_CRM_Products_UpdateBatchStats`: Cập nhật thống kê lô khi bán hàng
- `TR_CRM_Products_StatusHistory`: Ghi lại lịch sử thay đổi trạng thái

## 🔧 **API Endpoints V2**

### **Lô hàng (Import Batches)**
- `GET /api/import-batches` - Danh sách lô hàng
- `POST /api/import-batches` - Tạo lô hàng mới

### **Sản phẩm V2**
- `GET /api/products-v2` - Danh sách sản phẩm
- `GET /api/products-v2?availableOnly=true` - Sản phẩm có thể bán
- `POST /api/products-v2` - Thêm sản phẩm vào lô

### **Bán hàng**
- `GET /api/sales` - Danh sách hóa đơn
- `POST /api/sales` - Bán sản phẩm và tạo hóa đơn

### **Tồn kho V2**
- `GET /api/inventory-v2` - Báo cáo tồn kho theo lô
- `GET /api/inventory-v2/batch/[id]` - Chi tiết lô hàng
- `GET /api/inventory-v2/stats` - Thống kê tổng quan

## 🚀 **Cài đặt và Chạy**

### **1. Cài đặt Database**
```sql
-- Tạo database
CREATE DATABASE WarehouseManagement;

-- Chạy schema V2
sqlcmd -S localhost -d WarehouseManagement -i database/schema_v2.sql

-- Chạy procedures V2
sqlcmd -S localhost -d WarehouseManagement -i database/procedures_v2.sql

-- Chạy dữ liệu mẫu V2
sqlcmd -S localhost -d WarehouseManagement -i database/sample-data_v2.sql
```

### **2. Cấu hình ứng dụng**
```bash
# Cài đặt dependencies
npm install mssql --legacy-peer-deps

# Cấu hình .env.local
DB_SERVER=localhost
DB_NAME=WarehouseManagement
DB_USER=sa
DB_PASSWORD=your_password

# Chạy ứng dụng
npm run dev
```

## 📊 **Workflow nghiệp vụ**

### **1. Nhập hàng**
1. Tạo lô hàng mới với thông tin cơ bản
2. Thêm từng sản phẩm vào lô với IMEI cụ thể
3. Hệ thống tự động cập nhật thống kê lô hàng

### **2. Bán hàng**
1. Tìm kiếm sản phẩm có sẵn (IN_STOCK)
2. Nhập giá bán và thông tin khách hàng
3. Hệ thống tự động:
   - Tạo hóa đơn với số tự động
   - Cập nhật trạng thái sản phẩm thành SOLD
   - Cập nhật thống kê lô hàng
   - Ghi lại lịch sử thay đổi

### **3. Báo cáo tồn kho**
1. Xem báo cáo theo lô hàng
2. Theo dõi lãi/lỗ theo từng lô
3. Phân tích hiệu quả kinh doanh

## 🔍 **Tính năng nổi bật**

### **Serial Tracking**
- Theo dõi từng sản phẩm qua IMEI
- Lịch sử đầy đủ từ nhập đến bán
- Không thể trùng lặp IMEI

### **Batch Management**
- Quản lý theo lô hàng
- Tính toán lãi/lỗ theo lô
- Thống kê hiệu quả từng lô

### **Auto Generation**
- Mã lô hàng tự động
- Số hóa đơn tự động
- Cập nhật thống kê tự động

### **Real-time Updates**
- Triggers tự động cập nhật
- Thống kê real-time
- Trạng thái đồng bộ

## 📈 **Báo cáo và Thống kê**

### **Báo cáo tồn kho**
- Tồn kho theo lô hàng
- Lãi/lỗ theo lô
- Tỷ lệ bán hàng

### **Báo cáo bán hàng**
- Doanh thu theo ngày/tháng
- Sản phẩm bán chạy
- Hiệu quả theo danh mục

### **Thống kê tổng quan**
- Dashboard tổng quan
- KPI kinh doanh
- Xu hướng bán hàng

## 🔒 **Bảo mật và Kiểm soát**

### **Data Integrity**
- IMEI unique constraint
- Foreign key relationships
- Check constraints cho giá trị

### **Audit Trail**
- Lịch sử thay đổi trạng thái
- Tracking người thực hiện
- Timestamp đầy đủ

### **Business Rules Enforcement**
- Không bán sản phẩm đã bán
- Giá bán phải > 0
- IMEI phải đúng format

## 🎯 **Roadmap phát triển**

### **Phase 2**
- Quản lý bảo hành
- Đổi trả sản phẩm
- Tích hợp thanh toán

### **Phase 3**
- Mobile app
- Barcode scanning
- Inventory alerts

### **Phase 4**
- Multi-store management
- Advanced analytics
- Customer loyalty program

---

**Hệ thống này đã được thiết kế đặc biệt cho nghiệp vụ quản lý điện thoại với IMEI, đảm bảo tính chính xác và hiệu quả cao trong việc theo dõi từng sản phẩm cụ thể.**
