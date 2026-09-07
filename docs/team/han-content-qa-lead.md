# HÂN — CONTENT, DOCUMENTATION & QA LEAD

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Trưởng nhóm<br>
**Reviewer/backup:** Khoa duyệt khoa học; Ngân duyệt trình bày; Mạnh cung cấp test/release evidence

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Biến mô hình kỹ thuật thành nội dung dễ hiểu, có nguồn, kiểm thử được và báo cáo được. |
| 👤 **Vai trò** | Owner copy, evidence, manual QA, acceptance evidence và báo cáo Word. |
| ✅ **Đầu ra cuối** | Ba bài có nội dung hoàn chỉnh; test evidence, báo cáo Word và demo material sẵn sàng. |
| ⚠️ **Không chỉ viết báo cáo** | Hân tham gia từ đầu vào content states và QA, không chờ tuần cuối mới tổng hợp. |

## Đọc tài liệu này khi nào?

- Trước khi viết nội dung UI, source card hoặc test scenario.
- Khi cần kiểm tra wording có tuyên bố quá mức hay không.
- Khi chuẩn bị báo cáo Word, ảnh minh chứng hoặc demo.

## Các quyết định chính

- Hân sở hữu chất lượng nội dung; Khoa sở hữu tính đúng khoa học.
- Mọi claim quan trọng phải resolve claim/source key.
- Disclaimer và giới hạn là nội dung chính, không phải ghi chú cuối trang.
- Manual QA dựa trên acceptance IDs, không kiểm tra tùy hứng.
- Báo cáo Word được cập nhật theo bằng chứng mỗi tuần.

## Mục lục

