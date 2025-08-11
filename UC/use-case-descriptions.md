# MÔ TẢ USE CASE - WEBSITE HỆ THỐNG QUẢN LÝ TUYÊN DỤNG

## 1. USE CASE QUẢN LÝ TÀI KHOẢN

### UC001: Đăng nhập
**Actor:** Khách vãng lai, Ứng viên, Nhà tuyển dụng, Quản trị viên
**Mô tả:** Khách vãng lai, Ứng viên, Nhà tuyển dụng, Quản trị viên đăng nhập vào hệ thống bằng email/google và mật khẩu
**Precondition:** Người dùng chưa đăng nhập
**Main Flow:**
1. Người dùng truy cập trang đăng nhập
2. Chọn cách đăng nhập bằnd email/google
3. Hệ thống xác thực thông tin
**Postcondition:** Người dùng đã đăng nhập thành công
**Exception:** Thông tin đăng nhập không chính xác

### UC002: Đăng ký
**Actor:** Khách vãng lai
**Mô tả:** Khách vãng lai tạo tài khoản mới trong hệ thống
**Precondition:** Chưa có tài khoản
**Main Flow:**
1. Người dùng truy cập trang đăng ký
2. Nhập thông tin cá nhân (họ tên, email, số điện thoại, mật khẩu)
3. Xác nhận mật khẩu
4. Đồng ý với điều khoản sử dụng
5. Xác nhận đăng ký
6. Tài khoản được kích hoạt
**Postcondition:** Tài khoản mới được tạo thành công
**Exception:** Email đã tồn tại, thông tin không hợp lệ

### UC003: Quên mật khẩu
**Actor:** Ứng viên, Nhà tuyển dụng
**Mô tả:** Người dùng yêu cầu đặt lại mật khẩu khi quên
**Precondition:** Có tài khoản trong hệ thống
**Main Flow:**
1. Người dùng chọn "Quên mật khẩu"
2. Nhập email đã đăng ký
3. Hệ thống gửi link đặt lại mật khẩu qua email
4. Người dùng click vào link
5. Nhập mật khẩu mới
6. Xác nhận mật khẩu mới
7. Cập nhật mật khẩu thành công
**Postcondition:** Mật khẩu được đặt lại thành công
**Exception:** Email không tồn tại, link hết hạn

### UC004: Đăng xuất
**Actor:** Ứng viên, Nhà tuyển dụng, quản trị viên
**Mô tả:** Người dùng đăng xuất khỏi hệ thống
**Precondition:** Người dùng đã đăng nhập
**Main Flow:**
1. Người dùng chọn "Đăng xuất"
2. Hệ thống xóa session
3. Chuyển hướng về trang chủ
**Postcondition:** Người dùng đã đăng xuất thành công

### UC005: Quản lý hồ sơ ứng viên
**Actor:** Ứng viên
**Mô tả:** Người dùng cập nhật thông tin cá nhân
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập trang hồ sơ cá nhân
2. Xem thông tin hiện tại
3. Chỉnh sửa thông tin (họ và tên, email, địa chỉ,...)
4. Cập nhật thông tin
**Postcondition:** Thông tin cá nhân được cập nhật
**Exception:** Thông tin không hợp lệ

### UC006: Quản lý hồ sơ nhà tuyển dụng
**Actor:** Nhà tuyển dụng 
**Mô tả:** Người dùng cập nhật thông tin cá nhân
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập trang hồ sơ cá nhân
2. Xem thông tin hiện tại
3. Chỉnh sửa thông tin (tên công ty, số điện thoại, email, website, địa chỉ, mô tả)
4. Cập nhật thông tin
**Postcondition:** Thông tin cá nhân được cập nhật
**Exception:** Thông tin không hợp lệ

## 2. USE CASE CHUNG

### UC007: Xem trang chủ
**Actor:** Khách vãng lai, Ứng viên, Nhà tuyển dụng
**Mô tả:** Hiển thị trang chủ với thông tin tổng quan
**Precondition:** Không
**Main Flow:**
1. Truy cập trang chủ
2. Hiển thị banner quảng cáo
3. Hiển thị ngành nghề phổ biến
4. Hiển thi cách thức hoạt động
4. Hiển thị việc làm mới nhất
5. Hiển thị thông tin đánh giá
**Postcondition:** Trang chủ được hiển thị thành công

### UC008: Xem việc làm
**Actor:** Khách vãng lai, Người dùng, Nhà tuyển dụng
**Mô tả:** Xem việc làm đang tuyển dụng
**Precondition:** Không
**Main Flow:**
1. Truy cập trang việc làm
2. Xem các việc làm
**Postcondition:** Các việc làm được hiển thị

### UC009: Xem tin tức
**Actor:** Khách vãng lai, Ứng viên, Nhà tuyển dụng
**Mô tả:** Xem tin tức, bài viết và thông tin mới nhất về tuyển dụng
**Precondition:** Không
**Main Flow:**
1. Truy cập trang tin tức
2. Xem tin tức nổi bật
3. Xem tin tức mới nhất
4. Đọc chi tiết tin tức
**Postcondition:** Tin tức được hiển thị 

