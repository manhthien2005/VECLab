# Jar Test First Slice Implementation Plan

> **Cách thực hiện đã chọn:** ChatGPT web làm từng task; Codex local review/kiểm chứng; người dùng thử UI. Đọc [contract giao việc](../../workflow/web-handoff-contract.md) và `veclab-implement` trong repo. Nếu dùng runtime khác thì vẫn giữ cùng phạm vi và handback; plan không yêu cầu cài thêm plugin hoặc tự dispatch nhiều agent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một lượt Jar Test chạy đầu cuối: thao tác 2D → đo → tự tính/chọn phương án → báo cáo → lưu/tiếp tục, giữ acid cũ hoạt động.

**Architecture:** Thêm module và session Jar cụ thể, dùng Process Core và hai repository hiện có. UI, report và API dispatch tường minh acid/Jar; không tạo hệ plugin, workflow engine hay renderer lab tổng quát.

**Tech Stack:** Next.js/React/TypeScript hiện cài, SVG/HTML/CSS, Vitest, Playwright, IndexedDB và Supabase local cho kiểm chứng cloud. Không thêm dependency.

**Spec:** [Thiết kế sản phẩm](../specs/2026-10-13-simulation-v1-design.md), [Jar Test](../../experiments/jar-test-design.md), [audit và kiểm tra số học](../../research/simulation-refactor-audit.md). Phạm vi plan là bài đầu tiên; pH refactor, hấp phụ và tutor có plan sau.

## Chuẩn bị trước Task 1

Skill dự án và contract giao việc phải có trong source được giao. Dùng `veclab-handoff` để chuẩn bị brief Task 1 với repo/branch/full base SHA, inputs, allowed files, interface, acceptance và handback; xác nhận web đọc được đúng commit và công cụ thực có. Chỉ có plan local chưa đủ để dispatch. Nếu web chỉ đọc GitHub thì trả patch; local chạy tests và review bằng `veclab-verify`. Contract FE ↔ BE chi tiết được khóa lần lượt ở Tasks 1–3; không coi interface đề xuất là code đã có.

## Global Constraints

- “Mỗi attempt là một mẻ với tối đa sáu cốc có ID A–F.” Thử mẻ mới tạo attempt mới.
- “Quan sát diễn biến ngay, giải thích đúng/sai chủ yếu ở cuối”; không trả score/reference trước complete.
- “Renderer không tự quyết định kết quả, trừ điểm, tạo phép đo hoặc phát sinh hóa chất.”
- “Domain dùng simulated time hữu hạn, không dùng FPS, thời gian tải mạng hoặc đồng hồ máy người học để tính hiệu suất.”
- “Không đổi tên một release cũ thành bài mới”; giữ `acid-neutralization@1.0.0` và API start acid cũ.
- Hai quyết định bản đầu: pH ban đầu và liều. Khuấy/lắng dùng protocol cố định; chưa đo định lượng giữa pha.
- Read `AGENTS.md` và guides Next cài trong repo trước sửa code. Git theo AGENTS; giữ nhánh từ Hoang đã được yêu cầu, không tự rebase nền trong task này. Không push/merge trực tiếp main/develop; production mutation không thuộc plan.
- Cloud chỉ kiểm chứng bằng Supabase local/ephemeral. Chưa có bằng chứng cần migration hoặc bảng cups; nếu phát sinh nhu cầu DB thật, bổ sung task/migration và local tests trước thực hiện.

## Review Focus

1. Đổi/retry liều, reload hoặc hai tab không được cộng hóa chất hai lần — Task 2/3.
2. Load Jar qua link acid hoặc ngược lại phải từ chối/dispatch đúng, không cast nhầm state — Task 2/5.
3. Số đo chưa lấy/không hợp lệ và kết thúc thiếu dữ liệu phải hiện N/A, không giả 0% — Task 1/5.
4. Màn hình đang học không được lộ đáp án qua projection, feedback hoặc event DTO mặc định — Task 3/4.
5. Mobile, bàn phím và reduced motion thực hiện cùng thao tác/kết quả — Task 4/6.

## Các quyết định nội dung khóa cho bản khởi đầu

Đây là lựa chọn của Tech Lead phục vụ mô hình dạy học, không phải thông số chung của mọi mẫu nước:

