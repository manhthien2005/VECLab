# KIẾN TRÚC HỆ THỐNG

## Nền tảng mô phỏng quy trình hóa học có căn cứ khoa học

**Trạng thái:** Kiến trúc mục tiêu cho phạm vi đã duyệt<br>
**Ngày:** 27/08/2026<br>
**Phạm vi:** Ứng dụng web, simulation core, xác thực, dữ liệu, đồng bộ, báo cáo và nội dung khoa học

> Tài liệu này triển khai các ranh giới kỹ thuật từ [Core Project Scope](core-project-scope.md) và [Web Application Scope](web-application-scope.md). Nó không thay đổi phạm vi sản phẩm hoặc nội dung khoa học đã được chốt.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Chuyển hai tài liệu scope thành ranh giới kỹ thuật có thể triển khai. |
| 👥 **Dành cho** | Technical lead, frontend, backend và người xây simulation engine. |
| ✅ **Sau khi đọc** | Hiểu kiến trúc monolith theo mô-đun, luồng action và quyền sở hữu từng lớp. |
| ⚠️ **Lưu ý** | Experiment spec mới là nguồn quyết định công thức và hằng số của từng bài. |

## Đọc tài liệu này khi nào?

- Trước khi khởi tạo codebase hoặc thêm một module mới.
- Khi cần xác định logic thuộc UI, application service, domain hay persistence.
- Khi thiết kế mutation, guest import, report hoặc authorization.

## Các quyết định chính

- Dùng một web monolith Next.js/TypeScript với module boundaries rõ, không microservice.
- Domain engine là hàm thuần, xác định và không phụ thuộc React/database.
- Máy chủ xác nhận kết quả cloud và commit event/snapshot qua RPC nguyên tử.
- Guest chạy cùng domain package trong trình duyệt và lưu IndexedDB.
- Scenario release khóa đồng thời engine, scoring, state, content và evidence.

## Mục lục

