# P0-C Cross-Check Report — Capacity Model 3 Kim Loại Đồng Thời (Fe + Zn + Pb)

**Ngày chạy cross-check:** 17/10/2026
**Người chuẩn bị (closed-form + cross-check):** Cursor Assistant (TL2 session)
**Người duyệt (sign-off):** ✅ User — 17/10/2026 (tolerance hiện tại ±0,025 log; tighten về 0,004 là phase 2)
**Mục đích:** Verify closed-form biểu thức capacity cho Fe + Zn + Pb đồng thời (P0-C)
**PHREEQC binary:** KHÔNG chạy trực tiếp trong session này (env không có `phreeqc.exe` đã build).
  Cross-check dựa trên output có sẵn từ `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-SOLID-01.select.out`
  (được tạo bởi quy trình khác trước 16/10/2026, hiện lưu trong repo).

> **Trạng thái cuối:** P0-C **đã đóng** 17/10/2026 với sai số ±0,025 log (1 case PHREEQC,
> 2 simulation pH 9 và 9,5). Tighten tolerance về ±0,004 bằng Davies γ + Cl complexes và chạy
> thêm ≥ 2 case là việc phase 2 — không chặn close MVP hiện tại. Evidence register
> `docs/scientific-evidence-register.md` §5.1.3 đã cập nhật trạng thái **ĐÃ ĐÓNG** ngày 17/10/2026.

---

## 1. Tóm tắt

| Mục | Giá trị |
| --- | --- |
| **P0-C status (trước)** | 🔴 Mở — capacity 3-KL chưa cross-check PHREEQC |
| **P0-C status (sau khi đóng)** | 🟢 **ĐÃ ĐÓNG** (17/10/2026, user sign-off tại tolerance ±0,025) |
| **PHREEQC release** | 3.8.6-17100 (SHA-256 zip: `91bf4998cfb5ed33b1222e034e559a9845f592f0f4f79a11819efe229b65a847`) |
| **Database** | `minteq.v4.dat` (SHA-256: `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`) |
| **Baseline phases** (D4 chốt 16/10/2026) | Fe = Ferrihydrite, Zn = Zn(OH)₂(am), Pb = Pb(OH)₂ |
| **Input test case** | Fe 5 mg/L + Zn 5 mg/L + Pb 0,5 mg/L; pH initial 9 và 9,5 |
| **Number of cases cross-checked** | 1 case (2 simulation: pH 9 và 9,5) — đạt yêu cầu tối thiểu "≥ 1 case" của P0-C |
| **Sai số log (vs PHREEQC)** | 0.008–0.023 log, **trong ±0.025** (chemistry owner có thể thắt chặt về 0.004) |
| **Test pass (vitest)** | 11/11 PASS — `tests/unit/water-treatment-capacity.test.ts` |

---

## 2. Cơ sở lý thuyết (closed-form derivation)

### 2.1. Ksp (hằng số tích tan) — đã pin trong D1/D2/D3 (16/10/2026)

Cho phase rắn baseline (đã chốt theo D4):

| Kim loại | Phase rắn | Phản ứng hòa tan axit | `log_k` (minteq.v4.dat) | `log Ksp` (so với Fe³⁺/Zn²⁺/Pb²⁺ + OH⁻) |
| --- | --- | --- | --- | --- |
| Fe | Ferrihydrite | Fe(OH)₃(s) + 3H⁺ ⇌ Fe³⁺ + 3H₂O | `3,191` | `3,191 − 3 × 13,990 = −38,779` |
| Zn | Zn(OH)₂(am) | Zn(OH)₂(s) + 2H⁺ ⇌ Zn²⁺ + 2H₂O | `12,474` | `12,474 − 2 × 13,990 = −15,506` |
| Pb | Pb(OH)₂ | Pb(OH)₂(s) + 2H⁺ ⇌ Pb²⁺ + 2H₂O | `8,15` | `8,15 − 2 × 13,990 = −19,830` |

pKw = 13,990 theo IAPWS R11-24, 25 °C, 0,1 MPa (đã pin trong PHREEQC 3.8.6-17100).

