# 📦 Warehouse Management System V2

Hệ thống quản lý kho hàng hiện đại được xây dựng với Next.js và SQL Server, tập trung vào quản lý theo lô hàng và tracking IMEI.

## ✨ Tính năng chính

### 📊 Dashboard
- **Doanh thu real-time**: Theo ngày, tháng, năm với growth tracking
- **Lãi/Lỗ**: Tính toán tự động với tỷ lệ profit margin
- **Tồn kho**: Quản lý theo lô hàng, số lượng chính xác
- **Hoạt động gần đây**: Timeline các giao dịch mới nhất

### 📱 Quản lý sản phẩm
- **IMEI tracking**: Mỗi sản phẩm có mã IMEI riêng
- **Batch management**: Quản lý theo lô nhập hàng
- **Dynamic pricing**: Giá bán được set tại thời điểm bán
- **Status tracking**: IN_STOCK, SOLD, DAMAGED, LOST

### 💰 Bán hàng
- **Quick sale**: Form bán hàng đơn giản, nhanh chóng
- **Auto invoicing**: Tự động tạo hóa đơn với số thứ tự
- **Profit calculation**: Tính lãi/lỗ real-time
- **Toast notifications**: Thông báo thành công/lỗi

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: React Bootstrap 5
- **Database**: SQL Server với stored procedures
- **Styling**: Custom CSS với responsive design
- **Icons**: Font Awesome 6

## 🚀 Cài đặt

1. **Clone repository:**
```bash
git clone https://github.com/[username]/warehouse-management-v2.git
cd warehouse-management-v2
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình database:**
```bash
# Tạo file .env.local
DB_HOST=your_server
DB_PORT=1433
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```

4. **Khởi chạy development server:**
```bash
npm run dev
```

5. **Mở trình duyệt:** http://localhost:3000/warehouse-v2

## 📁 Cấu trúc project

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── dashboard/          # Dashboard APIs
│   │   ├── products-v2/        # Product management
│   │   ├── sales/              # Sales processing
│   │   └── batches/            # Batch management
│   └── warehouse-v2/           # Main application
│       ├── page.tsx            # Dashboard page
│       ├── products/           # Product pages
│       ├── sales/              # Sales pages
│       └── globals.css         # Global styles
├── lib/
│   └── database.ts             # Database connection
└── database/
    └── schema_v2.sql           # Database schema
```

## 🎯 Tính năng nổi bật

### Quản lý theo lô hàng
- Mỗi lô có mã riêng và tracking chi tiết
- Tính toán tồn kho chính xác: Tổng nhập - Tổng bán
- Báo cáo hiệu quả từng lô

### Dynamic Pricing
- Giá bán được set tại thời điểm bán hàng
- Tính lãi/lỗ real-time dựa trên giá nhập
- Flexible pricing strategy

### Real-time Dashboard
- Cập nhật số liệu tức thì
- Charts và graphs trực quan
- Mobile responsive design

## 🔧 API Endpoints

- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/activities` - Hoạt động gần đây
- `GET /api/products-v2` - Danh sách sản phẩm
- `POST /api/sales` - Xử lý bán hàng
- `GET /api/dashboard/batches` - Quản lý lô hàng

## 📱 Responsive Design

- **Desktop**: Full features với sidebar navigation
- **Tablet**: Optimized layout với collapsible menu
- **Mobile**: Touch-friendly với bottom navigation

## 🎨 UI/UX Features

- **Large fonts**: Dễ đọc trên mọi thiết bị
- **High contrast colors**: Accessibility friendly
- **Toast notifications**: User feedback tức thì
- **Loading states**: Smooth user experience

## 📄 License

MIT License
