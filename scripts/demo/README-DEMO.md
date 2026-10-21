# VECLab — bản source demo

Gồm 5 bài: Jar Test, xử lý nước Fe/Zn/Pb, chiết tách axit–bazơ, xà phòng hóa và phân loại nhựa nguyên sinh. Đăng nhập/đăng ký dùng Supabase local; không cần tài khoản Supabase hosted.

## Chuẩn bị

- Máy Windows x64 hoặc Linux x64. Bài xử lý nước dùng PHREEQC đã kèm bản thực thi và database. macOS/ARM cần máy ảo hoặc máy chủ Linux x64 để dùng đầy đủ bài này.
- Node.js 22.13 trở lên (khuyến nghị Node.js 24 LTS), npm và Docker Desktop với Linux engine đang chạy.
- Internet cho lần cài npm/Docker đầu tiên và khi xem các video YouTube/MP4 từ xa. Các video không nằm trong ZIP.

Giải nén toàn bộ ZIP vào một thư mục riêng, mở terminal tại thư mục chứa package.json rồi chạy:

```sh
npm ci
npm run demo:setup
npm run dev
```

Mở http://localhost:3000. Chỉ bấm chạy lại khi lệnh trước đã hoàn tất. Lần đầu Supabase cần tải Docker images nên có thể mất vài phút và cần vài GB dung lượng trống.

`demo:setup` tự khởi động dịch vụ local, áp dụng migrations có sẵn và viết đủ `.env.local`. Không phải điền khóa hoặc tạo project trên website Supabase. Chạy lại lệnh này nếu chuyển source sang máy khác hoặc tạo lại backend local; sau đó khởi động lại ứng dụng, hoặc build lại bản production.

## Đăng nhập và đăng ký

Chọn **Đăng ký**, dùng một email thử và mật khẩu ít nhất 8 ký tự. Môi trường demo không bắt xác minh email. Có thể đăng xuất rồi đăng nhập bằng tài khoản vừa tạo.

- Supabase API: http://127.0.0.1:54331
- Studio: http://127.0.0.1:54333
- Hộp thư local để thử đặt lại mật khẩu: http://127.0.0.1:54334

Tài khoản lưu trên Docker local. Jar Test, chiết tách, xà phòng hóa và phân loại nhựa lưu lượt trong trình duyệt; đăng nhập không đồng bộ lượt sang máy khác. Bài xử lý nước giữ lượt trong bộ nhớ, báo cáo lưu trên thiết bị. Không dùng tài khoản hay dữ liệu cá nhân thật cho demo.

## Chạy chế độ production tại máy demo

Dừng dev server trước, giữ Supabase đang chạy, rồi:

```sh
npm run build
npm start
```

Mở http://localhost:3000. `npm start` cần một lần build thành công. Đây là chế độ production của ứng dụng trên máy local, không phải kết nối database production.

## Kết thúc

Dừng web bằng Ctrl+C. Dừng backend bằng `npm run demo:stop`; dữ liệu local được giữ, lệnh này không reset hoặc xóa database. Lần sau dùng lại `npm run demo:setup` rồi chạy web.

Nếu báo không kết nối Docker, mở Docker Desktop và chờ **Engine running**. Nếu cổng 3000 hoặc 54331–54334 đang được ứng dụng khác dùng, dừng ứng dụng chiếm cổng hoặc đổi cấu hình local rồi chạy lại setup. Không thay URL thành project hosted.

Bản source không kèm node_modules, .next, cache, Git, dữ liệu cá nhân, rule/skill agent hay báo cáo phát triển. Các tệp ghi công/giấy phép tài nguyên được giữ cùng source.
