# Hoàn thiện workflow Jar Test và chiết tách

Coder 2; branch `fix/lab-workflow-clarity`; base `3b60dcf`; target `develop`, rồi release PR `develop` → `main`, theo yêu cầu trực tiếp ngày 16/10/2026.

Giữ mô hình và release hiện tại. Không biến lỗi học tập (đo sớm, bỏ trộn, nộp thiếu dữ liệu) thành cấm thao tác mới; phân biệt điều kiện kỹ thuật không hợp lệ, dữ liệu đang lưu/chưa xác nhận, xung đột tab và cảnh báo quy trình. Không subagent hay thay checkout khác.

- [x] RED: lý do khóa thấy trực tiếp và có accessible description; Jar thiếu mẫu/liều, pha đã khóa; extraction bình trống, chưa xả áp/phân lớp, thể tích/thu rắn/cô/làm khô, nhập đáp số; khôi phục sau conflict và lỗi lưu; lượt mới không mang draft/lựa chọn cũ.
- [x] UI: helper nút với lý do liên kết; chỉ đường khắc phục tại các nhóm thao tác; giữ input/button validation cùng contract. Xóa “— mở tab mới” khỏi tên liên kết lý thuyết ở hai bài.
- [x] Controller extraction: chặn ghi từ view stale; giữ đúng intent khi retry; trạng thái stopped/completed có đường xem lại/bắt đầu lượt mới. Source page đã key theo attempt nên giữ nguyên, case mở lượt mới xác nhận draft/lựa chọn reset đúng.
- [x] GREEN focused E2E desktop/mobile, hồi quy hai quy trình chiết tách, các kiểm tra Jar/guide/motion đã thay đổi; typecheck/lint/Vitest toàn gói phục vụ tích hợp.
- [ ] Tự review toàn diff kể cả stack guide/motion đã được người dùng duyệt; commit/push nhánh task, tạo PR develop, attach PR, CI App Quality + Database Contract xanh rồi merge. Tạo/attach release PR develop → main, review diff, kiểm CI xanh rồi merge. Không bypass CI, không ghi production DB.

Skills: VECLab Implement/Verify, Impeccable harden/craft floor, systematic-debugging, TDD, verification-before-completion, finishing-a-development-branch. Mọi xác nhận merge đã có trong yêu cầu hiện tại; không mở lại câu hỏi lựa chọn workflow.

## Bằng chứng local trước PR

- Lý do disabled là paragraph nhìn thấy trực tiếp và được nối bằng `aria-describedby`, không chỉ `title`. Các input vẫn giữ ràng buộc hiện hành. Jar chỉ rõ cốc thiếu phèn và có nút chuyển đến cốc cần xử lý; đo sớm vẫn được phép nhưng giải thích N/A.
- Extraction giữ nguyên việc cho phép lỗi học tập như bỏ trộn hoặc nộp thiếu dữ liệu; điều kiện trống/pha chưa tách/dung tích/lọc/cô/làm khô/đáp số có lý do và hướng tiếp tục. Không thêm khóa hóa học dựa trên animation.
- Xung đột trạng thái khóa ghi có chủ đích và dẫn đến tải lại. Regression phát hiện dialog nộp bài còn nút xác nhận enabled nhưng controller bỏ qua sau conflict, còn nút reload ở ngoài modal. Đã sửa bằng reason trên action và reload ngay trong modal (RED→GREEN).
- Fault injection sau transaction đã commit rồi lỗi lần đọc xác nhận: retry cùng action ID, revision vẫn 1, thể tích 45 mL, không thêm nước hai lần. Regression phát hiện cảnh rót phát lại sau idempotent retry; đã chặn cue replay (RED→GREEN).
- 12/12 case mới desktop/mobile qua, bao gồm field errors, multi-cup batch recovery, hai tab, conflict khi nộp, retry sau mất xác nhận, draft reset và tên link ngắn.
- Toàn gói local: typecheck, lint, 53 file Vitest / 461 test và diff check qua. Lần hồi quy rộng 104 browser cases: 98 qua, 6 case cũ không khớp catalog/guide/reduced-motion đã duyệt. Cập nhật assertions tương đương theo hai bài runnable, một bài planned, tám bước guide có actions lồng, frame tĩnh trong reduced motion. Rerun 8 case liên quan: 6 qua, còn hai lỗi selector/streaming của guide; sửa scope và chờ nội dung, 2/2 cuối qua. Tổng 104 case liên quan đã có bằng chứng GREEN; không chạy lại những case không thay đổi.
- Source review: inputs → controller → session → engine validation → projection → UI; controller chỉ thêm lock/recovery/cue guard, không sửa mô hình, đơn vị, releases, API hay DB. Đã review stack guide/media `fca4649`, Jar `94ac2b0`, extraction `3b60dcf` để tích hợp cùng workflow. Source page key sẵn có được giữ, không thêm reset effect thừa.
- UI chạy trên local `:3004`; manual read xác nhận trang load được và không có browser error. Browser tests desktop/mobile kiểm lý do hiển thị, keyboard/touch/reduced motion và giữ dữ liệu/report.

Verdict local: passes assigned scope (tự review theo no-subagent). CI và merge được ghi bằng trạng thái PR/GitHub, không coi kiểm tra local là CI. Build sẽ được kiểm trong App Quality CI để giữ dev server đang chạy; Database Contract dùng Supabase ephemeral của CI, không production credentials hay remote mutation.
