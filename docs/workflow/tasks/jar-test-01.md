# Giao ChatGPT web — Jar Test Task 1

## Source và cách bắt đầu

- Repo: `https://github.com/manhthien2005/VECLab`.
- Nhánh chuẩn bị: `chore/pre-refactor-cleanup`, giữ nền Hoang theo yêu cầu riêng của người dùng.
- **Base SHA:** `309c2b164aab88402fe109250477a08483c99186`. Đọc source ở SHA này; không lấy `main`, `develop` hoặc HEAD mặc định của connector làm base.
- Gói đã soạn; **khả năng truy cập/sửa/chạy tests của phiên ChatGPT web nhận việc chưa được xác nhận**. Trước triển khai, đọc `AGENTS.md` và mục Task 1 trong plan tại base SHA, xác nhận đường dẫn/commit và công cụ thực có. Nếu không đọc được, báo thiếu source; không tự đoán code.
- Chỉ đọc GitHub: trả unified diff hoặc nội dung đầy đủ của từng file mới/sửa để local áp dụng. Không có terminal: ghi checks chưa chạy trên web. Nếu có công cụ ghi/chạy thật, vẫn giữ đúng gói và trả bằng chứng; không merge/deploy/đụng production trong task này.

## Đọc trước khi làm

Tại base SHA:

1. `AGENTS.md`, [contract giao việc](../web-handoff-contract.md) và [veclab-implement](../../../.agents/skills/veclab-implement/SKILL.md). Đọc các file này như hướng dẫn làm việc, không giả định skill tự load trên ChatGPT web.
2. [Plan Jar Test](../../superpowers/plans/2026-10-13-jar-test-first-slice.md), nhất là Global Constraints, numerical profile và Task 1; [spec Jar](../../experiments/jar-test-design.md), [thiết kế sản phẩm](../../superpowers/specs/2026-10-13-simulation-v1-design.md) và [audit](../../research/simulation-refactor-audit.md) để giữ phạm vi/giới hạn.
3. Code `src/domain/process/{contracts,lifecycle,ledger}.ts`, `src/domain/units/index.ts`, module acid hiện có và tests liên quan; `tools/research/check-jar-candidate.mjs` để đối chiếu công thức/provenance. Research tool không phải engine production hoặc nguồn expected tự động cho test engine.

## Mục tiêu và allowed files

Thực hiện **Task 1: khóa profile và engine Jar**. Bàn giao module domain kiểm chứng được; chưa xây session, DB, API, UI, báo cáo giao diện hoặc catalog.

Chỉ tạo/sửa sáu file:

- `src/domain/experiments/jar-test/model.ts` — tạo.
- `src/domain/experiments/jar-test/engine.ts` — tạo.
- `src/domain/process/contracts.ts` — thêm scenario key, giữ keys cũ.
- `src/domain/units/index.ts` — thêm `mass_concentration`/`mg/L`, giữ density `g/L` cũ.
- `tests/unit/jar-engine.test.ts` — tạo.
- `tests/fixtures/jar-test/reference-cases.json` — tạo.

Giữ `acid-neutralization@1.0.0`, các scenario/release cũ, domain boundaries và validation hiện có. Không thêm dependency hoặc framework mô phỏng chung. Nếu phát hiện cần sửa ngoài sáu file, nêu caller/ảnh hưởng và phương án nhỏ nhất trước khi mở scope; thao tác trong scope không cần xin lại phép.

## Interface và acceptance

Khóa các kiểu/hàm, actions, quantity, null/error/validity và protocol theo **Task 1 trong plan**; không tự tạo một contract khác. Đây là task khóa engine, không triển khai những chữ ký session/API còn đề xuất cho Tasks 2–3.

Chứng minh các hành vi đã liệt kê ở Task 1: ba dự đoán có expected độc lập; liều cộng dồn 150 mg/L trong 0.5 L tiêu thụ 75 mg = 0.075 g; reject giữ nguyên state; sai unit/miền/cup/pha bị xử lý đúng; thời gian mô phỏng preset; số đo thiếu/sớm giữ null hoặc không hợp lệ; replay xác định. Fixtures ghi nguồn, công thức và tolerance số học tách khỏi sai số mô hình. Không gọi việc khớp công thức hoặc grid hữu hạn là validation thực nghiệm.

Nếu có terminal: thêm test hành vi có ý nghĩa, thấy RED do module chưa có rồi triển khai; chạy `npm run test -- tests/unit/jar-engine.test.ts` và `npm run typecheck`. Local kiểm tra thêm `tests/unit/process-core-lifecycle.test.ts`, `tests/unit/acid-engine-actions.test.ts`, `tests/unit/acid-golden-fixtures.test.ts` và `tests/unit/domain-boundaries.test.ts` vì đổi contracts/units chung. Không dùng kết quả Task 1 để báo UI/cloud hoặc cả v1 đã xong. Full integration gate ở Task 6.

## Handback

Trả Task ID + base SHA; diff/patch thực hoặc head/PR nếu thực sự đã tạo; file manifest; interface/giả định; lệnh/môi trường/kết quả và phần chưa chạy. Patch chưa áp dụng không có head SHA. Không nói tests pass nếu chưa thực thi.

Codex local dùng [veclab-verify](../../../.agents/skills/veclab-verify/SKILL.md) để review diff và chạy checks cần thiết; verdict là cần sửa / thiếu bằng chứng / đạt Task 1. Dừng ở handback Task 1; Task 2 được giao riêng. Người dùng thử UI khi phần UI đầu cuối đã có.