### 2.2. Hydrolysis constants — trích từ `minteq.v4.dat`

| j | Fe(OH)ⱼ^(3-j)+ | log_k | Zn(OH)ⱼ^(2-j)+ | log_k | Pb(OH)ⱼ^(2-j)+ | log_k |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | FeOH²⁺ | **−2,187** | ZnOH⁺ | **−8,997** | PbOH⁺ | **−7,597** |
| 2 | Fe(OH)₂⁺ | **−4,594** | Zn(OH)₂(aq) | **−17,794** | Pb(OH)₂(aq) | **−17,094** |
| 3 | Fe(OH)₃(aq) | **−12,56** | Zn(OH)₃⁻ | **−28,091** | Pb(OH)₃⁻ | **−28,091** |
| 4 | Fe(OH)₄⁻ | **−21,588** | Zn(OH)₄²⁻ | **−40,488** | Pb(OH)₄²⁻ | **−39,699** |

Phản ứng theo convention MINTEQ v4 đã pin:
```
M^n+ + j H₂O ⇌ M(OH)_j^(n-j)+ + j H+
log K_j  =  log[M(OH)_j] − log[M^n+] + j × pH
       ⟹  [M(OH)_j]  =  [M^n+] × 10^(log K_j + j × pH)
```

### 2.3. Công thức closed-form tổng quát

Tại SI = 0 với phase baseline (3 phase cùng đạt saturation), bỏ qua activity coefficient
(γ ≈ 1 cho ionic strength < 0.001 — gần đúng cho nước thải loãng):

```
[M^n+]_free  =  Ksp_M / [OH⁻]^valence
            =  10^(logKsp_M) / 10^(valence × (pH − pKw))
            =  10^(logKsp_M − valence × pH + valence × 13,990)
```

Tổng molality (bao gồm tất cả hydrolysis complexes):

```
[M]_total  =  [M^n+]_free  +  Σ_{j=1..4}  [M(OH)_j]
           =  [M^n+]_free × ( 1  +  Σ 10^(log K_j + j × pH) )
```

### 2.4. Mô hình 3-KL đồng thời

Vì cả 3 phase cùng ở SI = 0, công thức trên áp dụng **độc lập** cho mỗi kim loại. KHÔNG có
ràng buộc tương tác giữa 3 capacity ở mức Ksp — vì mỗi metal có phase rắn riêng và Ksp riêng.

Tương tác 3-KL xuất hiện ở **OH⁻ budget chung** khi solver phải xác định pH final:
- Khi kết tủa xảy ra, 3 × [Fe]_ppt + 2 × [Zn]_ppt + 2 × [Pb]_ppt mol OH⁻ bị tiêu thụ
- pH_final phải thỏa mãn: initial OH⁻ − consumed OH⁻ = OH⁻ ở pH_final
- Trong baseline model này, **pH được cố định bởi input** (sample pH) → tương tác 3-KL
  ở mức pH được khai báo trong input. Solver trong tương lai (P0-J) sẽ cần giải coupled
  pH + capacity equation, nhưng đó là P0-J (mass-balance tolerance), không phải P0-C.

→ **P0-C close**: closed-form cho capacity từng kim loại ở SI=0 đã verify với PHREEQC,
trong tolerance cho phép. P0-J còn mở sẽ handle coupled pH + mass balance.

---

## 3. Cross-check vs PHREEQC

### 3.1. PHREEQC input tham chiếu

File: `cases/GC-SOLID-01.pqi` (đã tồn tại trong repo, 16/10/2026)
```
SOLUTION 1     SOLUTION 2
-temp 25       -temp 25
pH 9           pH 9.5
Fe(3) 0.0895   Fe(3) 0.0895
Zn 0.0765      Zn 0.0765
Pb 0.00241     Pb 0.00241
Cl 0.537       Cl 0.537
END            END
USE solution 1 USE solution 2
EQUILIBRIUM_PHASES 1   EQUILIBRIUM_PHASES 2
    Ferrihydrite 0 0       Ferrihydrite 0 0
    Zn(OH)2(am) 0 0        Zn(OH)2(am) 0 0
    Pb(OH)2 0 0            Pb(OH)2 0 0
END            END
```

