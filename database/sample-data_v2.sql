-- =============================================
-- SAMPLE DATA FOR WAREHOUSE MANAGEMENT V2
-- =============================================

-- Insert sample categories (các dòng điện thoại)
INSERT INTO CRM_Categories (CategoryName, Description) VALUES
('iPhone 16', 'Dòng iPhone 16 series'),
('iPhone 15', 'Dòng iPhone 15 series'),
('iPhone 14', 'Dòng iPhone 14 series'),
('Samsung Galaxy S24', 'Dòng Samsung Galaxy S24 series'),
('Samsung Galaxy S23', 'Dòng Samsung Galaxy S23 series'),
('Xiaomi 14', 'Dòng Xiaomi 14 series'),
('OPPO Find X7', 'Dòng OPPO Find X7 series'),
('Vivo V30', 'Dòng Vivo V30 series');

-- Insert sample users
INSERT INTO CRM_Users (Username, Email, PasswordHash, FullName, Role) VALUES
('admin', 'admin@phonestore.com', '$2b$10$hash_here', 'Quản trị viên', 'ADMIN'),
('manager1', 'manager1@phonestore.com', '$2b$10$hash_here', 'Nguyễn Văn Quản lý', 'MANAGER'),
('seller1', 'seller1@phonestore.com', '$2b$10$hash_here', 'Trần Thị Bán hàng', 'USER'),
('seller2', 'seller2@phonestore.com', '$2b$10$hash_here', 'Lê Văn Nhân viên', 'USER');

-- Insert sample customers
INSERT INTO CRM_Customers (CustomerName, Phone, Email, Address) VALUES
('Nguyễn Văn A', '0123456789', 'nguyenvana@email.com', '123 Đường ABC, Hà Nội'),
('Trần Thị B', '0987654321', 'tranthib@email.com', '456 Đường XYZ, TP.HCM'),
('Lê Văn C', '0369852147', 'levanc@email.com', '789 Đường DEF, Đà Nẵng'),
('Phạm Thị D', '0147258369', 'phamthid@email.com', '321 Đường GHI, Hải Phòng'),
('Hoàng Văn E', '0258147369', 'hoangvane@email.com', '654 Đường JKL, Cần Thơ');

-- Insert sample system settings
INSERT INTO CRM_SystemSettings (SettingKey, SettingValue, Description) VALUES
('COMPANY_NAME', 'Cửa hàng điện thoại ABC', 'Tên cửa hàng'),
('COMPANY_ADDRESS', '123 Đường Nguyễn Huệ, Quận 1, TP.HCM', 'Địa chỉ cửa hàng'),
('COMPANY_PHONE', '0123456789', 'Số điện thoại cửa hàng'),
('COMPANY_EMAIL', 'info@phonestore.com', 'Email cửa hàng'),
('TAX_RATE', '10', 'Thuế VAT mặc định (%)'),
('CURRENCY', 'VND', 'Đơn vị tiền tệ'),
('WARRANTY_PERIOD', '12', 'Thời gian bảo hành (tháng)'),
('RETURN_PERIOD', '7', 'Thời gian đổi trả (ngày)');

-- Tạo lô hàng mẫu bằng stored procedure
EXEC SP_CRM_CreateImportBatch 
    @CategoryID = 1, 
    @ImportDate = '2024-06-15', 
    @TotalQuantity = 10, 
    @TotalImportValue = 250000000, 
    @Notes = 'Lô iPhone 16 Pro Max đầu tiên', 
    @CreatedBy = 'admin';

EXEC SP_CRM_CreateImportBatch 
    @CategoryID = 2, 
    @ImportDate = '2024-06-16', 
    @TotalQuantity = 8, 
    @TotalImportValue = 160000000, 
    @Notes = 'Lô iPhone 15 Pro', 
    @CreatedBy = 'manager1';

EXEC SP_CRM_CreateImportBatch 
    @CategoryID = 4, 
    @ImportDate = '2024-06-17', 
    @TotalQuantity = 12, 
    @TotalImportValue = 180000000, 
    @Notes = 'Lô Samsung Galaxy S24 Ultra', 
    @CreatedBy = 'admin';

