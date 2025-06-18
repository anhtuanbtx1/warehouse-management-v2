-- =============================================
-- SAMPLE DATA FOR WAREHOUSE MANAGEMENT SYSTEM
-- =============================================

-- Insert sample categories
INSERT INTO CRM_Categories (CategoryName, Description) VALUES
('Điện tử', 'Các sản phẩm điện tử, thiết bị công nghệ'),
('Thời trang', 'Quần áo, phụ kiện thời trang'),
('Gia dụng', 'Đồ gia dụng, nội thất'),
('Thực phẩm', 'Thực phẩm, đồ uống'),
('Sách', 'Sách, văn phòng phẩm'),
('Thể thao', 'Dụng cụ thể thao, thể dục'),
('Làm đẹp', 'Mỹ phẩm, chăm sóc sức khỏe'),
('Xe cộ', 'Phụ tùng xe, phụ kiện ô tô');

-- Insert sample units
INSERT INTO CRM_Units (UnitName, UnitSymbol) VALUES
('Cái', 'cái'),
('Chiếc', 'chiếc'),
('Bộ', 'bộ'),
('Kilogram', 'kg'),
('Gram', 'g'),
('Lít', 'l'),
('Mét', 'm'),
('Hộp', 'hộp'),
('Thùng', 'thùng'),
('Gói', 'gói');

-- Insert sample warehouses
INSERT INTO CRM_Warehouses (WarehouseCode, WarehouseName, Address, ManagerName, Phone) VALUES
('KHO001', 'Kho Hà Nội', '123 Đường ABC, Quận Ba Đình, Hà Nội', 'Nguyễn Văn A', '0123456789'),
('KHO002', 'Kho TP.HCM', '456 Đường XYZ, Quận 1, TP.HCM', 'Trần Thị B', '0987654321'),
('KHO003', 'Kho Đà Nẵng', '789 Đường DEF, Quận Hải Châu, Đà Nẵng', 'Lê Văn C', '0369852147');

-- Insert sample suppliers
INSERT INTO CRM_Suppliers (SupplierCode, SupplierName, ContactPerson, Phone, Email, Address, TaxCode) VALUES
('NCC001', 'Công ty TNHH Điện tử ABC', 'Nguyễn Văn D', '0123111111', 'contact@abc.com', '111 Đường ABC, Hà Nội', '0123456789'),
('NCC002', 'Công ty CP Thời trang XYZ', 'Trần Thị E', '0123222222', 'info@xyz.com', '222 Đường XYZ, TP.HCM', '0987654321'),
('NCC003', 'Công ty TNHH Gia dụng DEF', 'Lê Văn F', '0123333333', 'sales@def.com', '333 Đường DEF, Đà Nẵng', '0369852147'),
('NCC004', 'Công ty CP Thực phẩm GHI', 'Phạm Thị G', '0123444444', 'order@ghi.com', '444 Đường GHI, Hà Nội', '0147258369'),
('NCC005', 'Công ty TNHH Sách JKL', 'Hoàng Văn H', '0123555555', 'book@jkl.com', '555 Đường JKL, TP.HCM', '0258147369');

-- Insert sample customers
INSERT INTO CRM_Customers (CustomerCode, CustomerName, ContactPerson, Phone, Email, Address, TaxCode, CustomerType) VALUES
('KH001', 'Công ty TNHH Bán lẻ A', 'Nguyễn Văn I', '0123666666', 'retail@a.com', '666 Đường A, Hà Nội', '0369741852', 'WHOLESALE'),
('KH002', 'Cửa hàng B', 'Trần Thị J', '0123777777', 'shop@b.com', '777 Đường B, TP.HCM', '0741852963', 'RETAIL'),
('KH003', 'Siêu thị C', 'Lê Văn K', '0123888888', 'market@c.com', '888 Đường C, Đà Nẵng', '0852963741', 'WHOLESALE'),
('KH004', 'Khách lẻ', '', '', '', '', '', 'RETAIL'),
('KH005', 'Công ty TNHH Phân phối D', 'Phạm Thị L', '0123999999', 'distribute@d.com', '999 Đường D, Hà Nội', '0963741852', 'WHOLESALE');

