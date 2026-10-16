# VECLab

Nền tảng học tập mô phỏng quy trình hóa học bằng TypeScript, Next.js và React.

## Trạng thái hiện tại

| Bài | Trạng thái |
| --- | --- |
| Jar Test | Workbench sáu cốc, khuấy/lắng, phép đo NTU, sổ đo, báo cáo và so sánh lượt. |
| Chiết tách axit–bazơ | Workbench A/B/N, hai pha, thu sản phẩm, phép đo, báo cáo và lưu lượt. |
| Hấp phụ xanh methylene | Giữ thẻ giới thiệu; chưa có engine hoặc route thực hành. |

Hai bài thực hành lưu dữ liệu trong IndexedDB của trình duyệt, kể cả khi đăng nhập. Chưa hỗ trợ đồng bộ lượt lên tài khoản. Source của trung hòa axit/chuẩn độ, phân loại nhựa và đặc tả kết tủa đồng đã được gỡ theo quyết định ngày 16/10/2026. Không xóa dữ liệu đã lưu hoặc viết lại migration lịch sử.

## Chạy local

Yêu cầu Node.js >= 22.13.0. Chạy `npm ci`, rồi `npm run dev`; mở http://localhost:3000. Hai bài thực hành không cần tài khoản.

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
