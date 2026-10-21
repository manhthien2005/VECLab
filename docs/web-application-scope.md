# Phạm vi ứng dụng web

Phục vụ [năm bài hiện hành](ui/current-experiments.md): Jar Test, xử lý nước Fe/Zn/Pb, chiết tách axit–bazơ, xà phòng hóa và phân loại nhựa nguyên sinh.

## Màn hình

- Landing, danh mục, chi tiết, hướng dẫn và nguồn khoa học là nội dung công khai.
- Các workbench công khai; Jar Test, chiết tách, xà phòng hóa và phân loại nhựa lưu IndexedDB, xử lý nước giữ trạng thái trong bộ nhớ. Tài khoản không thay nơi lưu lượt.
- Lab/account liệt kê theo đúng bài. Compare dùng báo cáo Jar đã hoàn tất.
- Báo cáo/sổ đo do workbench từng bài trình bày; URL lượt/báo cáo chung là entry tương thích đọc metadata rồi chuyển đúng bài.
- Auth/profile là tính năng riêng, cùng private/no-store, kiểm tra danh tính và same-origin write.

## Tương tác

Thao tác không khả dụng cần lý do thấy được và cách tiếp tục. Phân biệt đang lưu, chưa xác nhận lưu, revision conflict, lượt đã dừng/hoàn tất. Retry cùng ý định dùng cùng action ID; không lặp thao tác hoặc animation khi idempotent replay. Dữ liệu lỗi không được thay bằng lượt mới hoặc số 0 giả.

Keyboard, touch, mobile và reduced motion phải giữ kết quả giống nhau. Không thay OS/browser motion preference. Kiểm chứng theo [hướng dẫn nghiệm thu](verification-and-acceptance.md).
