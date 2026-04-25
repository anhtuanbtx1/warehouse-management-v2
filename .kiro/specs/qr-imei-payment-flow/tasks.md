# Kế hoạch Triển khai: QR IMEI Payment Flow

## Tổng quan

Chuyển thiết kế tính năng `qr-imei-payment-flow` thành các bước triển khai tăng dần trong codebase hiện có: thêm submenu thanh toán theo IMEI, nhận dữ liệu từ máy quét QR, trích xuất IMEI, tra cứu sản phẩm, yêu cầu nhân viên xác nhận, rồi gửi giao dịch thanh toán qua luồng bán hàng hiện hữu. Mỗi bước đều xây trên bước trước và kết thúc bằng việc nối toàn bộ luồng với nhau, không để lại phần code rời rạc chưa được tích hợp.

## Tasks

- [x] 1. Tạo khung submenu thanh toán IMEI và trạng thái phiên cơ bản
  - Tạo component `QrImeiPaymentSubmenu` và các kiểu dữ liệu trạng thái phiên theo thiết kế.
  - Khởi tạo vòng đời phiên với các trạng thái tối thiểu: sẵn sàng quét, lỗi, chờ xác nhận, đang thanh toán, thanh toán thành công.
  - Thêm các hành động reset/xóa thao tác hiện tại và tạo phiên mới để đảm bảo không tái sử dụng dữ liệu của phiên trước.
  - Gắn submenu mới vào điều hướng hoặc điểm mở phù hợp trong màn hình bán hàng hiện có.
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3_

- [x] 2. Triển khai nhận dữ liệu quét và parser IMEI
  - [x] 2.1 Tạo `ScanInputCapture` hoặc hook tương đương để nhận raw scan từ máy quét QR
    - Giữ focus cho vùng nhập khi submenu mở.
    - Ghi nhận toàn bộ chuỗi dữ liệu quét vào phiên hiện tại và chuyển sang bước parse.
    - Chỉ cho phép một dữ liệu quét đang hoạt động trong mỗi phiên.
    - _Requirements: 1.1, 1.2, 1.3, 6.3_

  - [x] 2.2 Tạo hàm `extractImeiFromQrPayload` để chuẩn hóa dữ liệu quét và trích xuất đúng một IMEI
    - Xử lý các trường hợp chuỗi rỗng, không tìm thấy IMEI, nhiều IMEI, hoặc sai định dạng.
    - Trả kết quả có mã lỗi rõ nghĩa để UI hiển thị thông báo phù hợp.
    - Hiển thị IMEI đã trích xuất cho nhân viên kiểm tra trước bước tra cứu.
    - _Requirements: 2.1, 2.2, 2.3_

  - [x]* 2.3 Viết unit tests cho `extractImeiFromQrPayload` và logic nhận scan
    - Bao phủ các mẫu QR hợp lệ, không hợp lệ, dữ liệu rỗng và chuỗi có nhiều candidate IMEI.
    - Kiểm tra raw scan được ghi nhận đúng vào phiên hiện tại.
    - _Requirements: 1.3, 2.1, 2.2, 2.3_

- [x] 3. Triển khai tra cứu sản phẩm theo IMEI và hiển thị kết quả
  - [x] 3.1 Tạo `ProductLookupService` hoặc lớp truy vấn tương đương để tìm sản phẩm theo IMEI
    - Dùng nguồn dữ liệu/endpoint tương thích với luồng sản phẩm hiện có để đảm bảo đồng nhất dữ liệu.
    - Chuẩn hóa shape trả về tối thiểu gồm tên sản phẩm, mã sản phẩm, IMEI, trạng thái sẵn sàng bán và giá bán nếu có.
    - _Requirements: 3.1, 3.3_

  - [x] 3.2 Tích hợp lookup vào phiên quét và xử lý các nhánh lỗi sản phẩm
    - Sau khi parse IMEI thành công, tự động gọi tra cứu sản phẩm theo IMEI.
    - Hiển thị thông báo khi không tìm thấy sản phẩm, lỗi API, hoặc sản phẩm không ở trạng thái sẵn sàng bán.
    - Đảm bảo dữ liệu sản phẩm cũ không còn ảnh hưởng khi một lượt quét mới thất bại.
    - _Requirements: 3.1, 3.2, 3.3, 6.3_

  - [x]* 3.3 Viết integration tests cho luồng quét hợp lệ và tra cứu sản phẩm
    - Mô phỏng scanner input, kiểm tra IMEI được hiển thị và thông tin sản phẩm được render đúng.
    - Bao phủ nhánh không tìm thấy sản phẩm và nhánh sản phẩm không sẵn sàng bán.
    - _Requirements: 2.3, 3.2, 3.3_

