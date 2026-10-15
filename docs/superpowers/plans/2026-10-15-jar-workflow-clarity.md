# Jar Test — guide, workflow và báo cáo

Phạm vi theo yêu cầu người dùng: nâng guide, tách bước đo mẫu đầu, làm rõ mẻ dùng chung, polish sổ thực hành và báo cáo. Tiếp tục trên checkout tích hợp đang chạy local 3004; không đổi checkout của session khác, không sửa bài chiết tách/AI, không merge/deploy.

## Cơ sở và lựa chọn

- Engine `jar-test@0.1.0`: prepare/add chỉ ở setup; run_phase chạy cả dàn; measure_final chỉ thêm phép đo vào một cốc, không đổi phase hay khóa cốc khác. Giữ model, release và snapshots cũ.
- Xác minh bằng regression A/B/C: đo sớm A vẫn chuẩn bị/cấp phèn B/C được; chạy đủ mẻ rồi đo/ghi A, B, C độc lập. Không gọi khóa setup có chủ đích là lỗi engine.
- Mục tiêu hiện tại: phương án được chọn có giảm đục ≥80% và phép tính lệch ≤0,5 điểm %. Với 125 NTU đầu, tương đương cuối ≤25 NTU. Đây là mục tiêu bài học, không là tiêu chuẩn nước thực tế. Đầy đủ số đo/đáp số của mọi cốc là chất lượng báo cáo so sánh, không đổi quy tắc chấm thành tất cả cốc phải đạt.
- Trước nộp chỉ show số đo/input đã có; không tự tính hoặc lộ đáp án. Sau nộp chỉ vẽ từ snapshot, không chạy predictor để tạo kết quả cho cốc chưa đo.
- Không kết luận quá liều/thiếu liều chỉ từ hiệu suất thấp. Có thể đối chiếu các cốc đã đo cùng pH nhưng khác liều; nêu đúng phạm vi bằng chứng.

## Thực hiện trực tiếp, không subagent

- [x] Reproduce luồng nhiều cốc bằng một E2E tập trung trước khi sửa.
- [x] Tách Đo mẫu ban đầu thành nhóm thao tác và bước đầu; sổ thực hành chỉ hiển thị kết quả đo. Thêm rà soát cấu hình trước khi khởi động mẻ chung, readiness và giải thích khóa pH/liều.
- [x] Tách notebook thành component: mẫu đầu, bảng cốc/readiness và lịch sử progressive disclosure; selection và draft đúng cốc, không giả số đo.
- [x] Viết lại guide: mục đích, đầu vào, đầu ra, tiêu chí, thuật ngữ; mỗi bước nêu làm gì, dùng gì, tạo ra gì và vì sao. Cùng tên bước với workbench, link giữ attempt.
- [x] Báo cáo: biểu đồ giảm đục so mốc 80%, NTU đầu/cuối so mốc cần đạt; đối chiếu đáp số/sai lệch, checklist thiếu dữ liệu và lỗi đo sớm có sequence. Giữ bảng chi tiết, ghi rõ nguồn mô hình và giới hạn nhân quả.
- [x] Chạy unit engine/session/report bị ảnh hưởng + type/lint; E2E desktop/mobile nhiều cốc và báo cáo thiếu dữ liệu. Không screenshots hoặc suite ngoài phạm vi.
- [x] Giữ server 3004 để người dùng review; báo ngắn và link guide/workbench.

## Kiểm chứng

Đã kiểm tra 26 unit/integration cases của engine, session và insight; typecheck và lint liên quan đạt. E2E tập trung bao phủ nhiều cốc trước/sau đo, bước đo đầu, báo cáo thiếu dữ liệu và guide trên desktop/mobile; bổ sung keyboard và link/icon trang đọc. Các luồng nhiều cốc đã đạt sau khi test chờ đúng trạng thái chuẩn bị cốc đã được lưu, tránh click accordion trùng với chuyển nhóm tự động. Không đổi công thức hoặc quy tắc chấm.
