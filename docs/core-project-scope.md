# Phạm vi sản phẩm VECLab

Quyết định ngày 16/10/2026: tập trung [hai bài hiện hành](ui/current-experiments.md), giữ thẻ hấp phụ chưa triển khai. Tài liệu này thay scope MVP cũ về chuẩn độ/nhựa/đồng.

## Jar Test

Khảo sát pH ban đầu và liều phèn trên mẫu kaolin được khóa; so sánh cốc sau chương trình khuấy nhanh, khuấy chậm, lắng; đo NTU, tự tính hiệu suất, chọn phương án và nộp. Đơn vị, giới hạn và nguồn theo [thiết kế Jar](experiments/jar-test-design.md) và profile trong source.

## Chiết tách axit–bazơ

Tách ba thành phần mô phỏng A/B/N bằng hai pha; thêm thuốc thử, trộn, xả áp, phân lớp, chuyển pha, kết tủa/lọc/cô/làm khô, cân và khai báo sản phẩm. Giữ bảo toàn vật chất, thể tích và capacity. [Thiết kế](superpowers/specs/2026-10-15-acid-base-extraction-design.md), [profile](experiments/acid-base-extraction-profile.md).

## Giới hạn

Mô hình học tập, không chứng nhận nước đạt chuẩn hoặc thay quy trình an toàn phòng thí nghiệm. Animation minh họa trạng thái đã commit, không quyết định hóa học. Số đo thiếu/không hợp lệ giữ N/A; câu trả lời đúng chỉ xuất hiện ở phần đánh giá sau hoàn tất.

Landing đã duyệt được giữ. Không tạo route thực hành cho bài hấp phụ khi chưa có engine và profile.
