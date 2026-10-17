# Water Treatment MVP Build Plan

> **Cách thực hiện đã chọn:** ChatGPT web làm từng task; Codex local review/kiểm chứng; người dùng thử UI. Đọc [contract giao việc](../../workflow/web-handoff-contract.md) và `veclab-implement` trong repo. Plan này **arch trước, exec sau** theo yêu cầu người dùng 17/10/2026. Steps dùng checkbox (`- [ ]`).

**Goal:** Workbench `/simulate/water-treatment` chạy end-to-end với solver thật (không còn skeleton): user tạo mẫu → chỉnh pH → khuấy/lắng/lọc → đo → nhận goal status theo QCVN Cột A → báo cáo. Solver dùng capacity 3 KL closed-form (P0-C đã cross-check), Ksp/hydrolysis đã pin (P0-D), QCVN đã xác minh (P0-A), 3 golden case PASS (P0-F).

**Trạng thái khoa học (cập nhật 17/10/2026):** 9/9 P0 đã rõ — A ✅, B ✅ (design-assumed), C ✅ (±0,025 log), D ✅ (7 case PHREEQC), E ⏸ deferred, F ✅ (G1 AI-prepared + G2/G3), G ✅ (rubric 40/30/15/15), H ✅ (slider step), J ✅ (tolerance ±2%). `WT_OPEN_BLOCKERS = []` trong `constants.ts`. Solver có quyền trả `goalStatus` ngoài `unknown`; UI không còn lý do khoá "chưa xác minh".

**Tech stack:** Next.js/React/TypeScript hiện cài, CSS Modules, Vitest, Supabase local cho kiểm chứng DB (nếu cần). Không thêm dependency mới.

**Spec:** [`docs/experiments/water-treatment-spec.md`](../../experiments/water-treatment-spec.md) (đặc biệt §4.1, §6, §7, §10, §16.1, §17.6) và [`docs/scientific-evidence-register.md`](../../scientific-evidence-register.md) §5.1.3.

## Kiến trúc (Architecture trước)

### A.1. Hiện trạng đã có (không sửa trừ khi cần)

| File | Trách nhiệm | Ghi chú |
| --- | --- | --- |
| `src/features/water-treatment/constants.ts` | QCVN Cột A, Ksp, solid phase, outcome contract, DB pin SHA-256 | Đã verified 17/10; types ổn định |
| `src/features/water-treatment/capacity.ts` | Capacity 3 KL closed-form (P0-C) | `freeMetalAtSaturation`, `totalDissolvedMetalAtSaturation`, `capacityAtSaturation`, `hydrolysisEnrichmentFactor` |
| `src/features/water-treatment/use-water-treatment-attempt.ts` | Hook state attempt (composition, pH, history, isRunning) | 4 action types, reducer thuần |
| `src/app/simulate/water-treatment/actions.ts` | Server action `runWaterTreatmentAction` | Coarse pH shift model, capacity, goal status. **Đang placeholder** cho stir/settle/filter và mass-balance |
| `src/app/simulate/water-treatment/page.tsx` | Next.js route | Metadata + search params routing |
| `src/features/water-treatment/workbench.tsx` | UI workbench 939 dòng | Đầy đủ shell, controls, event log, report |
| `src/features/water-treatment/workbench.module.css` | CSS module 1040 dòng (đã dọn duplicate 17/10) | Đầy đủ layout |
| `tests/unit/water-treatment-capacity.test.ts` | 3-KL cross-check PHREEQC | PASS (P0-C) |
| `tests/unit/water-treatment-golden-cases.test.ts` | G1/G2/G3 end-to-end | PASS (P0-F) |

### A.2. Cần wire/hoàn thiện để end-to-end chạy thật