Input molality: Fe 5 mg/L = 0,0895 mmol/kgw; Zn 5 mg/L = 0,0765 mmol/kgw; Pb 0,5 mg/L = 0,00241 mmol/kgw.

### 3.2. PHREEQC output tham chiếu

File: `actual/GC-SOLID-01.select.out` (đã tồn tại trong repo)

**Sim 1 (initial pH 9):** pH final = 8,78; totals (mol/L):
- Fe = 7,40 × 10⁻¹⁰
- Zn = 1,91 × 10⁻⁵
- Pb = 7,66 × 10⁻⁹

**Sim 2 (initial pH 9,5):** pH final = 9,92; totals (mol/L):
- Fe = 3,87 × 10⁻⁹
- Zn = 7,28 × 10⁻⁶
- Pb = 1,67 × 10⁻⁹

### 3.3. Closed-form output

Implementation: `src/features/water-treatment/capacity.ts`
Test: `tests/unit/water-treatment-capacity.test.ts` (11/11 PASS với ±0,025 log)

| Metal | pH 8,78 PHREEQC | pH 8,78 closed-form | Sai số | pH 9,92 PHREEQC | pH 9,92 closed-form | Sai số |
| --- | --- | --- | --- | --- | --- | --- |
| Fe | 7,40 × 10⁻¹⁰ | 7,58 × 10⁻¹⁰ | **0,010 log** | 3,87 × 10⁻⁹ | 4,04 × 10⁻⁹ | **0,018 log** |
| Zn | 1,91 × 10⁻⁵ | 1,81 × 10⁻⁵ | **0,023 log** | 7,28 × 10⁻⁶ | 7,53 × 10⁻⁶ | **0,015 log** |
| Pb | 7,66 × 10⁻⁹ | 7,80 × 10⁻⁹ | **0,008 log** | 1,67 × 10⁻⁹ | 1,74 × 10⁻⁹ | **0,018 log** |

**Kết luận cross-check:** 5/6 giá trị trong ±0,020 log, 1/6 (Zn tại pH 8,78) trong ±0,025 log.
Tất cả PASS tolerance ±0,025 log (5× rộng hơn P0-D tight 0,004 log).

### 3.4. Phân tích nguồn sai số

| Nguồn | Ước tính đóng góp | Ghi chú |
| --- | --- | --- |
| Activity coefficient (γ ≠ 1) | ~0,005–0,015 log | I thực tế ở pH 8,78–9,92 với 3-KL saturation là ~10⁻⁴ đến 10⁻³ mol/kgw. Davies: log γ ≈ −0,003 đến −0,015 cho ion 2+/3+. |
| Cl complexes (ZnCl⁺, PbCl⁺) | ~0,001–0,005 log | Tỉ lệ phụ thuộc [Cl⁻] = 0,537 mM. |
| Thiếu sulfate complexes | < 0,001 log | [SO₄²⁻] rất thấp trong closed system, contribution không đáng kể. |
| Roundoff trong log K | ~0,001 log | 4 chữ số thập phân đủ. |
| pH từ GC-SOLID-01 (final) | 0 (input chính xác) | Lấy trực tiếp từ PHREEQC output. |
| **Tổng ước tính** | **~0,008–0,025 log** | Khớp với sai số quan sát được. |

Để đạt P0-D tight tolerance (0,004 log), cần:
1. Thêm Davies equation: `log γ = −A × z² × (√I / (1 + √I) − 0,3I)` với A = 0,5092 ở 25 °C.
2. Bổ sung Cl⁻ complexes: ZnCl⁺ (log K = 0,43), PbCl⁺ (log K = 1,5), v.v.
3. Chạy thêm ≥ 2 case khác (variation input concentration, pH initial) để củng cố evidence.

---

## 4. Deliverable cho P0-C

### 4.1. Code đã merge vào session TL2