-- Insert sample products
INSERT INTO CRM_Products (ProductCode, ProductName, CategoryID, UnitID, Description, CostPrice, SalePrice, MinStock, MaxStock, Barcode) VALUES
('SP001', 'iPhone 15 Pro Max', 1, 1, 'Điện thoại thông minh cao cấp của Apple', 25000000, 30000000, 5, 50, '1234567890123'),
('SP002', 'Samsung Galaxy S24', 1, 1, 'Điện thoại thông minh flagship của Samsung', 20000000, 24000000, 5, 40, '1234567890124'),
('SP003', 'Laptop Dell XPS 13', 1, 1, 'Laptop cao cấp cho doanh nhân', 35000000, 42000000, 3, 20, '1234567890125'),
('SP004', 'Áo sơ mi nam', 2, 1, 'Áo sơ mi công sở cho nam', 200000, 350000, 20, 100, '1234567890126'),
('SP005', 'Quần jeans nữ', 2, 1, 'Quần jeans thời trang cho nữ', 300000, 500000, 15, 80, '1234567890127'),
('SP006', 'Nồi cơm điện', 3, 1, 'Nồi cơm điện tử 1.8L', 800000, 1200000, 10, 50, '1234567890128'),
('SP007', 'Bàn làm việc', 3, 1, 'Bàn làm việc gỗ công nghiệp', 1500000, 2200000, 5, 25, '1234567890129'),
('SP008', 'Gạo ST25', 4, 4, 'Gạo thơm cao cấp', 25000, 35000, 100, 500, '1234567890130'),
('SP009', 'Nước mắm', 4, 6, 'Nước mắm truyền thống Phú Quốc', 50000, 75000, 50, 200, '1234567890131'),
('SP010', 'Sách lập trình Python', 5, 1, 'Sách học lập trình Python cơ bản', 150000, 250000, 20, 100, '1234567890132'),
('SP011', 'Bút bi', 5, 1, 'Bút bi văn phòng', 5000, 8000, 100, 500, '1234567890133'),
('SP012', 'Bóng đá', 6, 1, 'Bóng đá FIFA Quality', 200000, 350000, 10, 50, '1234567890134'),
('SP013', 'Giày thể thao', 6, 2, 'Giày chạy bộ chuyên nghiệp', 800000, 1200000, 15, 60, '1234567890135'),
('SP014', 'Kem dưỡng da', 7, 8, 'Kem dưỡng da mặt chống lão hóa', 300000, 450000, 25, 100, '1234567890136'),
('SP015', 'Dầu gội', 7, 6, 'Dầu gội thảo dược', 80000, 120000, 30, 150, '1234567890137'),
('SP016', 'Lốp xe ô tô', 8, 1, 'Lốp xe ô tô 4 mùa', 1200000, 1800000, 8, 40, '1234567890138'),
('SP017', 'Dầu nhớt', 8, 6, 'Dầu nhớt tổng hợp cao cấp', 200000, 300000, 20, 100, '1234567890139'),
('SP018', 'Tai nghe Bluetooth', 1, 1, 'Tai nghe không dây chống ồn', 1500000, 2200000, 10, 50, '1234567890140'),
('SP019', 'Đồng hồ thông minh', 1, 1, 'Smartwatch theo dõi sức khỏe', 3000000, 4500000, 5, 30, '1234567890141'),
('SP020', 'Máy pha cà phê', 3, 1, 'Máy pha cà phê espresso', 5000000, 7500000, 3, 15, '1234567890142');

-- Insert sample users
INSERT INTO CRM_Users (Username, Email, PasswordHash, FullName, Role) VALUES
('admin', 'admin@warehouse.com', '$2b$10$hash_here', 'Quản trị viên', 'ADMIN'),
('manager1', 'manager1@warehouse.com', '$2b$10$hash_here', 'Nguyễn Văn Quản lý', 'MANAGER'),
('user1', 'user1@warehouse.com', '$2b$10$hash_here', 'Trần Thị Nhân viên', 'USER'),
('user2', 'user2@warehouse.com', '$2b$10$hash_here', 'Lê Văn Kho', 'USER');

-- Insert sample inventory (initial stock)
INSERT INTO CRM_Inventory (ProductID, WarehouseID, CurrentStock, ReservedStock) VALUES
-- Kho Hà Nội
(1, 1, 25, 0), (2, 1, 20, 0), (3, 1, 10, 0), (4, 1, 50, 0), (5, 1, 40, 0),
(6, 1, 30, 0), (7, 1, 15, 0), (8, 1, 200, 0), (9, 1, 100, 0), (10, 1, 50, 0),
-- Kho TP.HCM  
(1, 2, 20, 0), (2, 2, 25, 0), (3, 2, 8, 0), (4, 2, 60, 0), (5, 2, 45, 0),
(11, 2, 200, 0), (12, 2, 25, 0), (13, 2, 30, 0), (14, 2, 40, 0), (15, 2, 60, 0),
-- Kho Đà Nẵng
(16, 3, 20, 0), (17, 3, 50, 0), (18, 3, 25, 0), (19, 3, 15, 0), (20, 3, 8, 0);