- [x] 4. Triển khai bước xác nhận của nhân viên trước khi thanh toán
  - [x] 4.1 Thêm UI và logic xác nhận kiểm tra thông tin sản phẩm
    - Hiển thị trạng thái chờ xác nhận sau khi đã tìm thấy sản phẩm hợp lệ.
    - Chỉ cho phép bật cờ xác nhận khi phiên đang gắn đúng một IMEI với đúng một bản ghi sản phẩm.
    - Khóa nút thanh toán cho đến khi nhân viên xác nhận kiểm tra xong.
    - _Requirements: 4.1, 4.2, 4.3, 6.3_

  - [x]* 4.2 Viết unit hoặc component tests cho điều kiện bật/tắt xác nhận và nút thanh toán
    - Kiểm tra nút thanh toán bị khóa trước xác nhận và được bật sau xác nhận hợp lệ.
    - Kiểm tra reset thao tác sẽ xóa trạng thái xác nhận hiện tại.
    - _Requirements: 4.2, 4.3, 6.2_

- [x] 5. Checkpoint - Đảm bảo luồng quét, parse, tra cứu và xác nhận hoạt động xuyên suốt
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có điểm chưa rõ.

- [x] 6. Tích hợp submit thanh toán qua luồng bán hàng hiện có
  - [x] 6.1 Tạo `PaymentSubmissionAdapter` để map dữ liệu phiên IMEI sang payload thanh toán hiện hữu
    - Tái sử dụng endpoint/nghiệp vụ bán hàng đang được form bán hàng hiện tại dùng.
    - Chỉ cho phép submit khi phiên đã xác nhận và sản phẩm hiện tại khớp IMEI đã quét.
    - Bổ sung trường truy vết IMEI đã quét trong payload hoặc lớp adapter nếu hệ thống hỗ trợ.
    - _Requirements: 5.1, 6.3_

  - [x] 6.2 Tích hợp hành động thanh toán vào submenu và xử lý trạng thái thành công/thất bại
    - Chuyển phiên sang trạng thái đang thanh toán để chặn double-submit.
    - Hiển thị trạng thái thành công khi giao dịch được tạo xong.
    - Nếu thanh toán thất bại, giữ lại thông tin sản phẩm và IMEI để nhân viên thử lại hoặc quét lại.
    - _Requirements: 5.1, 5.2, 5.3, 6.1_

  - [x]* 6.3 Viết integration tests cho submit thanh toán thành công và thất bại
    - Kiểm tra payload gửi đi bám đúng dữ liệu sản phẩm/IMEI của phiên hiện tại.
    - Bao phủ nhánh hiển thị thành công, lỗi thanh toán và chặn submit lặp.
    - _Requirements: 5.1, 5.2, 5.3, 6.3_

- [x] 7. Hoàn thiện quản lý vòng đời phiên và nối toàn bộ luồng vào màn hình thực tế
  - [x] 7.1 Hoàn thiện reset phiên, quét mới sau thành công và dọn trạng thái lỗi
    - Sau thanh toán thành công, thao tác quét mới phải tạo `sessionId` mới và không giữ raw scan, IMEI hay sản phẩm của phiên trước.
    - Khi nhân viên xóa thao tác hiện tại, toàn bộ dữ liệu phiên phải được xóa sạch và quay về trạng thái sẵn sàng quét.
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Rà soát tích hợp với màn hình bán hàng hiện có và hoàn thiện thông báo trạng thái
    - Đảm bảo submenu mới có thể mở/đóng an toàn trong luồng bán hàng hiện tại.
    - Đồng bộ callback thành công hoặc refresh dữ liệu cần thiết sau khi thanh toán hoàn tất.
    - Hoàn thiện các thông báo lỗi/trạng thái để nhân viên có thể quyết định thử lại hay quét mới.
    - _Requirements: 1.1, 3.2, 5.2, 5.3, 6.1_

  - [x]* 7.3 Viết integration tests hồi quy cho toàn bộ vòng đời phiên
    - Bao phủ các kịch bản: quét lỗi, quét lại, lookup lỗi, xác nhận, thanh toán thành công, thanh toán thất bại, reset phiên.
    - Xác nhận mỗi phiên chỉ giữ một IMEI và một bản ghi sản phẩm đang hoạt động.
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 6.1, 6.2, 6.3_

- [x] 8. Checkpoint cuối - Đảm bảo tất cả tests pass và luồng đã được nối hoàn chỉnh
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có điểm chưa rõ.

## Ghi chú

- Các sub-task có dấu `*` là task kiểm thử tùy chọn, có thể bỏ qua để làm MVP nhanh hơn.
- Task chỉ tập trung vào công việc viết, sửa hoặc kiểm thử code; không bao gồm deploy, UAT hay tài liệu vận hành.
- Không thêm property-based test vì `design.md` đã xác định tính năng này không có mục Correctness Properties và phù hợp hơn với unit test/integration test.
- Mỗi bước đều xây trên bước trước và kết thúc bằng việc nối toàn bộ luồng submenu quét IMEI vào quy trình thanh toán hiện có.
