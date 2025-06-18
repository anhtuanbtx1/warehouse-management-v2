# Hệ thống Quản lý Kho hàng (Warehouse Management System)

## Tổng quan dự án

Đây là một hệ thống quản lý kho hàng toàn diện được xây dựng bằng Next.js 14, TypeScript, SQL Server và React Bootstrap. Hệ thống hỗ trợ quản lý sản phẩm, nhập hàng, xuất hàng, tồn kho, báo cáo và in hóa đơn.

## Tính năng chính

### 🏷️ Quản lý sản phẩm
- Thêm, sửa, xóa sản phẩm
- Phân loại theo danh mục
- Quản lý đơn vị tính
- Thiết lập giá vốn, giá bán
- Cảnh báo tồn kho tối thiểu/tối đa
- Upload hình ảnh sản phẩm

### 📦 Quản lý nhập hàng
- Tạo phiếu nhập hàng
- Quản lý nhà cung cấp
- Theo dõi chi tiết nhập hàng
- Quản lý lô hàng và hạn sử dụng
- Tính toán thuế và chiết khấu

### 🚚 Quản lý xuất hàng
- Tạo phiếu xuất hàng
- Quản lý khách hàng
- Theo dõi trạng thái thanh toán
- Kiểm tra tồn kho trước khi xuất
- In hóa đơn bán hàng

### 📊 Quản lý tồn kho
- Theo dõi tồn kho theo thời gian thực
- Cảnh báo tồn kho thấp
- Lịch sử xuất nhập tồn
- Báo cáo tồn kho theo kho, danh mục

### 📈 Báo cáo & Thống kê
- Báo cáo doanh thu theo thời gian
- Top sản phẩm bán chạy
- Báo cáo lợi nhuận
- Thống kê xuất nhập tồn
- Export báo cáo Excel/PDF

### 🖨️ In ấn
- In phiếu nhập hàng
- In phiếu xuất hàng
- In hóa đơn bán hàng
- In báo cáo tồn kho
- Template có thể tùy chỉnh

## Công nghệ sử dụng

### Frontend
- **Next.js 14**: Framework React với App Router
- **TypeScript**: Type safety
- **React Bootstrap**: UI Components
- **React Hook Form**: Form management
- **Yup**: Form validation
- **ApexCharts**: Biểu đồ và thống kê

### Backend
- **Next.js API Routes**: RESTful API
- **SQL Server**: Database chính
- **mssql**: SQL Server driver cho Node.js

### Database
- **SQL Server**: Lưu trữ dữ liệu
- **Stored Procedures**: Logic nghiệp vụ phức tạp
- **Triggers**: Tự động cập nhật tồn kho
- **Indexes**: Tối ưu performance

## Cấu trúc Database

### Bảng chính (với prefix CRM_)
- `CRM_Products`: Sản phẩm
- `CRM_Categories`: Danh mục sản phẩm
- `CRM_Units`: Đơn vị tính
- `CRM_Suppliers`: Nhà cung cấp
- `CRM_Customers`: Khách hàng
- `CRM_Warehouses`: Kho hàng
- `CRM_ImportOrders`: Phiếu nhập hàng
- `CRM_ImportOrderDetails`: Chi tiết phiếu nhập
- `CRM_ExportOrders`: Phiếu xuất hàng
- `CRM_ExportOrderDetails`: Chi tiết phiếu xuất
- `CRM_Inventory`: Tồn kho
- `CRM_StockMovements`: Lịch sử xuất nhập tồn
- `CRM_Users`: Người dùng
- `CRM_SystemSettings`: Cấu hình hệ thống

### Stored Procedures
- `SP_CRM_GetInventoryReport`: Báo cáo tồn kho
- `SP_CRM_GetRevenueReport`: Báo cáo doanh thu
- `SP_CRM_GetTopSellingProducts`: Top sản phẩm bán chạy
- `SP_CRM_GetLowStockAlert`: Cảnh báo tồn kho thấp

### Triggers
- `TR_CRM_ImportOrderDetails_UpdateInventory`: Tự động cập nhật tồn kho khi nhập hàng
- `TR_CRM_ExportOrderDetails_UpdateInventory`: Tự động cập nhật tồn kho khi xuất hàng

## Cài đặt và Chạy dự án

