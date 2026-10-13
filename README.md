# VECLab

Nền tảng học tập mô phỏng quy trình hóa học môi trường bằng TypeScript, Next.js và React.

## Trạng thái hiện tại

| Phần | Mức triển khai |
| --- | --- |
| Trung hòa axit | Engine, workbench, lưu lượt, lịch sử, báo cáo và so sánh đã có trong source. Luồng tài khoản/cloud cần Supabase local để kiểm chứng. |
| Phân loại nhựa nguyên sinh | Mô phỏng riêng cho 6 polymer qua nước, ethanol và NaCl; có trang chi tiết, kết quả theo bước và làm lại. Chưa tích hợp lưu lượt, báo cáo hoặc Process Core. |
| Kết tủa đồng | Có đặc tả và hình giới thiệu; chưa có engine/workbench hoạt động. |

Các đặc tả mô tả sản phẩm mục tiêu. Chúng không phải bằng chứng rằng mọi tính năng đã hoàn thành. Mô phỏng nhựa hiện tại dùng kết quả cố định theo các mốc nghiên cứu, khác với mô hình mục tiêu trong đặc tả nhựa.

## Chạy local

Yêu cầu Node.js >= 22.13.0 và npm. Cài dependency bằng lockfile:

~~~sh
npm ci
npm run dev
~~~

Mở http://localhost:3000. Chế độ khách chạy không cần file môi trường; dữ liệu lượt axit lưu trên trình duyệt.

Để kiểm tra tài khoản và cloud save, cấu hình Supabase **local** theo các tên biến trong [.env.example](.env.example). Chỉ điền khóa local thật vào file .env.local; không dùng giá trị placeholder và không đưa thông tin đặc quyền production vào nhánh phát triển.

## Kiểm tra

~~~sh
npm run verify
npm run test:e2e
~~~

- verify chạy TypeScript, ESLint, unit/integration tests và production build.
- test:e2e chạy Playwright trên desktop/mobile; có thể cần cài browser bằng npx playwright install chromium.
- npm run test:db và npm run test:db:concurrency cần Supabase local đang chạy. Hai bước này được CI kiểm tra riêng.
- Build hoặc unit tests qua không thay thế kiểm tra database, đăng nhập và luồng cloud.

## Bản đồ source

| Thư mục | Trách nhiệm |
| --- | --- |
| src/app | Trang, route API, shell ứng dụng |
| src/domain | Mô hình khoa học, Process Core, invariants và ledger |
| src/application | Session, repositories, projection và điều phối mô phỏng |
| src/features | Workbench, tài khoản, danh mục, báo cáo và landing |
| src/content | Nội dung tiếng Việt, release manifests và nguồn khoa học |
| src/infrastructure | Supabase clients |
| src/shared | Tiện ích dùng chung |
| supabase | Migrations, database tests và cấu hình local |
| tests, e2e | Fixtures và kiểm thử tự động |
| docs | Scope, contracts, đặc tả và ghi chú chuẩn bị refactor |

Các thư mục .agent, .agents, .claude và skills-lock.json là công cụ hỗ trợ phát triển đã được cài trong repo, không nằm trong runtime ứng dụng.

## Tài liệu và quy trình

- [Mục lục tài liệu](docs/README.md)
- [Nền source trước refactor](docs/refactor-baseline.md)
- [Ownership đội ngũ](docs/team/README.md)
- [Quy tắc repository](AGENTS.md)

Công việc thông thường tách nhánh từ develop và trở về develop qua PR. Production chỉ phát hành từ main qua PR develop → main; CI bắt buộc phải xanh. Đợt dọn source này được tách từ Hoang theo yêu cầu riêng.

Mô hình phục vụ học tập, chưa thay thế thí nghiệm thực tế, thiết kế kỹ thuật hoặc đánh giá an toàn.
