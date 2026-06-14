# HƯỚNG DẪN KẾT NỐI GAME VỚI TIKFINITY WEB APP

Nếu bạn đang sử dụng **TikFinity phiên bản Web** (chạy trực tiếp trên trình duyệt, không cài đặt phần mềm vào máy tính), bạn cần sử dụng **Cloud WebSocket URL** do TikFinity cung cấp.

Hãy làm theo các bước sau:

### Bước 1: Lấy link WebSocket từ TikFinity Web
1. Mở trang web TikFinity và đăng nhập, đảm bảo đã kết nối với phiên Livestream TikTok của bạn.
2. Ở menu bên trái, bấm vào mục **Setup** (Cài đặt).
3. Cuộn xuống tìm phần có tên là **API** hoặc **Websocket API**.
4. Bạn sẽ thấy một đường link được gọi là **Cloud WebSocket URL** (nó thường bắt đầu bằng chữ `wss://...` và chứa một đoạn mã token dài).
5. Bấm nút **Copy** để sao chép đường link đó.

### Bước 2: Dán link vào Game
1. Mở Game web này lên.
2. Ở màn hình chờ, dán đường link `wss://...` mà bạn vừa copy ở Bước 1 vào ô trống.
3. Bấm nút **Kết Nối TikFinity & Vào Game**.
4. Nhìn lên góc trên ở giữa màn hình Game, nếu thấy chữ màu xanh lá cây **"TikFinity Đã Kết Nối"** là bạn đã thành công 100%!

### Bước 3: Chơi Game
Bây giờ, bất kỳ ai đang xem Livestream của bạn:
- Comment `1` -> Ra lính Bơ Thị
- Comment `2` -> Ra lính Nho Thị
- Tặng quà (Hoa hồng, Bắn, Cỏ ba lá...) -> Ra lính tương ứng cho Team mà họ đã comment trước đó.
- Thả tim -> Ra lính.

*(Lưu ý: Tuyệt đối không chia sẻ đường link `wss://...` của bạn cho người khác vì nó chứa token bảo mật của tài khoản TikFinity của bạn).*