### 1. Yêu cầu hệ thống
- Node.js 18+
- SQL Server 2019+
- npm hoặc yarn

### 2. Clone và cài đặt dependencies
```bash
git clone <repository-url>
cd warehouse-management
npm install --legacy-peer-deps
```

### 3. Cấu hình Database
```bash
# Tạo database trong SQL Server
CREATE DATABASE WarehouseManagement;

# Chạy script tạo bảng
sqlcmd -S localhost -d WarehouseManagement -i database/schema.sql

# Chạy script tạo procedures
sqlcmd -S localhost -d WarehouseManagement -i database/procedures.sql

# Chạy script dữ liệu mẫu (tùy chọn)
sqlcmd -S localhost -d WarehouseManagement -i database/sample-data.sql
```

### 4. Cấu hình môi trường
```bash
# Copy file cấu hình
cp .env.example .env.local

# Chỉnh sửa thông tin database
DB_SERVER=localhost
DB_NAME=WarehouseManagement
DB_USER=sa
DB_PASSWORD=your_password
```

### 5. Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── products/          # API sản phẩm
│   │   ├── import-orders/     # API nhập hàng
│   │   ├── export-orders/     # API xuất hàng
│   │   ├── inventory/         # API tồn kho
│   │   └── reports/           # API báo cáo
│   └── warehouse/             # Pages
│       ├── products/          # Trang sản phẩm
│       ├── import/            # Trang nhập hàng
│       ├── export/            # Trang xuất hàng
│       ├── inventory/         # Trang tồn kho
│       └── reports/           # Trang báo cáo
├── components/
│   └── warehouse/             # Components
│       ├── ProductList.tsx
│       ├── ProductForm.tsx
│       ├── ImportOrderForm.tsx
│       └── ...
├── lib/
│   ├── database.ts            # Database connection
│   └── utils.ts               # Utilities
├── types/
│   └── warehouse.ts           # TypeScript types
└── utils/
    ├── formatters.ts          # Format functions
    └── validators.ts          # Validation functions

database/
├── schema.sql                 # Database schema
├── procedures.sql             # Stored procedures
└── sample-data.sql            # Dữ liệu mẫu
```

## API Endpoints

### Sản phẩm
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products/[id]` - Lấy thông tin sản phẩm
- `PUT /api/products/[id]` - Cập nhật sản phẩm
- `DELETE /api/products/[id]` - Xóa sản phẩm

### Nhập hàng
- `GET /api/import-orders` - Lấy danh sách phiếu nhập
- `POST /api/import-orders` - Tạo phiếu nhập mới
- `GET /api/import-orders/[id]` - Lấy chi tiết phiếu nhập
- `PUT /api/import-orders/[id]` - Cập nhật phiếu nhập
- `POST /api/import-orders/[id]/complete` - Hoàn thành phiếu nhập

### Xuất hàng
- `GET /api/export-orders` - Lấy danh sách phiếu xuất
- `POST /api/export-orders` - Tạo phiếu xuất mới
- `GET /api/export-orders/[id]` - Lấy chi tiết phiếu xuất
- `PUT /api/export-orders/[id]` - Cập nhật phiếu xuất

### Tồn kho
- `GET /api/inventory` - Lấy báo cáo tồn kho
- `GET /api/inventory/movements` - Lịch sử xuất nhập tồn
- `GET /api/inventory/alerts` - Cảnh báo tồn kho thấp

### Báo cáo
- `GET /api/reports/revenue` - Báo cáo doanh thu
- `GET /api/reports/top-products` - Top sản phẩm bán chạy
- `GET /api/reports/inventory` - Báo cáo tồn kho

## Tính năng nâng cao

### 1. Quản lý quyền người dùng
- Role-based access control
- Phân quyền theo module
- Audit log

### 2. Tích hợp thanh toán
- Nhiều phương thức thanh toán
- Theo dõi công nợ
- Lịch sử thanh toán

### 3. Quản lý đa kho
- Chuyển kho
- Tồn kho theo từng kho
- Báo cáo tổng hợp

### 4. Tích hợp với hệ thống khác
- API cho mobile app
- Webhook notifications
- Export/Import Excel

## Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Liên hệ

- Email: your-email@example.com
- Project Link: [https://github.com/your-username/warehouse-management](https://github.com/your-username/warehouse-management)