1. **Server action `actions.ts`**: 
   - `stir`, `settle`, `filter` hiện không đổi pH/filtrate (placeholder). Cần mô hình 2 pha:
     - `stir`: ổn định pH tại buffer; không kết tủa chưa (chờ lắng)
     - `settle`: kết tủa chuyển sang sludge nếu SI>0; pH không đổi
     - `filter`: tách sludge khỏi filtrate; filtrate trở thành input mới
   - **Mass-balance wire-up (P0-J ±2%)**: hiện `massBalancePct = {0,0,0}` (fake). Cần tính delta% thật giữa input → filtrate + sludge và push `invalidReasonCodes = ['MASS_BALANCE_BELOW_TOLERANCE']` khi vượt ±2% một nguyên tố bất kỳ.
   - **pH guard** đã có [2;13]; cần đẩy lên UI error message khi hit.
2. **UI workbench**:
   - Wire `runWaterTreatmentAction` thực sự cho 7 action types (đã có hooks, chỉ thiếu kết nối nút bấm)
   - Hiển thị `filtrate_mgPerL` + `precipitated_mgPerL` + `capacity_mgPerL` realtime
   - Hiển thị goal status tone dùng `GOAL_STATUS_TONE` (đã có map)
   - Hiển thị `massBalancePct` violation
   - Sludge accounting card
   - Per-phase pH measurement (hiện measure-initial-ph và measure-final)
3. **Persistence**: hiện in-memory. Phase 2.
4. **Scoring (P0-G rubric 40/30/15/15)**: chưa wire; chỉ có constants.
5. **P0-J wire** thật + test tolerance ±2% với 1 golden case.
6. **P0-E (LOD)**: deferred theo spec — giữ EPA reference, không đụng.

### A.3. Data flow & module structure (giữ nguyên ranh giới hiện có)

```
            ┌─────────────────────────────────────┐
            │  UI: workbench.tsx (client)         │
            │  useWaterTreatmentAttempt()         │
            │  state: composition / pH / history  │
            └────────────────┬────────────────────┘
                             │ useReducer dispatch
                             ▼
            ┌─────────────────────────────────────┐
            │  Server action: actions.ts          │
            │  runWaterTreatmentAction(input)     │
            │  → pure function (no DB)            │
            └────────────────┬────────────────────┘
                             │ imports
                             ▼
            ┌─────────────────────────────────────┐
            │  capacity.ts (pure)                 │
            │  capacityAtSaturation(pH)           │
            │  hydrolysisEnrichmentFactor(...)    │
            └────────────────┬────────────────────┘
                             │ imports constants
                             ▼
            ┌─────────────────────────────────────┐
            │  constants.ts (Ksp, QCVN, DB pin)  │
            └─────────────────────────────────────┘
```

**Nguyên tắc ranh giới** (giữ từ workflow song song):
- Coder 1 sở hữu `actions.ts`, `capacity.ts`, `constants.ts`, `use-water-treatment-attempt.ts`, tests.
- Coder 2 sở hữu `workbench.tsx`, `workbench.module.css` (outer UI); không sửa contract mô phỏng.
- Cùng chạm file = tuần tự hoá, không gộp task.

### A.4. Contracts cần giữ ổn định (do không phá release cũ)

```ts
// constants.ts (đã có, không đổi signature)
type WaterTreatmentGoalStatus =
  | 'pending' | 'success' | 'partial-success' | 'failed' | 'invalid' | 'unknown'
type WaterTreatmentVerificationStatus =
  | 'pending' | 'source-checked' | 'cross-checked' | 'failed'
type WaterTreatmentOutcome = {
  expectedOutcome: WaterTreatmentGoalStatus
  goalStatus: WaterTreatmentGoalStatus
  verificationStatus: WaterTreatmentVerificationStatus
  unknownReasonCodes: readonly string[]
}

// actions.ts — output shape
type WaterTreatmentResult = {
  action, composition, pH, previousPH, capacity,
  capacity_mgPerL, filtrate_mgPerL, precipitated_mgPerL,
  pHGuardHit, massBalancePct,
  goalStatus, expectedOutcome, verificationStatus,
  invalidReasonCodes, events
}
```

**Không thêm field mới vào types đã export** trong gói đầu; nếu cần thiết kế mở rộng (vd: thêm phase measurement, sludge mass), mở type trong một `v2` export riêng và giữ `v1` nguyên — local TL1 review trước khi merge.

## Global Constraints

