# Local review — Jar Test Task 1

Ngày 13/10/2026. **Verdict: cần sửa**, chưa giao Task 2.

Cập nhật: vòng sửa `5a920ee` đã được local kiểm chứng, hai finding đóng; xem [kết quả JSON Round 1](jar-test-01-r1.json). Nội dung bên dưới lưu review của commit `69f8b30`, không phải verdict hiện tại cho commit đã sửa.

## Source đã review

- Repo/branch: `manhthien2005/VECLab`, `chore/pre-refactor-cleanup`.
- Base trong brief: `309c2b164aab88402fe109250477a08483c99186`.
- Parent của implementation: `010b614771eecbe7d5a51e33f63678fa19678587` (thêm brief, chưa đổi code domain).
- Head đã review: `69f8b30a05dc41ea00a8e4e0645b2e298f070b74`.
- Commit: https://github.com/manhthien2005/VECLab/commit/69f8b30a05dc41ea00a8e4e0645b2e298f070b74
- Diff: https://github.com/manhthien2005/VECLab/compare/010b614771eecbe7d5a51e33f63678fa19678587...69f8b30a05dc41ea00a8e4e0645b2e298f070b74

Đã xác nhận đúng sáu file trong brief; không đổi dependency, app, API hoặc database. Local cập nhật nhánh bằng fast-forward để review, chưa merge vào develop/main hoặc nghiệm thu implementation.

## Finding 1 — Typecheck không qua (P1)

`tests/unit/jar-engine.test.ts:94–97`: mảng các cặp đầu vào được suy ra thành `number[][]`. Khi destructure, cấu hình TypeScript hiện có suy ra `ph`/`dose` là `number | undefined`, không phù hợp tham số `number` của predictor.

Lệnh `npm run typecheck` trả exit 1:

~~~text
tests/unit/jar-engine.test.ts(97,39): error TS2345:
Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
~~~

Sửa kiểu dữ liệu case thành tuple hai số, chẳng hạn `as const` hoặc annotation tuple phù hợp. Giữ nguyên strictness của dự án và ý nghĩa các test input sai.

## Finding 2 — Action không được khai báo vẫn qua validation hoặc gây exception (P2)

`src/domain/experiments/jar-test/engine.ts:55–60`: `KEYS` là object thông thường. Lookup bằng chuỗi `toString`, `constructor` hoặc `__proto__` lấy thuộc tính kế thừa, nên kiểm tra `allowed === undefined` không từ chối chúng.

Đã chạy probe trên module thật qua Vite SSR loader và `runCommand`, với initial state/ledger mới cho từng case. Kết quả:

~~~text
not_an_action + {}       -> UNKNOWN_ACTION_TYPE (đúng)
toString + {}            -> ok: true, state revision 1, operationCount 1
constructor + {}         -> ok: true, state revision 1, operationCount 1
__proto__ + {}           -> ok: true, state revision 1, operationCount 1
toString + { bad: 1 }    -> TypeError: allowed.includes is not a function
~~~

Action lạ không được tạo event, tăng revision/tài nguyên hoặc ném exception ngoài domain contract. Kiểm tra own property/allowlist trước khi lấy danh sách parameter. Thêm regression cho các tên trên với payload rỗng/có parameter; kiểm tra DomainError và state/ledger không đổi. Giữ kiểm tra trong đường validate/run của module, không chỉ lọc ở UI hoặc API sau này.

## Bằng chứng đã chạy local

Môi trường: Windows, Node `v24.16.0`, npm `11.13.0`, dependencies đang cài trong checkout. Không chạy lại `npm ci`; package và lockfile không đổi trong commit này.

- PASS — `npm run test -- tests/unit/jar-engine.test.ts tests/unit/process-core-lifecycle.test.ts tests/unit/acid-engine-actions.test.ts tests/unit/acid-golden-fixtures.test.ts tests/unit/domain-boundaries.test.ts` — 5 files, 94 tests; gồm 11 test Jar và 83 test regression.
- FAIL — `npm run typecheck` — TS2345 như Finding 1.
- PASS — `npx --no-install eslint src/domain/experiments/jar-test/model.ts src/domain/experiments/jar-test/engine.ts src/domain/process/contracts.ts src/domain/units/index.ts tests/unit/jar-engine.test.ts` — exit 0.
- PASS — `git diff HEAD^ HEAD --check` tại head review — không lỗi whitespace.
- FAIL — probe action không khai báo — Finding 2; đây là probe review độc lập, chưa thêm test/file vào implementation.

Không chạy full build/Playwright/DB trong vòng review engine này. Kết quả trên không chứng minh UI, cloud, validation thực nghiệm hoặc môi trường Node của CI. Web báo Vercel lỗi ở `npm ci`; vòng review này chưa đọc build log hoặc xác định nguyên nhân deployment. Không quy lỗi cài dependency cho engine chỉ từ trạng thái deployment.

## Gói sửa giao web

Tiếp tục **Task 1**, sửa hai finding trên. Allowed files cho vòng sửa: `src/domain/experiments/jar-test/engine.ts` và `tests/unit/jar-engine.test.ts`. Không mở thêm kiến trúc hoặc đổi profile để chữa lỗi validation/typecheck.

Đọc [contract handback hiện hành](../web-handoff-contract.md), dùng result JSON v1. Khi có terminal, chạy lại focused tests, typecheck và lint phần thay đổi. Nếu web không có terminal, ghi `not_run` và giao code/tests thực cho local chạy; không gọi là đã nghiệm thu.

Local sẽ kiểm chứng lại sau commit sửa; chỉ giao Task 2 khi đạt Task 1. Không sửa code implementation trong commit tài liệu review này.
