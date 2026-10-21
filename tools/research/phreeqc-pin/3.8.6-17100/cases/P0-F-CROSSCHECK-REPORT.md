# P0-F Cross-Check Report — 3 Golden Case cho Solver MVP End-to-End

**Ngày chuẩn bị:** 17/10/2026
**Người chuẩn bị (golden case files + report):** Cursor Assistant (TL2 session)
**Người duyệt (sign-off):** ✅ User — 17/10/2026
**Mục đích:** Verify solver MVP Fe/Zn/Pb end-to-end bằng ≥ 3 golden case (P0-F)
**PHREEQC binary:** KHÔNG chạy trực tiếp trong session này (env không có `phreeqc.exe` build).
  G2 + G3 dùng PHREEQC output có sẵn từ `actual/GC-SOLID-01.select.out` (đã chạy 16/10/2026).
  G1 là AI-prepared — chờ chemistry owner re-run khi có binary.

> **Trạng thái cuối:** P0-F **đã đóng** 17/10/2026 với 2/3 case live (G2, G3) + 1/3 case
> AI-prepared (G1). Tolerance tổng thể lỏng hơn P0-D (đóng với input đơn lẻ Fe/Zn/Pb)
> vì golden case kiểm tra workflow end-to-end (composition 3 KL đồng thời + pH + so sánh
> Cột A), chứ không kiểm tra từng hằng số. Evidence register
> `docs/scientific-evidence-register.md` §5.1.3 đã cập nhật trạng thái **ĐÃ ĐÓNG** ngày 17/10/2026.

---

## 1. Tóm tắt

| Mục | Giá trị |
| --- | --- |
| **P0-F status (trước)** | 🔴 Mở — chưa có golden case |
| **P0-F status (sau khi đóng)** | 🟢 **ĐÃ ĐÓNG** (17/10/2026) |
| **Số golden case** | 3 (G1, G2, G3) — đáp ứng "≥ 3 case" của P0-F |
| **Số case có PHREEQC live output** | 2/3 (G2, G3 reuse `GC-SOLID-01` từ P0-D) |
| **Số case AI-prepared** | 1/3 (G1 — input thấp, pH trung tính, không có EQUILIBRIUM_PHASES) |
| **Test pass (vitest)** | 6/6 PASS — `tests/unit/water-treatment-golden-cases.test.ts` |
| **Cập nhật evidence register** | §5.1.3 row P0-F: 🔴 Mở → 🟢 ĐÃ ĐÓNG (17/10/2026) |

---

## 2. 3 Golden Case

### G1 — `golden-control-no-treatment` (AI-prepared)

| Thuộc tính | Giá trị |
| --- | --- |
| File | `cases/G1-control-no-treatment.pqi` |
| Output PHREEQC | ⚠️ **Chưa có** — AI-prepared; sẽ live-run khi chemistry owner build binary |
| Input | Fe 1 mg/L, Zn 0,5 mg/L, Pb 0,05 mg/L (mỗi kim loại < 50% Cột A) |
| pH | 7,5 (trung tính nhẹ kiềm) |
| EQUILIBRIUM_PHASES | (không — không cần kết tủa) |
| Expected filtrate | Fe ≈ 1,0; Zn ≈ 0,5; Pb ≈ 0,05 mg/L (gần như input, không kết tủa) |
| QCVN Cột A | Fe 2,0; Zn 1,0; Pb 0,1 |
| Pass criteria | Tất cả 3 kim loại < Cột A |
| `goalStatus` expected | `'success'` (3/3 đạt ngưỡng) |
| Mục đích | Cover scenario "đạt không cần xử lý" (case (a) spec §16.1) |

### G2 — `golden-hydroxide-partial-pH9` (LIVE, reuse P0-D)

| Thuộc tính | Giá trị |
| --- | --- |
| File | `cases/G2-hydroxide-partial-pH9.pqi` (alias tài liệu của `GC-SOLID-01.pqi` Sim 1) |
| Output PHREEQC | ✅ `actual/GC-SOLID-01.select.out` Sim 1 (pH final 8,78) |
| Input | Fe 5 mg/L, Zn 5 mg/L, Pb 0,5 mg/L (Pb = 5× Cột A) |
| pH initial | 9 (buffer mạnh) |
| EQUILIBRIUM_PHASES | Ferrihydrite, Zn(OH)₂(am), Pb(OH)₂ (3 pha baseline đồng thời) |
| Expected filtrate (closed-form tại pH 8,78) | Fe ≈ 0; Zn ≈ 0; Pb ≈ 0,5 mg/L |
| QCVN Cột A | Fe 2,0; Zn 1,0; Pb 0,1 |
| Pass criteria | Fe+Zn đạt, Pb fail (vì input 0,5 < Pb capacity 0,617 → tan hết) |
| `goalStatus` expected | `'partial-success'` (2/3 đạt) |
| Mục đích | Cover scenario "đạt Fe+Zn nhưng fail Pb" (case (b) spec §16.1) |

### G3 — `golden-hydroxide-full-pH9_5` (LIVE, reuse P0-D)

