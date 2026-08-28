# MÔ HÌNH DỮ LIỆU VÀ TRẠNG THÁI

## Nền tảng mô phỏng quy trình hóa học có căn cứ khoa học

**Trạng thái:** Đặc tả logic đã chốt cho MVP<br>
**Ngày:** 27/08/2026<br>
**Phạm vi:** Tài khoản, phiên bản kịch bản, lượt thử, event, snapshot, báo cáo, guest import, branch, undo, reset và đồng bộ đa thiết bị

> Tài liệu này định nghĩa dữ liệu cần tồn tại và các bất biến phải giữ. DDL cuối cùng có thể thay đổi cú pháp nhưng không được thay đổi ý nghĩa nếu chưa cập nhật tài liệu.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Định nghĩa cách lưu tài khoản, attempt, event, snapshot, report và đồng bộ. |
| 👥 **Dành cho** | Backend, database, simulation service và QA bảo mật dữ liệu. |
| ✅ **Sau khi đọc** | Hiểu vòng đời attempt, transaction, idempotency, RLS và guest import. |
| ⚠️ **Lưu ý** | DDL là schema logic; migration cuối có thể đổi cú pháp nhưng phải giữ invariant. |

## Đọc tài liệu này khi nào?

- Trước khi tạo migration, repository hoặc RPC mutation.
- Khi xử lý resume, conflict, undo, reset, branch hoặc completed report.
- Khi kiểm tra người dùng có thể truy cập dữ liệu nào.

## Các quyết định chính

- Event log là lịch sử; current snapshot tối ưu việc mở lại.
- Completed attempt và final report snapshot là bất biến.
- Browser không được ghi trực tiếp trusted state, score hoặc event.
- Retry dùng action ID và fingerprint; concurrent edit dùng revision conflict.
- Guest import bắt buộc replay action inputs bằng exact scenario release trên server.

## Mục lục