- Release đề xuất `jar-test@0.1.0`, mẫu kaolin/alum hai paddle, `initialNtu = 125`. pH ban đầu chọn 5/7/9; tổng liều chọn các bội 50 trong [50,250] mg/L. Không nhận liều 0 để ngoại suy phương trình.
- Dùng Equation 3 với hệ số in công bố, coded factors và miền trong [công cụ nghiên cứu](../../../tools/research/check-jar-candidate.mjs). Trong lesson này A = 0. Không tính lại regression khi chạy ứng dụng.
- Theo nguồn: rapid 60 s ở 100 rpm, slow 1200 s ở 40 rpm, settling 1800 s. Đây là thời gian mô phỏng; có thể bỏ animation, không bắt chờ ngoài đời đủ 51 phút. Không dùng nguồn 2017 để bổ sung kinetics vào công thức 2024.
- Thể tích aliquot quy ước 0.5 L/cốc, trong hình cốc dung tích 1 L; dùng để tính tài nguyên `massMg = doseMgL × 0.5`. Đây là quy ước dạy học do Tech Lead chọn: nguồn chỉ nêu dung tích beaker, không khóa volume fill. Không mở volume cho người học, không tuyên bố hiệu chuẩn thủy động lực học cho volume này. Dosing chọn mg/L, chưa có bài pha stock/mL.
- Mục tiêu sư phạm: giảm đục ít nhất 80% trong mô hình; không phải ngưỡng chất lượng nước. Tham chiếu là phương án đạt mục tiêu dùng liều nhỏ trong tập lựa chọn, cùng profile/release; có thể có nhiều cốc đạt. Không chấm nhỏ hơn sai số mô hình như bằng chứng chắc chắn ngoài thực tế.
- Đáp số hiệu suất: so phép tính từ measurement của chính người học, tolerance 0.5 điểm phần trăm do cách làm tròn. Đây là tolerance bài toán, không phải độ chính xác thực nghiệm. So goal bằng giá trị chưa làm tròn; hiện kết quả 1 chữ số thập phân kèm nhãn mô hình.
- pH là profile mẫu chuẩn bị sẵn trước xử lý; không suy pH cuối hoặc lượng acid/base chỉnh pH. Bông/hạt là minh họa pha, không có mm hoặc khối lượng bùn.

## File map và hợp đồng tối thiểu

| File/module | Trách nhiệm |
| --- | --- |
| `src/domain/experiments/jar-test/model.ts` | Profile, state/actions, công thức cuối pha và bất biến; không React/Node/DB |
| `src/domain/experiments/jar-test/engine.ts` | Adapter `DomainModule<JarState>` cho pipeline hiện có |
| `src/application/scenarios/jar-projection.ts` | Dữ liệu learner được phép thấy; report cuối lượt |
| `src/application/simulation/jar-session.ts` | Start/load/apply/complete qua repository, replay và commit helpers có sẵn |
| `src/application/simulation/jar-wire.ts`, `remote-jar-session.ts` | DTO/timestamps và transport cloud cho Jar |
| `src/features/jar-test/{workbench.tsx,apparatus.tsx,report.tsx,workbench.module.css}` | Điều khiển nhỏ, sân khấu 2D và báo cáo cụ thể |
| Các entry point hiện có trong Tasks 3/5 | Chọn đúng session, route, danh sách và nội dung; giữ API acid |

Không tạo file riêng cho mỗi chiếc cốc/hạt/nút. Tách thêm chỉ khi có trách nhiệm độc lập thực sự.

### Task 1: Khóa profile và engine Jar

**Files:** tạo `model.ts`, `engine.ts` ở file map; sửa `src/domain/process/contracts.ts` để thêm key `jar-test` và giữ keys cũ, `src/domain/units/index.ts` để thêm quantity `mass_concentration` với canonical unit `mg/L`; tạo `tests/unit/jar-engine.test.ts`, `tests/fixtures/jar-test/reference-cases.json`. Không đổi unit `g/L` đang thuộc density của bài nhựa.

**Interfaces:** xuất `JarState`, `JarProfile`, `JAR_PROFILE`, `createJarModule(): DomainModule<JarState>`, `predictJarRemoval(initialPh: number, doseMgL: number): number`. State có cup IDs, profile/revision, pha chung, tổng liều từng cup, measurements và submission; không chứa state animation. Actions phẳng: `prepare_cup {cupId,initialPh}`, `measure_initial`, `add_coagulant {cupId,incrementMgL}`, `run_phase {phase}`, `measure_final {cupId}`, `record_result {cupId,removalPercent}`, `select_result {cupId}`, `complete`. Numeric dose dùng `parameterQuantities.incrementMgL = 'mass_concentration'`; pH và hiệu suất là scalar không có unit selector. Cấp liều chỉ trước khi chạy chương trình; mẫu/liều khóa khi bắt đầu rapid. Chuẩn bị A–F một lần trong attempt. Program phases rapid/slow/settling đúng thứ tự, mỗi phase commit thời gian preset một lần; không có chế độ rpm/thời gian tùy ý để chấm lỗi.