-- Thêm sản phẩm vào lô hàng 1 (iPhone 16 Pro Max)
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 256GB Natural Titanium', @IMEI = '356789012345671', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 256GB Blue Titanium', @IMEI = '356789012345672', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 256GB White Titanium', @IMEI = '356789012345673', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 256GB Black Titanium', @IMEI = '356789012345674', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 512GB Natural Titanium', @IMEI = '356789012345675', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 512GB Blue Titanium', @IMEI = '356789012345676', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 512GB White Titanium', @IMEI = '356789012345677', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 512GB Black Titanium', @IMEI = '356789012345678', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 1TB Natural Titanium', @IMEI = '356789012345679', @ImportPrice = 25000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 1, @ProductName = 'iPhone 16 Pro Max 1TB Blue Titanium', @IMEI = '356789012345680', @ImportPrice = 25000000;

-- Thêm sản phẩm vào lô hàng 2 (iPhone 15 Pro)
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 128GB Natural Titanium', @IMEI = '356789012345681', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 128GB Blue Titanium', @IMEI = '356789012345682', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 256GB Natural Titanium', @IMEI = '356789012345683', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 256GB Blue Titanium', @IMEI = '356789012345684', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 256GB White Titanium', @IMEI = '356789012345685', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 256GB Black Titanium', @IMEI = '356789012345686', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 512GB Natural Titanium', @IMEI = '356789012345687', @ImportPrice = 20000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 2, @ProductName = 'iPhone 15 Pro 512GB Blue Titanium', @IMEI = '356789012345688', @ImportPrice = 20000000;

-- Thêm sản phẩm vào lô hàng 3 (Samsung Galaxy S24 Ultra)
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 256GB Titanium Black', @IMEI = '356789012345689', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 256GB Titanium Gray', @IMEI = '356789012345690', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 256GB Titanium Violet', @IMEI = '356789012345691', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 256GB Titanium Yellow', @IMEI = '356789012345692', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 512GB Titanium Black', @IMEI = '356789012345693', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 512GB Titanium Gray', @IMEI = '356789012345694', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 512GB Titanium Violet', @IMEI = '356789012345695', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 512GB Titanium Yellow', @IMEI = '356789012345696', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 1TB Titanium Black', @IMEI = '356789012345697', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 1TB Titanium Gray', @IMEI = '356789012345698', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 1TB Titanium Violet', @IMEI = '356789012345699', @ImportPrice = 15000000;
EXEC SP_CRM_AddProductToBatch @BatchID = 3, @ProductName = 'Samsung Galaxy S24 Ultra 1TB Titanium Yellow', @IMEI = '356789012345700', @ImportPrice = 15000000;

-- Bán một số sản phẩm mẫu
EXEC SP_CRM_SellProduct @ProductID = 1, @SalePrice = 30000000, @CustomerName = 'Nguyễn Văn A', @CustomerPhone = '0123456789', @PaymentMethod = 'CASH', @CreatedBy = 'seller1';
EXEC SP_CRM_SellProduct @ProductID = 2, @SalePrice = 29500000, @CustomerName = 'Trần Thị B', @CustomerPhone = '0987654321', @PaymentMethod = 'CARD', @CreatedBy = 'seller1';
EXEC SP_CRM_SellProduct @ProductID = 11, @SalePrice = 24000000, @CustomerName = 'Lê Văn C', @CustomerPhone = '0369852147', @PaymentMethod = 'TRANSFER', @CreatedBy = 'seller2';
EXEC SP_CRM_SellProduct @ProductID = 21, @SalePrice = 18000000, @CustomerName = 'Phạm Thị D', @CustomerPhone = '0147258369', @PaymentMethod = 'CASH', @CreatedBy = 'seller1';
EXEC SP_CRM_SellProduct @ProductID = 22, @SalePrice = 17500000, @CustomerName = 'Hoàng Văn E', @CustomerPhone = '0258147369', @PaymentMethod = 'CARD', @CreatedBy = 'seller2';

-- Kiểm tra dữ liệu
SELECT 'Import Batches' as TableName, COUNT(*) as RecordCount FROM CRM_ImportBatches
UNION ALL
SELECT 'Products', COUNT(*) FROM CRM_Products
UNION ALL
SELECT 'Sales Invoices', COUNT(*) FROM CRM_SalesInvoices
UNION ALL
SELECT 'Products IN_STOCK', COUNT(*) FROM CRM_Products WHERE Status = 'IN_STOCK'
UNION ALL
SELECT 'Products SOLD', COUNT(*) FROM CRM_Products WHERE Status = 'SOLD';

-- Hiển thị báo cáo tồn kho
EXEC SP_CRM_GetInventoryReport;
