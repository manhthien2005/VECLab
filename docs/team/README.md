# KẾ HOẠCH PHỐI HỢP ĐỘI NGŨ VECLab

**Quy mô đội:** 6 người<br>
**Ngày bắt đầu:** 07/09/2026<br>
**Milestone duy nhất:** Hoàn thiện MVP trước hoặc trong ngày 07/10/2026<br>
**Scope:** Giữ nguyên Core Scope và Web Application Scope đã duyệt

> Bốn giai đoạn trong tài liệu là checkpoint nội bộ để điều phối và phát hiện trễ. Chúng không phải các milestone sản phẩm độc lập.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Chia ownership, cách phối hợp và đầu ra của đội 6 người trong một tháng. |
| 👥 **Dành cho** | Mạnh, Thiên, Khoa, Hoàng, Ngân, Hân và người theo dõi tiến độ. |
| ✅ **Sau khi đọc** | Biết ai quyết định việc gì, bàn giao cho ai và điều kiện nào được coi là hoàn thành. |
| ⚠️ **Lưu ý** | Không thay đổi scope hoặc công thức; mọi thay đổi phải quay về tài liệu nguồn quyết định. |

## Đọc tài liệu này khi nào?

- Trước khi nhận công việc hoặc mở pull request đầu tiên.
- Khi chưa rõ một hạng mục thuộc ownership của ai.
- Khi có blocker, chậm bàn giao hoặc tranh chấp quyết định.

## Các quyết định chính

- Thiên giữ vai trò Technical Lead; Khoa chịu trách nhiệm cuối về simulation khoa học.
- Hoàng sở hữu phần ứng dụng mà người dùng tương tác; Mạnh sở hữu platform, data và delivery.
- Ngân sở hữu UX/Figma; Hân sở hữu content, bằng chứng, QA thủ công và báo cáo Word.
- Mỗi đầu ra quan trọng có một owner và ít nhất một reviewer; không có module lõi chỉ một người hiểu.
- Milestone duy nhất là MVP hoàn chỉnh ngày 07/10/2026.

## Mục lục

