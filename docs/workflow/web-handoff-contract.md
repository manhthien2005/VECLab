# Contract giao việc và nghiệm thu VECLab

Ngày: 13/10/2026. Phạm vi: Codex local làm Tech Lead/review; ChatGPT web thực hiện gói được giao; người dùng thử UI đầu cuối. Contract này là quy ước làm việc, không tự cấp quyền cho connector, đẩy Git, nhắn chat khác hoặc thay đổi production.

## 1. Vị trí trong quy trình

Yêu cầu sản phẩm → audit/đặc tả → skill dự án và contract giao việc → gói triển khai cụ thể → web thực hiện → local review/kiểm chứng → người dùng thử UI → tích hợp theo AGENTS.

Hiện đã có thiết kế, audit và plan Jar Test. Bộ skill/contract là phần chuẩn bị phải hoàn tất trước khi coi gói đầu tiên sẵn sàng giao. Viết xong plan không tự chứng minh đã chuẩn bị đủ workflow, web đọc được source, hoặc tính năng đã chạy.

“Contract web” ở đây là hợp đồng giao việc cho tác nhân trên web. Contract kỹ thuật FE ↔ BE là phần riêng: các ranh giới hiện nằm trong thiết kế/plan; cấu trúc `JarState`, action và đơn vị khóa ở Task 1, `JarProjection`/report/session ở Task 2, DTO/API ở Task 3. Một chữ ký đề xuất trong plan chưa phải API đã triển khai hoặc đã kiểm thử.

## 2. Nguồn quyết định

- [AGENTS.md](../../AGENTS.md): Git, môi trường và phạm vi quyền.
- [Thiết kế hiện hành](../superpowers/specs/2026-10-13-simulation-v1-design.md): mục tiêu học tập, phản hồi và 2D.
- [Jar Test](../experiments/jar-test-design.md), [audit](../research/simulation-refactor-audit.md), [plan](../superpowers/plans/2026-10-13-jar-test-first-slice.md): phạm vi khoa học, giả định và gói thực hiện.
- Code/tests tại base commit được giao: hiện trạng chạy thật. Nếu khác đặc tả, nêu khác biệt; không âm thầm sửa đặc tả để hợp code.

Local dùng các skill dự án trong `.agents/skills`. Web phải được yêu cầu đọc các file cần thiết qua repo hoặc nhận nguyên nội dung nếu công cụ không truy cập được. Không giả định ChatGPT web tự tải skill, plugin hoặc file chỉ có trên máy local. Cách đặt repo skill đối chiếu [tài liệu OpenAI](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).

| Công việc | Entry point dùng chung |
| --- | --- |
| Làm rõ phần còn mở, chuẩn bị task và kiểm tra readiness | [veclab-handoff](../../.agents/skills/veclab-handoff/SKILL.md) |
| Thực hiện đúng một task đã giao | [veclab-implement](../../.agents/skills/veclab-implement/SKILL.md) |
| Review diff và chứng minh kết quả đúng phạm vi | [veclab-verify](../../.agents/skills/veclab-verify/SKILL.md) |

Facts về source/tool đọc từ repo và môi trường; quyết định về mục tiêu, trải nghiệm hoặc đổi miền mô hình mới cần hỏi người dùng nếu chưa được chốt. Hỏi gọn, kèm đề xuất và ảnh hưởng; tiếp tục phần độc lập khi có thể. Không mở lại yêu cầu đã chấp nhận để làm đầy một checklist. Khi audit, ghi file/caller chứng minh nhận định; phần suy luận hoặc đề xuất phải được gọi đúng tên.

## 3. Gói giao việc tối thiểu

Mỗi gói ghi các trường dưới đây bằng giá trị thật lúc chuẩn bị; không dùng HEAD hoặc tên nhánh di động làm định danh duy nhất.

