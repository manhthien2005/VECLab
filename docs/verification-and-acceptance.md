# ĐẶC TẢ KIỂM CHỨNG VÀ NGHIỆM THU

**Trạng thái:** Nguồn quyết định cho kiểm chứng MVP<br>
**Ngày:** 27/08/2026<br>
**Phạm vi:** Mô hình khoa học, process state, dữ liệu, auth, đồng bộ, web, report, responsive, accessibility và security

> Tài liệu này định nghĩa điều gì phải đúng và bằng chứng nào cần có trước khi tuyên bố sản phẩm hoàn thành. Nó không thay thế thí nghiệm bench và không tạo claim “đã kiểm chứng thực nghiệm bởi đội”.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Biến mọi yêu cầu khoa học, dữ liệu và web thành acceptance gates có thể kiểm tra. |
| 👥 **Dành cho** | QA, người xây engine, backend, frontend và người duyệt release. |
| ✅ **Sau khi đọc** | Biết test nào bắt buộc, tolerance nào áp dụng và bằng chứng nào phải lưu. |
| ⚠️ **Lưu ý** | Golden tests chứng minh code khớp model; không chứng minh model đã được đội kiểm chứng bench. |

## Đọc tài liệu này khi nào?

- Trước khi viết test hoặc tuyên bố một module đã hoàn thành.
- Khi cần phân biệt scientific model validation với web acceptance.
- Trước mỗi release hoặc thay scenario release.

## Các quyết định chính

- Release phải qua năm gate: scope/evidence, domain, state/data, web và security/accessibility.
- Mỗi thí nghiệm có golden cases, invalid cases và invariants riêng.
- Guest, auth, RLS, idempotency, report và responsive đều có luồng E2E bắt buộc.
- WCAG 2.2 AA là mục tiêu cho core flows; performance dùng Core Web Vitals làm release goal.
- Không gọi một mục là accepted nếu test chưa chạy trên release hiện tại.

## Mục lục

