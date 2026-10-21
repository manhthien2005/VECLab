# VECLab

Nền tảng học tập mô phỏng quy trình hóa học bằng TypeScript, Next.js và React.

## Trạng thái hiện tại

| Bài | Trạng thái |
| --- | --- |
| Jar Test | Workbench sáu cốc, khuấy/lắng, phép đo NTU, sổ đo, báo cáo và so sánh lượt. |
| Chiết tách axit–bazơ | Workbench A/B/N, hai pha, thu sản phẩm, phép đo, báo cáo và lưu lượt. |
| Xử lý nước Fe, Zn và Pb | Điều chỉnh pH, khuấy, lắng/lọc và đối chiếu chỉ tiêu; trạng thái trong bộ nhớ. |
| Xà phòng hóa | Pha kiềm, trộn dầu, đổ khuôn, ủ và kiểm tra sản phẩm. |
| Phân loại nhựa nguyên sinh | Tách nổi–chìm theo khối lượng riêng, cân phân đoạn và xem báo cáo. |

Jar Test, chiết tách, xà phòng hóa và phân loại nhựa lưu IndexedDB của trình duyệt; xử lý nước giữ trạng thái trong bộ nhớ. Đăng nhập không đồng bộ lượt sang thiết bị khác. Source của trung hòa axit/chuẩn độ và đặc tả kết tủa đồng cũ đã được gỡ. Không xóa dữ liệu đã lưu hoặc viết lại migration lịch sử.

## Chạy local

Yêu cầu Node.js >= 22.13.0. Chạy `npm ci`, rồi `npm run dev`; mở http://localhost:3000. Các bài thực hành không cần tài khoản.

Auth/profile dùng Supabase theo [.env.example](.env.example). Nhánh phát triển chỉ dùng môi trường local/ephemeral; không đưa khóa đặc quyền production vào source hoặc CI phát triển.

## Kiểm tra

- `npm run verify`: TypeScript, ESLint, unit/integration và production build.
- `npm run test:e2e`: Playwright desktop/mobile; có thể cần `npx playwright install chromium`.
- `npm run test:db`, `npm run test:db:concurrency`: cần Supabase local; CI kiểm tra riêng.

## Source và tài liệu

- `src/domain`: hai mô hình thí nghiệm, Process Core, đơn vị và ledger.
- `src/application`: session, IndexedDB, projection/report và profile.
- `src/features`: workbench, lab, tài khoản, danh mục và landing.
- `src/content`: nội dung, trợ giúp và nguồn của hai bài.
- `supabase`: lịch sử migration và kiểm thử hợp đồng dữ liệu; không phải danh mục bài đang phục vụ.
- [Tài liệu](docs/README.md), [phạm vi hiện hành](docs/ui/current-experiments.md), [quy tắc repository](AGENTS.md).

Công việc tách nhánh từ develop, trở về develop qua PR và CI. Production dùng PR develop → main. Mô hình phục vụ học tập, không thay thế thí nghiệm hoặc đánh giá an toàn thực tế.
