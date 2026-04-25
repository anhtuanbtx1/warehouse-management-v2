# Tài liệu Yêu cầu

## Giới thiệu

Tính năng `qr-imei-payment-flow` bổ sung một sub-menu hỗ trợ nhân viên quét QR code từ máy quét, trích xuất IMEI từ dữ liệu quét, tìm sản phẩm tương ứng trong hệ thống, kiểm tra lại thông tin hiển thị và thực hiện thanh toán sau khi xác nhận.

## Thuật ngữ

- **Hệ_Thống_Bán_Hàng**: Ứng dụng quản lý bán hàng và kho đang được nhân viên sử dụng.
- **Submenu_Thanh_Toán_IMEI**: Màn hình con hỗ trợ quy trình quét QR, tra cứu IMEI và thanh toán.
- **Máy_Quét_QR**: Thiết bị quét QR code được kết nối để nhập dữ liệu vào hệ thống.
- **IMEI**: Mã định danh thiết bị dùng để tra cứu sản phẩm cụ thể trong dữ liệu tồn kho hoặc danh mục sản phẩm.
- **Bản_Ghi_Sản_Phẩm**: Dữ liệu sản phẩm được tìm thấy từ IMEI, bao gồm tối thiểu tên sản phẩm, mã sản phẩm, IMEI và trạng thái sẵn sàng bán.
- **Nhân_Viên**: Người vận hành quy trình quét, kiểm tra thông tin và bấm thanh toán.
- **Phiên_Thanh_Toán**: Trạng thái làm việc hiện tại của Submenu_Thanh_Toán_IMEI từ lúc nhận dữ liệu quét đến lúc hoàn tất hoặc hủy thao tác.

## Yêu cầu

### Yêu cầu 1: Mở sub-menu quét và nhận dữ liệu từ máy quét

**User Story:** Là một nhân viên, tôi muốn mở sub-menu tích hợp với máy quét QR, để tôi có thể bắt đầu quy trình bán hàng từ mã quét.

#### Tiêu chí chấp nhận

1. WHEN Nhân_Viên mở chức năng thanh toán IMEI, THE Hệ_Thống_Bán_Hàng SHALL hiển thị Submenu_Thanh_Toán_IMEI với vùng nhận dữ liệu từ Máy_Quét_QR.
2. WHILE Phiên_Thanh_Toán đang hoạt động, THE Submenu_Thanh_Toán_IMEI SHALL duy trì trạng thái sẵn sàng nhận một dữ liệu quét mới.
3. WHEN Máy_Quét_QR gửi dữ liệu QR vào Submenu_Thanh_Toán_IMEI, THE Hệ_Thống_Bán_Hàng SHALL ghi nhận toàn bộ chuỗi dữ liệu quét cho Phiên_Thanh_Toán hiện tại.

### Yêu cầu 2: Trích xuất IMEI từ dữ liệu QR

**User Story:** Là một nhân viên, tôi muốn hệ thống tự lấy IMEI từ dữ liệu QR, để tôi không phải nhập lại bằng tay.

#### Tiêu chí chấp nhận

1. WHEN Phiên_Thanh_Toán nhận được dữ liệu quét hợp lệ chứa IMEI, THE Submenu_Thanh_Toán_IMEI SHALL trích xuất đúng một giá trị IMEI từ dữ liệu quét.
2. IF dữ liệu quét không chứa IMEI theo định dạng được Hệ_Thống_Bán_Hàng chấp nhận, THEN THE Submenu_Thanh_Toán_IMEI SHALL hiển thị thông báo lỗi nêu rõ dữ liệu quét không hợp lệ và giữ Phiên_Thanh_Toán ở trạng thái chờ dữ liệu mới.
3. WHEN IMEI được trích xuất thành công, THE Submenu_Thanh_Toán_IMEI SHALL hiển thị giá trị IMEI cho Nhân_Viên kiểm tra.

### Yêu cầu 3: Tra cứu sản phẩm theo IMEI

**User Story:** Là một nhân viên, tôi muốn hệ thống tìm sản phẩm theo IMEI đã quét, để tôi xác định đúng hàng hóa cần thanh toán.

#### Tiêu chí chấp nhận