<!-- TOC:START -->
- [1. Bốn lớp xác nhận](#1-bốn-lớp-xác-nhận)
- [2. Acceptance gates](#2-acceptance-gates)
- [3. Công cụ và tầng test](#3-công-cụ-và-tầng-test)
- [4. Quy tắc tolerance](#4-quy-tắc-tolerance)
- [5. Acid neutralization test set](#5-acid-neutralization-test-set)
- [6. Copper precipitation test set](#6-copper-precipitation-test-set)
- [7. Plastic separation test set](#7-plastic-separation-test-set)
- [8. Process Core tests](#8-process-core-tests)
- [9. Schema và unit tests](#9-schema-và-unit-tests)
- [10. Persistence và transaction tests](#10-persistence-và-transaction-tests)
- [11. Guest mode tests](#11-guest-mode-tests)
- [12. Auth và profile tests](#12-auth-và-profile-tests)
- [13. RLS và authorization tests](#13-rls-và-authorization-tests)
- [14. Branch, undo và reset tests](#14-branch-undo-và-reset-tests)
- [15. Report và compare tests](#15-report-và-compare-tests)
- [16. End-to-end core flows](#16-end-to-end-core-flows)
- [17. Responsive matrix](#17-responsive-matrix)
- [18. Accessibility target](#18-accessibility-target)
- [19. Performance/reliability targets](#19-performancereliability-targets)
- [20. Content/evidence tests](#20-contentevidence-tests)
- [21. Traceability matrix](#21-traceability-matrix)
- [22. Test evidence phải lưu](#22-test-evidence-phải-lưu)
- [23. Definition of accepted](#23-definition-of-accepted)
- [24. Tài liệu liên quan](#24-tài-liệu-liên-quan)
<!-- TOC:END -->

---


## 1. Bốn lớp xác nhận

| Lớp | Câu hỏi | Bằng chứng |
| --- | --- | --- |
| Tính thực tế | Quy trình có tồn tại ngoài thực tế? | nguồn kỹ thuật/primary study |
| Tính đúng của model | Code có thực hiện đúng phương trình/giả định đã chốt? | golden tests, invariants, independent solver |
| Tính đúng của sản phẩm | Web/data/auth có thực hiện đúng scope? | integration/E2E/security tests |
| Bench validation | Mô hình có khớp thí nghiệm do đội làm? | không có trong dự án này |

Chỉ được tuyên bố ba lớp đầu trong phạm vi tương ứng. Bench validation luôn ghi “chưa thực hiện”.

---


## 2. Acceptance gates

### Gate A — Scope và evidence

- Mỗi route có source/condition/limitation.
- Không có constant không rõ nguồn hoặc transformation.
- Scenario version khóa constant bundle.
- UI disclaimer khớp spec.
- Không có claim pháp lý/industrial performance.

### Gate B — Domain model

- Golden cases pass.
- Mass/charge/species invariants pass.
- Invalid input không tạo result.
- Solver không hội tụ không trả số đoán.
- Replay deterministic.

### Gate C — Process/state/data

- State transition đúng.
- Event/snapshot atomic.
- Idempotency đúng.
- Revision conflict không ghi dữ liệu.
- Branch/undo/reset đúng semantics đã chốt.
- Completed report immutable.

### Gate D — Web behavior

- Guest hoàn thành đầy đủ ba bài.
- Account auth/save/resume hoạt động.
- Report/compare hoạt động.
- Mobile/desktop không mất chức năng.
- Error và save status rõ.

### Gate E — Security/accessibility

- Cross-user access bị chặn.
- Browser không ghi trực tiếp trusted result.
- Auth/session/CSRF/Origin baseline pass.
- Core flows đạt WCAG 2.2 AA target bằng automated + manual checks.

Không release nếu Gate A–E còn failure mức blocking.

---


## 3. Công cụ và tầng test

| Tầng | Công cụ mục tiêu | Phạm vi |
| --- | --- | --- |
| Domain unit | Vitest | formula, solver, scoring, state transition |
| Schema/unit | Vitest + TypeScript | parse, canonical unit, version schema |
| Property/invariant | Vitest | conservation, range, determinism |
| Database | pgTAP/Supabase CLI | schema, constraints, RLS, RPC |
| Application integration | Vitest/integration DB | service, idempotency, conflict, import |
| End-to-end | Playwright | guest/auth/resume/report/compare |
| Responsive | Playwright projects | desktop/tablet/mobile |
| Accessibility | axe-compatible automated checks + keyboard/manual review | WCAG target |
| Print | Playwright screenshot/PDF comparison | report print CSS |

Vitest transform TypeScript nhưng type-check chạy riêng: [Vitest Writing Tests](https://vitest.dev/guide/learn/writing-tests). Playwright tests dùng isolated context và user-visible behavior: [Playwright Writing Tests](https://playwright.dev/docs/writing-tests), [Best Practices](https://playwright.dev/docs/best-practices). Supabase cung cấp pgTAP/RLS test flow: [Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview).

---


## 4. Quy tắc tolerance

### 4.1. Absolute và relative error

```text
absoluteError = abs(actual - expected)
relativeError = absoluteError / max(abs(expected), scaleFloor)
```

Mỗi metric dùng tolerance ghi trong experiment spec. Không dùng một tolerance chung cho pH, mass và concentration.

### 4.2. Full precision và UI rounding

- Golden tests so full-precision engine output.
- UI tests so formatted value theo rule display.
- Không dùng value đã làm tròn làm state đầu vào cho bước sau.
- Snapshot lưu canonical numeric value và display metadata riêng.

### 4.3. Model tolerance không phải experimental uncertainty

Mọi bảng golden phải ghi rõ đây là regression tolerance của implementation so với model khóa.

---


## 5. Acid neutralization test set

Nguồn quyết định: [Acid Neutralization Specification](experiments/acid-neutralization-spec.md).

### 5.1. Golden cases

| ID | Expected chính | Tolerance |
| --- | --- | --- |
| AN-G01 | pH* 2,00000 | ±0,002 |
| AN-G02 | NaOH 22,50 mL → 3,27875 | ±0,002 |
| AN-G03 | NaOH 25,00 mL → 6,99500 | ±0,002 |
| AN-G04 | Ca(OH)₂ 27,50 mL → 10,64984 | ±0,002 |
| AN-G05 | Na₂CO₃ 25,00 mL → 4,47992 | ±0,002 |
| AN-G06 | Na₂CO₃ 42,25 mL → 6,99921 | ±0,002 |
| AN-G07 | Ca(OH)₂ 25,00 mL → 6,98637 | ±0,002 |
| AN-G08 | NaOH 27,50 mL + HCl correction 2,50 mL → 6,99500 | ±0,002 |

### 5.2. Invariants

- Charge residual ≤ 1×10⁻¹⁰ mol/L acceptance.
- Carbon alpha sum = 1 ±1×10⁻¹².
- Carbon mass relative error ≤1×10⁻¹⁰.
- `[Ca²⁺]+[CaOH⁺]=CCaT` trong numeric tolerance.
- NaOH strong-route pH liên tục qua equivalence.
- Same event chain → bitwise-stable serialized state hoặc numeric-stable theo canonical rule.

### 5.3. Invalid cases

| ID | Input/action | Expected |
| --- | --- | --- |
| AN-I01 | measure chưa calibrate | `METER_NOT_CALIBRATED`; không event result |
| AN-I02 | measure chưa mix | `SAMPLE_NOT_MIXED` |
| AN-I03 | đổi route sau addition | `ROUTE_LOCKED` |
| AN-I04 | Ca(OH)₂ slurry flag | `CALCIUM_SOLUTION_INVALID` |
| AN-I05 | temperature khác scope | `TEMPERATURE_OUT_OF_SCOPE` |
| AN-I06 | solver không bracket | `EQUILIBRIUM_NO_CONVERGENCE`; state unchanged |
| AN-I07 | add reagent rồi complete bằng measurement revision cũ | stale measurement rejected |

### 5.4. Scoring cases

- Exact target, good procedure → near/max score theo formula.
- Same final pH nhưng HCl correction → resource/process score thấp hơn.
- Carbonate target dùng E* route-specific, không 0,2500 mmol.
- Achievement percent không có nhãn probability.

### 5.5. Cost/safety convention cases

- Stoichiometric NaOH benchmark: cost index 1,000.
- Stoichiometric Ca(OH)₂ benchmark: cost index 0,650.
- Na₂CO₃ at benchmark target E*: cost index xấp xỉ 0,84396.
- AN-G08 correction: cost index 1,200; safety index 85 do `CORRECTION_ACID_USED`.
- Model invalid: không dùng 0 thay N/A.

---


## 6. Copper precipitation test set

Nguồn quyết định: [Copper Precipitation Specification](experiments/copper-precipitation-spec.md).

### 6.1. Golden cases

| ID | Route/dose | pH | Total dissolved Cu mg/L | Solid mg/L |
| --- | --- | ---: | ---: | ---: |
| CP-G00 | Chưa dose | 5,32524 | 100,000 | 0 |
| CP-G01 | NaOH R=1,000 | 6,10400 | 51,1344 | 75,0217 |
| CP-G02 | NaOH R=2,020 | 9,46596 | 0,00324284 | 153,5216 |
| CP-G03 | NaOH R=4,000 | 11,45777 | 0,0240016 | 153,4897 |
| CP-G04 | Ca(OH)₂ R=1,000 | 7,82219 | 0,0302403 | 153,4802 |
| CP-G05 | Na₂CO₃ R=1,000 | 5,73655 | 5,50795 | 164,3968 malachite |
| CP-G06 | Na₂CO₃ R=1,500 | 8,23329 | 0,0175587 | 173,9489 malachite |

Tolerances:

- pH ±0,01.
- CP-G00 override: pH ±0,01 và dissolved Cu ±0,001 mg/L.
- Các dosed case có Cu ≥1 mg/L: ±0,5%.
- Cu <1 mg/L: max(±2%, ±0,001 mg/L).
- Solid ±0,20 mg/L.
- Removal ±0,01 percentage point.
- Cu mass balance relative ≤1×10⁻⁶.

### 6.2. Invariants

- Total dissolved Cu ≥ free Cu²⁺ ≥0.
- Cu total = dissolved + solid-bound Cu.
- S/Na/Ca/C totals conserved by route.
- Active solid SI ≈0.
- Solid moles ≥0.
- Settle không đổi equilibrium fields.
- Filter không đổi dissolved fields trong ideal model.
- CP-G03 total dissolved Cu > CP-G02 dù free Cu thấp hơn; regression hydroxo-complex.
- Transition measured→completed giữ evaluation result và completed report pass hard gate.

### 6.3. Invalid/workflow cases

| ID | Action/state | Expected |
| --- | --- | --- |
| CP-I01 | settle before mix | `MIX_REQUIRED` |
| CP-I02 | filter before settle | `SETTLE_REQUIRED` |
| CP-I03 | measure dissolved before filter | `FILTER_REQUIRED` |
| CP-I04 | dose after filter | `BATCH_CLOSED_AFTER_FILTER` |
| CP-I05 | I≥0,02 | no science score; out-of-scope warning |
| CP-I06 | balance fail | `MASS_BALANCE_FAILED`; no commit |
| CP-I07 | solver fail | `EQUILIBRIUM_NO_CONVERGENCE` |

### 6.4. Independent check

CP-G00…CP-G06 đã được tái tạo bằng một log-activity/Davies/speciation solver độc lập. Residual norm của các nghiệm kiểm tra nằm khoảng 10⁻¹¹ hoặc nhỏ hơn.

### 6.5. Cost/safety convention cases

- NaOH R=2,000: cost index 1,000.
- Ca(OH)₂ R=1,000: cost index 0,650.
- Na₂CO₃ R=1,500: cost index 0,750.
- CP-G03: model validity fail nên safety index N/A; vẫn hiển thị dose/pH hazard flags.
- Rejected command không đổi safety index.

---


## 7. Plastic separation test set

Nguồn quyết định: [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md).

### 7.1. Golden cases

Vector `[PP, HDPE, PS, PET]` g.

| ID | Expected |
| --- | --- |
| PS-G01 | water: float `[3,3,0,0]`; sink `[0,0,3,3]` |
| PS-G02 | ethanol50: float `[3,0,0,0]`; sink `[0,3,3,3]`; score25 |
| PS-G03 | NaCl14: float `[3,3,3,0]`; sink `[0,0,0,3]`; score25 |
| PS-G04 | water-first: four 3 g products; closure12; score100; 3 stages |
| PS-G05 | NaCl-first: four 3 g products; closure12; score100; 3 stages |
| PS-G06 | range NaCl8: PP/HDPE guaranteed float, PS unresolved, PET sink; score N/A |
| PS-G07 | ethanol-first complete: four 3 g products; closure12; all-resins score100 |
| PS-G08 | target HDPE water→ethanol: P=R=100%; 2 stages; Starget100 |

Tolerances:

- Mass ±0,001 g.
- Purity/recovery ±0,01 percentage point.
- Density ±0,00001 g/cm³.
- Whole closure ±0,004 g.

### 7.2. Invariants

- Child mass sum parent mass.
- Terminal + unknown = initial mass.
- Closed parent không được reuse.
- Mass không âm.
- Purity/recovery/yield trong [0,100] hoặc N/A.
- Empirical evidence card không đổi ideal state/score.
- Range-guard partition thật nhưng score N/A.
- NaCl14 1 L dùng 0,154112 kg NaCl theo normalization.
- Complete all-resins resource: 3 L medium, 154,112 g NaCl, 0,500 L ethanol-equivalent.

### 7.3. Invalid cases

| ID | Action/state | Expected |
| --- | --- | --- |
| PS-I01 | split before wet | `STREAM_NOT_WETTED` |
| PS-I02 | split before settle | `STREAM_NOT_SETTLED` |
| PS-I03 | next medium before rinse/dry | `CARRYOVER_RISK` |
| PS-I04 | reuse parent | `STREAM_CLOSED` |
| PS-I05 | NaCl >26% | `NACL_OUT_OF_RANGE` |
| PS-I06 | EPS/filler material | `MATERIAL_OUT_OF_SCOPE` |
| PS-I07 | unresolved forced to float | rejected; mass unchanged |

### 7.4. Independent check

PS-G01…PS-G08 đã được kiểm tra bằng một deterministic partition/goal implementation riêng; G04/G05/G07 closure bằng 12,000 g.

### 7.5. Cost/safety convention cases

- Target PP one-stage ethanol: cost index 5,000.
- Target PET one-stage NaCl: cost index 2,000.
- Target HDPE water→ethanol: cost index 6,000.
- Target PS water→NaCl: cost index 3,000.
- All-resins route: cost index 8,000.
- Valid minimum route: safety index 100; extra unnecessary ethanol stage trừ 10.

---


## 8. Process Core tests

### 8.1. Determinism

- Same `scenario_release_id + state + action` cho structurally equal result.
- Không timestamp/random trong domain result.
- Event timestamp được application layer thêm sau calculation.

### 8.2. Preconditions

- Mỗi invalid transition trả typed error.
- State hash/sequence/revision không thay.
- Không resource delta.

### 8.3. Calculation trace

- Mỗi formula output quan trọng có equation key.
- Source keys resolve trong evidence registry.
- Không có NaN/Infinity.
- Canonical unit.

### 8.4. Complete

- Chỉ complete khi required measurements/actions đủ.
- Completed state không nhận domain action mới.
- Final report projection stable.

---


## 9. Schema và unit tests

- Reject missing fields.
- Reject unknown action type.
- Reject wrong unit dimension.
- Convert mL→L, mg/L→mol/L bằng exact factor/molar mass bundle.
- Reject ambiguous locale number nếu parser không xác định.
- JSON depth/size bounded ở server endpoints.
- Parse scenario release/state schema exact version.
- Unknown release returns content error, không fallback current silently.

---


## 10. Persistence và transaction tests

### 10.1. Atomic commit

- Event insert fail → attempt snapshot/revision unchanged.
- Snapshot update fail → no event committed.
- Success → event sequence +1, revision +1, current state matches event state_after.

### 10.2. Idempotency

- Retry same `action_id + request_fingerprint` trả existing result.
- Không tạo event thứ hai.
- Same action ID/different fingerprint → idempotency conflict.
- Existing action check xảy ra trước stale revision check.

### 10.3. Concurrency

- Device A commit revision5→6.
- Device B sends expected5 → conflict, no event.
- Device B refreshes6 and retries new action ID → success7.

### 10.4. Completed immutability

- Action/update final report bị từ chối.
- Delete own attempt được phép qua controlled service.
- Recompute không overwrite snapshot.

---


## 11. Guest mode tests

| ID | Flow | Expected |
| --- | --- | --- |
| GUEST-01 | new→actions→close→reopen same browser | resume local snapshot |
| GUEST-02 | complete→report | local final report snapshot render/print |
| GUEST-03 | storage write fail | show not saved; state visible |
| GUEST-04 | clear browser data | app explains guest data unavailable |
| GUEST-05 | login/import valid | server replays action inputs; cloud attempt created |
| GUEST-06 | import retry same payload | same cloud attempt returned |
| GUEST-07 | import modified result/state | ignored/rejected; server-derived values only |
| GUEST-08 | import event/size limit exceeded | validation/rate error |

Boundary cases:

- Portable attempt 500 events và ≤4 MiB: được replay nếu release cho phép.
- 501 events hoặc >4 MiB: bị từ chối trước replay.
- Acid action thứ 121 `add_base/add_correction_acid`: bị scenario validation chặn, nên mọi acid attempt hợp lệ vẫn import lossless.

Guest payload không được coi là trusted chỉ vì hash chain hợp lệ.

---


## 12. Auth và profile tests

- Sign up email/password.
- Email verification gate.
- Sign in/out.
- Wrong password generic error.
- Password reset link/flow.
- Expired reset/session behavior.
- Profile auto-created/idempotent.
- Display name trim/length/escaping.
- Auth route response không cache user session across users.

Không test social login vì ngoài scope.

---


## 13. RLS và authorization tests

Supabase yêu cầu test grants và policies cho allow/deny: [RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Testing](https://supabase.com/docs/guides/database/testing).

### 13.1. Matrix

| Actor | profiles SELECT | attempts SELECT | direct trusted writes |
| --- | --- | --- | --- |
| anon | deny | deny | deny |
| user A own | allow | allow | deny from browser |
| user A user-B | deny | deny | deny |
| server controlled service | explicit | explicit | allowed after checks |

### 13.2. Negative cases

- Change `user_id` payload.
- Guess attempt UUID.
- Direct INSERT fake completed attempt.
- Direct UPDATE score/report/state.
- Direct event INSERT/UPDATE/DELETE.
- Guest import direct DB call.

Tất cả phải bị chặn.

---


## 14. Branch, undo và reset tests

### 14.1. Undo scope

MVP chỉ undo action hiệu lực cuối cùng khi experiment đánh dấu reversible và trước filter/complete.

- Undo last reversible → append undo event; state đúng.
- Undo non-last → rejected.
- Undo after filter/complete → rejected.
- Undo twice same action → rejected.

### 14.2. Branch

- Chỉ cùng exact scenario release.
- Origin snapshot/inherited timeline được lưu bất biến.
- Xóa parent không làm branch report mất provenance.
- New branch starts own event sequence/revision.

### 14.3. Reset

- Old attempt stopped bằng lifecycle mutation.
- New attempt initial state đúng.
- Retry reset idempotent.
- Không overwrite old event history.

---


## 15. Report và compare tests

### 15.1. Report

- Guest và cloud dùng cùng report projection contract.
- Completed report dùng snapshot.
- Có started/completed time, localized title, inputs/units, timeline, observations, warnings, explanations, resolved citations, assumptions, limitations, disclaimer.
- Engine deploy mới không đổi old report.
- Print ẩn nav/control, giữ scientific content.

### 15.2. Compare

MVP chỉ compare:

- Hai completed cloud attempts.
- Cùng exact `scenario_release_id`.
- Cùng metric schema.

Cases:

- Same release → compare.
- Different release → blocked/explained.
- In-progress attempt → not selectable.
- User B attempt ID → access denied.
- Guest report → không vào cloud comparison list cho đến khi import.

---


## 16. End-to-end core flows

### 16.1. Public/guest

```text
Home → detail → start guest → perform valid route → complete → report → print
```

Chạy cho cả ba experiment.

### 16.2. Account cross-device

```text
Sign up/verify → start → save → new browser context sign in → resume → complete → report
```

### 16.3. Guest import

```text
Guest actions → sign in → confirm import → server replay → lab list → resume/report
```

### 16.4. Compare

```text
Complete attempt A/B same release → Lab → select both → compare metrics/timeline
```

### 16.5. Conflict

Hai browser context sửa cùng attempt; second action conflict và draft được giữ.

---


## 17. Responsive matrix

| Viewport | Core requirement |
| --- | --- |
| 320×700 | no horizontal overflow; all core controls reachable |
| 390×844 | primary mobile reference |
| 768×1024 | tablet stack/split hợp lý |
| 1024×768 | compact desktop/tablet landscape |
| 1440×900 | three-panel desktop workbench |

Test trên Chromium, Firefox và WebKit qua Playwright project khi môi trường CI hỗ trợ.

### 17.1. Assertions

- `scrollWidth <= clientWidth` trong core pages.
- No clipped input/unit/error.
- Touch target phù hợp.
- Không hover-only essential content.
- Sticky action không che field đang focus.
- Keyboard focus visible.

---


## 18. Accessibility target

Mục tiêu: WCAG 2.2 Level AA cho core flows, không tuyên bố certification bên ngoài. W3C khuyến nghị WCAG 2.2 và yêu cầu responsive variations cũng thuộc full-page conformance: [WCAG 2.2](https://www.w3.org/TR/wcag/).

### 18.1. Automated

- Label/description cho input.
- Role/name/state cho control động.
- Contrast checks.
- Duplicate ID.
- Heading order.
- Dialog focus/trap khi dùng.

### 18.2. Manual

- Hoàn thành core flow chỉ bằng keyboard.
- Screen-reader spot check cho status/save/error/result.
- Color không là tín hiệu duy nhất.
- Formula/source expandable accessible.
- Error focus và message liên kết field.
- Auth không yêu cầu cognitive puzzle ngoài khả năng accessible auth.

---


## 19. Performance/reliability targets

### 19.1. Domain

- Solver có max iteration rõ.
- Không unbounded recursion/tree traversal.
- Golden batch không timeout test runner.

### 19.2. Web vitals release goal

Sau deploy, đo mobile/desktop:

- LCP ≤2,5 s.
- INP ≤200 ms.
- CLS ≤0,1.

Đây là goal theo Core Web Vitals ở percentile phù hợp, không thay functional gate: [web.dev Web Vitals](https://web.dev/articles/vitals).

### 19.3. Save reliability

- UI không hiển thị saved trước server ack.
- Retry không duplicate event.
- Correlation ID tồn tại cho persistence/domain errors.

---


## 20. Content/evidence tests

- Mọi `source_key` resolve.
- Mọi `equationKey` có source/derivation.
- URL syntax hợp lệ.
- Scenario release chứa evidence version.
- Final report snapshot chứa resolved citation metadata.
- Không có banned wording:
  - “xác suất thành công thực tế”
  - “đạt pháp luật”
  - “an toàn để xả”
  - “liều tối ưu cho nước thải”
  - “khối lượng bùn thực” khi chỉ tính dry theoretical solid.

---


## 21. Traceability matrix

| Scope requirement | Verification group |
| --- | --- |
| Ba experiment hoàn chỉnh | §5–7, §16.1 |
| Multiple valid routes | Experiment process family/E2E fixtures |
| Deterministic | §8.1 |
| Guest full use | §11, §16.1 |
| Account cross-device | §10, §12, §16.2 |
| User owns data | §13 |
| Report/PDF | §15.1 |
| Compare | §15.2, §16.4 |
| Mobile/desktop | §17 |
| Scientific sources/limits | §20, Scientific Evidence Register |
| Error handling | §5–14 invalid matrices |

---


## 22. Test evidence phải lưu

- Test command/commit/build ID.
- Scenario release ID.
- Golden fixture version.
- Passed/failed/skipped count.
- Browser/project matrix.
- Database migration version.
- RLS negative test result.
- Screenshot/trace cho E2E failure.
- Manual accessibility checklist người kiểm tra/ngày.
- Known limitation không blocking.

Không lưu token, password hoặc personal data thật trong test artifact.

---


## 23. Definition of accepted

Một scope item được accepted khi:

1. Có requirement/spec.
2. Có test hoặc manual verification case.
3. Test đã chạy trên current release.
4. Không có blocking failure.
5. Evidence được lưu.
6. Disclaimer/limitation hiển thị khi yêu cầu.

“Test được viết” không đồng nghĩa accepted nếu chưa chạy.

---


## 24. Tài liệu liên quan

- [Core Project Scope](core-project-scope.md)
- [Web Application Scope](web-application-scope.md)
- [System Architecture](system-architecture.md)
- [Data and State Model](data-and-state-model.md)
- [Scientific Evidence Register](scientific-evidence-register.md)
- [Acid Neutralization Specification](experiments/acid-neutralization-spec.md)
- [Copper Precipitation Specification](experiments/copper-precipitation-spec.md)
- [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md)