### UC010: Xem chính sách
**Actor:** Khách vãng lai, Ứng viên, Nhà tuyển dụng
**Mô tả:** Xem các chính sách và điều khoản của hệ thống
**Precondition:** Không
**Main Flow:**
1. Truy cập trang chính sách
2. Xem loại chính sách, điều khoản (điều khoản, bảo mật, liên hệ)
3. Đọc nội dung chính sách
**Postcondition:** Chính sách được hiển thị


## 2. USE CASE ỨNG VIÊN

### UC011: Tạo CV
**Actor:** Ứng viên
**Mô tả:** Ứng viên tạo mới CV cá nhân trên hệ thống
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập chức năng tạo CV
2. Nhập thông tin cá nhân, học vấn, kinh nghiệm, kỹ năng,...
3. Lưu CV
**Postcondition:** CV được tạo thành công
**Exception:** Thông tin không hợp lệ

### UC012: Quản lý CV
**Actor:** Ứng viên
**Mô tả:** Ứng viên xem hoặc xóa CV đã tạo
**Precondition:** Đã đăng nhập, đã có CV
**Main Flow:**
1. Truy cập danh sách CV
2. Chọn CV để xem, xóa
**Postcondition:** CV được xóa thành công
**Exception:** Không tìm thấy CV

### UC013: Ứng tuyển việc làm 
**Actor:** Ứng viên
**Mô tả:** Ứng viên nộp CV ứng tuyển vào vị trí tuyển dụng 
**Precondition:** Đã đăng nhập, đã có CV
**Main Flow:**
1. Xem danh sách việc làm
2. Chọn việc làm phù hợp
3. Nộp CV ứng tuyển
**Postcondition:** Đơn ứng tuyển được gửi thành công
**Exception:** Đã ứng tuyển

### UC014: Việc làm AI gợi ý
**Actor:** Ứng viên
**Mô tả:** Hệ thống AI phân tích CV và gợi ý việc làm phù hợp cho ứng viên
**Precondition:** Đã đăng nhập, đã có CV
**Main Flow:**
1. Truy cập trang việc làm AI gợi ý
2. Hệ thống AI phân tích CV của ứng viên (kinh nghiệm, kỹ năng, bằng cấp, ngành nghề)
3. AI so sánh với các tin tuyển dụng hiện có
4. AI tính toán độ phù hợp (matching score)
5. Hiển thị danh sách việc làm được gợi ý theo thứ tự ưu tiên
6. Hiển thị điểm phù hợp
7. Ứng viên có thể ứng tuyển trực tiếp từ danh sách gợi ý
**Postcondition:** Danh sách việc làm AI gợi ý được hiển thị thành công
**Exception:** Chưa có CV, không có việc làm phù hợp

### UC015: Việc làm đã ứng tuyển
**Actor:** Ứng viên
**Mô tả:** Ứng viên theo dõi trạng thái ứng tuyển
**Precondition:** Đã đăng nhập, đã ứng tuyển
**Main Flow:**
1. Truy cập trang quản lý việc làm đã ứng tuyển 
2. Xem danh sách các đơn ứng tuyển và trạng thái
3. Xem chi tiết ứng tuyển
**Postcondition:** Thông tin trạng thái được hiển thị

### UC016: Chat với nhà tuyển dụng
**Actor:** Ứng viên
**Mô tả:** Ứng viên trò chuyện trực tuyến với nhà tuyển dụng 
**Precondition:** Đã đăng nhập, đã ứng tuyển và được nhà tuyển dụng duyệt
**Main Flow:**
1. Truy cập trang quản lý
2. Vào tin nhắn
3. Chọn nhà tuyển dụng để chat
4. Gửi tin nhắn văn bản
5. Nhận phản hồi từ nhà tuyển dụng 
**Postcondition:** Cuộc trò chuyện với nhà tuyển dụng được thực hiện thành công
**Exception** Cuộc trò chuyện không khả dụng 

## 3. USE CASE NHÀ TUYỂN DỤNG

### UC017: Tài khoản và nạp tiền
**Actor:** Nhà tuyển dụng, VNPAY
**Mô tả:** Nhà tuyển dụng nạp tiền để sử dụng dịch vụ đăng tin tuyển dụng
**Precondition:** Đã đăng nhập, cần nạp thêm tiền
**Main Flow:**
1. Chọn thanh toán qua VNPay
2. Chuyển hướng đến cổng VNPay
3. Nhập thông tin thẻ
4. Xác thực thanh toán
5. Nhận kết quả thanh toán
6. Quay về trang chủ
**Postcondition:** Thanh toán hoàn tất
**Exception:** Thanh toán thất bại

