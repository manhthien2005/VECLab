# Nền source trước refactor

Ngày chuẩn bị: 13/10/2026. Gốc: nhánh Hoang, commit c60ac86f6cbcdb0b099973dbf56c9962305adfc9. Nhánh dọn: chore/pre-refactor-cleanup.

## Phạm vi dọn

- Gỡ cụm panel workbench cũ, PhMeter, WarningItem và barrel controller không có đường import từ các entry point Next.js hoặc test.
- Gỡ 4 SVG cũ chỉ còn được nhắc trong README/thiết kế cũ. Giữ 2 WebP đang dùng và ảnh landing tham chiếu.
- Gỡ 12 tài liệu/mockup cũ; rút gọn ownership và mục lục. Viết lại README theo trạng thái triển khai thật.
- Sửa test guest cũ để mở menu mobile trước khi kiểm tra và chọn đúng thông báo lưu local, tránh khớp trùng hai đoạn chữ.
- Giữ engine, API, dữ liệu nội dung, migrations, fixtures, CI và bộ test. Không thay schema, dependency hoặc kết quả mô phỏng.
- Giữ các bộ skill phát triển đã cài trong .agent, .agents và .claude; đây là tooling, không phải code chết của ứng dụng.

Việc xoá source dựa trên phân tích imports bằng TypeScript và tìm tham chiếu toàn repo, có tính đến các entry point được Next.js tự tải. CSS và exports còn lại chưa bị cắt theo heuristic vì có thể được dùng động.

## Điểm cần xử lý trong đợt refactor

| Khu vực | Hiện trạng cần lưu ý |
| --- | --- |
| Phân loại nhựa | useReducer trong UI; kết quả theo mốc cố định; reload mất tiến trình; chưa có session/repository/report chung hoặc test riêng. |
| Kết tủa đồng | Chưa có engine/workbench, dù có đặc tả và hình giới thiệu. |
| Trung hòa axit | Đã có Process Core, guest IndexedDB, cloud API và báo cáo; cần giữ golden cases, determinism và dữ liệu lượt cũ khi đổi cấu trúc. |
| Auth và cloud | Chạy guest không chứng minh luồng tài khoản/cloud đúng. Kiểm tra riêng với Supabase local và database tests. |
| CSS và UI | globals.css chứa nhiều thế hệ layout. Cần kiểm tra theo từng màn hình trước khi bỏ selector. |
| Tài liệu mục tiêu | Scope/spec và threat model không phải bản mô tả mọi khả năng đang chạy; phải đối chiếu implementation. |

## Cách kiểm chứng nền source

- npm run verify: typecheck, lint, unit/integration tests và production build.
- npm run test:e2e: browser tests desktop/mobile.
- npm run test:db và npm run test:db:concurrency: kiểm chứng database local; CI có job riêng.
- Smoke test: trang chủ → danh mục → trung hòa axit; trang chi tiết nhựa → nước → cả hai nhánh ethanol/NaCl → làm lại.

## Kết quả kiểm tra sau dọn

- npm run verify: TypeScript, lint, 36 file test với 408 bài kiểm thử và production build đều qua.
- Smoke E2E: 8/8 bài qua trên hai project Chromium/mobile, bao gồm guest navigation, My Lab, setup và chu trình chuẩn độ có hướng dẫn. Hai bài workbench đặt viewport desktop; kiểm tra mobile menu/My Lab dùng viewport mobile thực tế. Chưa chạy toàn bộ 102 bài E2E.
- Phân tích 152 file source từ 30 entry point Next.js/proxy: không còn file ngoài luồng import. Kiểm tra liên kết file Markdown: không có đích bị thiếu.
- Rà soát độc lập: không phát hiện lỗi do phần dọn source.
- Chưa chạy database/auth/cloud integration trong đợt này; không thay API, migrations hoặc cấu hình môi trường.
- Cache/build local và kết quả test được Git bỏ qua; bước xoá các output này bị cơ chế xét duyệt tự động chặn, nên được giữ lại.

Không có production deployment hoặc remote schema mutation trong đợt dọn này. Tất cả file đã gỡ có thể phục hồi từ commit gốc.
