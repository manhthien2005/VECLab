# Hai coder web và local Tech Lead

Quyết định của người dùng ngày 13/10/2026: hai coder GPT web, local lập kế hoạch/review/tích hợp; người dùng thử UI khi được báo. Không spawn subagent nội bộ trừ khi người dùng yêu cầu rõ cho task hiện tại.

Cập nhật: người dùng tách local thành hai session Tech Lead. TL1 phụ trách coder 1 và điều phối tích hợp; session gốc giữ TL2/coder 2/UI. [Phân công và handoff](tech-lead-sessions.md) quy định checkout riêng, owner contract và trạng thái đang bàn giao. Hai coder web vẫn là hai phiên do người dùng vận hành.

## Nhánh và nền source

- `chore/pre-refactor-cleanup` là nhánh chuẩn bị/tích hợp tạm thời của nền Hoang đã được người dùng yêu cầu. Đây là ngoại lệ có giới hạn cho đợt này; Git workflow bình thường vẫn feature/fix/chore → PR develop → PR main theo AGENTS.
- Mỗi task có một nhánh riêng, ví dụ `fix/coder-1-jar02-review` và `feature/coder-2-ui-audit`. `branch` là nơi coder được ghi; `target` là nơi local tích hợp. Không dùng một nhánh chung cho hai coder, không dùng nhánh coder kéo dài qua nhiều task.
- Local ghim full base SHA và tạo/publish nhánh trước khi giao. Khi connector không ghi được nhánh riêng, coder trả patch/artifact; không chuyển sang ghi target để chữa thiếu quyền.
- Nhánh mới lấy nền đã nghiệm thu. Riêng vòng sửa review lấy đúng commit cần sửa và ghi rõ chưa nghiệm thu; không đưa commit lỗi đó vào nền coder còn lại. Nếu cần cập nhật quy ước chung, local đưa riêng commit tài liệu vào các nền liên quan.
- Không force-push, reset lịch sử hoặc tự rebase/merge nhánh của người khác. Target tiến lên không bắt task đang làm chạy theo; local kiểm tra lại khi tích hợp. Coders nhận base mới khi cần, không tự đoán từ HEAD của target.

## Quyền sở hữu

| Chủ việc | Phạm vi |
| --- | --- |
| Coder 1 | Domain, session, projection/report data, API và tests liên quan theo allowlist từng task |
| Coder 2 | Audit/thiết kế, outer UI và tests UI theo allowlist; trước mắt đề xuất giao diện, chưa sửa workbench Jar |
| Local TL1 | Contract/API/projection, điều phối AGENTS/templates, dependency/CI/migration và tích hợp; vẫn theo allowlist và quyền production riêng |
| Local TL2 | Chiến lược/review UI, docs UI và phối hợp shared tokens/layout/navigation khi được giao độc quyền; không tự đổi contract mô phỏng |

Không phải thư mục nào trong bảng cũng được sửa tự do: `files` trong JSON là allowlist thực. Cùng chạm file là lý do tách task/tuần tự hóa phần đó trước khi giao. Global CSS, shared layout/navigation, catalog registry và package/lockfile chỉ có một người được giao sửa ở một thời điểm. Không tự sửa file ngoài scope để làm tests xanh.

## Review và tích hợp

1. Mỗi coder một task active. Bàn giao JSON có `coder`, `branch`, base/head và checks; chưa được nghiệm thu thì sửa task đó trước khi nhận task mới.
2. Local kiểm tra đúng repo/branch/ancestry, diff và allowlist, chạy checks cùng review luồng thật. Tests xanh chưa đủ nếu probe cho thấy lỗi runtime hoặc lộ đáp án.
3. Local tích hợp từng gói đạt theo thứ tự dependency, bằng PR được review vào target và required CI xanh; không gộp hai gói chưa review thành một PR lớn. Không merge develop/main hay deploy production trong công việc giao coder.
4. Nếu hai nhánh xung đột, local giữ hai phiên bản, xác định hành vi cần có và giải quyết phần tích hợp; coder không chọn ours/theirs toàn bộ file. Chạy lại checks chịu ảnh hưởng trên kết quả kết hợp.

CI hiện có được bật cho PR vào target tạm `chore/pre-refactor-cleanup`: App Quality và Database Contract. Job DB vẫn dùng Supabase ephemeral, không thêm credentials production. Việc bật trigger không có nghĩa CI đã chạy/đã qua; local đọc kết quả thực trên PR trước tích hợp.

## Người dùng thử thực tế

Chưa yêu cầu người dùng test UI cho task chỉ có engine/session. Khi proposal UI hoặc luồng giao diện đủ để xem/thử, local báo rõ coder/task/branch, cách chạy local, các thao tác cần thử và kết quả mong đợi. Người dùng phản hồi trải nghiệm; local vẫn chịu trách nhiệm kiểm tra tự động và các dữ liệu/protocol liên quan.

Coder 2 bắt đầu bằng audit source và một hướng thiết kế đề xuất cho trang chủ/danh mục/chi tiết/My Lab. Ghi rõ nhận định từ code và phần chưa quan sát trong browser; không gọi audit source là visual QA. Chốt hướng với người dùng trước gói sửa UI. Bàn mô phỏng 2D làm sau khi giao diện chung và session contract ổn.