### UC018: Quản lý công ty
**Actor:** Nhà tuyển dụng
**Mô tả:** Nhà tuyển dụng cập nhật và quản lý thông tin công ty
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập trang quản lý công ty
2. Xem thông tin hiện tại của công ty
3. Cập nhật thông tin (tên công ty, địa chỉ, website, email, số điện thoại)
4. Cập nhật thông tin
**Postcondition:** Cập nhật thành công 


### UC019: Đăng tin tuyển dụng
**Actor:** Nhà tuyển dụng
**Mô tả:** Nhà tuyển dụng đăng tin tuyển dụng mới
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập chức năng đăng tin tuyển dụng 
2. Nhập thông tin tuyển dụng
3. Đăng tin
**Postcondition:** Đơn ứng tuyển được gửi thành công
**Exception:** Số dư không đủ, cần phải nạp tiền để đăng tin tuyển dụng

### UC020: Quản lý ứng viên
**Actor:** Nhà tuyển dụng
**Mô tả:** Nhà tuyển dụng xem danh sách ứng viên đã ứng tuyển, duyệt hoặc từ chối
**Precondition:** Đã đăng nhập, có ứng viên ứng tuyển
**Main Flow:**
1. Xem hồ sơ ứng viên 
2. Chọn duyệt hoặc từ chối
**Postcondition:** Trạng thái hồ sơ được cập nhật

### UC021: Chat với ứng viên
**Actor:** Nhà tuyển dụng
**Mô tả:** Nhà tuyển dụng trò chuyện trực tuyến với ứng viên
**Precondition:** Đã đăng nhập, ứng viên ứng tuyển đã được duyệt
**Main Flow:**
1. Truy cập vào tin nhắn
2. Chọn ứng viên để chat
3. Gửi tin nhắn văn bản
4. Nhận phản hồi từ ứng viên 
**Postcondition:** Cuộc trò chuyện được thực hiện thành công
**Exception** Cuộc trò chuyện không khả dụng

### UC022: Báo cáo thông kê
**Actor:** Nhà tuyển dụng
**Mô tả:** Nhà tuyển dụng xem báo cáo thống kê về hoạt động tuyển dụng
**Precondition:** Đã đăng nhập
**Main Flow:**
1. Truy cập trang báo cáo thống kê
2. Xem số lượng ứng viên theo thời gian
3. Xem tỷ lệ trạng thái ứng viên
4. Xem số tin đăng theo thời gian
5. Xem top ngành nghề có nhiều ứng viên
**Postcondition:** Báo cáo thông kê được hiển thị 
**Exception:** Không có dữ liệu


## 5. USE CASE QUẢN TRỊ VIÊN (ADMIN)

### UC023: Xem dashboard thống kê
**Actor:** Quản trị viên
**Mô tả:** Xem tổng quan thống kê hệ thống
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Truy cập dashboard
2. Xem thống kê doanh thu
3. Xem thống kê đơn ứng tuyển
4. Xem phân bố ngành nghề
5. Xem hoạt động gần đây
**Postcondition:** Dashboard được hiển thị

### UC024: Quản lý người dùng
**Actor:** Quản trị viên
**Mô tả:** Quản lý danh sách người dùng hệ thống
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách người dùng
2. Tìm kiếm người dùng
3. Xóa tài khoản (nếu cần)
**Postcondition:** Quản lý người dùng thành công

### UC025: Quản lý việc làm
**Actor:** Quản trị viên
**Mô tả:** Quản lý danh sách việc làm
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách tất cả các tin tuyển dụng
2. Tìm kiếm 
3. Xóa tin tuyển dụng (nếu cần)
**Postcondition:** Quản lý việc làm thành công

### UC026: Quản lý đơn ứng tuyển 
**Actor:** Quản trị viên
**Mô tả:** Quản lý danh sách đơn ứng tuyển
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách đơn ứng tuyển
2. Tìm kiếm 
3. Xóa đơn ứng tuyển (nếu cần)
**Postcondition:** Quản lý đơn ứng tuyển thành công

### UC027: Quản lý CV
**Actor:** Quản trị viên
**Mô tả:** Quản lý danh sách CV
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách tất cả các CV
2. Tìm kiếm
3. Xóa CV (nếu cần)
**Postcondition:** Quản lý CV thành công

### UC028: Quản lý tin tức
**Actor:** Quản trị viên
**Mô tả:** Quản lý nội dung tin tức và bài viết
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách tất cả các tin tức
2. Tìm kiếm
3. Tạo tin tức mới 
4. Chỉnh sửa tin tức hiện có 
5. Xóa tin tức (nếu cần)
**Postcondition:** Quản lý tin tức được xuất thành công

### UC029: Quản lý đánh giá 
**Actor:** Quản trị viên
**Mô tả:** Quản lý đánh giá của người dùng về hệ thống
**Precondition:** Đã đăng nhập với quyền quản trị viên
**Main Flow:**
1. Xem danh sách tất cả các đánh giá 
2. Tìm kiếm
3. Xem nội dung đánh giá
4. Xóa đánh giá (nếu cần)
**Postcondition:** Quản lý đánh giá được xuất thành công