- "Mỗi attempt là một bể mẫu; 7 action type theo spec §5." Mở attempt mới tạo state mới.
- "Renderer không tự quyết định kết quả, trừ điểm, tạo phép đo hoặc phát sinh hóa chất." Solver thuần, deterministic; UI chỉ hiển thị.
- "Animation không tính hóa học." UI spinner/transition chỉ trạng thái isRunning, không ảnh hưởng pH/capacity.
- "Domain dùng simulated time" cho event log timestamp; dùng `Date.now()` cho mỗi lần action dispatch (đã có), không dùng simulated time riêng.
- "Không đổi tên release cũ"; giữ `acid-neutralization@1.0.0` và `jar-test@0.1.0` nguyên.
- Read `AGENTS.md` và guide Next cài trong repo (`node_modules/next/dist/docs/`) trước sửa code. Git theo AGENTS; nhánh `feature/*` ngắn hạn từ `develop`. Không push/merge `main`/`develop` trực tiếp; production mutation không thuộc plan.
- Cloud chỉ kiểm chứng bằng Supabase local/ephemeral. Phase 1-3 không cần DB; nếu persistence (Phase 4) cần schema, bổ sung task + migration + local test trước triển khai.
- Theo [quyết định người dùng 14/10/2026](../../AGENTS.md): coder 1 = simulation/session/API/tests; coder 2 = outer UI/UX; **không spawn subagent** trong task này trừ khi người dùng yêu cầu rõ.
- Theo [quyết định người dùng 14/10/2026](../../AGENTS.md): UI edit trực tiếp, giữ approved header/footer, không tự ý dọn landing đã duyệt ở local commit `2fc2bf2`.
- Theo [contract](../../workflow/web-handoff-contract.md): mọi giao việc dùng **đúng một JSON object** v1; không Markdown fence, không prose bao quanh.

## Review Focus

1. **Mass-balance (±2% P0-J)**: input Fe/Zn/Pb/Cl/S/N/Na phải khớp filtrate + sludge ±2% mỗi nguyên tố; lệch thì `MASS_BALANCE_BELOW_TOLERANCE` + `goalStatus = 'unresolved'`. Test tối thiểu 1 golden case — Tasks 1/5.
2. **pH guard [2;13]**: vi phạm phải reject với `invalidReasonCodes` chứa `PH_GUARD_BELOW_MIN/ABOVE_MAX`; UI hiển thị banner đỏ, không cho chạy tiếp — Tasks 1/3.
3. **3 cơ chế tương tác đồng thời (P0-C)**: capacity 3 KL cross-check ±0,025 log; tightened ±0,004 (Davies + Cl) chưa thuộc plan MVP — chừa task riêng phase 2.
4. **Đúng trạng thái `goalStatus`**: 'success' / 'partial-success' / 'failed' / 'invalid' / 'pending' theo đúng §4.1; UI không collapse về "đạt/không đạt" — Task 3.
5. **Không lộ đáp án trước complete**: khi `goalStatus = 'pending'`, UI chỉ hiển thị capacity table, không hiển thị filtrate dự đoán — Task 3.
6. **Mobile/keyboard/reduced motion**: thao tác và kết quả phải tương đương desktop — Tasks 3/4.
7. **Giới hạn scope**: chỉ sửa file trong allowlist `files` của task; không tự sửa file ngoài scope để fix test — Task 5.

## File map và ownership

| File | Owner | Vai trò |
| --- | --- | --- |
| `src/features/water-treatment/constants.ts` | Coder 1 (RL) | Constants + types — không đổi signature |
| `src/features/water-treatment/capacity.ts` | Coder 1 | Pure model — bổ sung exports nếu cần |
| `src/features/water-treatment/actions.ts` | Coder 1 | Server action — wire stir/settle/filter + mass-balance |
| `src/features/water-treatment/use-water-treatment-attempt.ts` | Coder 1 | Hook state — bổ sung action types nếu cần |
| `src/features/water-treatment/workbench.tsx` | Coder 2 (TL2) | UI workbench — wire nút bấm, hiển thị kết quả |
| `src/features/water-treatment/workbench.module.css` | Coder 2 | CSS — bổ sung class nếu cần |
| `src/app/simulate/water-treatment/page.tsx` | Coder 1 (route) + Coder 2 (UI shell) | Route + wiring |
| `tests/unit/water-treatment-*.test.ts` | Coder 1 | Tests |

