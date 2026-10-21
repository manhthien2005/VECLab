# Bàn giao source demo VECLab — 2026-10-21

Nhánh chuẩn bị: `chore/demo-source-handoff`, dựa trên `c6c8d3a` (đã có video và danh mục 5 bài theo yêu cầu hiện tại). Không push, merge, triển khai hoặc thay đổi Supabase hosted.

## Rà soát và dọn source

- Kiểm tra đồ thị import bằng Knip và kiểm tra lại các đường dẫn/tài nguyên sử dụng động trước khi xóa. Sau dọn dẹp không còn file `src` không được sử dụng trong đồ thị production, dependency runtime thừa hoặc import không phân giải được. Những API chỉ được dùng bởi kiểm thử khoa học vẫn được giữ.
- Xóa 12 module không được gọi, 6 CSS module đi kèm và 5 ảnh không dùng/trùng lặp. Chuyển bộ tính pH cũ chỉ phục vụ hồi quy sang test fixture, giữ nguyên 327 kiểm thử hiện có. Không còn ảnh public trùng nội dung theo SHA-256.
- Thu gọn export và import không dùng. Sửa các cảnh báo lint hiện có; giữ nguyên ý nghĩa mô hình, dữ liệu lịch sử và migrations.
- Thêm trình chuẩn bị Supabase local, khóa phiên bản CLI và trình tạo bản source demo theo danh sách cho phép. Hướng dẫn dành cho người nhận nằm trong `scripts/demo/README-DEMO.md`.
- Giữ tài liệu nghiên cứu, quy tắc agent và dữ liệu cá nhân ở nơi phát triển khi chúng còn cần thiết; không đưa chúng vào ZIP. Không dọn/xóa các file cá nhân ở checkout gốc.

## Nội dung ZIP

`D:/Dev/Projects/Chemistry/outputs/VECLab-source-demo-2026-10-21.zip`

- 360 file, 9.782.246 byte; SHA-256: `2a2a1082ff93a51cfb1b9cfe62a5f506e118aa711027980e2ad64aa183ef996e`.
- Có source, tài nguyên đang dùng, cấu hình Next/TypeScript/npm, lockfile, migrations, cấu hình Supabase local, script khởi động/dừng, hướng dẫn và PHREEQC cần cho bài xử lý nước. Giữ các tệp giấy phép/ghi công cần thiết.
- Có `.env.local` đã điền cho backend loopback; `npm run demo:setup` tạo lại đầy đủ khóa theo máy nhận. Chỉ ba biến ứng dụng thực sự sử dụng được đưa vào môi trường. Trình setup từ chối ghi đè môi trường hosted.
- Không có Git, node_modules, .next, cache, log, rule/skill agent, hồ sơ cá nhân, bộ kiểm thử hoặc tài liệu phát triển/nghiên cứu. Tắt sinh file agent trong cấu hình Next của bản demo.
- Video YouTube/MP4 được tải từ các địa chỉ từ xa đã cấu hình, không nằm trong ZIP.

## Bằng chứng kiểm tra

| Phạm vi | Kết quả |
| --- | --- |
| TypeScript và lint source | Đạt; lint không cảnh báo |
| Unit/integration hiện có | 327/327 đạt |
| Kiểm thử đóng gói | 3/3 đạt; kiểm tra loại cache/agent/môi trường cá nhân và từ chối ghi đè |
| Guard môi trường | 3 kiểm tra đạt: URL local, từ chối hosted, chỉ tạo ba biến cần thiết |
| Supabase local và migrations | Khởi động thành công; 5 file SQL, 170 kiểm thử pgTAP đạt |
| Cài mới từ bản giải nén | `npm ci`, setup local và typecheck đạt |
| Development từ bản giải nén | 8 trang trả HTTP 200, không lỗi JavaScript trang trong lượt kiểm tra |
| Production từ bản giải nén | Build thành công; máy chủ production chạy được |
| Luồng thí nghiệm trên production | 6 kịch bản đạt, phủ 5 bài; có gọi PHREEQC native cho xử lý nước |
| Video và danh mục landing | 20 kiểm thử desktop/mobile đạt, gồm bàn phím, vuốt, chuyển nhanh và reduced motion |
| Tài khoản qua giao diện | Đăng ký, đăng xuất, đăng nhập, giữ phiên sau reload, đọc/cập nhật hồ sơ đạt trên Supabase local |
| Tính toàn vẹn ZIP | Hash từng file trùng bản giải nén đã kiểm tra; có cấu hình Supabase; không có cache/agent |

Kiểm tra thực thi trên Windows x64. Binary Linux x64 được kèm theo nhưng chưa chạy trên Linux; macOS/ARM cần môi trường x64 phù hợp cho PHREEQC. Đây là kiểm tra chức năng/hồi quy của phần mềm, không phải xác nhận thực nghiệm mô hình hóa học. Không chạy CI từ xa và không thực hiện promotion nhánh trong nhiệm vụ này.

## Thao tác cho người nhận

Cần Node.js 22.13+ (khuyến nghị 24), Docker Desktop Linux engine và Internet cho lần tải dependency/Docker đầu tiên cũng như xem video. Tại thư mục đã giải nén, chạy lần lượt:

```sh
npm ci
npm run demo:setup
npm run dev
```

Mở `http://localhost:3000`. Đăng ký bằng email thử; demo không yêu cầu xác minh email. Production local dùng `npm run build` rồi `npm start`. Dừng backend bằng `npm run demo:stop`, dữ liệu local được giữ. Hướng dẫn đầy đủ và cổng dịch vụ nằm trong `README-DEMO.md` của ZIP.