- [ ] Viết test `predicts_published_coded_values`: `predictJarRemoval(7,150)` gần 60.63; `(5,150)` gần 44.49; `(9,150)` gần 86.79 trong tolerance số học 1e-9. Fixtures ghi nguồn/mô hình/tolerance; không so output fit với thực nghiệm bằng tolerance solver.
- [ ] Thêm test `dose_is_additive_and_irreversible`: thêm 50 rồi 100 thành 150, ledger 0.075 g/cốc (75 mg); vượt tổng 250 bị từ chối không đổi state. `mg/L` được nhận đúng quantity, `g` không thể dùng làm đơn vị liều; phép đổi mật độ `g/L` cũ giữ nguyên. `run_phase` theo chương trình chung; thao tác không có dữ liệu không sinh NTU giả.
- [ ] Thêm test `unmeasured_is_not_zero`: đo cuối trước khi đủ protocol lưu reading không hợp lệ với value null; complete được và goal non-evaluable nếu thiếu số đo/submission. Cốc khác đã đo hợp lệ vẫn được đánh giá riêng.
- [ ] Chạy `npm run test -- tests/unit/jar-engine.test.ts`, xác nhận RED do module chưa có; triển khai công thức/state và domain adapter tối thiểu. Complete tính báo cáo nhưng không yêu cầu đạt 80%.
- [ ] Chạy lại tests và `npm run typecheck`; kiểm tra `NaN`, input ngoài miền, trùng cup ID, quá sáu cốc, sai unit, replay cùng chuỗi. Commit phần engine; chưa đưa card Jar ra catalog.

### Task 2: Lượt guest có thể lưu, mở lại và báo cáo

**Files:** tạo `jar-session.ts`, `jar-projection.ts`; dùng `src/application/attempts/guest-repository.ts`, `src/application/simulation/commit-action.ts`, lifecycle/ledger hiện có; tạo `tests/integration/jar-guest-runtime.test.ts`.

**Interfaces:** `createJarSession(repository: AttemptRepository<JarState>): JarSession`. `JarSession` có `start(): Promise<JarSessionView>`, `load(attemptId: UUID)`, `apply(attemptId, actionType, parameters, unitSelections, commit?)`, `complete(attemptId, commit?)`. Apply/complete dùng cùng cấu trúc ok/domain-error/write-refusal như acid, với view Jar. `JarSessionView`: `scenarioKey: 'jar-test'`, attempt/release/revision/status/storageMode, timestamps, `JarProjection`, `JarReportSnapshot | null`; không xuất raw domain. `jar-projection.ts` xuất các kiểu trên cùng `projectJar(state: JarState): JarProjection`, `buildJarReport(state: JarState, ledger: ResourceLedger, events: readonly StoredAttemptEventRecord<JarState>[], generatedAt: Date): JarReportSnapshot`. Snapshot chứa model/profile version, các cốc, measurements, submission, diagnostics có event IDs.

- [ ] Viết test `resume_matches_uninterrupted`: chạy cùng chuỗi, đóng/mở repository rồi tiếp tục; measurements, ledger và report bằng lượt không gián đoạn (ngoại trừ metadata ID/timestamp). Test `wrong_release_is_not_cast_to_jar` cho attempt acid.
- [ ] Viết test `retry_does_not_double_dose`: retry cùng action ID trả idempotent replay và một lần lượng hóa chất; expectedRevision cũ có conflict. Không generate ID mới khi retry.
- [ ] Chạy `npm run test -- tests/integration/jar-guest-runtime.test.ts` để thấy RED; triển khai session bằng helpers hiện có. Nếu phải dùng lại vài dòng điều phối, giữ rõ trách nhiệm; chưa tạo generic session framework để loại mọi dòng giống acid.
- [ ] Chạy lại test cùng `tests/integration/guest-runtime.test.ts` và `tests/unit/process-core-lifecycle.test.ts`; không thay DB schema/IndexedDB version nếu state JSON hiện có đã lưu đủ. Commit.

### Task 3: Cloud dispatch đúng bài và giữ API acid

