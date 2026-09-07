# NGÂN — PRODUCT UX LEAD

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Trưởng nhóm<br>
**Reviewer/backup:** Hoàng kiểm tra khả năng triển khai; Hân hỗ trợ content và visual documentation

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Làm VECLab dễ hiểu, cuốn hút và sử dụng đầy đủ trên desktop/mobile mà không quá tải thông tin. |
| 👤 **Vai trò** | Owner user flow, Figma, design system, responsive và design QA. |
| ✅ **Đầu ra cuối** | Toàn bộ core screens và trạng thái có thiết kế đủ rõ để Hoàng triển khai và Hân kiểm thử. |
| ⚠️ **Không chỉ vẽ đẹp** | Loading, error, empty, saving, conflict, N/A và accessibility là phần bắt buộc của UX. |

## Đọc tài liệu này khi nào?

- Trước khi thiết kế hoặc bàn giao Figma.
- Khi thêm state, route hoặc component mới.
- Khi review preview trên desktop/mobile.

## Các quyết định chính

- Bố cục Workbench B là nguồn định hướng đã duyệt.
- Trạng thái và thao tác chính luôn thấy; công thức/nguồn mở theo nhu cầu.
- Desktop hiển thị ba vùng; mobile xếp trạng thái → tiến trình → thao tác → chi tiết.
- Một component/state matrix dùng chung cho cả ba bài.
- Ngân chịu trách nhiệm đến khi preview đạt design QA, không kết thúc ở Figma handoff.

## Mục lục

<!-- TOC:START -->
- [1. Ownership chính](#1-ownership-chính)
- [2. Đầu ra bắt buộc](#2-đầu-ra-bắt-buộc)
- [3. Kế hoạch theo checkpoint](#3-kế-hoạch-theo-checkpoint)
- [4. Handoff cho Hoàng](#4-handoff-cho-hoàng)
- [5. Phối hợp với Hân](#5-phối-hợp-với-hân)
- [6. Ngoài ownership](#6-ngoài-ownership)
- [7. Definition of Done cá nhân](#7-definition-of-done-cá-nhân)
- [8. Ba việc bắt đầu ngay](#8-ba-việc-bắt-đầu-ngay)
- [9. Dấu hiệu cần báo động](#9-dấu-hiệu-cần-báo-động)
- [10. Tài liệu phải đọc](#10-tài-liệu-phải-đọc)
<!-- TOC:END -->

---

## 1. Ownership chính

Ngân sở hữu:

- Information architecture của chín khu vực web.
- Guest/account user flows.
- Design tokens, typography, spacing, color và component variants.
- Workbench desktop/tablet/mobile.
- Auth, Lab, history, report, compare, account và source screens.
- State matrix cho loading/error/empty/saving/conflict/disabled/N/A.
- Responsive behavior và interaction priority.
- Accessibility ở mức thiết kế.
- Prototype và design QA trên preview.
- Sơ đồ, hình minh họa và format trực quan cho báo cáo Word.

## 2. Đầu ra bắt buộc

### Figma foundation

- Page map và user flows.
- Token/styles.
- Components với variants/states.
- Naming khớp component inventory của Hoàng.
- Desktop và mobile reference frames.

### Core screens

- Home/catalog và experiment detail.
- Auth và account states.
- Phòng lab của tôi.
- Simulation Workbench.
- Report/print preview.
- Compare.
- Scientific sources/limitations.

### State coverage

- First load và skeleton/loading.
- Empty history/no attempt.
- Invalid field/domain warning.
- Saving/saved/unsynced/conflict.
- Session expired.
- Model invalid/score N/A.
- Destructive confirmation.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Khóa information architecture và end-to-end user flows.
- Hoàn thiện design system tối thiểu có thể code.
- Bàn giao Workbench desktop/mobile states ưu tiên cao.
- Bàn giao Home, detail, auth và Lab skeleton.
- Đồng bộ component naming với Hoàng.

### Checkpoint B — 14/09 đến 20/09

- Hoàn thiện Acid Workbench states và report.
- Hoàn thiện save/guest/account transitions.
- Design QA acid preview hằng ngày, không chờ cuối tuần.
- Bổ sung error/empty/N/A states từ phản hồi implementation.

### Checkpoint C — 21/09 đến 27/09

- Thiết kế chi tiết Copper species/precipitate và Plastic stream tree.
- Hoàn thiện history/compare/source screens.
- Kiểm tra responsive cả ba bài.
- Phối hợp Hân tạo hình/sơ đồ cho báo cáo.

### Checkpoint D — 28/09 đến 07/10

- Design freeze, chỉ sửa usability/accessibility blocker.
- Full design QA trên preview/production candidate.
- Kiểm tra 320, 390, 768, 1024 và 1440 px.
- Chuẩn hóa screenshots, captions và visual assets cho báo cáo/demo.

## 4. Handoff cho Hoàng

Mỗi màn hình bàn giao phải có:

- Mục tiêu và route.
- Component names.
- Desktop/mobile frames.
- Responsive rule.
- Empty/loading/error/success states.
- Nội dung nào fixed, nội dung nào dynamic.
- Interaction và keyboard/focus expectation.
- Link tới copy/source do Hân cung cấp.

Không dùng screenshot đơn lẻ thay cho component/state specification.

## 5. Phối hợp với Hân

- Ngân quyết định hierarchy, layout và cách mở rộng thông tin.
- Hân quyết định copy, thuật ngữ, citation và nội dung báo cáo.
- Hai người cùng kiểm tra độ dài thực tế của tiếng Việt.
- Ngân chịu trách nhiệm biểu đồ/sơ đồ không làm sai ý khoa học; Khoa duyệt nội dung.

## 6. Ngoài ownership

- Công thức và source correctness — Khoa/Hân.
- Frontend implementation — Hoàng.
- Process/API contract — Thiên.
- Auth/database/deploy — Mạnh.
- Ngân không tự thêm feature để làm giao diện “đẹp hơn”.

## 7. Definition of Done cá nhân

- Chín khu vực có design/state coverage.
- Workbench dùng chung nhưng biểu đạt đúng cả ba domain.
- Core flows không phụ thuộc hover.
- Mobile giữ đủ chức năng và không ép người dùng đọc dashboard dày đặc.
- Mọi control có label/focus/error expectation.
- Hoàng xác nhận Figma có thể triển khai trong scope.
- Design QA trên preview đã hoàn tất và issue blocker được đóng.
- Visuals cho báo cáo có caption/source phù hợp.

## 8. Ba việc bắt đầu ngay

1. Tách mockup đã duyệt thành design tokens và component inventory.
2. Vẽ end-to-end guest/account flow cùng error/save states.
3. Bàn giao Acid Workbench desktop/mobile trước các màn hình polish thấp hơn.

## 9. Dấu hiệu cần báo động

- Figma đẹp nhưng thiếu state hoặc responsive rule.
- Hoàng phải tự đoán component behavior.
- Design system thay đổi lớn sau Checkpoint B.
- Nội dung tạm vẫn tồn tại khi vào Checkpoint C.
- Design QA chỉ bắt đầu ở tuần cuối.

## 10. Tài liệu phải đọc

- [Team Plan](README.md)
- [Web Application Scope](../web-application-scope.md)
- [Desktop/Mobile Mockups](../mockups/)
- [Core Project Scope](../core-project-scope.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