<!-- TOC:START -->
- [1. Mục tiêu chung](#1-mục-tiêu-chung)
- [2. Cơ cấu ownership](#2-cơ-cấu-ownership)
- [3. Bốn luồng công việc](#3-bốn-luồng-công-việc)
- [4. Milestone và checkpoint nội bộ](#4-milestone-và-checkpoint-nội-bộ)
- [5. Quy trình cho một tính năng](#5-quy-trình-cho-một-tính-năng)
- [6. Ma trận bàn giao](#6-ma-trận-bàn-giao)
- [7. Quy tắc review](#7-quy-tắc-review)
- [8. Nhịp phối hợp](#8-nhịp-phối-hợp)
- [9. Kiểm soát tải công việc](#9-kiểm-soát-tải-công-việc)
- [10. Rủi ro cần theo dõi](#10-rủi-ro-cần-theo-dõi)
- [11. Điều kiện báo động tiến độ](#11-điều-kiện-báo-động-tiến-độ)
- [12. Tài liệu liên quan](#12-tài-liệu-liên-quan)
<!-- TOC:END -->

---

## 1. Mục tiêu chung

Đội phải bàn giao một MVP có thể sử dụng xuyên suốt:

- Ba thí nghiệm hoạt động theo các experiment spec 1.0.0.
- Chế độ khách thực hiện đầy đủ và lưu trên trình duyệt.
- Tài khoản email/mật khẩu, lưu database và tiếp tục đa thiết bị.
- Simulation Workbench trên desktop/mobile.
- Lịch sử, báo cáo, so sánh và in/lưu PDF.
- Nguồn khoa học, giả định và disclaimer hiển thị đúng.
- Golden cases, RLS, E2E, responsive và acceptance gates đạt.
- Bản production có đường dẫn ổn định và báo cáo Word hoàn chỉnh.

Không thêm chức năng ngoài scope để đổi lấy việc trễ milestone.

## 2. Cơ cấu ownership

| Thành viên | Vai trò chính | Sở hữu | Reviewer/backup chính |
| --- | --- | --- | --- |
| [Thiên](thien-technical-lead.md) | Technical Lead & Application Backend | Kiến trúc code, Process Core, API, integration | Khoa cho domain; Mạnh cho data |
| [Khoa](khoa-simulation-lead.md) | Simulation Engine Lead | Tính đúng ba mô hình, golden tests, calculation trace | Thiên |
| [Hoàng](hoang-application-lead.md) | Full-stack Application Lead | Workbench, report, compare, responsive integration | Thiên; Ngân review UX |
| [Mạnh](manh-platform-devops-lead.md) | Platform, Data & DevOps Lead | Auth, database, RPC, RLS, CI/CD, deploy, automation | Thiên hoặc Hoàng |
| [Ngân](ngan-product-ux-lead.md) | Product UX Lead | User flow, Figma, design system, responsive, design QA | Hoàng; Hân backup |
| [Hân](han-content-qa-lead.md) | Content, Documentation & QA Lead | Nội dung, evidence, manual QA, Word report, demo material | Khoa khoa học; Ngân trình bày |

Người sở hữu scope/product decision là trưởng nhóm được anh chỉ định; Technical Lead không tự thay scope.

## 3. Bốn luồng công việc

### 3.1. Simulation và khoa học

- Owner: Khoa.
- Thiên review interface và determinism.
- Hân kiểm tra source, wording và disclaimer.
- Hoàng tích hợp output vào UI.

### 3.2. Ứng dụng web

- Owner: Hoàng.
- Thiên sở hữu API/Process Core và review kiến trúc.
- Ngân cung cấp Figma, states và design QA.
- Hân cung cấp nội dung hiển thị và test scenario.

### 3.3. Data, platform và delivery

- Owner: Mạnh.
- Thiên review server contracts.
- Hoàng kiểm tra integration phía client.
- Hân phối hợp acceptance evidence.

### 3.4. UX, nội dung và báo cáo

- Ngân sở hữu UX/design.
- Hân sở hữu copy/evidence/report/QA.
- Khoa duyệt nội dung khoa học.
- Mỗi technical owner cung cấp sơ đồ, ảnh và nội dung phần mình cho báo cáo Word.

## 4. Milestone và checkpoint nội bộ

### Milestone duy nhất

**07/10/2026 — VECLab MVP hoàn chỉnh, kiểm chứng và triển khai production.**

### Checkpoint A — 07/09 đến 13/09

Mục tiêu điều phối:

- Codebase, CI, preview deployment và Supabase skeleton hoạt động.
- Process Core contracts và scenario release structure được khóa.
- Design system, information architecture và các màn hình ưu tiên cao đủ để code.
- Acid golden fixtures được đưa vào test runner.
- Báo cáo Word có outline và quy tắc thu thập minh chứng.

### Checkpoint B — 14/09 đến 20/09

Mục tiêu điều phối:

- Acid Neutralization chạy xuyên suốt ở guest mode.
- Workbench desktop/mobile, calculation trace và report acid hoạt động.
- Auth email/password và database attempt/event flow có đường đi hoàn chỉnh.
- Content/evidence của bài acid đã được QA.

### Checkpoint C — 21/09 đến 27/09

Mục tiêu điều phối:

- Copper và Plastic engines đạt golden tests.
- Hai bài được tích hợp vào Workbench dùng chung.
- Cloud save/resume, guest import, history và compare hoạt động.
- Report/source/limitation content của cả ba bài hoàn chỉnh.

### Checkpoint D — 28/09 đến 07/10

Mục tiêu điều phối:

- Không nhận chức năng mới.
- Hoàn thiện responsive, accessibility, print PDF, RLS và error states.
- Chạy toàn bộ acceptance suite và sửa blocker.
- Production deployment, dữ liệu demo và tài khoản demo sẵn sàng.
- Báo cáo Word, hình ảnh, video/demo script hoàn tất.

## 5. Quy trình cho một tính năng

```text
Spec + nguồn + acceptance case
        ↓
UX flow/Figma + content states
        ↓
Test thất bại mô tả hành vi cần có
        ↓
Implementation nhỏ nhất
        ↓
Code review + preview deployment
        ↓
UX/content/scientific QA
        ↓
Merge và cập nhật bằng chứng
```

### Definition of Ready

Một task chỉ được đưa vào code khi có:

- Link tới scope/spec liên quan.
- Input/output hoặc hành vi mong đợi.
- Acceptance case hoặc test case.
- Figma/state description nếu có UI.
- Owner và reviewer.

### Definition of Done

- Code/test/content đã merge vào `main`.
- Test liên quan pass.
- Preview được owner và reviewer kiểm tra.
- Không sai khác với scope/spec.
- Mobile/desktop state cần thiết đã kiểm tra.
- Documentation/evidence cập nhật nếu contract thay đổi.

## 6. Ma trận bàn giao

| Đầu ra | Người tạo | Người duyệt | Người nhận để tích hợp |
| --- | --- | --- | --- |
| Domain types/Process Core | Thiên | Khoa | Hoàng, Mạnh |
| Acid/Copper engine | Khoa | Thiên | Hoàng |
| Plastic engine implementation | Hoàng theo fixture của Khoa | Khoa + Thiên | Hoàng tích hợp vào Workbench |
| Database/Auth/RPC/RLS | Mạnh | Thiên | Hoàng |
| Figma/design system | Ngân | Hoàng kiểm tra khả thi | Hoàng |
| Copy/source/warning | Hân | Khoa | Hoàng |
| Workbench/report/compare UI | Hoàng | Thiên + Ngân | Hân QA |
| CI/E2E/deployment | Mạnh | Thiên | Toàn đội |
| Báo cáo Word | Hân | Ngân trình bày; owner duyệt phần mình | Trưởng nhóm |

## 7. Quy tắc review

- Không tự merge PR của chính mình.
- Engine PR: Khoa và Thiên phải cùng hiểu kết quả.
- UI PR: Hoàng review code; Ngân review design; Hân review content khi liên quan.
- Data/security PR: Mạnh là author/owner; Thiên review contract; phải có negative test.
- Một PR nên tạo một đầu ra kiểm thử được, không gom cả tuần vào một PR.
- Blocker hơn 24 giờ phải báo toàn đội, không âm thầm chờ.

## 8. Nhịp phối hợp

- Daily sync tối đa 15 phút: đã xong, sẽ làm, blocker.
- Demo nội bộ cuối mỗi tuần trên preview URL.
- Quyết định thay contract phải ghi vào issue/ADR hoặc cập nhật tài liệu nguồn.
- Figma/content đi trước implementation tương ứng ít nhất một nhịp làm việc.
- Báo cáo Word được cập nhật liên tục, không dồn vào ba ngày cuối.

## 9. Kiểm soát tải công việc

- Mạnh không chỉ deploy; Mạnh viết data/auth/security và automation.
- Khoa chịu trách nhiệm khoa học nhưng không phải tự tích hợp toàn bộ UI.
- Hoàng không tự quyết công thức hoặc copy khoa học.
- Ngân không kết thúc việc sau khi bàn giao Figma; phải design QA trên preview.
- Hân không chỉ viết báo cáo; phải sở hữu content states và acceptance evidence.
- Thiên không ôm mọi task; tập trung contract, integration và review blocker.

## 10. Rủi ro cần theo dõi

| Rủi ro | Dấu hiệu | Cách xử lý |
| --- | --- | --- |
| Engine thành bottleneck | Khoa có nhiều hơn hai module đang mở | Khoa giữ Acid/Copper; Hoàng viết Plastic theo fixture; Thiên pair khi cần |
| Thiếu chuyên gia hóa học ngoài đội | Một claim quan trọng chỉ có một người nội bộ duyệt | Khoa + Hân kiểm tra chéo nguồn; xin người hướng dẫn review nếu có; luôn giữ disclaimer |
| UI chờ Figma | Dev tự đoán state/error | Ngân ưu tiên state matrix trước polish |
| DevOps dồn cuối kỳ | Chưa có preview trong tuần đầu | Mạnh dựng preview/CI ngay Checkpoint A |
| Báo cáo dồn cuối | Không có ảnh/chứng cứ sau mỗi demo | Hân thu thập theo tuần |
| Scope creep | Task không trỏ tới scope/spec | Không đưa vào tháng này |
| Thiếu kiểm tra khoa học | UI có số nhưng không có golden/source | Khoa/Hân chặn merge |

## 11. Điều kiện báo động tiến độ

Trưởng nhóm cần can thiệp ngay khi:

- Hết Checkpoint A mà chưa có preview deployment hoặc engine test runner.
- Hết Checkpoint B mà chưa có một bài xuyên suốt.
- Hết Checkpoint C mà còn engine chưa đạt golden cases.
- Bất kỳ blocker khoa học/security nào chưa có owner sau 24 giờ.

Nếu trễ, ưu tiên hoàn thành chức năng đã chốt và chất lượng khoa học; không thêm polish hoặc tính năng ngoài scope.

## 12. Tài liệu liên quan

- [Documentation Index](../README.md)
- [Core Project Scope](../core-project-scope.md)
- [Web Application Scope](../web-application-scope.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
