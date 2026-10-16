# Nguồn và giới hạn khoa học hiện hành

Danh mục đang phục vụ gồm Jar Test và chiết tách axit–bazơ; thẻ hấp phụ chưa có mô hình/nguồn được công bố. Sổ nguồn của bộ trung hòa axit/nhựa/đồng cũ đã gỡ cùng bài.

## Jar Test

Nguồn, vai trò và giới hạn đang hiển thị nằm tại `src/content/evidence/jar-test.ts`. Profile/model và phương trình tại `src/domain/experiments/jar-test/model.ts`; fixture số học tại `tests/fixtures/jar-test/reference-cases.json`. [Thiết kế](experiments/jar-test-design.md) phân biệt dự đoán, phép đo, nguồn và vùng áp dụng.

## Chiết tách axit–bazơ

Nguồn tại `src/content/evidence/acid-base-extraction.ts`; [profile](experiments/acid-base-extraction-profile.md) và [thiết kế](superpowers/specs/2026-10-15-acid-base-extraction-design.md) mô tả A/B/N lý tưởng hóa. Hằng số dùng cho học tập, không phải bộ dữ liệu đo của ba chất thực được xác nhận.

## Quy tắc bằng chứng

Giữ nguồn hỗ trợ quy trình tách biệt nguồn hằng số/mô hình. Tái hiện công thức, bảo toàn inventory và test deterministic không chứng minh độ chính xác thực nghiệm. UI/report phải hiển thị đúng release, điều kiện và giới hạn; không diễn đạt kết quả như chứng nhận an toàn, đạt chuẩn xả thải hoặc hướng dẫn tự làm ngoài phòng thí nghiệm có giám sát.
