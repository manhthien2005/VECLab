# Dùng Impeccable và Taste trong VECLab

Cài ngày 14/10/2026 theo yêu cầu của người dùng. Bản trong `.agents/skills` là nguồn chung cho Codex local và ChatGPT web; [nguồn, SHA và giấy phép](skill-sources.md#bộ-ui-được-cài--14102026) được ghim để review và cập nhật có chủ đích.

## Chọn đúng skill

| Công việc | Skill cần đọc | Cách dùng |
| --- | --- | --- |
| Màn Khám phá, thư viện, chi tiết bài, My Lab, bàn mô phỏng, báo cáo | [Impeccable](../../.agents/skills/impeccable/SKILL.md) | Theo mode của màn: thường là Operate cho ứng dụng, Read cho tài liệu. Đọc playbook `shape` khi đề xuất, `critique` khi đánh giá, `audit` khi kiểm chất lượng. Chỉ đọc `craft-floor` trước lúc sửa UI. |
| Audit/cải thiện UI có sẵn | [Taste Redesign](../../.agents/skills/redesign-skill/SKILL.md) | Bổ sung chẩn đoán layout, typography, trạng thái tương tác; giữ stack và hành vi đang hoạt động. Đề xuất không tự chuyển thành sửa code. |
| Trang giới thiệu/landing page thực sự có mục tiêu giới thiệu sản phẩm | [Taste v2](../../.agents/skills/taste-skill/SKILL.md) | Dùng art direction, nội dung và công cụ của bộ này. Upstream nói rõ không dành cho dashboard/app screen; không áp công thức marketing lên màn học tập. |
| Người dùng yêu cầu ảnh tham khảo website | [Taste Imagegen Web](../../.agents/skills/imagegen-frontend-web/SKILL.md) + skill imagegen của runtime | Chỉ dùng khi yêu cầu phù hợp với ảnh mẫu web. Số ảnh/phần theo brief của người dùng; không tự nhân thành 6–8 ảnh. Ảnh là đề xuất, không phải bằng chứng UI đã chạy. |

Không nạp cả bốn skill cho mọi task. Chọn skill chính theo màn và mục tiêu; đọc reference/data khi cần. Vercel React và Web Design Guidelines vẫn dùng cho triển khai và kiểm tra accessibility phù hợp.

## Quy tắc dự án được ưu tiên

- Đọc [AGENTS](../../AGENTS.md), brief và [yêu cầu sản phẩm đã chốt](../superpowers/specs/2026-10-13-simulation-v1-design.md) trước. Người học chính là sinh viên không chuyên hóa, đã biết hóa học và dụng cụ cơ bản; giá trị cốt lõi là thao tác, quan sát và hiểu nguyên nhân kết quả.
- **Chưa chốt hướng UI ngoài.** Ba ảnh concept đã tạo chưa được chấp nhận. Coder 2 hiện chỉ có scope audit/đề xuất theo task đã giao; bước tiếp theo cần mẫu để người dùng lựa chọn. Cài skill không xác nhận màu, font, bố cục hay mở quyền triển khai.
- Với màn ứng dụng, ưu tiên tìm bài, tiếp tục lượt học, đọc hướng dẫn và hiểu thao tác. Chỉ dùng hero, ảnh trang trí hay animation khi chúng phục vụ mục tiêu của màn.
- House rules của hai bộ có thể khác nhau (gradient, borders, font, motion). Không gộp thành danh sách cấm chung. Brief được chấp nhận, khả dụng và khoa học quyết định; chọn hướng nhất quán theo từng màn. Bảng số liệu, nhãn dụng cụ, bước quy trình, màu chỉ thị pH và số liệu cần thiết phải giữ ý nghĩa chuyên môn.
- Font phải hiển thị tốt tiếng Việt. Giữ semantics, tương phản, focus, bàn phím và reduced motion. Không đổi icon/font library chỉ vì upstream không thích thư viện hiện có; không thêm GSAP, WebGL hoặc dependency khi chưa có nhu cầu trong task.
- Không tạo số liệu, người dùng, testimonial hay kết quả khoa học giả để giao diện trông thật. Nội dung mẫu phải được ghi rõ; số liệu chạy thật lấy từ contract/projection.
- **Không tự spawn subagent.** Các agent templates và gợi ý delegate của upstream không vượt quyết định này. Local tự review. Không tự bật hook hoặc đổi pipeline kiểm thử khi chỉ được giao làm UI.
- [JSON v1](web-handoff-contract.md) và file allowlist vẫn áp dụng. Không trả thêm `design_plan`, bảng hoặc lời dẫn ngoài JSON khi bàn giao giữa agent; đưa thông tin thiết kế cần review vào artifact được cho phép.

## Dùng trên local và web

Codex dùng skill dự án từ lượt tiếp theo; có thể đọc file trực tiếp trong lượt hiện tại. Impeccable có launcher Windows tại `.agents/skills/impeccable/scripts/impeccable.cmd`; engine nằm trong cache người dùng, không phải dependency ứng dụng. Chỉ chạy lệnh phù hợp với task, giữ cwd tại repo. `context` đọc ngữ cảnh; `init`/`document` ghi tài liệu nên phải nằm trong allowlist nếu là task giao coder. Không tạo PRODUCT/DESIGN trùng với spec hoặc ghi đề xuất thành quyết định đã chốt.

Prompt giao web phải ghim commit chứa bản cài, đưa tài liệu này và `SKILL.md` phù hợp vào `read`. Task UI-01 cũ ghim base trước khi cài: không giả định coder ở base đó đã có skill; local cần chuẩn bị brief/base mới trước lần giao tiếp theo, giữ nguyên công việc trên nhánh coder. Web chỉ đọc các reference liên quan, không tải toàn bộ library hoặc giả định có terminal/browser.

Nếu không chạy được launcher/inspector, đọc ngữ cảnh và reference bằng công cụ đang có, ghi `not_run` cùng giới hạn thật. Screenshot, browser QA và detector findings là các bằng chứng riêng; cài thành công hay detector không phát hiện gì chưa đủ kết luận giao diện đẹp, dễ dùng hoặc chính xác khoa học.