| Trường | Nội dung |
| --- | --- |
| Task | ID trong plan, một mục tiêu và ranh giới kết thúc |
| Source | Repo URL, nhánh làm việc và full base SHA; bằng chứng web đọc được đúng commit |
| Inputs | Paths của AGENTS, contract, spec/plan và nguồn/fixtures cần đọc tại base SHA |
| Allowed files | Danh sách file được tạo/sửa cho task; phạm vi hỗ trợ trực tiếp như index/export liên quan phải ghi rõ |
| Keep | Release/hành vi cũ và phần nằm ngoài task cần giữ |
| Interface | Kiểu/hàm/action, input/output, đơn vị, null/error/validity và version có liên quan |
| Acceptance | Các hành vi cần chứng minh cùng lệnh kiểm tra; phân biệt số học mô hình, kết quả thực nghiệm và UI |
| Capability | Web hiện đọc/sửa repo, chạy terminal/test, trả patch hoặc tạo PR được hay không; chỉ ghi năng lực đã xác nhận |
| Handback | Patch hoặc PR/commit thực, files changed, bằng chứng test, assumptions và phần chưa kiểm chứng |

Nguồn repo hiện tại: `https://github.com/manhthien2005/VECLab`. Giữ nền Hoang đã được yêu cầu; Git lifecycle theo AGENTS. Tạo brief phải đọc Git hiện tại để pin SHA/nhánh, không sao chép một SHA cũ từ ví dụ. Chưa có bằng chứng commit đã đến GitHub thì ghi “chuẩn bị local, chưa xác nhận web truy cập”; không gắn nhãn ready-to-dispatch.

Kiểm tra quyền bằng việc tối thiểu: web đọc AGENTS và một file task tại đúng commit, xác nhận đường dẫn/định danh. Nếu chỉ đọc được repo, web trả unified diff hoặc nội dung file đầy đủ để local áp dụng. Nếu không có terminal, ghi test “chưa chạy trên web”; local chạy trước nghiệm thu. Không đổi phương thức làm việc của người dùng chỉ vì runtime thiếu tool.

## 4. Cách thực hiện và trả kết quả

Web làm task đã giao, dùng kiến trúc/fixtures sẵn có. Nếu cần đổi interface hoặc file ngoài phạm vi, trả ảnh hưởng và phương án nhỏ nhất trước khi mở rộng. Routine implementation trong phạm vi không cần xin lại phép. Hoàn thành một task không tự mở Task kế tiếp.

Mẫu handback ngắn:

1. Task ID, base SHA và commit/PR SHA thực; nếu chỉ có patch thì ghi rõ patch chưa áp dụng.
2. Thay đổi và files changed; không gộp cleanup không liên quan.
3. Test: lệnh, môi trường, kết quả/log có thật, hoặc “chưa chạy” và lý do.
4. Giả định/giới hạn, interface thay đổi và việc còn lại.

“12 dự đoán khớp bảng” hoặc “grid hữu hạn” chỉ chứng minh phần số học đã kiểm tra. Không gọi đó là validation ngoài mẫu hoặc chứng nhận mô phỏng đúng thí nghiệm thực. Giữ riêng tolerance phép tính, sai số mô hình và mức đạt mục tiêu trong bài học.

## 5. Local review và nghiệm thu

Local lấy diff/patch thật và so với base, đọc code/tests liên quan rồi kiểm chứng đúng phạm vi. Tóm tắt của web là đầu vào review; trạng thái pass không thay thế diff hoặc bằng chứng tự chạy.

| Gate | Bằng chứng |
| --- | --- |
| Đúng gói | Diff chỉ làm mục tiêu/task, interface và miền đã giao |
| Đúng mô hình | Công thức/đơn vị/fixtures có căn cứ; không kẹp/ngoại suy/giả số đo để che dữ liệu không hợp lệ |
| Đúng trạng thái | State/ledger/replay/idempotency theo phần task chạm tới; measurement thiếu không thành 0; animation không tính hóa học |
| Tương thích | Release/API/lượt cũ vẫn đọc/chạy trong phạm vi bị ảnh hưởng |
| Đủ bằng chứng | Test phù hợp đã thực chạy; UI/cloud chỉ được ghi qua khi đã kiểm chứng phần đó |