## Phased execution (sau architecture)

Các task dưới dùng short ID `WT-xx`. Mỗi task một nhánh riêng, một PR review, không gộp. Order ưu tiên dependency: 1 → 3 → 2 → 4 → 5 → 6.

### Phase 1: Wire solver thật (smallest, immediate value)

- [ ] **WT-01 (Coder 1)**: Hoàn thiện `actions.ts` stir/settle/filter + mass-balance P0-J.
  - **Files**: `src/features/water-treatment/actions.ts`, `src/features/water-treatment/capacity.ts` (bổ sung helper nếu cần), `src/features/water-treatment/constants.ts` (chỉ thêm constant trong `as const`, không đổi type).
  - **Accept**:
    1. `stir` trả `previousPH === pH` (không dịch pH), `goalStatus = 'pending'`.
    2. `settle` chuyển phần `input - capacity` sang `precipitated_mgPerL` khi capacity < input; `goalStatus` cập nhật theo filtrate mới.
    3. `filter` cập nhật composition = filtrate, reset pH, `goalStatus` theo composition mới.
    4. `massBalancePct` tính `(input - filtrate - precipitated) / input × 100` thật; `invalidReasonCodes` thêm `'MASS_BALANCE_BELOW_TOLERANCE'` nếu > 2% một nguyên tố.
  - **Checks**: `npm run test -- tests/unit/water-treatment-golden-cases.test.ts` (PASS); thêm test `water-treatment-mass-balance.test.ts` cho ±2% với G1.
  - **Không đụng**: UI, types đã export.

- [ ] **WT-02 (Coder 2)**: Wire nút bấm workbench → `runWaterTreatmentAction` thực sự; hiển thị kết quả realtime.
  - **Files**: `src/features/water-treatment/workbench.tsx` (chỉ phần handlers + render kết quả), `src/features/water-treatment/workbench.module.css` (chỉ thêm class mới nếu cần).
  - **Accept**:
    1. 7 nút (đo pH, +base, +acid, khuấy, lắng, lọc, đo cuối) gọi `attempt.run(action, { dose_mL, volume_mL })`.
    2. Sau mỗi action: cập nhật pH hiện tại, event log, capacity card, filtrate/precipitated card.
    3. `goalStatus` tone pill dùng `GOAL_STATUS_TONE` (đã có).
    4. Khi `invalidReasonCodes.length > 0`: hiển thị banner đỏ với lý do.
  - **Checks**: chạy local `npm run dev`; người dùng thử scenario G1/G2/G3 reproduce.
  - **Không đụng**: `actions.ts`, `constants.ts`, types.

### Phase 2: Hoàn thiện report + scoring (P0-G)

- [ ] **WT-03 (Coder 2)**: Report view hiển thị measurement timeline, sludge accounting, rubric placeholder.
  - **Files**: `workbench.tsx` (chỉ phần report view + dialog), `workbench.module.css`.
  - **Accept**:
    1. Bảng timeline các action: timestamp, pH trước/sau, capacity, filtrate, precipitated, mass balance.
    2. Sludge mass = sum(precipitated × volume / 1000) mg.
    3. Rubric card hiển thị 4 trụ 40/30/15/15 với placeholder "chưa chấm".
  - **Checks**: local visual; người dùng xác nhận.
  - **Không đụng**: backend.

- [ ] **WT-04 (Coder 1)**: Wire rubric scoring thật (P0-G).
  - **Files**: `src/features/water-treatment/scoring.ts` (mới), `constants.ts` (chỉ thêm `WT_RUBRIC` constant), `actions.ts` (thêm field `score?` optional trong `WaterTreatmentResult`).
  - **Accept**:
    1. `score.result` (40): success = 100, partial = 60, failed = 0, invalid = 0.
    2. `score.process` (30): số action distinct tối thiểu / tổng action.
    3. `score.chemicalEfficiency` (15): 1 - (tổng mol reagent / input mol metal) (placeholder nếu chưa có reagent data).
    4. `score.report` (15): boolean — đủ measurement timeline + sludge accounting.
    5. N/A chuẩn hoá mẫu số theo spec §10.
  - **Checks**: `tests/unit/water-treatment-scoring.test.ts` PASS; hiển thị 4 trụ trong UI.

