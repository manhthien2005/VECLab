# Tài liệu VECLab

Bộ tài liệu được giữ lại để hỗ trợ kiểm tra và refactor. Phân biệt rõ **yêu cầu mục tiêu** trong đặc tả với **khả năng đã triển khai** trong source; xem [nền source hiện tại](refactor-baseline.md).

## Thiết kế refactor hiện hành — 13/10/2026

- [Thiết kế sản phẩm và hợp đồng mô phỏng 2D](superpowers/specs/2026-10-13-simulation-v1-design.md): yêu cầu đã chốt, các lựa chọn đề xuất, ba bài mục tiêu, phản hồi cuối lượt và ranh giới engine/phép đo/hình ảnh.
- [Jar Test — thiết kế chi tiết và điều kiện kiểm chứng](experiments/jar-test-design.md): bài ưu tiên; chưa có numerical release hoặc prototype.
- [Rà soát lựa chọn ba bài](research/scenario-selection-review.md): căn cứ khoa học/giáo dục và giới hạn.
- [Audit luồng mô phỏng và kiểm tra mô hình ứng viên](research/simulation-refactor-audit.md): phần giữ/thay, kết quả kiểm tra số học và lựa chọn triển khai gọn.
- [Plan Jar Test đầu cuối](superpowers/plans/2026-10-13-jar-test-first-slice.md): sáu phần để giao thực hiện, có điểm nghiệm thu; chưa phải tính năng đã triển khai.

Phạm vi mới là pH, Jar Test và hấp phụ xanh methylene. Các scope/architecture cũ bên dưới được giữ để audit implementation và tương thích release cũ; danh sách bài, rubric và chính sách hướng dẫn cũ không tự động là yêu cầu refactor mới. Khi lập kế hoạch phải đối chiếu mục tiêu mới với hợp đồng đang chạy, không coi tài liệu thiết kế là tính năng đã triển khai.

## Tài liệu nguồn

| Tài liệu | Dùng khi |
| --- | --- |
| [Core Project Scope](core-project-scope.md) | Xác định phạm vi và giới hạn khoa học |
| [Web Application Scope](web-application-scope.md) | Xác định hành vi màn hình, guest, tài khoản và báo cáo |
| [System Architecture](system-architecture.md) | Kiểm tra ranh giới domain/application/infrastructure/UI |
| [Data and State Model](data-and-state-model.md) | Kiểm tra attempt, event, snapshot và ownership dữ liệu |
| [Scientific Evidence Register](scientific-evidence-register.md) | Đối chiếu claim, nguồn và hằng số |
| [Verification and Acceptance](verification-and-acceptance.md) | Xác định bằng chứng cần có trước khi nghiệm thu |
| [Backend Threat Model](security/backend-threat-model.md) | Tham khảo ranh giới bảo mật và negative cases; tài liệu có commit gốc, cần đối chiếu source mới |

## Đặc tả thí nghiệm

- [Trung hòa axit](experiments/acid-neutralization-spec.md): căn cứ cho engine đã triển khai.
- [Kết tủa đồng](experiments/copper-precipitation-spec.md): mục tiêu chưa có engine hoạt động.
- [Phân loại nhựa](experiments/plastic-density-separation-spec.md): mô hình mục tiêu; mô phỏng nhựa nguyên sinh của Hoàng hiện là một luồng riêng, chưa thực hiện đầy đủ đặc tả này.

## Quy tắc ưu tiên

- Phạm vi refactor mới: thiết kế ngày 13/10/2026 → đặc tả từng bài mới khi được khóa. Scope cũ mô tả baseline/legacy; Core Scope → Web Scope → Architecture → Data Model vẫn là thứ tự đọc của bộ cũ.
- Khoa học: experiment spec → Evidence Register → generic contracts.
- Kiểm thử: golden cases/tolerance trong spec → Acceptance → fixtures trong source.
- Quy trình Git và môi trường: [AGENTS.md](../AGENTS.md).
- Phân công chuyên môn: [ownership đội ngũ](team/README.md).

Các mốc triển khai cũ trong tài liệu nguồn là bối cảnh lịch sử, không phải kế hoạch refactor mới. Nội dung khoa học và hợp đồng dữ liệu được giữ làm căn cứ; thay đổi làm khác kết quả cần xem xét release/version và khả năng đọc báo cáo cũ.

Tổng quan lịch sử, bản thiết kế ban đầu, mockup HTML, hướng dẫn landing cũ và các charter trùng lặp đã được bỏ trong đợt chuẩn bị refactor. Có thể tra lại trong Git ở commit c60ac86.