**Files:** tạo `jar-wire.ts`, `remote-jar-session.ts`; sửa `src/features/simulation-session.ts`, `src/app/api/simulation/server-session.ts`, `schemas.ts`, `attempts/route.ts`, các attempt action/load/complete/events handlers khi cần; tạo `tests/unit/jar-remote-api.test.ts`.

**Interfaces:** giữ `createSessionForStorageMode(mode)` cho acid; thêm `createJarSessionForStorageMode(mode): JarSession`. Start Jar body `{scenarioKey:'jar-test'}`; `{}` và setup acid cũ giữ nguyên. Start resolve release từ allowlist server. Mọi call theo attempt ID chọn session từ stored scenario/release sau kiểm tra ownership, không từ scenario client tự gửi. DTO Jar encode/decode timestamps và learner view; events mặc định chỉ xuất thao tác/số đo được phép thấy.

- [ ] Viết test start acid cũ không đổi; start Jar đúng release; body thêm `stateAfter`, score hoặc release tùy ý bị reject. Cross-user attempt vẫn một kết quả 404 như baseline, không lộ sự tồn tại.
- [ ] Viết test trước đo/complete: load/apply/events Jar không có reference, hidden final NTU, score hoặc chẩn đoán đúng/sai. Remote adapters kiểm tra discriminator/release trước decode/render, từ chối DTO của bài kia thay vì cast nhầm. Sau complete, snapshot decode `Date` đúng và hiển thị được.
- [ ] Chạy `npm run test -- tests/unit/jar-remote-api.test.ts` để thấy RED; triển khai hai nhánh tường minh, dùng auth guards và Supabase repository hiện có. Không thêm endpoint riêng từng dụng cụ.
- [ ] Chạy lại tests API hiện có (`parameterized-remote-api`, `bff-guards`, `service-role-boundaries`) và tests mới; xác minh cùng chuỗi guest/cloud qua Supabase local. Chạy `npm run test:db` và `npm run test:db:concurrency` trên local. Nếu môi trường chưa chạy được, ghi rõ và chưa coi cloud nghiệm thu. Commit.

### Task 4: Bàn Jar Test 2D thực hiện được toàn lượt

**Files:** tạo workbench/apparatus/CSS trong file map; tạo `src/app/simulate/jar-test/page.tsx` theo mẫu static route đang có; tạo `e2e/jar-test-workbench.spec.ts` (config hiện tại dùng `testDir: './e2e'`).

**Interfaces:** `JarWorkbench({attemptId, storageMode})` dùng JarSession; `JarApparatus({projection, selectedCupId, onSelectCup})` chỉ render và chọn đích. Mọi lượng/pH/phép đo đến từ session; selected cup và tốc độ animation chỉ là state UI. Route đọc storage mode phía server như acid.

- [ ] Viết browser test `chooses_cups_and_operates_apparatus`: chuẩn bị cốc khác điều kiện, cấp liều, chạy ba pha, đo, nhập phép tính và nộp. Xác nhận số đo chỉ xuất hiện sau thao tác đo và không có tick đỏ/xanh báo liều đúng/sai trong lượt.
- [ ] Chạy `npm run test:e2e -- e2e/jar-test-workbench.spec.ts --project=chromium` để thấy RED route chưa có; dựng sáu cốc SVG và điều khiển HTML theo dụng cụ/cốc được chọn. Có thể chọn/chạm và nhập lượng; không bắt drag-drop, không canvas/physics library.
- [ ] Thêm coverage mobile/bàn phím/reduced motion: cùng chuỗi action và kết quả, nhãn cốc rõ, trạng thái không chỉ dùng màu. Skip animation không được skip event/measurement.
- [ ] Chạy `npm run test:e2e -- e2e/jar-test-workbench.spec.ts` trên hai project desktop/mobile; không tạo hạt ngẫu nhiên để tính hóa học. Đọc guidelines React hiện có, kiểm tra số phần tử/animation thực tế; chỉ tối ưu phần gây chậm đo được. Commit.

### Task 5: Báo cáo, mở lại và danh mục không nhầm bài

**Files:** tạo `src/features/jar-test/report.tsx`, `src/content/scenarios/jar-test.vi.ts`, `src/content/evidence/jar-test.ts`; sửa content index/release manifests, `src/application/scenarios/registry.ts`, catalog, `src/features/reports/attempt-shell.tsx`, `src/features/learner-lab/lab-client.tsx`, `src/features/attempts/attempt-table.tsx`, `src/features/compare/compare-client.tsx` và `src/features/simulation-workbench/scenario.ts`; tạo `tests/unit/jar-report.test.ts`, `tests/unit/jar-routing.test.ts`.

