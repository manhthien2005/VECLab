# Tài liệu VECLab

Phạm vi hiện hành ngày 16/10/2026: **Jar Test** và **chiết tách axit–bazơ**. Thẻ hấp phụ xanh methylene được giữ như bài chưa triển khai. Xem [danh sách bài](ui/current-experiments.md).

## Thí nghiệm

- [Jar Test — thiết kế, đơn vị và giới hạn](experiments/jar-test-design.md).
- [Chiết tách — thiết kế](superpowers/specs/2026-10-15-acid-base-extraction-design.md) và [profile mô hình](experiments/acid-base-extraction-profile.md).
- [Nguồn và giới hạn](scientific-evidence-register.md); nội dung đang phục vụ ở `src/content/evidence`.

## Hợp đồng ứng dụng

- [Phạm vi sản phẩm](core-project-scope.md), [màn hình và luồng](web-application-scope.md).
- [Kiến trúc](system-architecture.md), [dữ liệu](data-and-state-model.md), [kiểm chứng](verification-and-acceptance.md).
- [Bảo mật backend](security/backend-threat-model.md): có bối cảnh lịch sử; đối chiếu code hiện hành. Migrations/SQL fixtures vẫn giữ lịch sử hợp đồng lưu trữ, không đăng ký lại bài đã bỏ.

## Quy trình

- [AGENTS](../AGENTS.md), [ownership đội ngũ](team/README.md), [checkout riêng](workflow/tech-lead-sessions.md), [workflow coder](workflow/parallel-work.md).
- [Contract giao việc](workflow/web-handoff-contract.md), mẫu JSON [task](workflow/templates/task.json)/[result](workflow/templates/result.json).
- [Skill UI](workflow/ui-skills.md), [motion](workflow/motion-skills.md), [nguồn skill](workflow/skill-sources.md).
- [Giữ landing đã duyệt](ui/landing-preservation-contract.md).
- [Plan dọn source](superpowers/plans/2026-10-16-retire-old-experiments.md).

Đặc tả/task riêng của trung hòa axit, nhựa và đồng cùng các handoff chuẩn bị đã hết hiệu lực được gỡ khỏi source. Lịch sử có thể tra bằng Git trước nhánh `chore/retire-old-experiments`. Các plan Jar/extraction giữ bằng chứng triển khai; không coi checklist cũ là task đang chờ chạy.