| Thuộc tính | Giá trị |
| --- | --- |
| File | `cases/G3-hydroxide-full-pH9_5.pqi` (alias tài liệu của `GC-SOLID-01.pqi` Sim 2) |
| Output PHREEQC | ✅ `actual/GC-SOLID-01.select.out` Sim 2 (pH final 9,92) |
| Input | Fe 5 mg/L, Zn 5 mg/L, Pb 0,5 mg/L |
| pH initial | 9,5 (buffer mạnh hơn G2) |
| EQUILIBRIUM_PHASES | Ferrihydrite, Zn(OH)₂(am), Pb(OH)₂ |
| Expected filtrate (closed-form tại pH 9,92) | Fe ≈ 0; Zn ≈ 0; Pb ≈ 0,062 mg/L |
| QCVN Cột A | Fe 2,0; Zn 1,0; Pb 0,1 |
| Pass criteria | Cả 3 đạt (Pb input 0,5 > Pb capacity 0,062 → dư kết tủa → filtrate 0,062 < 0,1) |
| `goalStatus` expected | `'success'` (3/3 đạt) |
| Mục đích | Cover scenario "đạt cả 3" (case khuyến nghị thêm cho MVP) |

---

## 3. Cơ sở tính toán closed-form

Công thức `capacityAtSaturation(pH)` đã implement tại `src/features/water-treatment/capacity.ts`
(P0-C đã đóng 17/10/2026). Filtrate kỳ vọng:

```
filtrate_M = max(0, input_M - capacity_M)  với M ∈ {Fe, Zn, Pb}
capacity_M = capacityAtSaturation(pH)        // mol/L
input_M ở mg/L, convert sang mol/L bằng ÷ (atomicWeight × 1000)
```

Cột A QCVN 40:2025/BTNMT (P0-A đã đóng 16/10/2026):
- Fe: 2,0 mg/L
- Zn: 1,0 mg/L
- Pb: 0,1 mg/L

Quy tắc `goalStatus` (spec §4.1):
- `'success'`: tất cả kim loại < Cột A
- `'partial-success'`: ≥ 1 nhưng < tất cả đạt
- `'failed'`: 0/3 đạt
- `'invalid'`: vi phạm pH guard [2; 13] hoặc dose cap

---

## 4. Kết quả test (vitest 17/10/2026)

```
$ npx vitest run tests/unit/water-treatment-golden-cases.test.ts

 ✓ tests/unit/water-treatment-golden-cases.test.ts (6 tests)
   ✓ G1: input thấp (Fe 1, Zn 0,5, Pb 0,05) pH 7,5 → goalStatus = 'success' (3/3)
   ✓ G1: filtrate giữ nguyên input (không kết tủa)
   ✓ G2: input trung bình (Fe 5, Zn 5, Pb 0,5) pH 9 → goalStatus = 'partial-success' (2/3)
   ✓ G2: Pb fail (filtrate 0,5 > Cột A 0,1)
   ✓ G3: input trung bình pH 9,5 → goalStatus = 'success' (3/3)
   ✓ G3: Pb pass (filtrate 0,062 < Cột A 0,1)

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

---

## 5. Giới hạn và action items (phase 2)

P0-F đã đóng cho MVP 17/10/2026 với 2/3 case có PHREEQC live output. Công việc
dưới đây là phase 2 (không chặn close):

1. [ ] **G1 live-run**: Build PHREEQC binary ở máy có quyền, chạy
       `phreeqc cases/G1-control-no-treatment.pqi` → update `actual/G1-*.select.out`.
       Sau đó update test `G1` để assert closed-form vs PHREEQC trong ±0,05 log
       (giống P0-C tolerance).

2. [ ] **Thêm case (c) spec §16.1 — vượt pH guard / dose cap**:
       - pH 11.5 input > pH guard [2;13] → `goalStatus = 'invalid'`, `invalidReasonCodes = ['PH_GUARD_EXCEEDED']`
       - Input cao vượt dose cap (ví dụ Fe 500 mg/L với max dose 100 mg/L) → `invalid`
       Cả 2 đều test logic `pH guard` và `dose cap` của solver — hiện chưa có
       test nào cover, chỉ có G1/G2/G3 cover chemistry outcome.

3. [ ] **Mass-balance verify (P0-J)**: P0-J tolerance ±2% (O9 đã chốt) hiện chưa
       được apply trong solver. Khi wire mass-balance check vào solver (xem
       `WT_OUTCOME.unknownReasonCodes` trong `src/features/water-treatment/constants.ts`),
       cần update golden case test để assert `mass_balance_pct ≤ 2%` cho cả 3 case.

4. [ ] **Nếu review lại derivation** solver và phát hiện sai, revert bằng cách
       add lại `'P0-F'` vào `WT_OPEN_BLOCKERS` và đổi evidence register row về
       lại 🔴 Mở.

---

## 6. Tham chiếu

- Solver closed-form: `src/features/water-treatment/capacity.ts`
- Constants & outcome: `src/features/water-treatment/constants.ts`
- Golden case test: `tests/unit/water-treatment-golden-cases.test.ts`
- Evidence register: `docs/scientific-evidence-register.md` §5.1.3 row P0-F
- Cột A QCVN: §5.1.1 (P0-A), `WT_QCVN_COLUMN_A` trong `constants.ts`
- Baseline D1–D5 chốt 16/10/2026: §5.1.3 (P0-D)
- Cross-check report liên quan:
  - `cases/P0-C-CROSSCHECK-REPORT.md` (capacity closed-form)
  - `cases/P0-D-CROSSCHECK-REPORT.md` (6 claim số học, 7 case chuyên biệt)
- Spec: `docs/experiments/water-treatment-spec.md` §4.1 (two-layer), §16.1 (P0-F), §7.4.9 (golden case mẫu)
- PHREEQC input/output: `cases/GC-SOLID-01.pqi` + `actual/GC-SOLID-01.select.out`
