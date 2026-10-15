# Danh sách bài đang phục vụ

Cập nhật ngày 15/10/2026 theo quyết định của người dùng.

- **Jar Test**: mở thực hành tại `/simulate/jar-test`, hồ sơ `jar-test@0.1.0`.
- **Điều chỉnh pH** và **Hấp phụ xanh methylene**: giữ thẻ giới thiệu, ghi **Chưa triển khai**. Không mở bài axit cũ thay cho bài pH dự kiến.
- Prototype phân loại nhựa đã rời luồng công khai. Đường dẫn cũ đưa về danh sách thí nghiệm.

Jar Test và `/lab` cùng đọc IndexedDB, kể cả khi đăng nhập. Lab chỉ liệt kê lượt Jar Test; không xóa dữ liệu bài cũ hoặc hứa đồng bộ tài khoản. Báo cáo mở từ chính workbench bằng `view=report`; sổ đo bằng `view=notebook`.

Nguồn hiện hành được khai báo tại `src/content/evidence/jar-test.ts`: phương trình RSM của Alateef và cộng sự (2024), và tài liệu thực hành của Qatar University. `/evidence`, chi tiết bài và hướng dẫn giữ riêng nguồn tính toán, quy trình và giới hạn. Tái hiện số học không đồng nghĩa với kiểm chứng thực nghiệm ngoài mẫu.

Engine, hợp đồng dữ liệu và tài liệu nghiên cứu lịch sử của bài axit vẫn được giữ để không phá các lượt đã lưu; chúng không còn quyết định danh sách bài đang mở thực hành.
