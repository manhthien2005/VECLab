# Acid–Base Extraction Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, inline in this session. The human forbids subagents and requested direct implementation. No delegation or production deployment.

**Goal:** Một bài chiết tách A/B/N hoàn chỉnh, có nhiều hướng thực hiện, theo dõi vật chất qua từng bình và giải thích kết quả sau nộp.

**Architecture:** Dùng DomainModule, Process Core, GuestAttemptRepository và WorkbenchFrame của Jar. Tạo model, engine, projection, session và UI riêng; không trích xuất một framework hóa học chung.

**Tech Stack:** TypeScript, React/Next hiện có, SVG/CSS và IndexedDB; không thêm dependency.

**Spec:** [Thiết kế](../specs/2026-10-15-acid-base-extraction-design.md).

## Global Constraints

Không sửa engine/UI của Jar hoặc bài khác. Local-only; không database/auth/API writes. Tham số mẫu chuẩn phải ghi là quy ước học tập. Lưu lượng chất độc lập animation; không lộ thành phần trước nộp; không thay báo cáo cũ.

## Review Focus

- Chuyển pha/gộp bình phải bảo toàn từng cấu tử; bình thải vẫn nằm trong cân bằng.
- Cùng thao tác retry hoặc hai tab không nhân đôi dung môi/mẫu.
- Đo khi không có pha nước hoặc chưa có sản phẩm phải trả validity/N/A rõ ràng.
- Nộp thiếu dữ liệu không báo đạt; không chấm theo thứ tự mẫu.
- SVG, reduced motion và reload không sinh thêm action.

## Đợt 1 — Model và engine riêng

Files: `src/domain/experiments/acid-base-extraction/{model,engine}.ts`; thêm một scenario key trong `src/domain/process/contracts.ts`; `tests/unit/extraction-engine.test.ts`.

- [x] Test độc lập phân bố một lần/nhiều lần, cân bằng A/B/N, phân lớp và chuyển nhầm vào W.
- [x] Khóa profile mẫu chuẩn và các đơn vị. `createExtractionModule(): DomainModule<ExtractionState>`; hàm cân bằng trả inventory hai pha/chất rắn, không phụ thuộc UI.
- [x] Actions: cấp dung dịch, trộn, xả áp, phân lớp, chuyển pha, lọc, cô, làm khô, đo, khai báo sản phẩm, nộp. Kiểm tra input hữu hạn/dung tích và own action keys.
- [x] Chạy test tập trung và typecheck.

## Đợt 2 — Lượt lưu, projection và báo cáo

Files: `src/application/scenarios/extraction-projection.ts`, `src/application/simulation/extraction-session.ts`; `tests/integration/extraction-runtime.test.ts`.

- [x] Dùng giao diện start/load/apply/complete như Jar, Generic AttemptRepository với state riêng. Giữ revision, action ID, fingerprint, replay hash và immutable completeAttempt.
- [x] Projection chỉ có pha/thể tích/hiện tượng và phép đo đã thực hiện. Report mới chứa thành phần, thu hồi/độ tinh khiết và action IDs.
- [x] Test replay/resume, retry, foreign release, thiếu phép đo và báo cáo giữ nguyên sau mở lại.
- [x] Không đổi IndexedDB schema hoặc Jar session.

## Đợt 3 — Bàn thao tác hoàn chỉnh

Files: `src/features/extraction/{workbench,apparatus}.tsx`, `workbench.module.css`; `src/app/simulate/acid-base-extraction/page.tsx`.

- [x] Dùng WorkbenchFrame hiện hành; bình được chọn quyết định bảng thao tác. Không ép wizard tuyến tính hoặc drag/drop bắt buộc.
- [x] Phễu chiết hai lớp, bình thu, chất rắn và dụng cụ lọc/cô có chuyển động nhẹ. Ghi rõ diễn biến là minh họa cân bằng, không có kinetics tự dựng.
- [x] Sổ đo, khai báo ba bình sản phẩm, đáp số và hộp xác nhận trước nộp; lỗi lưu có recovery, không báo thành công giả.
- [x] Mobile/bàn phím/reduced motion; chỉ một lượt browser tập trung cho mỗi hướng chính.

## Đợt 4 — Hướng dẫn, báo cáo và nghiệm thu

Files: `src/features/extraction/report.tsx`; `src/app/experiments/acid-base-extraction/{page.tsx,guide/page.tsx}`; test browser và tài liệu bài.

- [x] Lý thuyết trình bày theo bento, dụng cụ có giải thích; chưa có video thì nói rõ. Hướng dẫn workbench dùng tour đã có.
- [x] Báo cáo A/B/N theo từng bình, lượng còn trong dịch/thải, mức đạt tiêu chí và sai số phép tính. Mở lại báo cáo từ URL cùng attempt.
- [x] Tự chạy hai hướng tách, lượt chuyển nhầm pha và lượt thiếu dữ liệu; kiểm tra state/ledger/report match FE. Không chụp ảnh hoặc chạy suite lặp vô ích.
- [x] Typecheck/lint/test tập trung; build là bước chốt trước khi giao link local. Người dùng review rồi mới quyết định cải thiện hoặc phát hành.

## Tích hợp sau review

Chỉ thêm entry/catalog/lab theo scenario discriminator khi bài được người dùng nghiệm thu. Không đổi các thẻ bài khác trong vòng này. Không merge main/develop, deploy hoặc sửa cloud khi chưa có yêu cầu mới.

## Kết quả triển khai local

- Hai hướng tách đã qua integration, cùng kiểm tra bảo toàn A/B/N và report bất biến. Retry/changed intent/stale revision/foreign scenario được kiểm tra.
- Một lượt browser đầy đủ (tách A trước) đã chạy trên Chromium desktop và Pixel 7 mobile, có reload giữa lượt, nộp và mở lại report. Không chụp screenshot.
- Bài chỉ có route riêng; chưa thêm vào danh mục chung, lab/account/compare và chưa thay thẻ pH. Người dùng yêu cầu không đụng các bài khác trong vòng này.
- Dữ liệu mẫu chuẩn và giới hạn được công bố trong guide và hồ sơ khoa học. Không tuyên bố hiệu chuẩn cho ba hóa chất thực.

- Tour có nội dung riêng cho phễu chiết; kiểm tra desktop/mobile và regression tour Jar đều đạt. Workbench chỉ hiện sau khi URL lượt được tải xong, tránh đóng tour khi đổi khóa trang.