### Phase 3: Verification & edge case

- [ ] **WT-05 (Coder 1)**: Test mass-balance + tightened P0-C tolerance (nếu có thời gian) + replay idempotency.
  - **Files**: `tests/unit/water-treatment-mass-balance.test.ts` (mới), `tests/unit/water-treatment-replay.test.ts` (mới), `actions.ts` (chỉ fix nếu test lộ bug).
  - **Accept**:
    1. 1 test G1: mass-balance Fe/Zn/Pb đều < 2%.
    2. 1 test replay: gọi `settle` 2 lần cùng state → kết quả giống nhau (idempotent).
    3. 1 test pH guard: pH = 1 → `goalStatus = 'invalid'`, `PH_GUARD_BELOW_MIN`.
    4. 1 test pH guard: pH = 14 → `goalStatus = 'invalid'`, `PH_GUARD_ABOVE_MAX`.
  - **Checks**: `npm run test -- tests/unit/water-treatment-*.test.ts` PASS (tất cả).

- [ ] **WT-06 (Coder 2)**: UX pass: keyboard, mobile, reduced motion, banner pH guard, empty state.
  - **Files**: `workbench.tsx`, `workbench.module.css`.
  - **Accept**:
    1. Tab order: composition → dose → primary action → secondary action.
    2. Mobile (< 880px): layout stack; nút full-width; toolbar collapse.
    3. Reduced motion: không xoay spinner, chỉ fade.
    4. Empty state: lần đầu chưa có history → message "Hãy chọn Fe/Zn/Pb rồi bắt đầu".
  - **Checks**: Playwright `test:e2e --project=chromium` + `--project=mobile` PASS; người dùng thử.

### Phase 4: Persistence (nếu cần, sau MVP)

- [ ] **WT-07 (Coder 1, sau khi user chốt)**: Supabase local + migration cho `wt_attempts` + `wt_events`.
  - **Files**: `supabase/migrations/2026xxxx_wt_attempts.sql` (mới), `src/features/water-treatment/persistence.ts` (mới), `actions.ts` (thêm `persist?: boolean`).
  - **Accept**:
    1. Bảng `wt_attempts` (id uuid, user_id, created_at, final_status, score jsonb).
    2. Bảng `wt_events` (id, attempt_id, action, pH, capacity jsonb, filtrate jsonb, timestamp).
    3. Local Supabase: insert + select PASS.
  - **Checks**: `npm run test:db` PASS; không đụng production.

## Trước khi giao Task đầu

1. Tạo nhánh `feature/coder-1-wt-01-actions` từ `develop` mới nhất; pin full base SHA.
2. Brief WT-01 dùng template [`docs/workflow/templates/task.json`](../../workflow/templates/task.json) với `coder: 1`, `target: develop`, files allowlist, accept, checks cụ thể.
3. Web đọc `AGENTS.md` + `water-treatment-spec.md` + `actions.ts` + `constants.ts` tại base SHA đã pin.
4. Local TL1 verify bằng `veclab-verify` (test, typecheck, lint, replay thủ công 1 case).
5. Người dùng duyệt visual (nếu có UI) trước khi merge vào `develop` theo AGENTS.

## Không thuộc plan này

- P0-E (LOD/accuracy): deferred theo evidence register §5.1.4; reopen khi có analytical method.
- Live-run G1 với PHREEQC binary thật: cần chemistry owner build binary trước; tạo task riêng.
- Persistence DB (Phase 4): chỉ mở khi người dùng chốt cần lưu attempt.
- Multi-sample chạy song song, undo/redo, chia sẻ attempt: phase sau.
- Các thí nghiệm khác (pH, methylene-blue): plan riêng.