<!-- TOC:START -->
- [1. Mục tiêu kiến trúc](#1-mục-tiêu-kiến-trúc)
- [2. Các quyết định kiến trúc chính](#2-các-quyết-định-kiến-trúc-chính)
- [3. Công nghệ mục tiêu](#3-công-nghệ-mục-tiêu)
- [4. Cấu trúc code mục tiêu](#4-cấu-trúc-code-mục-tiêu)
- [5. Hợp đồng dùng chung của simulation engine](#5-hợp-đồng-dùng-chung-của-simulation-engine)
- [6. Process Core](#6-process-core)
- [7. Ba domain module](#7-ba-domain-module)
- [8. Application services](#8-application-services)
- [9. Luồng thực hiện thao tác cho tài khoản](#9-luồng-thực-hiện-thao-tác-cho-tài-khoản)
- [10. Luồng chế độ khách](#10-luồng-chế-độ-khách)
- [11. Auth và authorization](#11-auth-và-authorization)
- [12. Versioning và reproducibility](#12-versioning-và-reproducibility)
- [13. Error model](#13-error-model)
- [14. Báo cáo và print](#14-báo-cáo-và-print)
- [15. Observability tối thiểu](#15-observability-tối-thiểu)
- [16. Yêu cầu hiệu năng và giới hạn](#16-yêu-cầu-hiệu-năng-và-giới-hạn)
- [17. Security boundaries](#17-security-boundaries)
- [18. Những lựa chọn bị loại](#18-những-lựa-chọn-bị-loại)
- [19. Tiêu chí nghiệm thu kiến trúc](#19-tiêu-chí-nghiệm-thu-kiến-trúc)
- [20. Tài liệu liên quan](#20-tài-liệu-liên-quan)
<!-- TOC:END -->

---


## 1. Mục tiêu kiến trúc

Kiến trúc phải đạt được các mục tiêu sau:

- Một codebase có thể hoàn thành và vận hành bởi một đội trong khoảng 2 tháng.
- Một Process Core dùng chung cho cả ba thí nghiệm.
- Các mô-đun hóa học hoặc vật liệu độc lập với giao diện.
- Kết quả xác định: cùng scenario release, trạng thái và thao tác phải cho cùng kết quả.
- Chế độ khách hoạt động đầy đủ mà không tạo dữ liệu tài khoản trên máy chủ.
- Tài khoản người học tự lưu và tiếp tục được trên thiết bị khác.
- Lượt cũ giữ nguyên phiên bản mô hình và báo cáo đã sử dụng.
- Người dùng chỉ truy cập được dữ liệu thuộc tài khoản của mình.
- Desktop và mobile sử dụng cùng API và cùng engine.
- Không cần microservice, message queue hoặc hạ tầng điều phối phức tạp.

---


## 2. Các quyết định kiến trúc chính

### 2.1. Kiến trúc monolith theo mô-đun

Sử dụng một ứng dụng web full-stack với các mô-đun nội bộ rõ ràng:

```text
Trình duyệt
  |-- Trang công khai
  |-- Xác thực
  |-- Phòng lab của tôi
  |-- Simulation Workbench
  |-- Báo cáo và so sánh
  `-- Guest Store
          |
          v
Web Application / Backend for Frontend
  |-- Auth & Session
  |-- Attempt Service
  |-- Simulation API
  |-- Report Service
  `-- Evidence Service
          |
          +------------------------+
          |                        |
          v                        v
Simulation Domain             PostgreSQL + Auth
  |-- Process Core              |-- Profiles
  |-- Acid Neutralization       |-- Attempts
  |-- Copper Precipitation      `-- Attempt Events
  |-- Plastic Separation
  |-- Evaluation
  `-- Explanation
          |
          v
Versioned Scenario & Evidence Content
```

Đây là một hệ thống triển khai duy nhất, không phải microservice. Ranh giới mô-đun được giữ trong code, interface và test.

### 2.2. Engine chuyên môn không phụ thuộc UI

Mọi phép tính quan trọng phải nằm trong các hàm TypeScript thuần:

- Không đọc DOM.
- Không gọi database.
- Không phụ thuộc framework UI.
- Không dùng thời gian hệ thống hoặc số ngẫu nhiên để quyết định kết quả.
- Nhận input có kiểu rõ và trả output có kiểu rõ.
- Có thể chạy trong unit test mà không khởi động web.

### 2.3. Máy chủ là nơi xác nhận kết quả cho tài khoản

- Client có thể kiểm tra form và hiển thị preview không mang tính cam kết.
- Khi người dùng xác nhận thao tác cloud, máy chủ chạy engine TypeScript với đúng scenario release.
- Engine chạy **trước** transaction database; kết quả chưa được xem là đã lưu.
- Máy chủ gọi một PostgreSQL RPC chỉ dành cho server để khóa row, kiểm tra lại quyền sở hữu, status, release, idempotency và revision, rồi insert event/update snapshot nguyên tử.
- Nếu revision đã thay đổi trong lúc engine tính, RPC bỏ kết quả và trả conflict.
- Client chỉ hiển thị “đã lưu” sau khi nhận xác nhận.

Browser role không được INSERT/UPDATE trusted result trực tiếp vào `attempts` hoặc `attempt_events`.

Chế độ khách chạy **cùng domain package được bundle trong browser** và lưu vào IndexedDB. Không xây public simulation endpoint thứ hai cho guest trong MVP. Khi import, server bắt buộc replay action inputs bằng release tương ứng; không tin state/result/score do browser gửi.

### 2.4. Scenario release được phiên bản hóa trong repository

Vì không có CMS trong scope:

- Cấu hình kịch bản nằm trong thư mục nội dung của codebase.
- Mỗi bản phát hành có một `scenario_release_id` bất biến, ví dụ `copper-precipitation@1.0.0`.
- Release manifest khóa đồng thời scenario state/actions, engine, scoring, state schema, content, locale bundle và evidence version.
- Attempt lưu `scenario_release_id`; không ghép tùy ý các version con.
- Không sửa nội dung của phiên bản đã phát hành; tạo phiên bản mới.
- MVP không migrate attempt giữa hai release. Attempt đang làm chỉ resume khi exact release còn trong runtime registry.

### 2.5. Event log cộng snapshot hiện tại

Mỗi lượt lưu:

- Event log để giải thích và phát lại.
- Current snapshot để tiếp tục nhanh.
- Final report snapshot khi hoàn thành.

Không chỉ lưu kết quả cuối, vì sản phẩm cần timeline, hoàn tác, tạo nhánh và so sánh quy trình.

---


## 3. Công nghệ mục tiêu

### 3.1. Ứng dụng web

- **Next.js App Router + React + TypeScript.**
- Server Components cho trang đọc dữ liệu và nội dung công khai.
- Client Components cho Simulation Workbench, form tương tác và guest storage.
- Route Handlers hoặc Server Functions cho mutation và API nội bộ.
- CSS responsive theo design system nhẹ; có thể dùng Tailwind CSS để thống nhất utility.

Next.js App Router hỗ trợ route theo file, Server/Client Components và Route Handlers trong cùng ứng dụng: [Next.js App Router](https://nextjs.org/docs/app), [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

### 3.2. Xác thực và database

- **Supabase Auth** cho email, mật khẩu, xác minh email và khôi phục tài khoản.
- **Supabase PostgreSQL** cho profiles, attempts và attempt events.
- **Row Level Security** kết hợp grants tối thiểu để bảo vệ dữ liệu theo chủ sở hữu.
- Session cookie dành cho rendering phía server; chọn package Supabase chính thức phù hợp với Next.js tại thời điểm khởi tạo.

Supabase Auth tích hợp JWT với PostgreSQL và RLS: [Supabase Auth](https://supabase.com/docs/guides/auth). Tài liệu RLS yêu cầu bật RLS và thiết lập cả grants lẫn policies trên bảng được expose: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Với session cookie trong framework SSR, hướng dẫn hiện hành định tuyến qua `@supabase/ssr`: [Which package to use](https://supabase.com/docs/guides/auth/choosing-a-server-package).

### 3.3. Validation

- Schema TypeScript dùng chung cho request, scenario config và persisted JSON.
- Zod hoặc thư viện schema tương đương được khóa phiên bản tại thời điểm khởi tạo.
- Validation chạy ở server cho mọi mutation.
- Client validation chỉ để phản hồi nhanh, không thay server validation.

### 3.4. Kiểm thử

- **Vitest** cho domain engine, scoring, validation và service thuần.
- **Playwright** cho luồng guest, auth, resume, report, compare và responsive.
- TypeScript compiler chạy riêng vì Vitest transform TypeScript nhưng không thay type-check: [Vitest Writing Tests](https://vitest.dev/guide/learn/writing-tests).
- Playwright dùng browser context cô lập và assertion theo hành vi người dùng: [Playwright Writing Tests](https://playwright.dev/docs/writing-tests), [Best Practices](https://playwright.dev/docs/best-practices).

### 3.5. Triển khai

- **Vercel** cho Next.js.
- **Supabase** cho Auth và PostgreSQL.
- Môi trường local, preview và production.
- Không chạy server riêng liên tục trong phạm vi này.

Vercel cung cấp quy trình triển khai trực tiếp cho Next.js và preview URL khi tích hợp Git: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

### 3.6. Quy tắc phiên bản dependency

- Không hard-code số phiên bản thư viện trong tài liệu kiến trúc.
- Tại thời điểm khởi tạo, chọn bản stable được tài liệu chính thức hỗ trợ.
- Lockfile là nguồn quyết định phiên bản thực tế.
- Không tự động nâng major version trong thời gian phát triển nếu không có quyết định riêng.

---


## 4. Cấu trúc code mục tiêu

Tên thư mục có thể điều chỉnh theo convention của framework, nhưng trách nhiệm phải giữ như sau:

```text
src/
  app/
    (public)/
      page.tsx
      experiments/
      evidence/
    (auth)/
      sign-in/
      sign-up/
      verify/
      forgot-password/
      reset-password/
    (learner)/
      lab/
      compare/
      account/
    simulate/[scenarioKey]/
    attempts/[attemptId]/
    reports/[attemptId]/
    api/
      simulation/
      attempts/
      guest-import/
  features/
    auth/
    experiment-catalog/
    simulation-workbench/
    learner-lab/
    reports/
    comparison/
    evidence/
  domain/
    process/
    experiments/
      acid-neutralization/
      copper-precipitation/
      plastic-separation/
    evaluation/
    explanation/
    units/
  application/
    attempts/
    simulation/
    reports/
    guest-import/
  infrastructure/
    supabase/
    persistence/
    logging/
  content/
    scenarios/
    evidence/
  shared/
    schemas/
    errors/
    ui/
tests/
  e2e/
  fixtures/
```

### 4.1. Nguyên tắc tổ chức

- Domain không import từ app, React hoặc Supabase.
- Application gọi domain và persistence qua interface.
- Infrastructure triển khai interface persistence/auth.
- Feature UI không tự tính công thức hóa học.
- Scenario content không chứa executable JavaScript tùy ý.
- Một mô-đun thí nghiệm sở hữu state, actions, engine adapter và tests của chính nó.

---


## 5. Hợp đồng dùng chung của simulation engine

Các tên dưới đây là hợp đồng khái niệm; implementation có thể dùng type tương đương nhưng không được làm mất thông tin.

```ts
type UUID = string & { readonly __brand: 'UUID' }

type ScenarioRef = {
  key: 'acid-neutralization' | 'copper-precipitation' | 'plastic-separation'
  releaseId: string
}

type SimulationAction = {
  actionId: UUID
  actionType: string
  parameters: Record<string, number | string | boolean>
  unitSelections: Record<string, string>
}

type SimulationContext<State> = {
  scenario: ScenarioRef
  state: State
  sequence: number
}

type CalculationTrace = {
  equationKey: string
  inputs: Record<string, number | string>
  outputs: Record<string, number | string>
  sourceKeys: string[]
}

type SimulationResult<State> = {
  nextState: State
  observations: Observation[]
  calculationTrace: CalculationTrace[]
  warnings: DomainWarning[]
  resourceDelta: ResourceDelta
}
```

### 5.1. Quy tắc engine

- Action ID do client tạo để request retry không tạo hai event.
- `requestFingerprint` là SHA-256 của RFC 8785/JCS-canonical payload gồm `attemptId`, `scenarioReleaseId`, `actionType`, `normalizedParameters` và `canonicalUnits`.
- Action type phải nằm trong scenario definition.
- Mọi số phải ở canonical unit khi vào domain engine.
- Engine không làm tròn dữ liệu nội bộ để hiển thị.
- Lớp presentation chịu trách nhiệm format và làm tròn.
- Calculation trace chỉ chứa dữ liệu đủ để giải thích, không chứa bí mật hoặc token.
- Error chuyên môn dùng mã ổn định, không dùng text làm logic.

### 5.2. Kiểu dùng chung tối thiểu

```ts
type Observation = {
  code: string
  titleKey: string
  detailKey: string
  data: Record<string, number | string>
}

type DomainWarning = {
  code: string
  severity: 'info' | 'warning' | 'blocking'
  messageKey: string
  data: Record<string, number | string>
}

type ResourceDelta = {
  reagents: Record<string, { amount: number; unit: string }>
  waterLiters: number
  operationCount: number
  relativeCostIndexDelta: number | null
  safetyPenalties: Array<{ code: string; points: number }>
  secondaryWaste: Record<string, { amount: number; unit: string }>
}

type CriterionResult = {
  key: string
  evaluable: boolean
  met: boolean
  actual: number | string | null
  target: number | string
  unit: string | null
}
```

Report timeline, score, chart, citation và attempt persistence types được định nghĩa chuẩn tại [Data and State Model](data-and-state-model.md); UI không tự tạo shape khác.

---


## 6. Process Core

Process Core sở hữu vòng đời dùng chung:

```text
validateAction
→ checkPreconditions
→ runDomainModel
→ applyStateTransition
→ evaluateObservations
→ updateResourceLedger
→ appendEvent
→ evaluateGoalStatus
```

### 6.1. Trách nhiệm

- Xác định thao tác nào được phép ở trạng thái hiện tại.
- Gọi đúng domain module.
- Tạo state mới bất biến.
- Ghi calculation trace, warnings và observations.
- Cập nhật timeline và resource ledger.
- Kiểm tra điều kiện kết thúc.
- Hỗ trợ replay.
- Hỗ trợ tạo nhánh từ một sequence hợp lệ.

### 6.2. Không thuộc Process Core

- Công thức pH cụ thể.
- Ksp và mô hình kết tủa cụ thể.
- Density classification cụ thể.
- HTML hoặc component UI.
- Database query.
- Auth session.

---


## 7. Ba domain module

### 7.1. Acid Neutralization

Sở hữu:

- State dung dịch axit.
- Reagent inventory đã cho phép.
- Acid/base equivalent và equilibrium cần thiết.
- pH calculation.
- Quan sát và cảnh báo chuyên môn.

Nguồn quyết định chi tiết: [Acid Neutralization Specification](experiments/acid-neutralization-spec.md).

### 7.2. Copper Precipitation

Sở hữu:

- Cu inventory theo pha.
- pH và precipitant inventory.
- Hydroxide/carbonate route đã duyệt.
- Trạng thái mixing, settling, filtration và measurement.
- Mass balance Cu và solid estimate.

Nguồn quyết định chi tiết: [Copper Precipitation Specification](experiments/copper-precipitation-spec.md).

### 7.3. Plastic Separation

Sở hữu:

- Material streams.
- Polymer composition và density metadata.
- Separation medium.
- Float/sink partition.
- Purity, recovery và mass balance.

Nguồn quyết định chi tiết: [Plastic Separation Specification](experiments/plastic-density-separation-spec.md).

---


## 8. Application services

### 8.1. Attempt Service

Trách nhiệm:

- Tạo lượt mới.
- Đọc lượt thuộc người dùng.
- Thực hiện action với expected revision qua server-only commit RPC.
- Kiểm tra existing `(attempt_id, action_id)` trước revision để retry response-lost trả event cũ.
- Lưu event và current snapshot nguyên tử sau khi RPC kiểm tra lại row lock/revision.
- Kết thúc hoặc dừng lượt.
- Tạo nhánh.
- Xóa lượt thuộc người dùng.

### 8.2. Simulation Service

- Tải đúng scenario release.
- Parse state theo schema đúng phiên bản.
- Normalize unit.
- Chạy Process Core.
- Trả domain result hoặc typed error.

### 8.3. Guest Import Service

- Validate portable guest payload bằng schema và size/event limits.
- Kiểm tra exact scenario release còn được hỗ trợ.
- Không tin owner ID từ client.
- Chỉ nhận initial choices và action inputs làm dữ liệu có thể replay; không tin client state/result/score/hash.
- Replay bắt buộc toàn bộ action chain bằng exact release trên server.
- Tạo attempt mới thuộc session đã xác thực từ kết quả server.
- Giữ original guest ID trong metadata audit không nhạy cảm nếu cần chống import lặp.
- Trả mapping ID mới cho client.

### 8.4. Report Service

- Dùng một `AttemptRepository` abstraction.
- Cloud repository đọc completed attempt từ database; guest repository đọc local completed attempt/final snapshot từ IndexedDB.
- Completed report luôn dùng final report snapshot; không recompute/ghi đè trong MVP.
- Tạo cùng view model và print CSS cho guest/cloud.

### 8.5. Comparison Service

- Chỉ nhận hai completed cloud attempts của cùng user.
- Yêu cầu cùng exact `scenario_release_id` và metric schema.
- Chuẩn hóa metric cùng unit.
- Không so sánh số liệu không cùng ý nghĩa.

---


## 9. Luồng thực hiện thao tác cho tài khoản

```text
Client gửi:
  attemptId
  expectedRevision
  actionId
  actionType
  parameters + units
        |
        v
Server xác thực session, Origin/CSRF boundary và ownership
        |
        v
Load attempt + exact scenario release
        |
        v
Check existing action_id/fingerprint; validate state, input và preconditions
        |
        v
Run deterministic TypeScript engine ngoài DB transaction
        |
        v
Call server-only PostgreSQL RPC:
  lock attempt row
  re-check owner/status/release
  check existing action_id trước revision
  compare expected revision
  insert attempt_event
  update current_state
  increment revision
  update score/status
        |
        v
Return saved result + new revision
```

Nếu action ID đã tồn tại cùng fingerprint, trả event cũ dù expected revision đã cũ. Nếu action mới có revision cũ, không lưu; trả conflict cùng revision mới nhất.

---


## 10. Luồng chế độ khách

```text
Scenario content đã tải
→ Tạo guest attempt với local UUID
→ Chạy exact release engine trong browser
→ Append event vào local store
→ Update local snapshot
→ Hiển thị trạng thái "Lưu trên thiết bị này"
```

### 10.1. Guest storage adapter

Guest store phải triển khai cùng interface logic với cloud persistence:

```ts
interface AttemptRepository {
  getAttempt(id: string): Promise<Attempt>
  createAttempt(input: CreateAttemptInput): Promise<Attempt>
  appendAction(input: AppendActionInput): Promise<AppendActionResult>
  listAttempts(filter: AttemptFilter): Promise<AttemptSummary[]>
  deleteAttempt(id: string): Promise<void>
}
```

Browser adapter có thể dùng IndexedDB để lưu structured data và nhiều event ổn định hơn localStorage. localStorage chỉ nên giữ cờ nhỏ hoặc fallback, không giữ toàn bộ history dài.

Guest complete tạo `final_report_snapshot` cục bộ và render cùng report UI. Route `/attempts` và `/reports` là shell dùng storage mode; tên route group không được dùng như auth guard.

---


## 11. Auth và authorization

### 11.1. Auth flow

- Sign up bằng email/mật khẩu.
- Email verification.
- Sign in/out.
- Password reset.
- Server xác minh session trước mọi mutation.

### 11.2. Quy tắc cache

- Không cache response chứa session refresh hoặc dữ liệu riêng như nội dung công khai.
- Authenticated route dùng dynamic rendering hoặc cấu hình no-store phù hợp.
- Không dùng ISR cho route xử lý auth/session refresh.

Supabase cảnh báo không cache response có `Set-Cookie` của session refresh và mô tả cấu hình cho SSR: [Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

### 11.3. RLS defense in depth

- RLS bật trên profiles, attempts và attempt_events.
- Browser role chỉ có SELECT cần thiết trên dữ liệu own; không có direct INSERT/UPDATE trusted state/event/report.
- Create/action/complete/reset/branch/import/delete đi qua BFF/server-only RPC.
- Policy profiles dùng `auth.uid() = user_id`.
- Policy attempts dùng `auth.uid() = user_id`.
- Policy events kiểm tra ownership thông qua attempt.
- `guest_imports` không có grant cho anon/authenticated.
- Service role key chỉ ở server và không gửi client.

---


## 12. Versioning và reproducibility

Mỗi attempt lưu tối thiểu `scenario_key`, `scenario_release_id` và `content_locale`. Release registry resolve engine/scoring/state/content/evidence bundle.

### 12.1. Quy tắc version

- Scenario release thay khi state schema, action, formula, source, scoring, content hoặc goal thay đổi có thể ảnh hưởng replay/report.
- Completed attempt lưu final report snapshot.
- MVP không state-migrate in-progress attempt qua release; giữ release cũ để resume hoặc khóa resume có giải thích.
- Không sửa/recompute completed history bằng release mới.

---


## 13. Error model

Error phải có lớp rõ:

| Nhóm | Ví dụ | Hành vi |
| --- | --- | --- |
| Validation | sai unit, ngoài range | không chạy engine |
| Preconditions | lọc trước khi có solid | giải thích thao tác chưa hợp lệ |
| Domain | solver không hội tụ | không tạo state mới |
| Conflict | expected revision cũ | tải state mới nhất |
| Auth | session hết hạn | yêu cầu đăng nhập lại |
| Persistence | transaction thất bại | giữ UI state, đánh dấu chưa lưu |
| Content | scenario release thiếu | khóa mutation, vẫn cho đọc lịch sử nếu có snapshot |

### 13.1. Typed error contract

```ts
type AppError = {
  code: string
  category: 'validation' | 'precondition' | 'domain' | 'conflict' | 'auth' | 'persistence' | 'content'
  userMessageKey: string
  fieldErrors?: Record<string, string>
  retryable: boolean
  correlationId?: string
}
```

Không trả stack trace, SQL error hoặc secret cho client.

---


## 14. Báo cáo và print

- Report page đọc final snapshot.
- Print stylesheet ẩn navigation, edit button và control không liên quan.
- Print giữ title, scenario release, timeline, kết quả, unit, warning, source và disclaimer.
- Không tạo PDF server-side.
- Không lưu binary PDF vào database.

---


## 15. Observability tối thiểu

Ghi log có cấu trúc cho:

- Request ID/correlation ID.
- Scenario key/version.
- Action type.
- Error code/category.
- Attempt ID đã băm hoặc ID nội bộ phù hợp.
- Duration của simulation.

Không ghi:

- Mật khẩu.
- Token/JWT.
- Toàn bộ request auth.
- Email trong log domain calculation.

Metrics tối thiểu:

- Simulation success/error count theo scenario release.
- Save conflict count.
- Persistence failure count.
- Domain solver failure count.

Không xây analytics học tập nâng cao.

---


## 16. Yêu cầu hiệu năng và giới hạn

- Một action của kịch bản MVP phải tính đồng bộ trong thời gian đủ cho phản hồi tương tác; không cần job queue.
- Không thực hiện Monte Carlo hoặc tối ưu hóa dài trong request.
- Scenario content nhỏ được cache theo version.
- Attempt list phân trang khi dữ liệu tăng.
- Event list chỉ tải đầy đủ khi mở attempt/report; dashboard dùng summary.
- Không tải toàn bộ source PDF vào bundle.

Ngưỡng nghiệm thu chi tiết nằm tại [Verification and Acceptance](verification-and-acceptance.md).

---


## 17. Security boundaries

- Client là môi trường không tin cậy.
- Server kiểm tra auth, ownership, schema, unit, revision và scenario release.
- Database RLS là lớp bảo vệ bổ sung, không thay server validation.
- Scenario config chỉ đến từ build hoặc registry nội bộ, không từ payload tùy ý của người dùng.
- HTML giải thích/source phải được render an toàn; không chạy script từ content.
- Secret key chỉ tồn tại trong server environment.
- Cookie-auth mutation kiểm tra Origin/CSRF theo framework pattern hiện hành.
- Endpoint có body-size, event-count và rate limits; guest import tối đa 4 MiB và 500 events. Release contract không được tạo attempt hợp lệ vượt 500 events.
- Authenticated response dùng private/no-store phù hợp; không cache `Set-Cookie` response công khai.
- Security headers/CSP chỉ cho phép script/style/resource cần thiết của ứng dụng.

---


## 18. Những lựa chọn bị loại

### 18.1. Microservices

Không dùng vì ba domain module vẫn nhỏ, giao dịch attempt/event cần đơn giản và đội có thời gian ngắn.

### 18.2. Chemistry engine tổng quát

Không dùng vì không thể kiểm chứng mọi phản ứng và mâu thuẫn trực tiếp với Core Scope.

### 18.3. NoSQL làm database chính

Không ưu tiên vì ownership, event sequence, transaction và RLS phù hợp với PostgreSQL.

### 18.4. Lưu toàn bộ dữ liệu khách trên server ẩn danh

Không dùng trong scope để tránh lifecycle và privacy phức tạp. Guest data ở browser; cloud storage bắt đầu sau auth và consent import.

### 18.5. Tính kết quả chỉ ở client cho tài khoản

Không dùng vì server cần xác nhận event và state được lưu, đồng thời bảo đảm cùng scenario release.

---


## 19. Tiêu chí nghiệm thu kiến trúc

- Domain engine test được mà không chạy web/database.
- Ba experiment module chỉ phụ thuộc shared domain utilities.
- UI không chứa công thức khoa học quyết định kết quả.
- Server mutation kiểm tra session, ownership và revision.
- Insert event và update snapshot không tạo trạng thái nửa chừng.
- Guest và account dùng cùng schema action/state.
- Mỗi attempt tham chiếu version bất biến.
- Completed report không thay đổi khi release mới phát hành.
- RLS chặn user A đọc/ghi attempt của user B.
- Mobile/desktop gọi cùng service contract.
- Không có dependency bắt buộc vào microservice, queue, AI hoặc CMS.

---


## 20. Tài liệu liên quan

- [Documentation Index](README.md)
- [Core Project Scope](core-project-scope.md)
- [Web Application Scope](web-application-scope.md)
- [Data and State Model](data-and-state-model.md)
- [Verification and Acceptance](verification-and-acceptance.md)
- [Scientific Evidence Register](scientific-evidence-register.md)
- [Acid Neutralization Specification](experiments/acid-neutralization-spec.md)
- [Copper Precipitation Specification](experiments/copper-precipitation-spec.md)
- [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md)
