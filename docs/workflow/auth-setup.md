# Cấu hình đăng nhập VECLab

## Hai biến để kết nối Auth

Đặt trong `.env.local` của checkout đang chạy (hiện tại là worktree `coder-2-landing-polish/Chemistry`), hoặc Environment Variables của môi trường deploy:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key>
```

Dùng publishable key, không đưa secret/service-role key vào `NEXT_PUBLIC_*`. Không commit giá trị thật. Sau khi thay env, khởi động lại dev server; với deployment phải build/deploy lại vì Next.js đóng gói các biến public lúc build. Không cần biến Site URL thứ ba: ứng dụng lấy origin hiện tại để xây callback.

## Cấu hình dự án Supabase

- Bật Email provider và cho phép đăng ký. Chính sách mật khẩu tối thiểu của giao diện là 8 ký tự; Supabase có thể yêu cầu mạnh hơn.
- Bật Confirm email nếu muốn bắt buộc xác minh. Nếu dự án tắt xác minh và trả session ngay, ứng dụng chuyển vào Lab thay vì báo đã gửi email.
- Auth → URL Configuration: Site URL là domain chính thức. Local/preview dùng dự án local/ephemeral theo AGENTS; hosted project hiện tại dành riêng cho production.
- Cho phép callback ở đúng origin đang sử dụng. Local đang chạy: `http://127.0.0.1:3002/auth/callback**`. `localhost` và `127.0.0.1` là hai origin khác nhau.
- Production nên giới hạn callback ở domain và đường dẫn cụ thể, với các URL ứng dụng dùng: `/auth/callback?next=%2Flab`, `/auth/callback?next=%2Faccount`, `/auth/callback?next=%2Fcompare`, `/auth/callback?next=%2Freset-password`. Thêm domain chính thức trước từng đường dẫn. Không mở wildcard cho mọi domain.
- Cấu hình SMTP cho người dùng thực. Dịch vụ email mặc định có giới hạn gửi và giới hạn người nhận; thêm env không bảo đảm email đến hộp thư. Với local, dùng mail catcher của Supabase local.

## Liên kết email

Callback hỗ trợ cả `code` (PKCE mặc định) và `token_hash` cho `signup`, `email`, `recovery`. PKCE mặc định cần mở liên kết trên trình duyệt đã gửi yêu cầu. Để xác minh/khôi phục từ trình duyệt khác, cấu hình nút trong Email Templates như sau; `.RedirectTo` do ứng dụng tạo đã có query `next`:

Confirm signup:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=signup">Xác minh email</a>
```

Reset password:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Đặt lại mật khẩu</a>
```

Không log/chia sẻ URL có code hoặc token_hash. Callback tiêu thụ chứng thực, đặt session cookie và chuyển đến URL không chứa chứng thực. Liên kết không hợp lệ/hết hạn đưa về màn hướng dẫn yêu cầu liên kết mới. Recovery luôn chuyển đến trang đặt lại mật khẩu.

## Kiểm chứng sau khi có env

1. Tạo một tài khoản thử trên Supabase local/ephemeral, nhận email và xác minh; thử cả gửi lại email và liên kết hết hạn.
2. Đăng nhập đúng/sai; thành công phải vào `/lab` và thấy “Phòng lab của tôi / Đã đăng nhập”. Tải lại trang để kiểm tra cookie phiên.
3. Yêu cầu quên mật khẩu, mở email, đặt mật khẩu mới rồi đăng nhập lại. Email không tồn tại vẫn nhận cùng thông báo chung.
4. Đăng xuất: header trở về “Lab dùng thử”, dữ liệu khách được tách riêng. Kiểm tra desktop/mobile và nút hiện/ẩn mật khẩu.

Các kiểm tra bằng mock của source không thay thế việc gửi/nhận email thật. Chưa có env thì chưa nghiệm thu end-to-end với nhà cung cấp.

## Auth và lưu tiến độ là hai phạm vi

Hai biến public phục vụ đăng nhập/đăng ký/khôi phục. Lưu lượt thực hành vào database còn cần migrations/RLS hiện có và cấu hình server theo `.env.example` (`SUPABASE_SECRET_KEY`, `SIMULATION_COMMIT_SECRET`). Không bổ sung secret vào trình duyệt. Task giao diện Auth không chạy migration hoặc thay đổi Supabase hosted.

Tham chiếu: [SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [password auth](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
