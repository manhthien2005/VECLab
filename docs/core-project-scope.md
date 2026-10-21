# Phạm vi sản phẩm VECLab

Phạm vi ngày 21/10/2026: [năm bài hiện hành](ui/current-experiments.md) — Jar Test, xử lý nước Fe/Zn/Pb, chiết tách axit–bazơ, xà phòng hóa và phân loại nhựa nguyên sinh. Tài liệu này thay scope MVP cũ về chuẩn độ/nhựa/đồng.

## Jar Test

Khảo sát pH ban đầu và liều phèn trên mẫu kaolin được khóa; so sánh cốc sau chương trình khuấy nhanh, khuấy chậm, lắng; đo NTU, tự tính hiệu suất, chọn phương án và nộp. Đơn vị, giới hạn và nguồn theo [thiết kế Jar](experiments/jar-test-design.md) và profile trong source.

## Chiết tách axit–bazơ

Tách ba thành phần mô phỏng A/B/N bằng hai pha; thêm thuốc thử, trộn, xả áp, phân lớp, chuyển pha, kết tủa/lọc/cô/làm khô, cân và khai báo sản phẩm. Giữ bảo toàn vật chất, thể tích và capacity. [Thiết kế](superpowers/specs/2026-10-15-acid-base-extraction-design.md), [profile](experiments/acid-base-extraction-profile.md).

## Giới hạn

Mô hình học tập, không chứng nhận nước đạt chuẩn hoặc thay quy trình an toàn phòng thí nghiệm. Animation minh họa trạng thái đã commit, không quyết định hóa học. Số đo thiếu/không hợp lệ giữ N/A; câu trả lời đúng chỉ xuất hiện ở phần đánh giá sau hoàn tất.

Giữ landing đã duyệt; bộ chọn giới thiệu đúng năm bài hiện hành và chỉ mở route có trong catalog.
