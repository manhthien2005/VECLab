# Nâng cấp chuyển động thực hành

Người dùng đã yêu cầu triển khai: Jar luôn có phản hồi chuyển động, bỏ ô tắt; chiết tách cần thấy rõ cấp dịch, trộn, phân lớp, thu pha và thu sản phẩm. Dùng CSS/SVG và React hiện có, tự review; không subagent, dependency, commit/push hoặc thay đổi mô hình.

## Hướng chuyển động

- Điểm nhấn: nguồn và bình nhận cùng xuất hiện khi chuyển/thu mẫu; dòng chảy nối đúng hai bình, mức dịch thay đổi từ trạng thái công khai trước thao tác đến trạng thái đã lưu.
- Liên tục: nhận snapshot hiển thị trước thao tác, chỉ tạo cue sau khi session xác nhận thành công. Dữ liệu/khối lượng luôn là bản đã lưu, animation không ghi action hoặc quyết định hóa học.
- Phản hồi: cấp thuốc thử có chai và dòng cấp; trộn có chuyển động bình/dịch; xả áp có nắp/luồng khí; phân lớp tách hai vùng nước/hữu cơ; lọc, cô/làm khô và phép đo có minh họa riêng.
- Ngân sách: CSS transform/opacity, SVG clip; từng cue hữu hạn khoảng 2,6 giây, không khóa controls. Cue mới thay cue cũ. Không dùng thư viện 3D, shader hoặc vòng render từng frame.
- Khả dụng: giữ cue khi khu mô phỏng chưa hiện; dừng khi ngoài màn hình/tab trình duyệt ẩn. Giảm chuyển động theo thiết lập hệ thống, vẫn có trạng thái và thông báo thao tác. Không đổi thiết lập OS.

## Phạm vi file

- Jar workbench/apparatus/CSS: bỏ checkbox và opt-in/skip state; bật mặc định, CSS giảm chuyển động và pause offscreen tiếp tục áp dụng. Hiển thị rõ ba pha chạy bằng thời gian mô phỏng, không phải đợi ngoài đời.
- Extraction workbench: thay chuỗi motion có timer tự hết bằng cue trình bày có snapshot public vessels và metadata UI; chỉ cập nhật sau thành công, hủy khi chọn bình khác.
- Extraction apparatus: quan sát visibility, kết thúc cue hữu hạn khi cảnh đã được xem; giữ tooltip, số đo, chọn bình và bản lưu.
- Extraction motion-scene.tsx: cảnh SVG theo hành động, cùng bình nguồn/nhận, nhãn minh họa và dòng chảy; không import engine/session.
- Extraction vessel-art.tsx/apparatus CSS: thay đổi mức pha dựa trên geometry snapshot và các hiệu ứng hữu hạn; tôn trọng reduced motion.
- E2E mới và hai case motion Jar hiện có: hành vi mặc định, cả hai bình, cue chờ mobile, ngắt/thay cue, dữ liệu không đổi khi xem/tải lại, reduced motion và workflow hiện có.

## Các bước thực hiện

1. Viết browser regression và chạy RED trên control/cảnh mới chưa tồn tại.
2. Bỏ checkbox Jar, cập nhật đúng hai case kiểm tra motion; giữ số đo độc lập và thời gian mô phỏng.
3. Nối cue UI từ kết quả đã lưu, xây các cảnh và chuyển mức dịch; kiểm tra source/receiver, pha và mức trước/sau.
4. Chạy tests tập trung: motion desktop/mobile, quy trình chiết valid/missing-mix, các phép đo Jar và tương tác tooltip/phase. Typecheck/lint file liên quan/diff check; không chạy toàn bộ database/cloud.
5. Một lượt xem chuyển động và bố cục desktop/mobile, sửa gộp nếu có lỗi. Chỉ cập nhật media guide thực sự đã lỗi thời; trình bày bản local cho người dùng.

## Điều kiện đủ

Chuyển động cho thấy hành động đã thực hiện và đúng nơi mẫu đi đến; không lộ thành phần ẩn, không tạo thời gian chờ thao tác, không thay kết quả. Mở/đóng cảnh hoặc hủy animation không tăng revision, cue không tự phát lại khi reload. Giao diện đã duyệt và nguồn dữ liệu được bảo toàn.

## Kết quả triển khai và kiểm tra

- Jar đã bỏ ô tắt hoạt ảnh; các pha vẫn tiến bằng thời gian mô phỏng. Khi thiết bị yêu cầu giảm chuyển động, cánh khuấy chạy chậm hơn và các phản hồi ngắn vẫn hiện; không đổi cài đặt hệ thống.
- Chiết tách có cảnh nguồn–bình nhận, dòng rót hoặc dòng từ khóa phễu, mức pha trước/sau, cấp thuốc thử, trộn, xả áp, phân lớp, lọc, cô/làm khô và đo. Cue chỉ sinh sau lưu thành công, không khóa thao tác; giữ khi người dùng đang ở bảng thao tác trên điện thoại và không phát lại khi tải lại.
- RED: ba case desktop mới thất bại đúng ở ô tắt/cảnh chưa tồn tại trước khi sửa. Lần chạy đầu sau sửa phát hiện hai race trong bước chuẩn bị Jar của test; đã chờ revision xác nhận trước bước tiếp theo. Hai assertion guide cũ được cập nhật theo bài hướng dẫn đã duyệt, phần kiểm tra quy trình và số liệu không đổi.
- GREEN cuối: 10/10 kiểm tra motion trên chromium/mobile, gồm chế độ chuyển động thường và giảm chuyển động, thay cue, mức dịch và dữ liệu sau tải lại. Quy trình chiết đủ/thiếu trộn: 4/4; tooltip: 2/2; cảnh pha và guide: 2/2 ở các lượt tập trung trước đó.
- Ảnh tổng quan và hai video chiết trong guide đã ghi lại từ UI mới; 4/4 kiểm tra media Jar/chiết trên desktop/mobile xác nhận phát theo yêu cầu và tải phụ đề.
- Typecheck, ESLint các file liên quan, diff check và design scan đều qua. Một lượt xem desktop/mobile và một lượt xác nhận sau sửa gộp không có tràn ngang. Chỉ kiểm chứng UI/quy trình đã nêu; chưa đánh giá hiệu quả học tập hoặc chạy toàn bộ suite.
- Không thêm dependency, không sửa engine/session/API/database/chấm điểm, không dùng subagent, không commit/push/merge/deploy. Bản local giữ tại develop theo lựa chọn của người dùng.