Verdict dùng một trong ba: **cần sửa**, **còn thiếu bằng chứng**, **đạt phạm vi task**. “Đạt Task 1” không có nghĩa Jar UI/cloud hoặc cả v1 đã xong. Gói engine chưa cần kiểm thử UI chưa tồn tại; gói UI phải có lượt đầu cuối rồi người dùng mới thử giao diện.

Local báo ngắn: verdict → vấn đề cần sửa theo mức ảnh hưởng → kiểm tra đã chạy/chưa chạy → bước tiếp theo. Merge/promotion vẫn theo required CI của AGENTS; production không nằm trong contract này.

## 6. Chọn kiểm chứng theo thay đổi

Đọc `package.json`, cấu hình test và scripts tại SHA đang review trước khi dùng lệnh bên dưới. Chạy phần tập trung trước, sửa lỗi rồi mới mở rộng khi rủi ro/task yêu cầu. Không chạy lại suite không đổi chỉ để tăng số lần kiểm tra.

| Phần thay đổi | Kiểm chứng phù hợp trong repo |
| --- | --- |
| Chỉ tài liệu/skill | Kiểm tra frontmatter, links nội bộ, diff/whitespace và một tình huống dùng skill bị ảnh hưởng; không coi đó là kiểm chứng ứng dụng. |
| Engine/units/ledger | Vitest qua `npm run test -- <test-file>`; fixtures độc lập, miền đầu vào, null/validity, tính không đổi khi reject, replay; thêm regression của contracts dùng chung và `npm run typecheck`. Task Jar cụ thể dùng tests trong plan. |
| Session/API/storage | Tests integration/API của luồng bị ảnh hưởng; retry cùng action ID, revision conflict, ownership và discriminator/release. DB thay đổi phải là migration có kiểm chứng local/CI. |
| UI/hành trình học | `npm run test:e2e -- <spec-file> --project=chromium`, rồi `--project=mobile` khi nghiệm thu UI. Đọc UI thật trước khi chọn locator; ưu tiên role/label, assertion quan sát được, tránh sleep cố định. Kiểm tra đo → nhập đáp số → report → reload/resume, bàn phím và reduced motion theo task. |
| Tích hợp hoặc gate toàn gói trong plan | `npm run verify`: typecheck, lint, Vitest, build. Không bắt mọi task nhỏ chạy lại full suite: Task 1 dùng checks riêng, Task 6 dùng full gate. Lệnh này **không** chạy Playwright hoặc DB; bổ sung hai phần đó khi có trong phạm vi nghiệm thu. |
| Cloud/database | Supabase local đang chạy và đúng target; `npm run test:db`, `npm run test:db:concurrency` cùng luồng app/API thực tế cần kiểm chứng. Thiếu môi trường thì ghi chưa chạy và chưa đạt phần cloud. |

Guest hiện chạy bằng `npm run dev` tại `http://localhost:3000`, không cần credentials. Playwright hiện có `testDir: './e2e'`, project `chromium`/`mobile`; tự khởi động app nếu chưa đặt `E2E_BASE_URL`. Cấu hình mặc định chụp ảnh khi lỗi và trace ở retry đầu. Khi cần trace cả lần chạy local không retry, dùng `--trace=retain-on-failure`. Giữ evidence trong output test đã ignore; handback ghi đường dẫn artifact có thật và bước tái hiện, không commit browser profile hoặc secrets.

CI hiện có hai job App Quality và Database Contract; chưa có job Playwright trong `.github/workflows/ci.yml`. CI xanh không tự chứng minh UI đã được thử. Với guest/browser case, dùng context cô lập; với cloud, dùng tài khoản/dữ liệu local và ownership riêng, không chạy trên production. Jar UI chưa tồn tại tại nền chuẩn bị này; không báo đã thử Jar từ acid smoke test.

## 7. Duy trì

[Nguồn chọn lọc và giấy phép](skill-sources.md) ghi commit upstream và lý do dùng/bỏ. Duy trì ba skill nhỏ cùng một contract; không thêm pipeline song song với Vitest/Playwright/CI sẵn có nếu chưa có vấn đề cụ thể. Brief sau này chỉ cần trỏ đúng skill, spec và SHA; không chép cả bộ tài liệu vào mọi prompt.
