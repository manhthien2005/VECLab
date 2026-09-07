# MẠNH — PLATFORM, DATA & DEVOPS LEAD

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Trưởng nhóm và Technical Lead<br>
**Reviewer/backup:** Thiên review backend/security contract; Hoàng review client integration

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Tạo nền tảng dữ liệu, bảo mật và delivery để sản phẩm luôn chạy, lưu đúng và triển khai được. |
| 👤 **Vai trò** | Owner Auth, PostgreSQL, RPC, RLS, CI/CD, environment và test automation. |
| ✅ **Đầu ra cuối** | Guest import, cloud save/resume, quyền sở hữu dữ liệu, preview và production hoạt động an toàn. |
| ⚠️ **Không chỉ DevOps** | Mạnh trực tiếp viết backend/data/security code, không chờ đến cuối mới deploy. |

## Đọc tài liệu này khi nào?

- Trước khi tạo Supabase project, migration hoặc workflow CI.
- Khi xử lý Auth, persistence, conflict, guest import hoặc deployment.
- Khi một lỗi liên quan environment, permission hoặc dữ liệu người dùng.

## Các quyết định chính

- Browser chỉ đọc own cloud data; trusted writes đi qua server/BFF và RPC.
- Event insert và snapshot update phải nguyên tử.
- RLS là defense in depth, không thay server ownership validation.
- Guest data nằm IndexedDB; import phải replay action inputs trên server.
- Preview deployment và test automation phải có từ tuần đầu.

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

Mạnh sở hữu:

- Supabase project và environment configuration.
- Email/password Auth, verify và reset password.
- Profiles, attempts, attempt_events và guest_imports migrations.
- RLS policies, grants và negative database tests.
- Server-only commit RPC, idempotency và optimistic concurrency.
- Guest import validation/replay persistence.
- CI cho lint, type-check, unit, database và E2E tests.
- Preview/production deployment, environment variables và secrets handling.
- Logging, correlation ID và release checklist.

## 2. Đầu ra bắt buộc

### Environment và CI/CD

- Local setup không chứa secret thật trong Git.
- Preview deployment từ pull request.
- Production environment riêng.
- CI chặn merge khi required checks fail.
- Migration áp dụng được từ môi trường sạch.

### Auth

- Sign up, verify email, sign in/out.
- Forgot/reset/change password.
- Profile provisioning idempotent.
- Session refresh và private/no-store behavior đúng.

### Persistence

- Attempt lifecycle và current snapshot.
- Append-only event log.
- Final report snapshot.
- Branch origin và reset lifecycle.
- Query cho Lab, resume, report và compare.

### Security

- User A không đọc/ghi/xóa dữ liệu user B.
- Browser không insert/update fake state, score hoặc report.
- Service key không xuất hiện client/log.
- Origin/CSRF, payload-size và event-count limits.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Dựng Supabase local/preview project và migration skeleton.
- Dựng GitHub Actions/CI và preview deployment.
- Tạo environment template, secret rules và README setup.
- Chốt repository/RPC contracts với Thiên.
- Viết database test harness trước migration nghiệp vụ.

### Checkpoint B — 14/09 đến 20/09

- Hoàn thiện email/password Auth và profile provisioning.
- Tạo attempts/events schema, indexes và SELECT RLS.
- Hoàn thiện create/action/complete server mutations.
- Kết nối acid cloud save/resume với Hoàng.
- Tạo negative authorization tests.

### Checkpoint C — 21/09 đến 27/09

- Guest import replay/idempotency.
- Optimistic concurrency và conflict response.
- History/report/compare queries.
- Branch/reset/delete semantics.
- E2E multi-browser auth/resume flow.

### Checkpoint D — 28/09 đến 07/10

- Security/RLS regression và migration-from-clean test.
- Production deployment, logs và release environment.
- Chạy full CI/E2E/browser matrix cùng Hoàng.
- Chuẩn bị release evidence và hạ tầng demo cho Hân.

## 4. Dependency và bàn giao

| Cần từ | Nội dung | Mạnh bàn giao |
| --- | --- | --- |
| Thiên | Attempt/action/report contract | RPC/repository implementation |
| Khoa | Replay-deterministic engine/release registry | Validated guest import |
| Hoàng | Client save/resume/error needs | API response và status behavior |
| Ngân | Auth/conflict/error UX | Error/status codes có thể render |
| Hân | Acceptance scenarios | Automated evidence/results |

## 5. Trách nhiệm review

- Review mọi migration, CI và deployment configuration.
- Yêu cầu negative test cho RLS/authorization changes.
- Review không để secrets/log personal data.
- Cùng Thiên duyệt transaction/idempotency semantics.
- Cùng Hoàng duyệt saving/conflict UX integration.

## 6. Ngoài ownership

- Công thức và golden values — Khoa.
- Process Core/domain architecture — Thiên.
- Workbench UI — Hoàng.
- Figma/UX source — Ngân.
- Scientific copy và Word report — Hân.

Mạnh cung cấp số liệu deployment/test cho báo cáo nhưng không biên tập toàn bộ báo cáo.

## 7. Definition of Done cá nhân

- Fresh setup tạo được local database và app connection.
- Migration/test chạy tự động và tái lập.
- RLS/grants chặn mọi cross-user/direct trusted write case.
- Action retry không duplicate event.
- Revision cũ tạo conflict, không ghi nửa chừng.
- Guest import replay và giới hạn payload/event hoạt động.
- Preview/production deploy từ commit xác định.
- Không có secret trong repository hoặc client bundle.
- Hoàng có thể dùng API mà không cần bypass contract.

## 8. Ba việc bắt đầu ngay

1. Dựng CI, preview deployment và Supabase local skeleton.
2. Viết migrations/tests cho profiles, attempts và events.
3. Chốt server-only commit RPC cùng Thiên trước cloud UI integration.

## 9. Dấu hiệu cần báo động

- Hết Checkpoint A chưa có preview URL.
- Browser cần service-role key hoặc direct trusted write.
- Migration chỉ chạy được trên máy Mạnh.
- E2E/RLS test bị hoãn sang tuần cuối.
- Deployment thủ công không gắn commit/release.

## 10. Tài liệu phải đọc

- [Team Plan](README.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Web Application Scope](../web-application-scope.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
