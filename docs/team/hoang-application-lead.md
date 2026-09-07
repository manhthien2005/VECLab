# HOÀNG — FULL-STACK APPLICATION LEAD

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Technical Lead<br>
**Reviewer/backup:** Thiên review code; Ngân review UX; Hân review content

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Biến engine và Figma thành trải nghiệm web xuyên suốt, rõ ràng trên desktop/mobile. |
| 👤 **Vai trò** | Owner Simulation Workbench, report, compare và application integration. |
| ✅ **Đầu ra cuối** | Người dùng có thể bắt đầu, thao tác, lưu, tiếp tục, xem báo cáo và so sánh ba bài. |
| ⚠️ **Không ôm** | Không tự quyết công thức, source wording hoặc data security contract. |

## Đọc tài liệu này khi nào?

- Trước khi triển khai màn hình hoặc component tương tác.
- Khi nhận Figma/content/engine contract để tích hợp.
- Khi một lỗi nằm giữa UI, API và state management.

## Các quyết định chính

- Workbench dùng một shell chung cho cả ba bài; khác biệt đến từ scenario/action renderers.
- Desktop và mobile có đầy đủ chức năng, không phải hai sản phẩm riêng.
- UI chỉ format/render kết quả; không chứa công thức khoa học quyết định state.
- Mọi loading, error, saving, conflict và N/A state phải có thiết kế rõ.
- Hoàng là người viết Plastic engine implementation theo fixture; Khoa duyệt khoa học và Thiên duyệt kiến trúc.

## Mục lục

<!-- TOC:START -->
- [1. Ownership chính](#1-ownership-chính)
- [2. Đầu ra bắt buộc](#2-đầu-ra-bắt-buộc)
- [3. Kế hoạch theo checkpoint](#3-kế-hoạch-theo-checkpoint)
- [4. Dependency và bàn giao](#4-dependency-và-bàn-giao)
- [5. Trách nhiệm review](#5-trách-nhiệm-review)
- [6. Ngoài ownership](#6-ngoài-ownership)
- [7. Definition of Done cá nhân](#7-definition-of-done-cá-nhân)
- [8. Ba việc bắt đầu ngay](#8-ba-việc-bắt-đầu-ngay)
- [9. Dấu hiệu cần báo động](#9-dấu-hiệu-cần-báo-động)
- [10. Tài liệu phải đọc](#10-tài-liệu-phải-đọc)
<!-- TOC:END -->

---

## 1. Ownership chính

Hoàng sở hữu:

- App shell và điều hướng chín khu vực web.
- Experiment catalog/detail/source pages.
- Simulation Workbench desktop/mobile.
- Action forms, validation feedback và unit display.
- Timeline, observations, warnings, charts và technical tabs.
- Guest/account state adapter ở lớp UI.
- Lab history, report và comparison UI.
- Print stylesheet cho report.
- Responsive, accessibility và application E2E phối hợp Mạnh.

## 2. Đầu ra bắt buộc

### Public experience

- Trang chủ/danh mục.
- Chi tiết ba thí nghiệm.
- Trang nguồn khoa học.
- Auth screens dùng component/state từ Ngân.

### Simulation Workbench

- Header, mục tiêu và save status.
- Timeline và current step.
- Visual state và metric panels.
- Action selector và parameter inputs.
- Feedback, calculation trace, source và limitation tabs.
- Undo/reset/branch/complete controls theo capability.

### Learner area

- Phòng lab của tôi.
- Resume attempt.
- Report page và print layout.
- Compare hai completed attempts cùng release.
- Account/data page.

### Plastic engine implementation

- Implement representative/range-guard partition theo fixture của Khoa.
- Implement stream tree, purity, recovery, yield và mass closure.
- Không thay golden expected hoặc density preset.
- Khoa duyệt correctness trước khi tích hợp vào Workbench.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Dựng design tokens/component primitives từ Figma của Ngân.
- Xây app shell, routes và responsive scaffolding.
- Dùng mock contract của Thiên để dựng Workbench states.
- Xây component cho metric, warning, timeline và action form.
- Thống nhất content slots với Hân.

### Checkpoint B — 14/09 đến 20/09

- Acid guest flow chạy xuyên suốt.
- Local attempt persistence/resume UI.
- Acid report và print view.
- Tích hợp auth shell/lab list với Mạnh.
- Design QA desktop/mobile cùng Ngân.

### Checkpoint C — 21/09 đến 27/09

- Tái sử dụng shell cho Copper và Plastic.
- Hoàn thiện charts, stream tree và species/technical tables.
- Tích hợp cloud save/resume/conflict.
- Hoàn thiện history/report/compare.
- Hoàn thành Plastic partition implementation theo fixtures và tích hợp vào Workbench.

### Checkpoint D — 28/09 đến 07/10

- Sửa responsive/accessibility/browser issues.
- Hoàn thiện loading/error/empty/N/A states.
- Chạy E2E cùng Mạnh và UX/content QA cùng Ngân/Hân.
- Cung cấp screenshots và demo flow cho báo cáo.

## 4. Dependency và bàn giao

| Cần từ | Nội dung | Cách dùng |
| --- | --- | --- |
| Ngân | Figma, token, responsive/state matrix | component và page implementation |
| Hân | Copy, warning, explanation, citation | content slots |
| Thiên | Process/API/report contracts | data fetching và mutation |
| Khoa | Engine output, trace, fixtures | render state/result |
| Mạnh | Auth, persistence, preview | end-to-end integration |

Nếu dependency chưa xong, Hoàng dùng typed mock đúng contract; không tự sáng tác contract tạm không được review.

## 5. Trách nhiệm review

- Review khả năng triển khai của Figma trước khi Ngân polish sâu.
- Review frontend/application PR của coder khác.
- Cùng Ngân duyệt responsive và interaction.
- Cùng Hân duyệt copy bị cắt, khó đọc hoặc sai state.
- Cùng Thiên kiểm tra UI không lặp domain logic.

## 6. Ngoài ownership

- Hằng số, solver, scoring correctness — Khoa.
- Shared architecture/API policy — Thiên.
- Database/RLS/CI/deployment — Mạnh.
- UX source of truth — Ngân.
- Scientific copy/evidence/Word report — Hân.

## 7. Definition of Done cá nhân

- Ba bài dùng cùng Workbench shell.
- Mọi core flow dùng được ở 320, 390, 768, 1024 và 1440 px.
- Không có horizontal overflow trong core pages.
- Keyboard/focus/labels/error state hoạt động.
- Save status không nói “đã lưu” trước server ack.
- Report guest/cloud dùng cùng layout và in PDF được.
- UI không tự tính chemistry hoặc sửa expected values.
- Ngân, Hân và Thiên đã review phần liên quan.

## 8. Ba việc bắt đầu ngay

1. Chuyển mockup đã duyệt thành component/state inventory.
2. Xây Workbench shell bằng typed mock của Thiên.
3. Hoàn thiện acid guest path trước khi tạo page đặc thù Copper/Plastic.

## 9. Dấu hiệu cần báo động

- Figma chưa có error/loading/mobile state nhưng code đã khóa layout.
- Component riêng cho mỗi thí nghiệm lặp lại phần lớn logic.
- UI cần tự suy công thức vì engine thiếu output.
- Hoàng có hơn ba page lớn đang làm dở.
- E2E chỉ được bắt đầu ở tuần cuối.

## 10. Tài liệu phải đọc

- [Team Plan](README.md)
- [Web Application Scope](../web-application-scope.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Desktop/Mobile Mockups](../mockups/)
- [Verification and Acceptance](../verification-and-acceptance.md)
