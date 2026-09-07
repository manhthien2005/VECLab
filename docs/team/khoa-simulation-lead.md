# KHOA — SIMULATION ENGINE LEAD

**Milestone:** 07/10/2026<br>
**Báo cáo cho:** Trưởng nhóm và Technical Lead<br>
**Reviewer/backup:** Thiên; Hân kiểm tra source và wording

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Sứ mệnh** | Bảo đảm mọi con số, state transition và giải thích khoa học đúng với release đã khóa. |
| 👤 **Vai trò** | Owner khoa học của cả ba simulation modules. |
| ✅ **Đầu ra cuối** | AN-G01…G08, CP-G00…G06 và PS-G01…G08 đạt; engine deterministic và giải thích được. |
| ⚠️ **Không ôm** | Không tự làm toàn bộ UI, database hoặc báo cáo Word. |

## Đọc tài liệu này khi nào?

- Trước khi triển khai hoặc duyệt logic mô phỏng.
- Khi thay hằng số, solver, scoring hoặc miền đầu vào.
- Khi UI/content có một con số hoặc claim cần xác nhận.

## Các quyết định chính

- Khoa chịu trách nhiệm cuối về tính đúng khoa học, kể cả khi người khác viết implementation.
- Golden case phải tồn tại trước hoặc cùng lúc với engine behavior.
- Không dùng dữ liệu mock UI làm expected chemistry result.
- Không lấp khoảng trống bằng hệ số không có nguồn hoặc convention không công khai.
- Hoàng viết Plastic implementation theo fixture; Khoa sở hữu fixture và duyệt toàn bộ correctness.

## Mục lục