-- Insert sample system settings
INSERT INTO CRM_SystemSettings (SettingKey, SettingValue, Description) VALUES
('COMPANY_NAME', 'Công ty TNHH Quản lý Kho hàng', 'Tên công ty'),
('COMPANY_ADDRESS', '123 Đường ABC, Quận 1, TP.HCM', 'Địa chỉ công ty'),
('COMPANY_PHONE', '0123456789', 'Số điện thoại công ty'),
('COMPANY_EMAIL', 'info@warehouse.com', 'Email công ty'),
('TAX_RATE', '10', 'Thuế VAT mặc định (%)'),
('CURRENCY', 'VND', 'Đơn vị tiền tệ'),
('LOW_STOCK_ALERT', '1', 'Bật cảnh báo tồn kho thấp'),
('AUTO_GENERATE_CODE', '1', 'Tự động tạo mã sản phẩm'),
('BACKUP_FREQUENCY', 'DAILY', 'Tần suất sao lưu dữ liệu'),
('REPORT_LOGO', '/images/logo.png', 'Logo cho báo cáo');

-- Sample import orders
INSERT INTO CRM_ImportOrders (ImportOrderCode, SupplierID, WarehouseID, ImportDate, TotalAmount, TaxAmount, DiscountAmount, FinalAmount, Status, Notes, CreatedBy) VALUES
('PN202400001', 1, 1, '2024-01-15', 100000000, 10000000, 0, 110000000, 'COMPLETED', 'Nhập hàng điện tử tháng 1', 'admin'),
('PN202400002', 2, 2, '2024-01-20', 50000000, 5000000, 2000000, 53000000, 'COMPLETED', 'Nhập hàng thời trang', 'manager1'),
('PN202400003', 3, 1, '2024-02-01', 75000000, 7500000, 0, 82500000, 'PENDING', 'Nhập hàng gia dụng', 'user1');

-- Sample import order details
INSERT INTO CRM_ImportOrderDetails (ImportOrderID, ProductID, Quantity, UnitPrice, TotalPrice, BatchNumber) VALUES
-- Phiếu nhập 1
(1, 1, 10, 25000000, 250000000, 'BATCH001'),
(1, 2, 8, 20000000, 160000000, 'BATCH002'),
-- Phiếu nhập 2  
(2, 4, 50, 200000, 10000000, 'BATCH003'),
(2, 5, 40, 300000, 12000000, 'BATCH004'),
-- Phiếu nhập 3
(3, 6, 20, 800000, 16000000, 'BATCH005'),
(3, 7, 10, 1500000, 15000000, 'BATCH006');

-- Sample export orders
INSERT INTO CRM_ExportOrders (ExportOrderCode, CustomerID, WarehouseID, ExportDate, TotalAmount, TaxAmount, DiscountAmount, FinalAmount, Status, PaymentStatus, Notes, CreatedBy) VALUES
('PX202400001', 1, 1, '2024-01-25', 60000000, 6000000, 3000000, 63000000, 'COMPLETED', 'PAID', 'Bán cho công ty A', 'user1'),
('PX202400002', 2, 2, '2024-02-05', 25000000, 2500000, 0, 27500000, 'COMPLETED', 'UNPAID', 'Bán lẻ', 'user2'),
('PX202400003', 3, 1, '2024-02-10', 45000000, 4500000, 2000000, 47500000, 'PENDING', 'UNPAID', 'Đơn hàng siêu thị', 'manager1');

-- Sample export order details
INSERT INTO CRM_ExportOrderDetails (ExportOrderID, ProductID, Quantity, UnitPrice, TotalPrice, BatchNumber) VALUES
-- Phiếu xuất 1
(1, 1, 2, 30000000, 60000000, 'BATCH001'),
-- Phiếu xuất 2
(2, 4, 10, 350000, 3500000, 'BATCH003'),
(2, 5, 8, 500000, 4000000, 'BATCH004'),
-- Phiếu xuất 3
(3, 6, 5, 1200000, 6000000, 'BATCH005'),
(3, 7, 3, 2200000, 6600000, 'BATCH006');
