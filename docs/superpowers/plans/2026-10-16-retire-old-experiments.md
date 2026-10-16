# Dọn source thí nghiệm đã ngừng phục vụ

**Yêu cầu:** chỉ giữ hai bài chạy thật Jar Test và chiết axit–bazơ; giữ nguyên thẻ hấp phụ. Người dùng cho phép xóa source/tài liệu/task của bài cũ. Thực hiện trực tiếp, không subagent.

**Nhánh:** `chore/retire-old-experiments`, từ `develop` sau PR #158. Không đổi checkout khác.

## Phạm vi

- [x] Rà caller và xóa engine, projection, session, content, workbench, test/fixture riêng của trung hòa axit và prototype nhựa. Xóa BFF axit đã nghỉ cùng adapter cloud không có đường dùng trong hai bài hiện hành.
- [x] Giữ Process Core, IndexedDB, auth/profile, Jar và extraction (kể cả engine v1 extraction đang đọc lượt đã lưu). Không sửa migration hoặc xóa dữ liệu người dùng.
- [x] Giữ URL báo cáo/lượt dùng chung để chuyển đến workbench đúng bài. Bài đã nghỉ phải giải thích rõ, không chạy engine cũ hoặc khởi tạo lượt thay thế.
- [x] Xóa đặc tả riêng bài cũ/asset không dùng; cập nhật README và tài liệu phạm vi. Gỡ handoff/task chuẩn bị đã hoàn tất; giữ plan triển khai Jar/extraction còn là căn cứ của hai bài.
- [x] Chuyển kiểm thử Process Core sang Jar, giữ kiểm thử an toàn auth và kiểm tra khác bài bằng extraction thay cho engine axit.
- [x] Chạy typecheck, lint, toàn bộ unit/integration, E2E hai bài + lab/report/catalog/retired URLs; tự review diff trong session này, không dùng subagent.

## Điểm review

1. Không import engine đã xóa qua barrel/shared helper.
2. Không biến lượt cũ thành lượt Jar hoặc extraction, không xóa IndexedDB.
3. URL báo cáo mới mở đúng bài và giữ ID; unknown/malformed ID có lý do rõ.
4. Thẻ hấp phụ và landing đã duyệt giữ nguyên.
5. Migration/SQL fixture là lịch sử hợp đồng dữ liệu, không phải engine chạy; không viết lại migration đã phát hành.

## Bằng chứng ngày 16/10/2026

- RED: test phạm vi phát hiện `SCENARIO_KEYS` vẫn chứa acid-neutralization, copper và plastic. GREEN: chỉ còn hai bài chạy thật; thẻ hấp phụ vẫn hiện và không có simulator giả.
- `npm run typecheck`, `npm run lint`: PASS. `npm run test`: 31 files / 153 tests PASS. Test riêng của engine đã gỡ được xóa cùng engine; kiểm thử chung về replay/hash/undo/revision/units chuyển sang Jar, còn guard khác bài dùng extraction.
- `npm run build`: PASS; output chỉ có `/simulate/jar-test` và `/simulate/acid-base-extraction`, không có simulation BFF cũ. Next hiện cài tách `.next/dev` và build output, nên server 3004 được giữ chạy trong lúc build.
- E2E ban đầu: 96 cases, 79 PASS / 17 FAIL. Các failure gồm expectation pH/giới thiệu cũ, selector revision không tồn tại trong test mới, đọc ID trước khi URL cập nhật và tương tác trong lúc hydration/HMR. Không thay hóa học hoặc landing để làm test xanh.
- E2E xác nhận trên source ổn định: 30 cases, 29 PASS / 1 FAIL (click đầu carousel mobile trước client effects). Thêm chờ client effects sẵn có và assert card đã chọn; focused rerun 2/2 PASS. Tổng **98 cases liên quan có bằng chứng GREEN qua các lượt chạy**, không phải một lần rerun toàn bộ 98.
- Đã kiểm tra hai luồng thực hành hoàn chỉnh, report/resume, compare/lab, thao tác bị khóa, retry mất xác nhận, hai tab, keyboard/mobile/reduced motion, carousel/card hấp phụ, guide và URL/API đã nghỉ. Test dữ liệu bài cũ kiểm tra row còn nguyên, revision không đổi và hiển thị lý do ngừng phục vụ.
- `git diff --check`: PASS. Không còn import/tên engine bài đã nghỉ trong `src`. Markdown links của README/AGENTS/docs không trỏ đến file bị gỡ.
- 114 file được gỡ, stylesheet cũ của chuẩn độ và các rule chỉ thuộc component đã xóa được dọn. Không sửa dependency, migrations, CI, source landing/carousel, engine/session của hai bài hoặc nguồn khoa học hiện hành.

## Tích hợp

Commit trên nhánh riêng; PR về develop, rồi PR develop → main theo quyền tích hợp người dùng đã cấp trong task trước. Chỉ merge khi App Quality và Database Contract green cho đúng head. Git/PR là bản ghi trạng thái commit/merge; checklist plan không mở lại task đã hoàn tất.
