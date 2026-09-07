# THIÊN — TECHNICAL LEAD & APPLICATION BACKEND

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Trưởng nhóm<br>
**Reviewer/backup:** Khoa cho domain; Mạnh cho data; Hoàng cho application integration

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Giữ một kiến trúc thống nhất và đưa các module thành một sản phẩm chạy xuyên suốt. |
| 👤 **Vai trò** | Technical Lead, Process Core và application backend. |
| ✅ **Đầu ra cuối** | Codebase có contract rõ, ba engine tích hợp, action pipeline và report projection ổn định. |
| ⚠️ **Không ôm** | Không tự viết mọi engine, mọi UI hoặc toàn bộ database. |

## Đọc tài liệu này khi nào?

- Trước khi Thiên nhận task hoặc review pull request.
- Khi team chưa rõ logic nên nằm ở domain, application hay infrastructure.
- Khi có thay đổi interface giữa engine, UI và database.

## Các quyết định chính

- Thiên là người quyết định kỹ thuật trong phạm vi scope đã chốt, không tự đổi scope.
- Process Core và shared contracts phải ổn định trước khi chia rộng ba module.
- UI không chứa công thức khoa học; infrastructure không chứa domain rule.
- Mọi cloud mutation phải được server xác nhận và commit nguyên tử.
- Thiên ưu tiên gỡ blocker và review hơn việc nhận quá nhiều task riêng.

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

Thiên sở hữu:

- Cấu trúc codebase Next.js/TypeScript.
- Ranh giới `domain`, `application`, `infrastructure`, `features` và `content`.
- Process Core và action/result contracts.
- Canonical units, typed errors và scenario release registry.
- Server simulation flow và integration với commit RPC.
- Report projection contract dùng chung guest/cloud.
- Integration giữa engine, UI, Auth và persistence.
- Quy tắc code review và giải quyết technical blocker.

## 2. Đầu ra bắt buộc

### Nền tảng code

- Project khởi động được bằng một lệnh thống nhất.
- TypeScript strict, lint, test và build scripts rõ.
- Folder boundaries khớp [System Architecture](../system-architecture.md).
- Shared schemas không phụ thuộc UI.

### Process Core

- `ScenarioRef`, `SimulationAction`, `SimulationContext`, `SimulationResult`.
- Action precondition và state transition pipeline.
- Calculation trace, warning và observation contracts.
- Completion, reset, branch và undo-last semantics.
- Deterministic replay.

### Application backend

- API/server functions nhận normalized action.
- Session/ownership/revision validation.
- Server chạy engine và gửi trusted result cho RPC.
- Report và compare projection.
- Error mapping an toàn cho client.

### Integration

- Acid vertical slice chạy đầu tiên.
- Copper và Plastic dùng cùng Process Core.
- Guest/cloud trả cùng domain result shape.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Khởi tạo application skeleton cùng Mạnh.
- Khóa folder structure, types và coding conventions.
- Tạo Process Core interfaces và release registry.
- Kết nối test runner với golden fixtures do Khoa cung cấp.
- Cung cấp mock services để Hoàng code UI không phải chờ database.

### Checkpoint B — 14/09 đến 20/09

- Tích hợp Acid Engine vào action pipeline.
- Hoàn thiện guest attempt repository contract.
- Hoàn thiện report projection cho acid.
- Review Auth/database/RPC contract của Mạnh.
- Review Workbench integration của Hoàng.

### Checkpoint C — 21/09 đến 27/09

- Tích hợp Copper và Plastic releases.
- Khóa guest import replay và conflict behavior.
- Hoàn thiện compare contract cùng Hoàng/Mạnh.
- Giải quyết khác biệt state/action giữa ba bài.

### Checkpoint D — 28/09 đến 07/10

- Không nhận feature ngoài scope.
- Review toàn bộ blocking PR.
- Sửa integration, security hoặc deterministic replay failures.
- Hỗ trợ Mạnh release production.
- Cung cấp kiến trúc, sơ đồ và nội dung kỹ thuật cho Hân.

## 4. Dependency và bàn giao

| Cần từ | Nội dung | Thiên bàn giao cho |
| --- | --- | --- |
| Khoa | State/action/engine contract và fixtures | Hoàng, Mạnh |
| Ngân | User flow và UI states | Hoàng |
| Hân | Copy, warning, source mapping | Hoàng |
| Mạnh | RPC, Auth và persistence API | Hoàng |
| Hoàng | Integration feedback từ UI | Khoa/Mạnh khi contract cần sửa |

Thiên phải chốt interface bằng type/test, không chỉ bằng trao đổi miệng.

## 5. Trách nhiệm review

- Review mọi PR thay shared/domain/application contract.
- Engine PR: kiểm tra determinism, unit, error và calculation trace; Khoa duyệt khoa học.
- Data PR: kiểm tra ownership, idempotency và transaction; Mạnh sở hữu implementation.
- UI PR: chỉ review contract/performance, không thay Ngân trong design review.
- Không merge khi test chưa chứng minh hành vi mới.

## 6. Ngoài ownership

Thiên không phải owner cuối của:

- Hằng số hoặc tính đúng khoa học — Khoa.
- Figma/design system — Ngân.
- Copy/source/report Word — Hân.
- Supabase/RLS/deployment — Mạnh.
- UI component và responsive implementation — Hoàng.

Thiên hỗ trợ nhưng không nhận thay ownership nếu chưa có quyết định điều phối.

## 7. Definition of Done cá nhân

- Shared types không có hai phiên bản cạnh tranh.
- Ba engine chạy qua cùng Process Core.
- Domain không import React/Supabase.
- Cloud action có auth, ownership, revision, idempotency và atomic commit.
- Guest/cloud report dùng cùng projection.
- Blocking integration tests pass.
- Technical decisions quan trọng được ghi vào code/docs.
- Ít nhất một người khác hiểu được mỗi module Thiên sở hữu.

## 8. Ba việc bắt đầu ngay

1. Tạo application skeleton, strict TypeScript và test commands.
2. Định nghĩa Process Core contracts từ System Architecture §5–6.
3. Cùng Khoa đưa Acid golden fixtures vào test runner trước implementation.

## 9. Dấu hiệu cần báo động

- Một feature UI tự tính chemistry.
- Engine trả shape riêng không đi qua Process Core.
- Mạnh/Hoàng phải chờ contract quá một ngày.
- PR shared code không có reviewer thứ hai.
- Thiên có hơn hai hạng mục implementation lớn đang mở đồng thời.

## 10. Tài liệu phải đọc

- [Team Plan](README.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Web Application Scope](../web-application-scope.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
- Ba [experiment specifications](../experiments/)