<!-- TOC:START -->
- [1. Mục tiêu](#1-mục-tiêu)
- [2. Nguyên tắc dữ liệu](#2-nguyên-tắc-dữ-liệu)
- [3. Định danh và version](#3-định-danh-và-version)
- [4. Trạng thái vòng đời attempt](#4-trạng-thái-vòng-đời-attempt)
- [5. Bảng profiles](#5-bảng-profiles)
- [6. Bảng attempts](#6-bảng-attempts)
- [7. Bảng attempt_events](#7-bảng-attempt_events)
- [8. Bảng guest_imports](#8-bảng-guest_imports)
- [9. Nội dung kịch bản không nằm trong bảng user data](#9-nội-dung-kịch-bản-không-nằm-trong-bảng-user-data)
- [10. Shape của state dùng chung](#10-shape-của-state-dùng-chung)
- [11. State chuyên môn](#11-state-chuyên-môn)
- [12. Server calculation và atomic commit RPC](#12-server-calculation-và-atomic-commit-rpc)
- [13. Optimistic concurrency](#13-optimistic-concurrency)
- [14. Branch, undo cuối và reset](#14-branch-undo-cuối-và-reset)
- [15. Complete và final report snapshot](#15-complete-và-final-report-snapshot)
- [16. Guest store](#16-guest-store)
- [17. RLS và grants](#17-rls-và-grants)
- [18. Indexes](#18-indexes)
- [19. Query/use case chính](#19-queryuse-case-chính)
- [20. Retention và xóa](#20-retention-và-xóa)
- [21. Data migration](#21-data-migration)
- [22. Invariants bắt buộc](#22-invariants-bắt-buộc)
- [23. Ví dụ event chain](#23-ví-dụ-event-chain)
- [24. Tiêu chí nghiệm thu dữ liệu](#24-tiêu-chí-nghiệm-thu-dữ-liệu)
- [25. Tài liệu liên quan](#25-tài-liệu-liên-quan)
<!-- TOC:END -->

---


## 1. Mục tiêu

Mô hình dữ liệu phải hỗ trợ:

- Người dùng khách làm đầy đủ thí nghiệm trên một trình duyệt.
- Tài khoản người học lưu và tiếp tục trên thiết bị khác.
- Timeline thao tác và giải thích từng bước.
- Replay kết quả xác định.
- Báo cáo ổn định sau khi engine được cập nhật.
- So sánh hai lượt tương thích.
- Tạo nhánh từ một bước cũ.
- Hoàn tác mà không xóa dấu vết lịch sử.
- Phát hiện hai thiết bị sửa cùng một lượt.
- Bảo vệ dữ liệu theo chủ sở hữu.
- Phiên bản hóa scenario, engine và scoring.

---


## 2. Nguyên tắc dữ liệu

### 2.1. Event log là lịch sử; snapshot là tối ưu đọc

- `attempt_events` là lịch sử append-only của thao tác đã được chấp nhận.
- `attempts.current_state` là snapshot mới nhất để mở nhanh.
- Snapshot phải có thể kiểm tra bằng event cuối.
- Không sửa event cũ để thay đổi lịch sử.

### 2.2. Completed attempt là bất biến

Sau khi `status = completed`:

- Không append action mới.
- Không recompute rồi ghi đè final report bằng engine mới.
- Chỉ được đọc, so sánh hoặc xóa.
- Muốn thử tiếp phải tạo branch/new attempt.

### 2.3. Canonical unit trong persisted state

- Domain state và event result lưu canonical unit.
- Unit người dùng chọn được lưu trong input metadata để báo cáo đúng cách nhập.
- Không lưu cùng một đại lượng ở nhiều unit trong state.

### 2.4. JSONB có schema phiên bản

Các field JSONB phải có schema TypeScript/Zod tương ứng theo scenario release. JSONB không có nghĩa là payload tùy ý.

### 2.5. Guest và cloud dùng cùng domain semantics

Guest data trong IndexedDB dùng cùng domain state/action/event semantics nhưng một `PortableAttempt` riêng, không giả có `user_id` hoặc server timestamps. Import mapping luôn qua replay server.

---


## 3. Định danh và version

### 3.1. ID

- UUID cho profile, attempt, event và import receipt.
- Client có thể tạo `action_id` UUID trước khi gửi để bảo đảm idempotency.
- Guest attempt dùng UUID do browser tạo.

### 3.2. Scenario release

Mỗi attempt lưu:

| Field | Ví dụ | Ý nghĩa |
| --- | --- | --- |
| `scenario_key` | `copper-precipitation` | Loại thí nghiệm |
| `scenario_release_id` | `copper-precipitation@1.0.0` | Bundle bất biến gồm engine, scoring, state schema, content và evidence |
| `content_locale` | `vi` | Nội dung hiển thị lúc tạo báo cáo |

Release manifest trong repository resolve các version con. MVP không ghép hoặc migrate attempt giữa release và không dùng timestamp thay version khoa học.

---


## 4. Trạng thái vòng đời attempt

```text
in_progress
  |-- complete hợp lệ --> completed
  |-- reset -----------> stopped + new in_progress attempt
  |-- user dừng -------> stopped
  `-- delete ----------> removed

completed
  |-- branch ----------> new in_progress attempt
  `-- delete ----------> removed

stopped
  |-- branch ----------> new in_progress attempt
  `-- delete ----------> removed
```

### 4.1. Enum

```sql
create type attempt_status as enum (
  'in_progress',
  'completed',
  'stopped'
);
```

### 4.2. Bất biến trạng thái

- `completed_at` chỉ có khi completed.
- `final_report_snapshot` bắt buộc khi completed.
- `completed` và `stopped` không nhận action thường.
- Attempt bị xóa hard-delete cùng event trong transaction.
- `removed` trong sơ đồ là row không còn tồn tại, không phải giá trị enum.

---


## 5. Bảng profiles

### 5.1. Mục đích

Lưu dữ liệu ứng dụng tối thiểu nối với user trong hệ thống auth.

### 5.2. Schema logic

```sql
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Người học',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(display_name)) between 1 and 80)
);
```

### 5.3. Constraints

- Sign-up thu display name khi có; server provisioning idempotent tạo profile và dùng mặc định `Người học` nếu thiếu.
- `display_name` sau trim dài 1–80 ký tự; render phải escape.
- Không lưu role vì MVP chỉ có learner.
- Không lưu password, refresh token hoặc JWT.
- Email đọc từ auth identity, không duplicate nếu không có nhu cầu nghiệp vụ.

---


## 6. Bảng attempts

### 6.1. Mục đích

Lưu metadata, snapshot hiện tại và kết quả cuối của một lượt cloud.

### 6.2. Schema logic

```sql
create table attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  scenario_key text not null,
  scenario_release_id text not null,
  content_locale text not null default 'vi',

  status attempt_status not null default 'in_progress',
  revision integer not null default 0,
  last_sequence integer not null default 0,

  initial_state jsonb not null,
  current_state jsonb not null,
  current_projection jsonb not null,
  projection_version integer not null,

  parent_attempt_id uuid null references attempts(id) on delete set null,
  parent_sequence integer null,
  branch_origin_snapshot jsonb null,
  inherited_timeline_snapshot jsonb null,

  final_report_snapshot jsonb null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,

  check (revision >= 0),
  check (last_sequence >= 0),
  check (
    (status = 'completed' and completed_at is not null and final_report_snapshot is not null)
    or
    (status <> 'completed' and completed_at is null)
  )
);
```

### 6.3. Ý nghĩa field

| Field | Ý nghĩa |
| --- | --- |
| `revision` | optimistic concurrency token |
| `last_sequence` | sequence event cuối đã commit |
| `initial_state` | state bất biến lúc tạo lượt |
| `current_state` | state sau event cuối |
| `current_projection` | summary duy nhất cho dashboard/goal/resource, sinh từ current_state bởi projector versioned |
| `projection_version` | phiên bản projector tạo current_projection |
| `parent_attempt_id` | attempt gốc khi branch |
| `parent_sequence` | event sequence làm điểm branch |
| `branch_origin_snapshot` | origin state/release/citation bất biến để không phụ thuộc parent tồn tại |
| `inherited_timeline_snapshot` | prefix timeline cần cho report branch |
| `final_report_snapshot` | dữ liệu báo cáo bất biến |

### 6.4. Không lưu trong attempts

- Password/token.
- PDF binary.
- Toàn bộ source PDF.
- UI layout state không cần thiết cho resume.
- Transient form input chưa xác nhận.

### 6.5. Immutability constraints

- Controlled trigger/RPC chặn đổi `user_id`, `scenario_key` hoặc `scenario_release_id` sau khi tạo.
- Completed attempt không được update ngoài hard delete của owner qua server service.
- Branch RPC kiểm tra parent cùng owner/release và lưu origin snapshot trong cùng transaction.

---


## 7. Bảng attempt_events

### 7.1. Mục đích

Lưu mọi chuyển trạng thái được chấp nhận theo thứ tự.

### 7.2. Event kind

```sql
create type attempt_event_kind as enum (
  'domain_action',
  'undo_last',
  'lifecycle'
);
```

### 7.3. Schema logic

```sql
create table attempt_events (
  id uuid primary key,
  attempt_id uuid not null references attempts(id) on delete cascade,
  action_id uuid not null,
  request_fingerprint text not null,
  sequence integer not null,
  event_kind attempt_event_kind not null,
  action_type text not null,

  input_payload jsonb not null,
  normalized_input jsonb not null,
  result_payload jsonb not null,
  calculation_trace jsonb not null,
  observations jsonb not null,
  warnings jsonb not null,
  resource_delta jsonb not null,

  state_before_hash text not null,
  state_after jsonb not null,
  state_after_hash text not null,

  undo_of_sequence integer null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),

  unique (attempt_id, sequence),
  unique (attempt_id, action_id),
  check (sequence > 0),
  check (
    (event_kind = 'undo_last' and undo_of_sequence is not null)
    or
    (event_kind in ('domain_action', 'lifecycle') and undo_of_sequence is null)
  )
);
```

### 7.4. Vì sao lưu `state_after`

- Tiếp tục nhanh từ event bất kỳ khi tạo branch.
- Report có thể hiển thị trạng thái trung gian mà không replay toàn bộ.
- Phát hiện mismatch giữa current snapshot và event cuối.
- Số event của ba bài MVP đủ nhỏ để chấp nhận duplication.

### 7.5. Calculation trace

Mỗi trace item tối thiểu:

```json
{
  "equationKey": "copper.hydroxide.mass_balance",
  "inputs": {
    "copperMoles": 0.001574,
    "hydroxideMoles": 0.003148
  },
  "outputs": {
    "precipitatedCopperMoles": 0.001574
  },
  "sourceKeys": [
    "EPA-CUPROSOLVENCY",
    "CARBONATE-HYDROXIDE-2022"
  ]
}
```

Giá trị trên chỉ minh họa shape, không quyết định golden value.

### 7.6. Request fingerprint

`request_fingerprint` là SHA-256 của RFC 8785/JCS-canonical JSON gồm attempt ID, scenario release ID, action type, normalized parameters và canonical units. Hash dùng để so payload khi retry; nó không chứng minh payload khách đáng tin.

`state_before_hash` và `state_after_hash` dùng cùng JCS + SHA-256, cấm NaN/Infinity và chỉ là integrity/debug aid, không phải chữ ký bảo mật.

Lifecycle action types tối thiểu trong một attempt: `completed`, `stopped`, `stopped_by_reset`. Việc tạo branch được ghi bằng metadata/origin snapshot của attempt con; không append `branch_created` vào parent.

---


## 8. Bảng guest_imports

### 8.1. Mục đích

Đảm bảo một guest attempt không bị import lặp khi client retry.

### 8.2. Schema logic

```sql
create table guest_imports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_attempt_id uuid not null,
  imported_attempt_id uuid not null references attempts(id) on delete cascade,
  payload_hash text not null,
  imported_at timestamptz not null default now(),
  unique (user_id, guest_attempt_id)
);
```

### 8.3. Import rules

- Session xác định `user_id`; không nhận owner từ payload.
- Validate portable guest payload bằng exact release schema.
- Payload tối đa 4 MiB, 500 events và giới hạn độ sâu JSON. Mỗi scenario release phải đặt `maxAcceptedEvents <= 500`; acid release còn đặt `maxAdditionActions = 120`.
- Kiểm tra sequence liên tục từ 1.
- Chỉ nhận initial choices và action inputs; không tin client result, state, score hoặc hash.
- Replay bắt buộc toàn bộ chain bằng exact release trên server.
- Import trong transaction.
- Retry cùng guest ID và payload trả attempt đã import.
- Cùng guest ID nhưng payload khác trả conflict, không ghi đè.

---


## 9. Nội dung kịch bản không nằm trong bảng user data

Scenario/evidence được version theo release trong repository:

```text
src/content/releases/
  acid-neutralization@1.0.0/
    manifest.json
    scenario.json
    evidence.json
  copper-precipitation@1.0.0/
  plastic-separation@1.0.0/
```

Runtime registry phải giữ version cần để đọc attempt còn được hỗ trợ. Completed report có snapshot để vẫn đọc được ngay cả khi domain code cũ không còn chạy.

Manifest resolve state schema, engine implementation, scoring, projector, content locale bundle và evidence metadata. Evidence/content không dùng file global không version cho completed report.

---


## 10. Shape của state dùng chung

```ts
type AttemptStateEnvelope<TDomainState> = {
  scenarioKey: string
  scenarioReleaseId: string
  sequence: number
  phase: string
  domain: TDomainState
  resources: ResourceLedger
  measurements: MeasurementRecord[]
  goalStatus: GoalStatus
}
```

### 10.1. ResourceLedger

```ts
type ResourceLedger = {
  reagents: Record<string, { amount: number; unit: string }>
  waterLiters: number
  operationCount: number
  relativeCostIndex: number | null
  costConventionVersion: string | null
  safetyIndex: number | null
  safetyConventionVersion: string | null
  safetyPenalties: SafetyPenalty[]
  secondaryWaste: Record<string, { amount: number; unit: string }>
}
```

Field không áp dụng cho một bài vẫn có giá trị neutral/empty theo schema, tránh tự thêm field tùy ý.

### 10.1.1. Cost/safety conventions

- `relativeCostIndex` không phải tiền tệ hoặc giá thị trường.
- Convention `pedagogical-cost-1.0.0` dùng coefficients versioned trong experiment release.
- Với Acid/Copper, index 1,0 là cost proxy của route NaOH stoichiometric chuẩn. Với Plastic, index 1,0 là một bath nước 1 L. Chỉ so trong cùng scenario/release.
- `safetyIndex = clamp(100 - sum(committedSafetyPenaltyPoints), 0, 100)` theo `pedagogical-safety-1.0.0`.
- Rejected command không tạo penalty; inherent reagent hazards hiển thị bằng hazard profile riêng.
- Nếu model/run không evaluable, hai index có thể N/A; không dùng 0 thay N/A.

### 10.2. GoalStatus

```ts
type GoalStatus = {
  evaluable: boolean
  goalMet: boolean
  primaryCriteria: CriterionResult[]
  efficiencyCriteria: CriterionResult[]
  achievementPercent: number
}
```

`achievementPercent` là mức đạt mục tiêu, không phải probability.

---


## 11. State chuyên môn

Chi tiết field nằm trong từng experiment spec. Tất cả phải hỗ trợ:

- Parse theo version.
- Serialize JSON không mất precision có ý nghĩa.
- Hash canonical representation.
- Validate conservation invariant.
- Render report mà không cần UI state.

### 11.1. Acid Neutralization state nhóm

- Solution volume.
- Acid species/equivalents.
- Added neutralizers.
- Current equilibrium/pH result.
- Mixing/measurement status.
- Resource ledger.

### 11.2. Copper Precipitation state nhóm

- Liquid volume.
- Dissolved/solid Cu inventory.
- Reagent inventory.
- pH/equilibrium result.
- Suspension/settled/filtered fractions.
- Measurement status.

### 11.3. Plastic Separation state nhóm

- Named streams.
- Polymer mass per stream.
- Medium and density per stage.
- Selected float/sink output.
- Recovery/purity result.
- Resource ledger.

---


## 12. Server calculation và atomic commit RPC

TypeScript engine không chạy bên trong PostgreSQL transaction:

```text
Server:
  authenticate session
  read attempt + exact release
  validate action/preconditions
  run deterministic TypeScript engine
  build event/new state/projection/fingerprint

Server-only PostgreSQL RPC:
  BEGIN
    SELECT attempt FOR UPDATE
    CHECK owner, status, exact release
    CHECK existing action_id/fingerprint trước revision
    CHECK expected revision
    INSERT attempt_event(sequence = last_sequence + 1)
    UPDATE attempt:
      current_state
      current_projection
      last_sequence + 1
      revision + 1
      updated_at
  COMMIT
```

RPC không grant cho anon/authenticated và chỉ được gọi từ BFF với service credential. Vì service role bypass RLS, RPC/service kiểm tra explicit user ID lấy từ session đã xác thực.

### 12.1. Idempotency

- Sau ownership, kiểm tra `(attempt_id, action_id)` trước revision.
- Fingerprint giống: trả kết quả event cũ dù retry mang expected revision cũ.
- Fingerprint khác: trả idempotency conflict.
- Không tạo event thứ hai.

### 12.2. Failure

- Engine/validation fail: không insert/update.
- Database fail: rollback event và snapshot.
- Client timeout có thể retry cùng action ID.

---


## 13. Optimistic concurrency

Client gửi `expectedRevision`; server chạy engine, RPC kiểm tra lại revision dưới row lock.

```sql
select commit_attempt_action(
  :verified_user_id,
  :attempt_id,
  :expected_revision,
  :action_id,
  :request_fingerprint,
  :trusted_server_result
);
```

Nếu 0 row được update:

- Không append action.
- Trả error category `conflict`.
- Trả current revision/summary mới nhất.
- UI giữ draft input và yêu cầu refresh trước khi submit lại.

Không tự merge hai action chain.

---


## 14. Branch, undo cuối và reset

### 14.1. Branch

- Chọn parent attempt/event cùng owner và exact `scenario_release_id`.
- Copy `initial_state` của parent.
- Copy state after parent sequence làm `current_state` của attempt mới.
- New attempt bắt đầu revision 0, last_sequence 0.
- Lưu `branch_origin_snapshot` và `inherited_timeline_snapshot` bất biến để report không phụ thuộc parent còn tồn tại.
- Không copy event cũ vào attempt mới; report có thể hiển thị inherited prefix từ parent khi cần.

### 14.2. Undo cuối

- MVP chỉ undo action hiệu lực cuối cùng, được experiment đánh dấu reversible và trước filter/complete.
- Không delete event; append `undo_last`.
- `undo_of_sequence` trỏ action cuối được hoàn tác.
- `state_after` bằng state trước action đó.
- Không undo non-last, undo lần hai cùng action hoặc undo qua ranh giới irreversible.

### 14.3. Reset

- Append lifecycle event `stopped_by_reset`, mark attempt hiện tại `stopped` và tăng revision trong controlled mutation.
- Tạo attempt mới cùng exact release từ initial state mới.
- Không ghi đè attempt cũ.
- Người dùng có thể xóa attempt stopped bằng action riêng.

---


## 15. Complete và final report snapshot

Khi complete:

1. Kiểm tra các measurement/action bắt buộc.
2. Chạy final evaluation.
3. Tạo result summary.
4. Tạo score summary.
5. Tạo report snapshot gồm source/version/disclaimer.
6. Update status, completed_at và revision trong transaction.

### 15.1. Final report snapshot tối thiểu

```ts
type FinalReportSnapshot = {
  scenario: ReportScenarioRef
  reportSchemaVersion: number
  localizedExperimentTitle: string
  startedAt: string
  completedAt: string
  initialStateSummary: unknown
  timeline: ReportTimelineItem[]
  finalStateSummary: unknown
  goalStatus: GoalStatus
  scoreSummary: ScoreSummary
  charts: ReportChartData[]
  observations: ReportObservation[]
  warnings: ReportWarning[]
  explanations: ExplanationBlock[]
  originalInputsAndUnits: ReportInputRecord[]
  resolvedCitations: ResolvedCitation[]
  assumptions: string[]
  limitations: string[]
  disclaimerText: string
  generatedAt: string
}
```

Snapshot chứa data, không chứa HTML.

### 15.2. Report support types

```ts
type ReportValue =
  | { kind: 'number'; value: number; unit: string; displayPrecision: number }
  | { kind: 'text'; value: string }
  | { kind: 'not-applicable'; reasonCode: string }

type ReportScenarioRef = {
  key: 'acid-neutralization' | 'copper-precipitation' | 'plastic-separation'
  releaseId: string
}

type ReportObservation = {
  code: string
  title: string
  detail: string
  data: Record<string, ReportValue>
}

type ReportWarning = {
  code: string
  severity: 'info' | 'warning' | 'blocking'
  message: string
  data: Record<string, ReportValue>
}

type ReportTimelineItem = {
  sequence: number
  eventKind: 'domain_action' | 'undo_last' | 'lifecycle'
  actionType: string
  occurredAt: string
  titleKey: string
  inputs: ReportInputRecord[]
  results: Array<{ key: string; value: ReportValue }>
  observationCodes: string[]
  warningCodes: string[]
}

type ReportInputRecord = {
  key: string
  canonicalValue: number | string | boolean
  canonicalUnit: string | null
  originalValue: number | string | boolean
  originalUnit: string | null
}

type ScoreSummary = {
  evaluable: boolean
  total: number | null
  maximum: number
  achievementPercent: number | null
  components: Array<{
    key: string
    score: number | null
    maximum: number
    status: 'met' | 'not-met' | 'not-applicable'
    reasonCode?: string
  }>
}

type ReportChartData = {
  key: string
  chartType: 'line' | 'bar' | 'stream-composition'
  xUnit: string | null
  yUnit: string | null
  series: Array<{
    key: string
    points: Array<{ x: number | string; y: number }>
  }>
}

type ExplanationBlock = {
  key: string
  level: 'basic' | 'technical'
  title: string
  body: string
  equationKeys: string[]
  sourceKeys: string[]
}

type ResolvedCitation = {
  sourceKey: string
  title: string
  authorsOrOrganization: string
  year: number | null
  url: string
  locations: string[]
  conditions: string[]
  limitations: string[]
  evidenceVersion: string
}
```

`not-applicable` là union case, không dùng `0`, chuỗi rỗng hoặc NaN để thay N/A. Guest/cloud report projection cùng `reportSchemaVersion` và các type trên.

---


## 16. Guest store

### 16.1. IndexedDB stores

```text
guest_attempts
guest_attempt_events
guest_metadata
```

### 16.2. Guest metadata

- Schema version của local database.
- App/content version gần nhất.
- Import status.

Guest attempt lưu local `final_report_snapshot` khi complete. Report UI nhận `AttemptRepository`, vì vậy guest và cloud dùng cùng projection/print CSS.

Portable guest event phân biệt `occurredAt` do browser ghi với `recordedAt` do server ghi khi import. Server chỉ giữ occurred time khi hợp lệ, monotonic và nằm trong giới hạn hợp lý; nó không dùng client time để quyết định ownership hoặc ordering.

### 16.3. Quota/storage failure

- Không tự xóa active attempt.
- Hiển thị cảnh báo rõ.
- Cho phép xóa lượt cũ hoặc đăng nhập để import.
- Không tuyên bố đã lưu khi write IndexedDB fail.

Không đặt số lượt khách cố định trong scope; giới hạn thực tế phụ thuộc browser quota và UI phải xử lý failure.

---


## 17. RLS và grants

### 17.1. Profiles

```sql
using (auth.uid() is not null and auth.uid() = user_id)
```

Đây là SELECT policy cho browser. Profile mutation đi qua server.

### 17.2. Attempts — read policy

Select:

```sql
using (auth.uid() is not null and auth.uid() = user_id)
```

Browser role không có INSERT/UPDATE/DELETE trực tiếp. Controlled server service thực hiện mutation sau explicit ownership checks.

### 17.3. Attempt events — read policy

Policy dùng `exists` trên parent attempt:

```sql
using (
  exists (
    select 1 from attempts a
    where a.id = attempt_events.attempt_id
      and a.user_id = auth.uid()
  )
)
```

Không grant client insert/update/delete event. Mutation event chỉ qua server-only RPC.

### 17.4. Guest imports

- RLS bật.
- Không grant anon/authenticated.
- Chỉ server service đọc/ghi.

### 17.5. Grants

- `anon`: không có quyền trên user attempt tables.
- `authenticated`: SELECT own rows cần thiết; không trusted write grants.
- `service_role`: server only.

Tài liệu Supabase nhấn mạnh grants và RLS là hai lớp riêng: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

---


## 18. Indexes

Tối thiểu:

```sql
create index attempts_user_updated_idx
  on attempts (user_id, updated_at desc);

create index attempts_user_scenario_status_idx
  on attempts (user_id, scenario_key, status);

create index attempt_events_attempt_sequence_idx
  on attempt_events (attempt_id, sequence);

create index attempts_parent_idx
  on attempts (parent_attempt_id)
  where parent_attempt_id is not null;
```

Không index mọi JSONB field. Chỉ thêm expression index khi query thật được xác định.

---


## 19. Query/use case chính

### 19.1. Phòng lab của tôi

Đọc attempt summary theo user, order updated desc, phân trang. Không tải current_state/event payload đầy đủ.

### 19.2. Resume

Đọc attempt metadata + current_state + revision. Event history có thể tải riêng.

### 19.3. Report

Đọc completed attempt final snapshot. Không chạy lại engine theo mặc định.

### 19.4. Compare

Chỉ đọc hai completed attempts cùng exact release của cùng user. Dùng final report snapshot/metric projection; timeline detail tải khi mở rộng.

### 19.5. Branch

Đọc state_after của parent event và exact release; tạo attempt mới cùng origin/inherited snapshots trong transaction.

---


## 20. Retention và xóa

- Attempt cloud được giữ đến khi người dùng xóa hoặc tài khoản bị xóa theo vận hành hệ thống.
- Xóa attempt là hard delete cùng event và import reference liên quan qua cascade/transaction.
- UI yêu cầu xác nhận.
- Không có recycle bin trong MVP.
- Guest data được giữ đến khi browser xóa storage hoặc người dùng xóa trong app.
- Không tự động công khai hoặc chia sẻ data.
- Backup/log retention là chính sách vận hành riêng; UI không hứa xóa tức thì khỏi mọi backup nếu hạ tầng chưa bảo đảm điều đó.

---


## 21. Data migration

### 21.1. Database migration

- Mọi thay đổi schema bằng migration versioned.
- Migration có thể rollback hoặc có hướng phục hồi dữ liệu.
- Không sửa production schema thủ công mà không ghi migration.

### 21.2. Scenario release

- MVP không migrate in-progress attempt qua release.
- Exact release phải còn trong runtime registry để resume/import.
- Nếu release không còn chạy được, khóa resume có giải thích; completed report snapshot vẫn đọc được.

### 21.3. Guest store migration

- IndexedDB schema upgrade rõ version.
- Không xóa attempt đang làm nếu migration fail.
- Cho phép export/import vào account khi version còn được server hỗ trợ.

---


## 22. Invariants bắt buộc

1. `last_sequence` bằng sequence event cuối hoặc 0 khi chưa có event.
2. `current_state` bằng `state_after` của event cuối.
3. Revision tăng đúng một lần cho mỗi mutation domain/lifecycle thành công.
4. Action ID không lặp trong một attempt.
5. Event sequence liên tục, không trùng.
6. Completed attempt có final snapshot và completed_at.
7. Event thuộc cùng scenario release với attempt.
8. User không thể đổi owner của attempt.
9. Parent branch dùng cùng exact release và origin snapshot bất biến.
10. Report snapshot giữ resolved citations, exact release và full disclaimer.
11. `current_projection` được sinh bởi projector versioned từ `current_state` trong cùng commit.
12. Domain mass/conservation invariant đạt tolerance của experiment spec.
13. User A không đọc/ghi/xóa data của user B.

---


## 23. Ví dụ event chain

```text
Attempt copper-precipitation@1.0.0
revision 0, sequence 0

Event 1: measure_initial
  state_after: measured initial pH/Cu
  revision -> 1

Event 2: add_precipitant
  input: NaOH, concentration, volume
  state_after: reagent inventory + equilibrium result
  revision -> 2

Event 3: mix
  state_after: suspension mixed
  revision -> 3

Event 4: settle
  state_after: settled fractions
  revision -> 4

Event 5: filter
  state_after: filtrate + retained solid
  revision -> 5

Complete
  lifecycle event appended
  final_report_snapshot stored
  revision -> 6
```

Không dùng các giá trị demo UI làm golden chemistry data.

---


## 24. Tiêu chí nghiệm thu dữ liệu

- Transaction không để event và snapshot lệch nhau.
- Retry cùng action ID không tạo event trùng.
- Revision cũ tạo conflict, không ghi dữ liệu.
- Guest import retry là idempotent.
- Guest import payload bị sửa trả conflict/validation error.
- Branch state đúng với parent event.
- Undo append event, không xóa lịch sử.
- Reset tạo attempt mới và giữ attempt stopped.
- Completed report không thay đổi khi engine mới được deploy.
- RLS isolation tests chặn cross-user access.
- Browser direct insert/update fake state/score/report bị chặn.
- Guest report render được từ local final snapshot.
- Guest import bắt buộc replay và không tin result/state do client gửi.
- Hard delete xóa event liên quan.
- Mobile/desktop resume cùng current snapshot.
- Exact release rule khóa cross-release resume/compare.

---


## 25. Tài liệu liên quan

- [System Architecture](system-architecture.md)
- [Web Application Scope](web-application-scope.md)
- [Verification and Acceptance](verification-and-acceptance.md)
- [Acid Neutralization Specification](experiments/acid-neutralization-spec.md)
- [Copper Precipitation Specification](experiments/copper-precipitation-spec.md)
- [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md)