<!-- TOC:START -->
- [1. Ownership chính](#1-ownership-chính)
- [2. Đầu ra bắt buộc](#2-đầu-ra-bắt-buộc)
- [3. Kế hoạch theo checkpoint](#3-kế-hoạch-theo-checkpoint)
- [4. Cách phối hợp khi người khác viết engine](#4-cách-phối-hợp-khi-người-khác-viết-engine)
- [5. Trách nhiệm review](#5-trách-nhiệm-review)
- [6. Ngoài ownership](#6-ngoài-ownership)
- [7. Definition of Done cá nhân](#7-definition-of-done-cá-nhân)
- [8. Ba việc bắt đầu ngay](#8-ba-việc-bắt-đầu-ngay)
- [9. Dấu hiệu cần báo động](#9-dấu-hiệu-cần-báo-động)
- [10. Tài liệu phải đọc](#10-tài-liệu-phải-đọc)
<!-- TOC:END -->

---

## 1. Ownership chính

Khoa sở hữu:

- Bộ hằng số và scenario release của ba bài.
- Canonical input/output của từng engine.
- Numerical solver và convergence criteria.
- Mass, charge và species invariants.
- Scoring khoa học và pedagogical cost/safety conventions.
- Golden fixtures và test oracle.
- Calculation trace/equation keys.
- Warning vượt miền mô hình.
- Review nội dung khoa học do Hân chuẩn bị.

## 2. Đầu ra bắt buộc

### Acid Neutralization

- Strong acid/base charge balance.
- CaOH⁺ equilibrium.
- Closed-carbon carbonate solver.
- Measurement freshness và route constraints.
- AN-G01…AN-G08.

### Copper Precipitation

- Activity/Davies model.
- Required Cu/sulfate/carbonate species.
- Cu(OH)₂ và malachite reference phases.
- Total dissolved Cu khác free Cu²⁺.
- CP-G00…CP-G06 và mass/charge residuals.

### Plastic Separation

- Cung cấp state/action contract và fixtures cho Hoàng implementation.
- Representative và range-guard partition.
- Stream tree, purity, recovery, yield và mass closure.
- Target/all-resins goals.
- PS-G01…PS-G08.

### Dùng chung

- Unit converters và rounding policy.
- Typed domain errors.
- Calculation trace đủ để Hân viết giải thích và Hoàng hiển thị.

## 3. Kế hoạch theo checkpoint

### Checkpoint A — 07/09 đến 13/09

- Chuyển Acid golden tables thành fixtures thực thi.
- Khóa engine interface với Thiên.
- Xây unit/charge-balance utilities tối thiểu.
- Chốt source keys, equation keys và test tolerance cùng Hân.
- Chuẩn bị Copper/Plastic fixtures để tránh nghẽn ở tuần sau.

### Checkpoint B — 14/09 đến 20/09

- Acid engine đạt toàn bộ golden và invalid cases.
- Cung cấp calculation trace/observations/warnings cho Hoàng.
- Review acid content và report output.
- Bắt đầu Copper solver bằng test fixtures đã khóa.

### Checkpoint C — 21/09 đến 27/09

- Copper engine đạt golden/convergence/invariants.
- Duyệt Plastic implementation của Hoàng đạt golden/mass closure.
- Review scoring/cost/safety outputs của ba bài.
- Cung cấp evidence cho Hân và integration notes cho Thiên.

### Checkpoint D — 28/09 đến 07/10

- Chỉ sửa correctness/blocker, không mở model mới.
- Chạy property, replay và boundary tests.
- Kiểm tra mọi số hiển thị trong report/demo.
- Duyệt phần khoa học trong báo cáo Word và slide/demo script.

## 4. Cách phối hợp khi người khác viết engine

Khi Thiên hoặc Hoàng hỗ trợ implementation:

1. Khoa cung cấp fixture và expected value trước.
2. Người viết code không thay expected value để làm test xanh.
3. Khoa review equation, unit, tolerance và limitation.
4. Thiên review architecture và contract.
5. Hân kiểm tra source/wording.

Khoa vẫn là owner cuối của correctness.

## 5. Trách nhiệm review

- Duyệt mọi thay đổi experiment spec hoặc source key.
- Duyệt UI copy có claim khoa học.
- Duyệt chart axes, units và rounding.
- Duyệt report result snapshot của ba bài.
- Không duyệt một kết quả chỉ vì “trông hợp lý”; phải có fixture/derivation.

## 6. Ngoài ownership

- Route/UI layout — Ngân và Hoàng.
- Account/database/RLS — Mạnh.
- Process Core/application architecture — Thiên.
- Word layout và biên tập cuối — Hân/Ngân.
- Khoa không trực tiếp thay scope để giảm khó khăn solver.

## 7. Definition of Done cá nhân

- Tất cả golden cases đạt đúng tolerance.
- Solver fail trả typed error, không NaN hoặc số đoán.
- Invariants pass ở toàn miền release.
- Same state/action/release cho same result.
- Calculation trace có equation/claim/source mapping.
- Scoring không bị gọi là probability hoặc legal compliance.
- Hân và Hoàng có đủ output để viết content/render UI.
- Thiên hoặc một coder khác có thể chạy và hiểu test suite.

## 8. Ba việc bắt đầu ngay

1. Chuyển AN-G01…G08 thành test fixture độc lập UI.
2. Chốt interface input/output và canonical units với Thiên.
3. Tạo skeleton fixtures CP-G00…G06 và PS-G01…G08 trước khi code solver.

## 9. Dấu hiệu cần báo động

- Expected value không trỏ được về spec/source.
- Copper solver chưa hội tụ ổn định khi kết thúc Checkpoint B.
- Một engine chỉ Khoa hiểu và không có calculation trace.
- UI/report dùng value đã làm tròn làm input bước sau.
- Có đề xuất thêm matrix, species hoặc experiment ngoài release.

## 10. Tài liệu phải đọc

- [Team Plan](README.md)
- [Acid Neutralization Specification](../experiments/acid-neutralization-spec.md)
- [Copper Precipitation Specification](../experiments/copper-precipitation-spec.md)
- [Plastic Separation Specification](../experiments/plastic-density-separation-spec.md)
- [Scientific Evidence Register](../scientific-evidence-register.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