**Interfaces:** `JarReport({snapshot: JarReportSnapshot})`; `workbenchPathForAttempt(attemptId: string, scenarioKey?: string): string` giữ default acid cho caller cũ. Metadata được đọc qua repository/BFF tương ứng, kiểm tra discriminator/release trước render Acid/Jar. Registry chỉ thêm Jar khi engine/content và các entry point chạy đủ. Không sửa acid report snapshot cũ.

- [ ] Viết test report tách kết quả mô hình, measurement validity và đáp số người học: đáp số sai không đổi NTU; cốc đạt nhưng tốn hóa chất không bị gọi sai toàn bộ; N/A không thành 0. Chênh hiệu suất dùng điểm phần trăm.
- [ ] Viết test My Lab/resume/report chọn route Jar bằng scenario thực; `AttemptRow` giữ `scenarioKey` từ summary, không suy từ tên hiển thị. Nhãn chỉ tiêu chung thay pH cố định, Jar hiện độ đục/hiệu suất đã đo thay vì N/A trong cột pH. Load cùng attempt dưới URL acid từ chối/điều hướng có chủ đích. `/compare` cũ chỉ cho acid tới khi có renderer so Jar; không render Jar như pH. Thử lại Jar giữ báo cáo cũ mở được để đối chiếu; chưa làm dashboard compare mới.
- [ ] Chạy tests để thấy RED; thêm renderer và dispatch hai nhánh. Report nêu nguồn/giới hạn, chương trình cố định và reference trong mô hình; chỉ chẩn đoán có event/measurement IDs hỗ trợ. Chuẩn bị dàn cốc không cần lời giải mẫu, tutor chưa có.
- [ ] Chạy tests report/routing, `comparison-rules`, `attempt-open-href`, content/evidence và guest/cloud snapshots. Khi hết entry point thiếu mới đăng ký catalog Jar; giữ acid release và nhựa baseline có đường đọc hợp lệ. Commit.

### Task 6: Kiểm tra đầu cuối và giao người dùng thử

**Files:** mở rộng browser test Jar ở Task 4 và `docs/experiments/jar-test-design.md` bằng kết quả nghiệm thu; không tạo thêm hệ test/monitoring.

**Interfaces:** các API/engine/UI từ Tasks 1–5; không thêm loại state/action mới trong task nghiệm thu.

- [ ] Chạy lượt đạt mục tiêu, lượt hợp lệ kém, lượt tính sai, lượt thiếu số đo; đối chiếu report với history và fixtures. Reload trước/sau complete giữ kết quả; retry action và hai tab không nhân liều.
- [ ] Chạy `npm run verify`, smoke E2E acid cũ và Jar desktop/mobile, DB local checks của Task 3. Ghi lệnh/kết quả và các giới hạn chưa kiểm chứng; không dùng unit green thay cho UI/cloud evidence.
- [ ] Người dùng thử UI đầu cuối; pilot nhỏ với sinh viên đúng đối tượng khi có người tham gia. Kiểm tra họ biết đo gì, đọc báo cáo hiểu nguyên nhân và cải thiện lượt sau. Chỉ từ pilot mới chốt thời lượng hoặc thêm thao tác.
- [ ] Giao PR đúng nhánh đích theo AGENTS với diff và bằng chứng review được; promotion/merge chờ required CI green. Không tự deploy production. Sau khi vòng học này được kiểm chứng mới lập plan cho pH refactor và hấp phụ.

## Tự rà soát plan

- Phạm vi phủ: engine/profile (1), guest/replay (2), cloud/auth/DTO (3), 2D và accessibility (4), report/catalog/compatibility (5), nghiệm thu (6).
- Không phủ trong đợt này: kinetics tự do, bùn định lượng, stock preparation, compare dashboard Jar, AI tutor, hai bài còn lại. Đây là scope rõ ràng; không coi toàn bộ mục tiêu v1 đã hoàn thành khi xong Jar.
- Các chữ ký JarSession/JarProjection/JarReportSnapshot được khóa khi làm Tasks 1–2 rồi là đầu vào cho Tasks 3–5. Người thực hiện đọc spec + toàn plan; không tự dựng bộ contracts mới ở từng task.
- Cách thực hiện đã được người dùng chọn: ChatGPT web làm từng phần; Codex local kiểm tra source/tích hợp và người dùng thử UI. Không tự nhắn task khác, push hoặc bắt đầu toàn bộ refactor khi chỉ đang chuẩn bị handoff này.
