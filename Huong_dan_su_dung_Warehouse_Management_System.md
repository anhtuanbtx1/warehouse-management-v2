# 📦 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ KHO HÀNG
## WAREHOUSE MANAGEMENT SYSTEM V2

---

## 📋 MỤC LỤC

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Dashboard - Trang chủ](#3-dashboard---trang-chủ)
4. [Quản lý nhập hàng](#4-quản-lý-nhập-hàng)
5. [Quản lý bán hàng](#5-quản-lý-bán-hàng)
6. [Quản lý tồn kho](#6-quản-lý-tồn-kho)
7. [Báo cáo bán hàng](#7-báo-cáo-bán-hàng)
8. [Các tính năng nâng cao](#8-các-tính-năng-nâng-cao)
9. [Xử lý sự cố thường gặp](#9-xử-lý-sự-cố-thường-gặp)

---

## 1. GIỚI THIỆU TỔNG QUAN

### 1.1 Về hệ thống
Hệ thống Quản lý Kho hàng V2 là một ứng dụng web hiện đại được thiết kế đặc biệt cho việc quản lý kho hàng điện tử (điện thoại, máy tính bảng...) với các tính năng:

- **Quản lý theo lô hàng**: Mỗi lần nhập hàng tạo thành một lô riêng biệt
- **Tracking IMEI**: Theo dõi từng sản phẩm qua mã IMEI duy nhất
- **Tính giá động**: Giá bán được thiết lập tại thời điểm bán hàng
- **Báo cáo lãi/lỗ**: Tính toán tự động lợi nhuận theo từng lô hàng
- **In hóa đơn**: Hỗ trợ in hóa đơn bán hàng và nhập hàng

### 1.2 Yêu cầu hệ thống
- **Trình duyệt**: Chrome, Firefox, Safari, Edge (phiên bản mới nhất)
- **Kết nối internet**: Ổn định để đồng bộ dữ liệu
- **Độ phân giải màn hình**: Tối thiểu 1024x768px

### 1.3 Cấu trúc menu chính
- **Dashboard**: Trang chủ với thống kê tổng quan
- **Nhập hàng**: Quản lý lô hàng và sản phẩm nhập kho
- **Bán hàng**: Xử lý đơn hàng và bán sản phẩm
- **Tồn kho**: Báo cáo tình trạng tồn kho theo lô
- **Báo cáo**: Thống kê doanh thu và lợi nhuận

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### 2.1 Truy cập hệ thống
1. Mở trình duyệt web
2. Nhập địa chỉ: `http://localhost:3001/warehouse-v2/login`
3. Hệ thống sẽ hiển thị trang đăng nhập

### 2.2 Thực hiện đăng nhập
1. **Nhập thông tin đăng nhập**:
   - Username: Tên đăng nhập được cấp
   - Password: Mật khẩu tương ứng

2. **Nhấn nút "Đăng nhập"**
   - Hệ thống sẽ xác thực thông tin
   - Nếu thành công, chuyển đến trang Dashboard

### 2.3 Xử lý lỗi đăng nhập
- **Sai thông tin**: Kiểm tra lại username/password
- **Kết nối lỗi**: Kiểm tra internet và thử lại
- **Tài khoản bị khóa**: Liên hệ quản trị viên

---

## 3. DASHBOARD - TRANG CHỦ

### 3.1 Tổng quan Dashboard
Dashboard là trang chủ hiển thị thông tin tổng quan về tình trạng kinh doanh:

#### 3.1.1 Thẻ thống kê chính
- **Doanh thu**: Tổng doanh thu hôm nay/tháng này
- **Lãi/Lỗ**: Tính toán lợi nhuận với tỷ lệ phần trăm
- **Tồn kho**: Số lượng sản phẩm còn lại trong kho
- **Hoạt động gần đây**: Danh sách giao dịch mới nhất

#### 3.1.2 Biểu đồ doanh thu
- Hiển thị doanh thu theo tháng trong năm
- Có thể xem theo năm khác nhau
- Cập nhật real-time khi có giao dịch mới

### 3.2 Thao tác nhanh
Dashboard cung cấp các nút thao tác nhanh:

1. **Nhập hàng**: Chuyển đến trang tạo lô hàng mới
2. **Bán hàng**: Chuyển đến trang bán sản phẩm
3. **Tồn kho**: Xem báo cáo tồn kho chi tiết
4. **Báo cáo**: Truy cập các báo cáo thống kê

### 3.3 Hoạt động gần đây
Hiển thị 10 giao dịch mới nhất bao gồm:
- Thời gian thực hiện
- Loại hoạt động (Nhập hàng/Bán hàng)
- Sản phẩm liên quan
- Giá trị giao dịch
- Người thực hiện

---

## 4. QUẢN LÝ NHẬP HÀNG

### 4.1 Khái niệm lô hàng
Lô hàng là đơn vị quản lý cơ bản trong hệ thống:
- Mỗi lần nhập hàng tạo thành một lô riêng biệt
- Mỗi lô có mã định danh duy nhất (VD: LOT-2024-001)
- Tất cả sản phẩm trong cùng lô có cùng giá nhập
- Hệ thống tính lãi/lỗ theo từng lô

### 4.2 Tạo lô hàng mới

#### 4.2.1 Truy cập trang nhập hàng
1. Từ menu chính, chọn **"Nhập hàng"**
2. Hoặc từ Dashboard, nhấn nút **"Nhập hàng"** trong phần thao tác nhanh

#### 4.2.2 Tạo lô hàng
1. **Nhấn nút "Tạo lô hàng mới"** (màu xanh lá)
2. **Điền thông tin lô hàng**:
   - **Danh mục**: Chọn loại sản phẩm (iPhone 16, Samsung S24...)
   - **Ngày nhập**: Mặc định là ngày hiện tại
   - **Số lượng dự kiến**: Tổng số sản phẩm sẽ nhập
   - **Giá nhập đơn vị**: Giá nhập cho mỗi sản phẩm
   - **Tổng giá trị nhập**: Tự động tính = Số lượng × Giá nhập
   - **Ghi chú**: Thông tin bổ sung (tùy chọn)

3. **Nhấn "Tạo lô hàng"** để hoàn tất

#### 4.2.3 Lưu ý quan trọng
- Giá nhập đơn vị sẽ áp dụng cho tất cả sản phẩm trong lô
- Số lượng dự kiến có thể điều chỉnh sau khi tạo lô
- Mã lô hàng được tạo tự động theo format: LOT-YYYY-XXX

### 4.3 Quản lý sản phẩm trong lô

#### 4.3.1 Thêm sản phẩm vào lô
1. **Chọn tab "Sản phẩm trong lô"**
2. **Chọn lô hàng** từ danh sách (nếu chưa chọn)
3. **Nhấn nút "Thêm SP"** (màu xanh lá)
4. **Điền thông tin sản phẩm**:
   - **Tên sản phẩm**: Tên chi tiết (VD: iPhone 16 Pro Max 256GB Gold)
   - **IMEI**: Mã IMEI duy nhất (15 số)
   - **Giá nhập**: Tự động điền từ lô hàng (có thể điều chỉnh)
   - **Ghi chú**: Thông tin bổ sung về sản phẩm

5. **Nhấn "Thêm sản phẩm"** để lưu

#### 4.3.2 Lưu ý về IMEI
- IMEI phải là duy nhất trong toàn hệ thống
- Không được trùng lặp với sản phẩm đã có
- Định dạng: 15 chữ số liên tiếp
- Hệ thống sẽ báo lỗi nếu IMEI đã tồn tại

#### 4.3.3 Giới hạn số lượng
- Không thể thêm quá số lượng dự kiến của lô
- Khi đạt đủ số lượng, nút "Thêm SP" sẽ bị vô hiệu hóa
- Có thể tăng số lượng dự kiến bằng cách sửa lô hàng

### 4.4 Chỉnh sửa thông tin lô hàng

#### 4.4.1 Sửa thông tin lô
1. **Tìm lô cần sửa** trong danh sách
2. **Nhấn nút "Sửa"** (biểu tượng bút chì)
3. **Chỉnh sửa thông tin**:
   - Danh mục sản phẩm
   - Số lượng dự kiến
   - Tổng giá trị nhập
   - Ghi chú

4. **Nhấn "Cập nhật"** để lưu thay đổi

#### 4.4.2 Hạn chế khi sửa
- Không thể giảm số lượng xuống dưới số sản phẩm đã nhập
- Không thể thay đổi ngày nhập sau khi tạo
- Giá nhập sẽ được tính lại tự động

### 4.5 Xuất Excel danh sách lô hàng

#### 4.5.1 Xuất toàn bộ danh sách
1. **Nhấn nút "Xuất Excel"** (biểu tượng file)
2. **Chọn vị trí lưu file**
3. **File Excel sẽ chứa**:
   - Mã lô hàng
   - Ngày nhập
   - Danh mục
   - Số lượng (nhập/bán/tồn)
   - Giá trị (nhập/bán)
   - Lợi nhuận
   - Trạng thái lô

#### 4.5.2 Lọc trước khi xuất
- Có thể lọc theo danh mục
- Lọc theo khoảng thời gian
- Lọc theo trạng thái lô
- File Excel sẽ chỉ chứa dữ liệu đã lọc

### 4.6 In hóa đơn nhập hàng

#### 4.6.1 In hóa đơn cho lô
1. **Tìm lô cần in** trong danh sách
2. **Nhấn nút "Hóa đơn"** (biểu tượng hóa đơn)
3. **Xem trước hóa đơn** trên màn hình
4. **Nhấn "In"** để in ra máy in

#### 4.6.2 Nội dung hóa đơn nhập
- Thông tin lô hàng (mã, ngày, danh mục)
- Danh sách sản phẩm trong lô
- Tổng số lượng và giá trị
- Thông tin người tạo

---

## 5. QUẢN LÝ BÁN HÀNG

### 5.1 Khái niệm bán hàng
Hệ thống bán hàng hoạt động theo nguyên tắc:
- Bán từng sản phẩm riêng lẻ theo IMEI
- Giá bán được thiết lập tại thời điểm bán
- Tự động tính lợi nhuận = Giá bán - Giá nhập
- Cập nhật trạng thái sản phẩm từ IN_STOCK thành SOLD

### 5.2 Thực hiện bán hàng

#### 5.2.1 Truy cập trang bán hàng
1. Từ menu chính, chọn **"Bán hàng"**
2. Hoặc từ Dashboard, nhấn **"Bán hàng"** trong thao tác nhanh

#### 5.2.2 Tìm sản phẩm để bán
1. **Sử dụng thanh tìm kiếm**:
   - Tìm theo tên sản phẩm
   - Tìm theo mã IMEI
   - Tìm theo mã lô hàng

2. **Lọc sản phẩm**:
   - Lọc theo danh mục
   - Chỉ hiển thị sản phẩm còn hàng (IN_STOCK)

3. **Chọn sản phẩm** từ danh sách hiển thị

#### 5.2.3 Thực hiện giao dịch bán
1. **Nhấn nút "Bán"** trên sản phẩm muốn bán
2. **Điền thông tin bán hàng**:
   - **Giá bán**: Nhập giá bán thực tế
   - **Thông tin khách hàng**: Tên, số điện thoại (tùy chọn)
   - **Ghi chú**: Thông tin bổ sung về giao dịch

3. **Xem thông tin lợi nhuận**:
   - Hệ thống tự động tính: Lợi nhuận = Giá bán - Giá nhập
   - Hiển thị tỷ lệ lợi nhuận phần trăm

4. **Nhấn "Xác nhận bán"** để hoàn tất

#### 5.2.4 Xác nhận giao dịch
- Hệ thống sẽ cập nhật trạng thái sản phẩm thành SOLD
- Tạo bản ghi giao dịch với thời gian hiện tại
- Cập nhật thống kê lô hàng tự động
- Hiển thị thông báo thành công

### 5.3 In hóa đơn bán hàng

#### 5.3.1 In hóa đơn ngay sau bán
1. **Sau khi bán thành công**, nhấn **"In hóa đơn"**
2. **Xem trước hóa đơn** trên màn hình
3. **Nhấn "In"** để in ra máy in

#### 5.3.2 In hóa đơn từ danh sách giao dịch
1. **Tìm giao dịch** trong danh sách giao dịch gần đây
2. **Nhấn nút "In"** (biểu tượng máy in)
3. **Hóa đơn sẽ hiển thị** để xem trước và in

#### 5.3.3 Nội dung hóa đơn bán hàng
- Thông tin sản phẩm (tên, IMEI)
- Giá bán và thời gian bán
- Thông tin khách hàng (nếu có)
- Số hóa đơn tự động
- Thông tin người bán

### 5.4 Quản lý giao dịch bán hàng

#### 5.4.1 Xem danh sách giao dịch
- Hiển thị tất cả giao dịch bán hàng
- Sắp xếp theo thời gian mới nhất
- Thông tin: Sản phẩm, giá bán, lợi nhuận, thời gian

#### 5.4.2 Tìm kiếm giao dịch
- Tìm theo tên sản phẩm
- Tìm theo IMEI
- Tìm theo thông tin khách hàng
- Lọc theo khoảng thời gian

---

## 6. QUẢN LÝ TỒN KHO

### 6.1 Tổng quan tồn kho
Hệ thống quản lý tồn kho theo nguyên tắc:
- Tồn kho được tính theo từng lô hàng
- Hiển thị số lượng: Nhập - Bán - Tồn
- Tính toán lãi/lỗ theo từng lô
- Cập nhật real-time khi có giao dịch

### 6.2 Xem báo cáo tồn kho

#### 6.2.1 Truy cập trang tồn kho
1. Từ menu chính, chọn **"Tồn kho"**
2. Hoặc từ Dashboard, nhấn **"Tồn kho"** trong thao tác nhanh

#### 6.2.2 Thông tin hiển thị
Mỗi lô hàng hiển thị:
- **Mã lô hàng**: Mã định danh duy nhất
- **Danh mục**: Loại sản phẩm
- **Ngày nhập**: Thời gian tạo lô
- **Số lượng nhập**: Tổng sản phẩm đã nhập
- **Số lượng bán**: Tổng sản phẩm đã bán
- **Số lượng tồn**: Còn lại trong kho
- **Giá trị nhập**: Tổng tiền đã đầu tư
- **Giá trị bán**: Tổng tiền đã thu về
- **Lãi/Lỗ**: Lợi nhuận thực tế
- **Trạng thái**: ACTIVE, PARTIAL, COMPLETE

### 6.3 Lọc và tìm kiếm

#### 6.3.1 Bộ lọc có sẵn
- **Theo danh mục**: Chọn loại sản phẩm cụ thể
- **Theo trạng thái**: ACTIVE (còn hàng), COMPLETE (hết hàng)
- **Theo thời gian**: Từ ngày - đến ngày nhập hàng

#### 6.3.2 Tìm kiếm nhanh
- Tìm theo mã lô hàng
- Tìm theo tên danh mục
- Kết quả hiển thị ngay lập tức

### 6.4 Xuất báo cáo Excel

#### 6.4.1 Xuất toàn bộ báo cáo
1. **Nhấn nút "Xuất Excel"** trên đầu trang
2. **Chọn vị trí lưu file**
3. **File Excel chứa đầy đủ thông tin** tồn kho

#### 6.4.2 Xuất báo cáo đã lọc
1. **Áp dụng bộ lọc** theo nhu cầu
2. **Nhấn "Xuất Excel"**
3. **File sẽ chỉ chứa dữ liệu** đã được lọc

### 6.5 Phân tích hiệu quả kinh doanh

#### 6.5.1 Đánh giá lô hàng
- **Lô có lãi cao**: Màu xanh, tỷ lệ lợi nhuận tốt
- **Lô thua lỗ**: Màu đỏ, cần xem xét chiến lược
- **Lô bán chậm**: Tồn kho cao, cần khuyến mãi

#### 6.5.2 Chỉ số quan trọng
- **Tỷ lệ bán hàng**: (Đã bán / Tổng nhập) × 100%
- **Tỷ lệ lợi nhuận**: (Lãi/lỗ / Giá trị nhập) × 100%
- **Thời gian tồn kho**: Số ngày từ nhập đến hết hàng

---

## 7. BÁO CÁO BÁN HÀNG

### 7.1 Tổng quan báo cáo
Trang báo cáo bán hàng cung cấp thông tin chi tiết về:
- Tất cả sản phẩm đã bán
- Thống kê doanh thu và lợi nhuận
- Lọc theo nhiều tiêu chí
- Xuất báo cáo Excel chi tiết

### 7.2 Xem báo cáo bán hàng

#### 7.2.1 Truy cập trang báo cáo
1. Từ menu chính, chọn **"Báo cáo"**
2. Trang sẽ hiển thị báo cáo bán hàng mặc định

#### 7.2.2 Thống kê tổng quan
Phần đầu trang hiển thị 4 thẻ thống kê:
- **Sản phẩm đã bán**: Tổng số lượng
- **Tổng doanh thu**: Tổng tiền thu được
- **Tổng chi phí**: Tổng tiền đầu tư
- **Tổng lợi nhuận**: Lãi/lỗ thực tế

### 7.3 Bộ lọc báo cáo

#### 7.3.1 Lọc theo thời gian
- **Từ ngày**: Chọn ngày bắt đầu
- **Đến ngày**: Chọn ngày kết thúc
- **Mặc định**: Tháng hiện tại

#### 7.3.2 Lọc theo danh mục
- Chọn loại sản phẩm cụ thể
- Hoặc chọn "Tất cả danh mục"

#### 7.3.3 Tìm kiếm
- Tìm theo tên sản phẩm
- Tìm theo mã IMEI
- Nhấn Enter hoặc nút tìm kiếm

#### 7.3.4 Áp dụng bộ lọc
1. **Thiết lập các tiêu chí** lọc
2. **Nhấn nút "Tìm kiếm"** (biểu tượng kính lúp)
3. **Kết quả sẽ cập nhật** ngay lập tức

### 7.4 Danh sách sản phẩm đã bán

#### 7.4.1 Thông tin hiển thị
Mỗi sản phẩm đã bán hiển thị:
- **STT**: Số thứ tự
- **Sản phẩm**: Tên và ghi chú
- **IMEI**: Mã định danh
- **Danh mục**: Loại sản phẩm
- **Lô hàng**: Mã lô và ngày nhập
- **Giá nhập**: Giá vốn
- **Giá bán**: Giá bán thực tế
- **Lợi nhuận**: Lãi/lỗ và màu sắc
- **Ngày bán**: Thời gian giao dịch
- **Hóa đơn**: Số hóa đơn (nếu có)

#### 7.4.2 Phân trang
- Hiển thị 20 sản phẩm mỗi trang
- Điều hướng bằng số trang ở cuối danh sách
- Hiển thị tổng số sản phẩm

### 7.5 Xuất báo cáo Excel

#### 7.5.1 Xuất báo cáo chi tiết
1. **Áp dụng bộ lọc** theo nhu cầu
2. **Nhấn nút "Xuất Excel"** (biểu tượng file)
3. **Chọn vị trí lưu file**

#### 7.5.2 Nội dung file Excel
File Excel bao gồm:
- **Tất cả thông tin** sản phẩm đã bán
- **Tính toán bổ sung**: Tỷ lệ lợi nhuận
- **Dòng tổng cộng**: Tổng hợp số liệu
- **Định dạng**: Dễ đọc và in ấn

#### 7.5.3 Tên file tự động
- Format: `Bao_cao_ban_hang_DD-MM-YYYY_den_DD-MM-YYYY.xlsx`
- Bao gồm khoảng thời gian đã lọc
- Tự động tải xuống thư mục Downloads

---

## 8. CÁC TÍNH NĂNG NÂNG CAO

### 8.1 Quản lý trạng thái sản phẩm

#### 8.1.1 Các trạng thái có sẵn
- **IN_STOCK**: Sản phẩm còn trong kho, có thể bán
- **SOLD**: Sản phẩm đã bán, không thể bán lại
- **DAMAGED**: Sản phẩm bị hỏng, cần xử lý
- **LOST**: Sản phẩm bị mất, cần báo cáo

#### 8.1.2 Thay đổi trạng thái
1. **Tìm sản phẩm** cần thay đổi trạng thái
2. **Nhấn nút "Sửa"** trên sản phẩm
3. **Chọn trạng thái mới** từ dropdown
4. **Nhập lý do** thay đổi (bắt buộc)
5. **Nhấn "Cập nhật"** để lưu

### 8.2 Chỉnh sửa thông tin sản phẩm

#### 8.2.1 Thông tin có thể sửa
- **Tên sản phẩm**: Cập nhật tên chi tiết
- **IMEI**: Thay đổi nếu nhập sai (chỉ khi chưa bán)
- **Giá nhập**: Điều chỉnh giá vốn
- **Ghi chú**: Thêm thông tin bổ sung

#### 8.2.2 Hạn chế khi sửa
- Không thể sửa sản phẩm đã bán (SOLD)
- IMEI mới không được trùng với sản phẩm khác
- Giá nhập phải lớn hơn 0

### 8.3 Tự động cập nhật trạng thái lô

#### 8.3.1 Trạng thái lô hàng
- **ACTIVE**: Còn sản phẩm chưa bán
- **PARTIAL**: Đã bán một phần
- **COMPLETE**: Đã bán hết sản phẩm

#### 8.3.2 Cập nhật tự động
- Hệ thống tự động cập nhật khi bán sản phẩm
- Khi số lượng tồn = 0, chuyển thành COMPLETE
- Không cần can thiệp thủ công

### 8.4 Backup và khôi phục dữ liệu

#### 8.4.1 Backup tự động
- Hệ thống tự động backup database hàng ngày
- Lưu trữ 30 ngày gần nhất
- Backup trước khi cập nhật hệ thống

#### 8.4.2 Xuất dữ liệu
- Có thể xuất toàn bộ dữ liệu ra Excel
- Bao gồm tất cả bảng và thông tin
- Sử dụng cho mục đích backup hoặc phân tích

---

## 9. XỬ LÝ SỰ CỐ THƯỜNG GẶP

### 9.1 Lỗi đăng nhập

#### 9.1.1 Không thể đăng nhập
**Nguyên nhân**:
- Sai username/password
- Kết nối internet không ổn định
- Server tạm thời không hoạt động

**Giải pháp**:
1. Kiểm tra lại thông tin đăng nhập
2. Thử refresh trang (F5)
3. Kiểm tra kết nối internet
4. Liên hệ quản trị viên nếu vẫn lỗi

#### 9.1.2 Trang bị trắng sau đăng nhập
**Nguyên nhân**:
- Trình duyệt không tương thích
- Cache trình duyệt bị lỗi

**Giải pháp**:
1. Xóa cache trình duyệt (Ctrl + Shift + Delete)
2. Thử trình duyệt khác (Chrome, Firefox)
3. Tắt các extension có thể gây xung đột

### 9.2 Lỗi khi nhập liệu

#### 9.2.1 IMEI bị trùng lặp
**Thông báo**: "IMEI đã tồn tại trong hệ thống"

**Giải pháp**:
1. Kiểm tra lại IMEI đã nhập
2. Tìm kiếm IMEI trong hệ thống để xem sản phẩm cũ
3. Nếu là sản phẩm mới, liên hệ quản trị viên

#### 9.2.2 Không thể thêm sản phẩm vào lô
**Nguyên nhân**:
- Lô đã đủ số lượng dự kiến
- Lô đã hoàn thành (COMPLETE)

**Giải pháp**:
1. Kiểm tra số lượng còn lại của lô
2. Tăng số lượng dự kiến bằng cách sửa lô
3. Hoặc tạo lô mới cho sản phẩm

### 9.3 Lỗi khi bán hàng

#### 9.3.1 Sản phẩm không hiển thị để bán
**Nguyên nhân**:
- Sản phẩm đã bán (SOLD)
- Sản phẩm bị hỏng (DAMAGED)
- Bộ lọc đang ẩn sản phẩm

**Giải pháp**:
1. Kiểm tra trạng thái sản phẩm
2. Xóa bộ lọc và tìm lại
3. Tìm theo IMEI chính xác

#### 9.3.2 Lỗi khi xác nhận bán
**Nguyên nhân**:
- Giá bán không hợp lệ (≤ 0)
- Kết nối database bị gián đoạn

**Giải pháp**:
1. Kiểm tra giá bán > 0
2. Thử lại sau vài giây
3. Refresh trang và thử lại

### 9.4 Lỗi in ấn

#### 9.4.1 Không thể in hóa đơn
**Nguyên nhân**:
- Máy in không kết nối
- Trình duyệt chặn popup
- Không có quyền in

**Giải pháp**:
1. Kiểm tra kết nối máy in
2. Cho phép popup trong trình duyệt
3. Thử in từ trang xem trước

#### 9.4.2 Định dạng in bị lỗi
**Nguyên nhân**:
- Kích thước giấy không phù hợp
- CSS in bị lỗi

**Giải pháp**:
1. Chọn kích thước giấy A4
2. Kiểm tra xem trước trước khi in
3. Điều chỉnh margin trong cài đặt in

### 9.5 Lỗi xuất Excel

#### 9.5.1 File Excel không tải xuống
**Nguyên nhân**:
- Trình duyệt chặn download
- Dung lượng file quá lớn
- Lỗi server tạm thời

**Giải pháp**:
1. Cho phép download trong trình duyệt
2. Giảm khoảng thời gian lọc
3. Thử lại sau vài phút

#### 9.5.2 File Excel bị lỗi khi mở
**Nguyên nhân**:
- File bị corrupt trong quá trình tải
- Phiên bản Excel không tương thích

**Giải pháp**:
1. Tải lại file Excel
2. Mở bằng Google Sheets hoặc LibreOffice
3. Kiểm tra dung lượng file

### 9.6 Liên hệ hỗ trợ

#### 9.6.1 Khi nào cần liên hệ
- Lỗi không thể tự xử lý
- Mất dữ liệu quan trọng
- Cần hướng dẫn sử dụng tính năng mới
- Đề xuất cải tiến hệ thống

#### 9.6.2 Thông tin cần cung cấp
- Mô tả chi tiết lỗi
- Thời gian xảy ra lỗi
- Các bước đã thực hiện
- Screenshot nếu có thể

---

## 📞 THÔNG TIN LIÊN HỆ HỖ TRỢ

- **Email hỗ trợ**: support@warehouse.com
- **Hotline**: 1900-xxxx
- **Thời gian hỗ trợ**: 8:00 - 17:00 (Thứ 2 - Thứ 6)

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Backup dữ liệu định kỳ** bằng cách xuất Excel
2. **Kiểm tra IMEI cẩn thận** trước khi nhập
3. **Đặt giá bán hợp lý** để đảm bảo lợi nhuận
4. **Theo dõi báo cáo thường xuyên** để đánh giá hiệu quả
5. **Liên hệ hỗ trợ sớm** khi gặp vấn đề

---

*Tài liệu này được cập nhật lần cuối: [Ngày hiện tại]*
*Phiên bản hệ thống: Warehouse Management System V2*