1. WHEN IMEI đã được trích xuất thành công, THE Hệ_Thống_Bán_Hàng SHALL tìm Bản_Ghi_Sản_Phẩm có IMEI trùng khớp trong dữ liệu sản phẩm.
2. IF Hệ_Thống_Bán_Hàng không tìm thấy Bản_Ghi_Sản_Phẩm khớp với IMEI, THEN THE Submenu_Thanh_Toán_IMEI SHALL hiển thị thông báo không tìm thấy sản phẩm và cho phép Nhân_Viên thực hiện lần quét mới.
3. WHEN Hệ_Thống_Bán_Hàng tìm thấy Bản_Ghi_Sản_Phẩm, THE Submenu_Thanh_Toán_IMEI SHALL hiển thị tối thiểu tên sản phẩm, mã sản phẩm, IMEI và trạng thái sẵn sàng bán.

### Yêu cầu 4: Xác nhận thông tin trước thanh toán

**User Story:** Là một nhân viên, tôi muốn kiểm tra thông tin sản phẩm đã tra cứu trước khi thanh toán, để tránh thanh toán nhầm thiết bị.

#### Tiêu chí chấp nhận

1. WHILE Bản_Ghi_Sản_Phẩm đang được hiển thị, THE Submenu_Thanh_Toán_IMEI SHALL cung cấp trạng thái chờ xác nhận từ Nhân_Viên trước khi cho phép thanh toán.
2. WHEN Nhân_Viên chưa xác nhận kiểm tra thông tin sản phẩm, THE Submenu_Thanh_Toán_IMEI SHALL giữ nút thanh toán ở trạng thái chưa thể thực hiện.
3. WHEN Nhân_Viên xác nhận thông tin sản phẩm đã được kiểm tra, THE Submenu_Thanh_Toán_IMEI SHALL cho phép thao tác thanh toán cho Bản_Ghi_Sản_Phẩm đang hiển thị.

### Yêu cầu 5: Thực hiện thanh toán cho sản phẩm đã xác nhận

**User Story:** Là một nhân viên, tôi muốn bấm nút thanh toán sau khi kiểm tra xong, để hoàn tất giao dịch cho đúng sản phẩm.

#### Tiêu chí chấp nhận

1. WHEN Nhân_Viên bấm nút thanh toán cho Bản_Ghi_Sản_Phẩm đã được xác nhận, THE Hệ_Thống_Bán_Hàng SHALL tạo giao dịch thanh toán gắn với IMEI của Bản_Ghi_Sản_Phẩm đó.
2. WHEN giao dịch thanh toán được tạo thành công, THE Submenu_Thanh_Toán_IMEI SHALL hiển thị trạng thái thanh toán thành công cho Nhân_Viên.
3. IF giao dịch thanh toán không được tạo thành công, THEN THE Submenu_Thanh_Toán_IMEI SHALL hiển thị thông báo lỗi thanh toán và giữ thông tin Bản_Ghi_Sản_Phẩm để Nhân_Viên quyết định thử lại hoặc quét lại.

### Yêu cầu 6: Quản lý vòng đời phiên thao tác

**User Story:** Là một nhân viên, tôi muốn hệ thống quản lý rõ từng phiên quét và thanh toán, để tránh dùng nhầm dữ liệu của lần quét trước.

#### Tiêu chí chấp nhận

1. WHEN Nhân_Viên bắt đầu một lần quét mới sau khi thanh toán thành công, THE Submenu_Thanh_Toán_IMEI SHALL khởi tạo Phiên_Thanh_Toán mới không chứa dữ liệu quét và Bản_Ghi_Sản_Phẩm của phiên trước.
2. WHEN Nhân_Viên chủ động xóa thao tác hiện tại, THE Submenu_Thanh_Toán_IMEI SHALL xóa dữ liệu quét, IMEI đã trích xuất và Bản_Ghi_Sản_Phẩm đang hiển thị khỏi Phiên_Thanh_Toán hiện tại.
3. WHILE Phiên_Thanh_Toán chưa được xác nhận thanh toán thành công, THE Hệ_Thống_Bán_Hàng SHALL chỉ liên kết một IMEI với một Bản_Ghi_Sản_Phẩm đang được hiển thị trong Submenu_Thanh_Toán_IMEI.
