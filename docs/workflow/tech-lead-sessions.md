# Hai session Tech Lead local

Theo quyết định trực tiếp của người dùng: tách hai session local để giảm nhầm context; giữ hai coder GPT web do anh vận hành. Đây là chuyển trách nhiệm giữa session, không phải yêu cầu spawn subagent hoặc tự tạo/nhắn chat khác.

| Session | Chủ việc | Ranh giới |
| --- | --- | --- |
| TL1 — session nhận handoff | Coder 1; domain, session, projection/report, API, tests và điều phối tích hợp | Review và giao task coder 1; giữ contract FE/BE. Không tự triển khai UI hoặc sửa app code thay coder trong task review. |
| TL2 — session gốc | Coder 2; landing, UI/UX, workbench presentation và test trải nghiệm cùng anh | Giữ context thiết kế; không nghiệm thu hoặc sửa engine/session/API thay TL1. |

Allowlist mỗi task quyết định quyền sửa thực tế. Contract/projection, registry, dependencies, CI/migrations và shared layout/CSS/tokens chỉ có một owner được giao ở mỗi thời điểm. TL1 điều phối điểm nối và tích hợp; TL2 chuẩn bị thay đổi UI theo contract đã khóa. Không session nào tự mở rộng scope của session còn lại.

## Checkout và nguồn quyết định

- Workspace hiện tại `D:/Dev/Projects/Chemistry` giữ cho TL2/UI trên `chore/pre-refactor-cleanup` trong giai đoạn chuẩn bị này.
- TL1 tạo managed worktree từ chính chat TL1 để checkout thuộc đúng session. Gói handoff cung cấp ref đã xác minh; TL1 dùng workspace do công cụ trả về, không checkout/reset/pull hoặc chạy verification trong workspace TL2. Handoff này chưa tạo worktree TL1, chưa cài dependencies hay chạy tests R1.
- Chỉ `git fetch` để nhận object/refs không đổi checkout kia. Khi tạo/chuyển/xóa nhánh, phải kiểm tra worktree ownership; không force-push/rebase nhánh người khác.
- Đọc spec, task, contract và source theo SHA thật. Context chat không thay thế tài liệu repo. Source chung tiến lên không bắt task đang làm tự đổi base.
- Không copy môi trường hoặc chia sẻ dependencies mutable giữa checkout. Review guest/session không cần credentials production.

## Handoff đang active cho TL1

[JSON để paste vào session TL1](handoffs/tech-lead-1.json) giao role local reviewer, không giao cho coder web triển khai.

- Task cần review: `JAR-02-R1`, nhánh coder `fix/coder-1-jar02-review`, base `543caa910620d77d93bd501fdc6ea046e918dea3`.
- Head remote vừa xác minh: `f08843057ec7c580763ee3a4d3f40e2a634ab5d7`; hai commit mới `91692f3`, `f088430`. Ancestry đúng, diff chỉ ba file được giao. Đây chưa phải bằng chứng code đúng hoặc task được nghiệm thu.
- Ba finding và evidence lịch sử nằm tại [review Task 2](reviews/jar-test-02.json); yêu cầu sửa/checks tại [brief coder 1](tasks/coder-1-jar-02-r1.json).
- File brief JSON được publish sau lúc tạo nền nhánh coder, nên không có trong `f088430`. Handoff ghim riêng URL của brief tại commit điều phối `a12e6a351b9fe3ef7dbcf4b0fb5f8ea0bc8f7965`; không đổi code base để lấy tài liệu còn thiếu.
- Chưa nhận final result JSON R1 trong session gốc. TL1 có thể chuẩn bị/review candidate; khi nhận kết quả phải xác nhận final SHA trước verdict. Không dùng kết quả 65 tests trên Task 2 gốc làm pass cho head R1 mới.
- Không mở Task 3, merge hay deploy trong gói review. App fixes trả lại coder 1 bằng JSON task giới hạn. Tích hợp sau nghiệm thu vẫn phải qua PR/required CI theo AGENTS, không có quyền push thẳng `main`/`develop`.

## Context UI giữ ở TL2

Coder 2 ở `feature/coder-2-ui-audit`; head remote quan sát cùng lượt là `1367e1cb2c5f7017c6e164fbccebf10b8337b8c7`, chưa review trong lượt bàn giao này.

Người dùng thấy ý tưởng workbench có bàn tương tác rộng và nhập số liệu rõ ràng là phù hợp. Landing giữ cấu trúc trang gốc; style marine navy/teal, hero chữ có chân và phần thân sáng đã được chấp nhận làm hướng phát triển, nhưng còn cần tăng điểm nhấn, chưa chốt thiết kế cuối hay giao triển khai. Vòng gen tăng điểm nhấn đang dở thì người dùng chuyển sang bàn giao TL1; chưa có ảnh mới của vòng đó. Không bắt TL1 nạp lịch sử thử ảnh UI.

Mọi prompt, result và review giữa agent vẫn là đúng một JSON v1, ghi coder/branch/base/head/checks; người dùng chuyển artifact giữa session khi cần. Không tự gửi tin sang chat khác khi chưa có chỉ định. Không spawn subagent trừ khi anh yêu cầu rõ cho task hiện tại.