<!-- TOC:START -->
- [1. Ownership chính](#1-ownership-chính)
- [2. Đầu ra bắt buộc](#2-đầu-ra-bắt-buộc)
- [3. Kế hoạch theo checkpoint](#3-kế-hoạch-theo-checkpoint)
- [4. Quy trình duyệt nội dung](#4-quy-trình-duyệt-nội-dung)
- [5. Phối hợp báo cáo Word](#5-phối-hợp-báo-cáo-word)
- [6. Trách nhiệm QA](#6-trách-nhiệm-qa)
- [7. Ngoài ownership](#7-ngoài-ownership)
- [8. Definition of Done cá nhân](#8-definition-of-done-cá-nhân)
- [9. Ba việc bắt đầu ngay](#9-ba-việc-bắt-đầu-ngay)
- [10. Dấu hiệu cần báo động](#10-dấu-hiệu-cần-báo-động)
- [11. Tài liệu phải đọc](#11-tài-liệu-phải-đọc)
<!-- TOC:END -->

---

## 1. Ownership chính

Hân sở hữu:

- UI copy và thuật ngữ tiếng Việt.
- Mục tiêu, hướng dẫn, observations, warnings và explanations.
- Source cards, assumptions, limitations và disclaimers.
- Scientific Evidence Register consistency cùng Khoa.
- Manual test cases và exploratory QA.
- Acceptance evidence index.
- Báo cáo Word: cấu trúc, biên tập, citation, hình và phụ lục.
- Demo script, dữ liệu demo và checklist thuyết trình.

## 2. Đầu ra bắt buộc

### Content package cho mỗi thí nghiệm

- Tình huống và mục tiêu.
- Nội dung trước khi bắt đầu.
- Tên action/parameter/unit.
- Observation và warning theo code.
- Giải thích cơ bản và kỹ thuật.
- Result/report wording.
- Source citation, assumption, limitation và disclaimer.
- Empty/error/N/A copy.

### QA package

- Happy path cho mỗi process family.
- Invalid/recovery paths.
- Guest/account/save/resume/report/compare cases.
- Desktop/mobile content checks.
- Source/claim/wording checks.
- Bằng chứng pass/fail, screenshot và issue link.

### Báo cáo Word

- Bối cảnh và vấn đề.
- Scope và đối tượng.
- Cơ sở khoa học.
- Thiết kế hệ thống và UX.
- Ba mô hình thí nghiệm.
- Kiểm chứng, kết quả và giới hạn.
- Hình ảnh, nguồn, phụ lục và demo evidence.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Tạo content inventory và glossary tiếng Việt.
- Chuẩn bị Acid content/source/warning package.
- Chuyển Verification spec thành manual QA checklist.
- Tạo outline báo cáo Word và quy tắc đặt tên ảnh.
- Thống nhất content slots với Ngân/Hoàng.

### Checkpoint B — 14/09 đến 20/09

- QA Acid guest flow, report và mobile.
- Hoàn thiện Auth/Lab/save/error copy.
- Thu screenshots/test evidence Acid.
- Viết phần scope, UX, phương pháp mô hình và Acid trong báo cáo.
- Báo lỗi content/science cho đúng owner.

### Checkpoint C — 21/09 đến 27/09

- Hoàn thiện Copper/Plastic content packages.
- QA cloud resume, guest import, history và compare.
- Thu source/evidence và screenshots cả ba bài.
- Viết phần Copper, Plastic, data và architecture trong báo cáo.

### Checkpoint D — 28/09 đến 07/10

- Full manual acceptance và wording audit.
- Kiểm tra không còn nội dung tạm hoặc claim quá mức.
- Hoàn thiện Word formatting cùng Ngân.
- Hoàn thiện kết quả kiểm thử, giới hạn, kết luận và phụ lục.
- Chuẩn bị demo account/data và script thuyết trình.

## 4. Quy trình duyệt nội dung

```text
Hân viết copy theo claim/source key
→ Khoa duyệt tính đúng khoa học
→ Ngân duyệt hierarchy/độ dài
→ Hoàng đưa vào UI
→ Hân kiểm tra trên preview thực tế
```

Không coi file copy là hoàn thành nếu chưa được kiểm tra trong layout thật.

## 5. Phối hợp báo cáo Word

| Phần | Người cung cấp nội dung gốc | Hân làm gì |
| --- | --- | --- |
| Kiến trúc/Process Core | Thiên | Biên tập, sơ đồ, citation nội bộ |
| Engine/kết quả | Khoa | Chuẩn hóa công thức, bảng và giới hạn |
| Web/UI | Hoàng | Chọn ảnh, mô tả luồng |
| Data/DevOps/test | Mạnh | Tổng hợp migration, security, deploy evidence |
| UX/Figma | Ngân | Chuẩn hóa hình, caption và visual language |
| Toàn báo cáo | Cả đội duyệt phần mình | Hân biên tập bản cuối |

## 6. Trách nhiệm QA

- Kiểm tra đúng acceptance case, không chỉ happy path.
- Ghi browser/device, release/commit và bước tái hiện.
- Phân biệt bug code, bug content, bug design và spec ambiguity.
- Re-test issue sau khi sửa.
- Không tự sửa expected chemistry value; báo Khoa.
- Không dùng dữ liệu cá nhân thật trong ảnh hoặc test.

## 7. Ngoài ownership

- Quyết định công thức/hằng số — Khoa.
- Figma/design system — Ngân.
- Application code — Hoàng.
- Architecture/backend contract — Thiên.
- CI/database/deploy — Mạnh.

Hân có quyền chặn nghiệm thu khi copy/source/disclaimer hoặc acceptance evidence chưa đạt.

## 8. Definition of Done cá nhân

- Mỗi content code có bản tiếng Việt cuối và state sử dụng rõ.
- Mọi claim/source key resolve.
- Không có “xác suất thành công thực tế”, “đạt pháp luật” hoặc wording bị cấm.
- Manual QA checklist có evidence cho core flows.
- Báo cáo Word thống nhất citation, hình, caption và thuật ngữ.
- Mỗi technical owner đã duyệt phần báo cáo của mình.
- Demo script khớp production build và dữ liệu demo.

## 9. Ba việc bắt đầu ngay

1. Tạo glossary/content inventory từ ba experiment specs.
2. Chuyển Acid actions/warnings/explanations thành content package.
3. Dựng outline báo cáo Word và acceptance evidence folder/index.

## 10. Dấu hiệu cần báo động

- UI còn nội dung tạm hoặc text do developer tự viết ở Checkpoint B.
- Source key không resolve hoặc citation thiếu condition.
- Báo cáo chưa có ảnh/evidence sau mỗi weekly demo.
- QA không ghi commit/release/browser.
- Team định dồn báo cáo vào tuần cuối.

## 11. Tài liệu phải đọc

- [Team Plan](README.md)
- [Documentation Index](../README.md)
- [Core Project Scope](../core-project-scope.md)
- [Web Application Scope](../web-application-scope.md)
- [Scientific Evidence Register](../scientific-evidence-register.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
- Ba [experiment specifications](../experiments/)