- `src/features/water-treatment/capacity.ts` (147 dòng): closed-form implementation với docstring
  đầy đủ về derivation + database source.
- `tests/unit/water-treatment-capacity.test.ts` (170 dòng): 11 test cases, 6 cross-check với
  PHREEQC output, 3 invariant test, 1 sanity test, 1 monotonicity test.

### 4.2. Test output

```
 RUN  v5.0.0 D:/VECLab
 ✓ tests/unit/water-treatment-capacity.test.ts (11 tests) — all PASS
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  169ms
```

### 4.3. Ranh giới & hạn chế (cần chemistry owner verify)

1. **Closed system assumption**: Cross-check này chỉ valid cho closed system (không CO₂ exchange,
   không có precipitation/dissolution khác ngoài 3 phase baseline). Spec §6.5.5 có mô tả
   mở rộng với carbonate / sulfate cần xét thêm.

2. **Activity coefficient**: Bỏ qua trong bản này. Cần thêm Davies trước khi solver MVP dùng
   cho input ionic strength > 0,01.

3. **Cl complexes**: Bỏ qua trong bản này. Ảnh hưởng nhỏ (~0,005 log) nhưng sẽ tăng ở mẫu
   có nhiều muối.

4. **Sample pH như input**: Cross-check chỉ validate capacity ở pH cho trước. Solver P0-J
   (mass-balance) sẽ phải giải coupled equation để tìm pH final khi dosing reagent.

5. **Đơn vị**: Tất cả output ở mol/L. UI cần convert sang mg/L bằng atomic weight × 1000.

6. **Number of cases**: 1 case × 2 simulation. P0-C spec yêu cầu "≥ 1 case" → đạt tối thiểu.
   Chemistry owner nên chạy thêm ≥ 2 case (ví dụ input 10× concentration, pH 6–7) để củng cố.

---

## 5. Action items (phase 2 — sau khi release MVP)

P0-C đã đóng cho MVP 17/10/2026 ở tolerance ±0,025 log. Công việc dưới đây là phase 2
(không chặn close), nên chuyển thành ticket riêng thay vì gate release:

1. [ ] **Tighten tolerance** bằng cách thêm Davies γ + Cl complexes (ước tính đạt 0,004 log,
       ngang P0-D). Mở PR riêng, không sửa file hiện tại trừ khi đã có O5 CLI.

2. [ ] **Run thêm ≥ 2 case** trên máy có PHREEQC binary (mục tiêu: ≥ 3 case tổng):
       - Case B: input 10× (Fe 50, Zn 50, Pb 5 mg/L), pH 9 → verify scale-up.
       - Case C: input thấp + pH thấp (Fe 1, Zn 1, Pb 0,1 mg/L, pH 6,5) → verify sub-mg/L.
       Mỗi case thêm → update PHREEQC output file `actual/GC-SOLID-XX.select.out` và
       update test reference trong `tests/unit/water-treatment-capacity.test.ts`.

3. [ ] **Nếu review lại derivation** trong `src/features/water-treatment/capacity.ts`
       và phát hiện sai, revert bằng cách add lại `'P0-C'` vào `WT_OPEN_BLOCKERS`
       và đổi evidence register row về lại 🔴 Mở.

---

## 6. Tham chiếu

- PHREEQC release: `tools/research/phreeqc-pin/3.8.6-17100/PIN.json`
- Database đã pin: SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` (`minteq.v4.dat`)
- PHREEQC input: `cases/GC-SOLID-01.pqi`
- PHREEQC output: `actual/GC-SOLID-01.select.out`
- Cross-check report cũ (P0-D): `cases/P0-D-CROSSCHECK-REPORT.md`
- Evidence register: `docs/scientific-evidence-register.md` §5.1.3
- Baseline D1–D5 chốt 16/10/2026: §5.1.3 (bảng "Decision request to chemistry owner")
- Solver spec: `docs/experiments/water-treatment-spec.md` §6.5.5 (capacity model 3 KL)
- Spec §4.1 (two-layer design, goalStatus = 'unknown' khi P0 mở)
- Spec §16.1 (release-ready gate)
