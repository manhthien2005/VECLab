# ĐẶC TẢ THÍ NGHIỆM 2 — KẾT TỦA Cu²⁺

**Scenario key:** `copper-precipitation`<br>
**Scenario version:** `1.0.0`<br>
**State schema version:** `1`<br>
**Trạng thái nội dung:** Đủ điều kiện triển khai mô hình cân bằng hẹp; chưa kiểm chứng bench bởi đội<br>
**Nhiệt độ mô hình:** 25,0 °C<br>
**Ngôn ngữ:** Tiếng Việt

> Đây là mô hình cân bằng giáo dục cho dung dịch CuSO₄ tổng hợp loãng, không phải mô hình nước thải công nghiệp. Liều, pH và hiệu suất của nước thải thật phải được xác định trên chính mẫu đó bằng đo đạc, jar test và đánh giá chuyên môn.

> **Nhãn bắt buộc:** Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.

---

## 1. Quyết định khoa học chính

Scenario 1.0.0 dùng ba route:

1. NaOH → pha rắn Cu(OH)₂ mới kết tủa.
2. Ca(OH)₂ đã hòa tan → pha rắn Cu(OH)₂ mới kết tủa.
3. Na₂CO₃ → basic copper carbonate dạng malachite, Cu₂CO₃(OH)₂.

Không dùng phản ứng giả `Cu²⁺ + CO₃²⁻ → CuCO₃(s)` làm pha cuối cho route carbonate.

Engine tính **tổng Cu hòa tan** gồm free Cu²⁺ và các complex hydroxo, sulfate, carbonate. Không dùng `Ksp/[OH]²` rồi gọi kết quả là total dissolved Cu.

Mixing kích hoạt phép giải cân bằng; settling không đổi hóa học; filtration là bộ tách lý tưởng định nghĩa trong model.

---

## 2. Kịch bản tham chiếu

| Đại lượng | Giá trị |
| --- | ---: |
| Nhiệt độ | 25,00 °C |
| Áp suất | xấp xỉ 1 atm |
| Thể tích chuẩn hóa | 1,00000 L, cố định |
| Tổng Cu ban đầu | 100,000 mg/L tính theo Cu |
| Molar mass Cu | 63,546 g/mol |
| Tổng Cu molar | 1,57366 × 10⁻³ mol/L |
| Tổng sulfate ban đầu | bằng tổng Cu molar |
| Na/Ca/carbon ban đầu | 0 |
| Hệ carbonate | kín đối với CO₂ |

pH ban đầu do equilibrium solver tính: 5,32524 trong bộ model này. Người dùng không nhập pH ban đầu độc lập.

### 2.1. Giả định volume

Liều reagent làm thay đổi số mol nhưng volume normalization giữ 1,00000 L. Đây là quyết định mô hình để so sánh route, không phải hướng dẫn pha một mẻ thật. UI dùng dose ratio/mmol, không dùng volume stock làm biến khoa học chính.

### 2.2. Không có trong mẫu

- Chloride cao.
- NH₃.
- EDTA/citrate.
- Phosphate.
- Chất hữu cơ.
- Surfactant.
- Kim loại khác.
- Suspended solids.

---

## 3. Dose ratio và miền input

### 3.1. Định nghĩa

```text
RNaOH = nNaOH / nCu0
RCa   = nCa(OH)2 / nCu0
RC    = nNa2CO3 / nCu0
```

- `RNaOH = 2` là 2 OH/Cu danh nghĩa.
- `RCa = 1` là 2 OH/Cu danh nghĩa.
- `RC = 1` là 1 carbonate/Cu danh nghĩa; không đủ bảo đảm total dissolved Cu thấp trong hệ kín.

### 3.2. Miền khám phá

| Biến | Miền |
| --- | ---: |
| Cu ban đầu exploration | 50–200 mg/L |
| Volume exploration | 0,250–1,000 L |
| RNaOH | 0–4,00 |
| RCa | 0–2,00 |
| RC | 0–2,00 |
| Nhiệt độ | khóa 25 °C |

Golden/scoring mode cố định 100 mg/L, 1 L.

### 3.3. Cửa sổ liều sư phạm

| Route | Cửa sổ liều được điểm |
| --- | --- |
| NaOH | 2,00–2,05 |
| Ca(OH)₂ | 1,00–1,025 |
| Na₂CO₃ | 1,25–1,50 |

Cửa sổ là quyết định thiết kế của simulator, không phải liều tối ưu công nghiệp.

### 3.4. Miền model validity

- Ionic strength `< 0,02 mol/L`.
- Hydroxide route: pH ≤ 11,0.
- Carbonate route: pH ≤ 9,0.
- Ngoài miền vẫn có thể hiển thị exploratory result nếu solver hội tụ, nhưng hard gate không chấm khoa học và phải gắn cảnh báo.

### 3.5. Parameter contract

Người học điều khiển bảy dimension:

1. Cu concentration trong exploration mode.
2. Batch normalization volume trong exploration mode.
3. Precipitant route.
4. Dose ratio của mỗi addition.
5. Số lần bổ sung dose trước filter.
6. Thứ tự mix–measure–settle–filter.
7. Completion decision.

Mixing time/rpm và settling duration không là numeric parameter vì scenario không có kinetics/jar-test data.

### 3.6. Event budget

- Tối đa 50 dose actions.
- Tối đa 200 accepted events.
- Giới hạn nằm trong release manifest và thấp hơn guest import ceiling.

---

## 4. State machine

```text
prepared
→ route-selected
→ dosed
→ mixed
→ settled
→ filtered
→ measured
→ completed
```

### 4.1. Actions

| Action | Từ state | Điều kiện | Đến state |
| --- | --- | --- | --- |
| `select_route` | `prepared` | route hợp lệ | `route-selected` |
| `add_dose` | `route-selected`/`mixed`/`settled` | chưa filter; ratio trong range | `dosed` |
| `mix` | `dosed` | totals hợp lệ | `mixed` |
| `measure_ph` | `mixed`/`settled` | solver đã hội tụ | giữ state + measurement |
| `settle` | `mixed` | có equilibrium result | `settled` |
| `filter` | `settled` | chưa filter | `filtered` |
| `measure_filtrate_cu` | `filtered` | filter complete | `measured` |
| `complete` | `measured` | validity gate đủ | `completed` |

### 4.2. Invalid transitions

- Settle trước mix: chặn.
- Filter trước settle: chặn.
- Measure dissolved Cu trước filter: chặn label “dissolved”.
- Dose sau filter: chặn; restart/new attempt.
- Thêm dose sau mix/settle: xóa downstream measurement/settling state và bắt buộc mix lại.

### 4.3. Recovery quá liều

Không thêm acid correction trong scenario 1.0.0. Acid có thể hòa tan lại solid và mở thêm cân bằng. Recovery là undo trước filter hoặc restart/new attempt.

### 4.4. Reversibility

| Action | Reversible? | Boundary/restored state |
| --- | --- | --- |
| `select_route` | Có, trước dose | `prepared`, route null |
| `add_dose` | Có nếu là action cuối và chưa mix | khôi phục totals/dose/stage trước addition |
| `mix` | Không | equilibrium result đã tạo; dùng addition mới hoặc restart |
| `measure_ph` | Không cần undo | đo lại bằng event mới |
| `settle` | Không | có thể restart; không xóa lịch sử |
| `filter` | Không | irreversible boundary của batch |
| `measure_filtrate_cu` | Không cần undo | đo lại/report measurement mới nếu UI cho phép |
| `complete` | Không | completed attempt bất biến |

Undo là rollback mô phỏng, không được mô tả như thao tác lấy hóa chất ra khỏi cốc thật.

---

## 5. State model

```ts
type CopperRoute = 'naoh' | 'calcium-hydroxide' | 'sodium-carbonate'

type CopperPrecipitationState = {
  stage: 'prepared' | 'route-selected' | 'dosed' | 'mixed' | 'settled' | 'filtered' | 'measured' | 'completed'
  route: CopperRoute | null

  volumeL: number
  temperatureC: 25.0

  totalsMolL: {
    copper: number
    sulfate: number
    sodium: number
    calcium: number
    inorganicCarbon: number
  }

  doseRatio: number
  equilibrium: CopperEquilibriumResult | null
  solidLocation: 'none' | 'suspended' | 'settled' | 'filter-cake'
  filtrateMeasured: boolean
  evaluationResult: CopperEvaluationResult | null

  modelValid: boolean
  invalidReasonCodes: string[]
}
```

### 5.1. Equilibrium result

```ts
type CopperEquilibriumResult = {
  pH: number
  ionicStrengthMolL: number
  speciesMolL: Record<string, number>
  modeledReferenceSolidPhase: 'none' | 'cupric-hydroxide' | 'malachite'
  solidAmountMolL: number
  saturationIndex: number
  dissolvedCopperTotalMolL: number
  dissolvedCopperFreeMolL: number
  massBalanceRelativeError: Record<'Cu' | 'S' | 'Na' | 'Ca' | 'C', number>
  chargeResidualMolL: number
  solverIterations: number
}
```

---

## 6. Activity model

Ionic strength:

```text
I = 0.5 × sum(z_i² × c_i)
```

Davies ở 25 °C:

```text
log10(gamma_i) = -0.509 z_i² × (sqrt(I)/(1 + sqrt(I)) - 0.3I)
```

Neutral species dùng `gamma = 1`.

```text
activity_i = gamma_i × concentration_i / (1 mol/L)
pH = -log10(activity_H)
activity_OH = 10^-14 / activity_H
```

Davies chỉ dùng trong miền ionic strength đã khóa; không dùng cho brine/high-I.

---

## 7. Species bắt buộc

### 7.1. Dùng cho cả ba route

- H⁺, OH⁻.
- Cu²⁺.
- CuOH⁺.
- Cu(OH)₂(aq).
- Cu(OH)₃⁻.
- Cu(OH)₄²⁻.
- Cu₂(OH)₂²⁺.
- Cu₃(OH)₄²⁺.
- CuSO₄(aq).
- SO₄²⁻, HSO₄⁻.

### 7.2. NaOH/carbonate spectator

- Na⁺, NaSO₄⁻.

### 7.3. Ca(OH)₂

- Ca²⁺, CaOH⁺, CaSO₄(aq).

Không ép gypsum thành solid trong reference concentration.

### 7.4. Carbonate

- CO₂* / H₂CO₃*.
- HCO₃⁻, CO₃²⁻.
- CuHCO₃⁺.
- CuCO₃(aq).
- Cu(CO₃)₂²⁻.
- NaCO₃⁻, NaHCO₃(aq).

---

## 8. Bộ log K 25 °C

Log cơ số 10 theo activity convention.

| Phản ứng | log K |
| --- | ---: |
| H₂O ⇌ H⁺ + OH⁻ | −14,000 |
| H⁺ + CO₃²⁻ ⇌ HCO₃⁻ | 10,329 |
| 2H⁺ + CO₃²⁻ ⇌ CO₂* + H₂O | 16,681 |
| H⁺ + SO₄²⁻ ⇌ HSO₄⁻ | 1,988 |
| Cu²⁺ + H₂O ⇌ CuOH⁺ + H⁺ | −7,96 |
| Cu²⁺ + 2H₂O ⇌ Cu(OH)₂(aq) + 2H⁺ | −16,24 |
| Cu²⁺ + 3H₂O ⇌ Cu(OH)₃⁻ + 3H⁺ | −26,90 |
| Cu²⁺ + 4H₂O ⇌ Cu(OH)₄²⁻ + 4H⁺ | −39,56 |
| 2Cu²⁺ + 2H₂O ⇌ Cu₂(OH)₂²⁺ + 2H⁺ | −10,58 |
| 3Cu²⁺ + 4H₂O ⇌ Cu₃(OH)₄²⁺ + 4H⁺ | −20,76 |
| Cu²⁺ + SO₄²⁻ ⇌ CuSO₄(aq) | 2,36 |
| Cu²⁺ + H⁺ + CO₃²⁻ ⇌ CuHCO₃⁺ | 12,13 |
| Cu²⁺ + CO₃²⁻ ⇌ CuCO₃(aq) | 6,82 |
| Cu²⁺ + 2CO₃²⁻ ⇌ Cu(CO₃)₂²⁻ | 10,60 |
| Na⁺ + SO₄²⁻ ⇌ NaSO₄⁻ | 0,70 |
| Na⁺ + CO₃²⁻ ⇌ NaCO₃⁻ | 1,27 |
| Na⁺ + HCO₃⁻ ⇌ NaHCO₃(aq) | −0,25 |
| Ca²⁺ + SO₄²⁻ ⇌ CaSO₄(aq) | 2,30 |
| Ca²⁺ + H₂O ⇌ CaOH⁺ + H⁺ | −12,78 |

Nguồn:

- Cu constants: [EPA Cuprosolvency report, Table 2, report pp. 10–11](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=30003CGQ.TXT).
- Water/carbonate/spectator: [USGS WATEQ4F database](https://github.com/usgs-coupled-subtrees/phreeqc3-database/blob/master/wateq4f.dat).

Bundle log K là bất biến của scenario 1.0.0.

---

## 9. Solid phase equations

### 9.1. Cu(OH)₂ mới kết tủa

```text
Cu(OH)₂(s) + 2H⁺ ⇌ Cu²⁺ + 2H₂O
log Kd = 8,89
```

Tương đương:

```text
Ksp = aCu × aOH² = 7,76 × 10^-20
```

`log Kd = 8,89` đại diện precipitate bề mặt lớn; không phải giá trị duy nhất cho mọi copper hydroxide: [Schindler và cộng sự, 1965](https://doi.org/10.1002/hlca.19650480528), [EPA report, Cupric Hydroxide Model](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=30003CGQ.TXT).

### 9.2. Malachite

```text
Cu₂CO₃(OH)₂(s) + 2H⁺ ⇌ 2Cu²⁺ + CO₃²⁻ + 2H₂O
log Kd = -5,48
```

Equivalent Ksp:

```text
Ksp = aCu² × aCO3 × aOH² ≈ 3,31 × 10^-34
```

Phép đo sơ cấp báo `3,5 ± 0,6 × 10⁻³⁴` ở 25 °C: [Symes & Kester, 1984](https://doi.org/10.1016/0016-7037(84)90218-7).

### 9.3. Molar mass

| Solid | Molar mass |
| --- | ---: |
| Cu(OH)₂ | 97,560 g/mol |
| Cu₂CO₃(OH)₂ | 221,114 g/mol |

---

## 10. Equilibrium solver

Giải đồng thời:

- Element balance: Cu, S, Na/Ca/C.
- Charge balance.
- Mass-action equations.
- Davies activity coefficients.
- Solid complementarity.

### 10.1. Complementarity

```text
solidAmountMolL >= 0
SI <= 0
solidAmountMolL × SI = 0
```

### 10.2. Hai nhánh

1. Giải không solid, `s = 0`.
2. Nếu SI ≤ 0, nhận nghiệm.
3. Nếu SI > 0, giải nhánh `SI = 0`.
4. Chỉ nhận solid branch khi `s >= 0`.

### 10.3. Numerical method

- Log-activity variables.
- Damped Newton hoặc nonlinear least squares có line search.
- Không dùng một pass stoichiometry đơn giản làm final equilibrium.
- Recompute activity coefficients đến self-consistency.

### 10.4. Convergence

- Relative element residual ≤ 1 × 10⁻⁸ trong solver target.
- Charge residual ≤ 1 × 10⁻¹⁰ mol/L.
- |SI| ≤ 1 × 10⁻⁸ khi solid active.
- Max iterations được ghi calculation trace.
- Không hội tụ: domain error; không commit action.

### 10.5. Mass balance acceptance

Run được chấm khi relative Cu/S/C balance ≤ 1 × 10⁻⁶.

---

## 11. Dissolved Cu và solid mass

Total dissolved Cu:

```text
CuDissolvedTotal =
  [Cu²⁺]
  + [CuOH⁺]
  + [Cu(OH)₂(aq)]
  + [Cu(OH)₃⁻]
  + [Cu(OH)₄²⁻]
  + 2[Cu₂(OH)₂²⁺]
  + 3[Cu₃(OH)₄²⁺]
  + [CuSO₄(aq)]
  + carbonate complexes khi route carbonate
```

### 11.1. Solid moles

```text
sHydroxide = TCu - CuDissolvedTotal
sMalachite = (TCu - CuDissolvedTotal) / 2
```

### 11.2. Solid dry theoretical mass

```text
massMg = 1000 × volumeL × solidAmountMolL × molarMassGmol
```

Output phải gọi “khối lượng kết tủa khô lý thuyết”, không gọi khối lượng bùn.

### 11.3. Removal

```text
removalPercent = 100 × (1 - CuDissolvedTotal / TCu0)
```

---

## 12. Mixing, settling và filtration

### 12.1. Mix

- Chạy equilibrium solver tức thời.
- UI animation duration/rpm không đi vào phương trình.
- Không tuyên bố kinetics.

### 12.2. Settle

- `solidLocation: suspended -> settled`.
- pH, dissolved Cu, solid moles không đổi.
- Không tính settling curve/turbidity/floc size.

### 12.3. Filter

- Giữ 100% modeled solid.
- Cho 100% dissolved species đi qua.
- Đây là định nghĩa ideal separator, không phải experimental efficiency.

### 12.4. Measurement

“Dissolved Cu” là operational output sau filter. EPA Method 200.8 định nghĩa dissolved analyte qua membrane 0,45 µm trước acidification: [Method 200.8, sections 3.3 và 8.2](https://www.epa.gov/sites/default/files/2015-06/documents/epa-200.8.pdf).

Simulator dùng ideal filter boundary, không mô phỏng membrane pore distribution/colloid passage.

---

## 13. Ba process family

### 13.1. NaOH

```text
Select NaOH
→ Dose RNaOH gần 2
→ Mix/equilibrate
→ Measure pH
→ Adjust trước filter nếu thiếu
→ Settle
→ Filter
→ Measure dissolved Cu
```

### 13.2. Ca(OH)₂ đã hòa tan

```text
Select dissolved Ca(OH)₂
→ Dose RCa gần 1
→ Mix/equilibrate
→ Measure
→ Settle
→ Filter
→ Measure filtrate
```

Không có particle dissolution/slurry kinetics.

### 13.3. Na₂CO₃ → malachite

```text
Select Na₂CO₃
→ Dose RC 1,25–1,50
→ Mix/equilibrate closed-carbon system
→ Measure
→ Settle
→ Filter
→ Measure filtrate
```

Không xác nhận phase bằng màu. Carbonate precipitate thực có thể cần aging/XRD để xác định.

---

## 14. Nhánh sai và phục hồi

| Trường hợp | Mã | Hành vi |
| --- | --- | --- |
| Thiếu dose | `DOSE_INSUFFICIENT` | Cu dissolved cao; thêm dose trước filter |
| NaOH quá dose | `HYDROXO_COMPLEX_WARNING` | pH cao; total dissolved Cu có thể tăng; undo/restart |
| Carbonate 1:1 | `CARBONATE_RATIO_LOW` | residual Cu còn đáng kể; thêm trước filter |
| Settle trước mix | `MIX_REQUIRED` | chặn action |
| Filter trước settle | `SETTLE_REQUIRED` | chặn action |
| Measure dissolved trước filter | `FILTER_REQUIRED` | chặn dissolved label |
| Dose sau filter | `BATCH_CLOSED_AFTER_FILTER` | restart/new attempt |
| I quá cao | `IONIC_STRENGTH_OUT_OF_SCOPE` | không chấm model |
| pH ngoài validity | `PH_OUT_OF_MODEL_RANGE` | warning/hard gate |
| Solver fail | `EQUILIBRIUM_NO_CONVERGENCE` | không state/event mới |
| Balance fail | `MASS_BALANCE_FAILED` | invalid run |

---

## 15. Output

### 15.1. Khoa học

- pH.
- Ionic strength.
- Modeled total dissolved Cu after ideal filter, mg/L.
- Free Cu²⁺ mg/L.
- Removal percent.
- Modeled reference solid phase/amount/theoretical dry mass.
- Theoretical Cu retained by ideal filter.
- Saturation index.
- Dose ratio/equivalents.
- Element/charge residuals.

### 15.2. Workflow

- Stage.
- Solid location.
- Blocked action count.
- Mix/settle/filter/measure completion.
- Adjustment count.

Blocked/rejected commands không tạo domain event và không dùng để chấm điểm. Nếu cần UX audit, log thuộc telemetry riêng.

### 15.3. Reagent resource vector

```text
massNaOH_g   = RNaOH × nCu0 × 39.997
massCaOH2_g  = RCa × nCu0 × 74.0927
massNa2CO3_g = RC × nCu0 × 105.9888
```

Report hiển thị reagent mass, equivalents, theoretical solid mass và safety categories. Cost index bên dưới là quy ước sư phạm versioned, không phải bảng giá.

### 15.4. Pedagogical cost index 1.0.0

Coefficients theo mmol reagent: NaOH 1,00; Ca(OH)₂ 1,30; Na₂CO₃ 1,00.

```text
rawCost = nNaOH_mmol×1.00 + nCaOH2_mmol×1.30 + nNa2CO3_mmol×1.00
relativeCostIndex = rawCost / (2 × initialCuMmol)
```

NaOH R=2 benchmark có index 1,00; Ca(OH)₂ R=1 có 0,65; Na₂CO₃ R=1,5 có 0,75. Đây là quy ước giáo dục, không phải giá tiền hoặc kết luận kinh tế.

### 15.5. Pedagogical safety index 1.0.0

```text
safetyIndex = clamp(100 - sum(committedPenaltyPoints), 0, 100)
```

| Penalty code | Điều kiện | Điểm |
| --- | --- | ---: |
| `DOSE_ABOVE_PEDAGOGICAL_WINDOW` | dose ratio vượt upper window nhưng còn trong exploration range | 20 |
| `FINAL_PH_OUTSIDE_6_TO_10_5` | pH final ngoài 6,0–10,5 | 30 |

Model validity fail → index N/A. Hazard profiles CuSO₄/NaOH/Ca(OH)₂/Na₂CO₃ và waste warning luôn hiển thị riêng.

### 15.6. Technical detail

- Species table.
- Activity coefficients.
- Log K/source bundle.
- Solver/convergence trace.

---

## 16. Scoring

### 16.1. Hard validity gate

- Evaluation chạy ở stage `measured`; transition `complete` lưu `evaluationResult` bất biến. Report ở stage `completed` dùng result đó.
- Solver converged.
- Required balances ≤ 1 × 10⁻⁶ relative.
- Ionic strength < 0,02 M.
- Route-specific pH validity.

Fail gate: không có final science score; hiển thị lý do.

### 16.2. Cu removal — 50

| Removal | Điểm |
| --- | ---: |
| ≥99,9% | 50 |
| 99–<99,9% | 40 |
| 95–<99% | 20 |
| <95% | 0 |

### 16.3. pH — 25

| Route | 25 điểm | 10 điểm | 0 điểm |
| --- | --- | --- | --- |
| NaOH/Ca(OH)₂ | 6,5–9,5 | 6,0–<6,5 hoặc >9,5–10,5 | ngoài |
| Na₂CO₃ | 6,5–9,0 | 6,0–<6,5 | ngoài hoặc >9,0 |

### 16.4. Dose — 15

- 15 khi dose trong cửa sổ sư phạm của route.
- 0 khi ngoài cửa sổ.

### 16.5. Workflow — 10

- 2 điểm mỗi bước bắt buộc đã có event hợp lệ: route/dose, mix, settle, filter, filtrate measurement.
- Rejected command không tham gia score.

### 16.6. Pass

- Tổng ≥85.
- Đây là mức đạt mục tiêu bài học, không phải probability hoặc discharge compliance.

---

## 17. Golden cases

Điều kiện: 1 L, 100 mg/L Cu, 25 °C, Davies, carbonate kín, ideal filter.

| ID | Dose | pH | Total dissolved Cu mg/L | Free Cu²⁺ mg/L | Removal % | Solid mg/L |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CP-G00 | Chưa dose | 5,32524 | 100,000 | — | 0 | 0 |
| CP-G01 | NaOH R=1,000 | 6,10400 | 51,1344 | 41,3698 | 48,8656 | 75,0217 Cu(OH)₂ |
| CP-G02 | NaOH R=2,020 | 9,46596 | 0,00324284 | 7,7466×10⁻⁶ | 99,99676 | 153,5216 Cu(OH)₂ |
| CP-G03 | NaOH R=4,000 | 11,45777 | 0,0240016 | 8,6699×10⁻¹⁰ | 99,97600 | 153,4897 Cu(OH)₂ |
| CP-G04 | Ca(OH)₂ R=1,000 | 7,82219 | 0,0302403 | 0,0153416 | 99,96976 | 153,4802 Cu(OH)₂ |
| CP-G05 | Na₂CO₃ R=1,000 | 5,73655 | 5,50795 | 4,48661 | 94,49205 | 164,3968 malachite |
| CP-G06 | Na₂CO₃ R=1,500 | 8,23329 | 0,0175587 | 0,000280679 | 99,98244 | 173,9489 malachite |

### 17.1. Tolerance

- pH ±0,01.
- Dissolved Cu ≥1 mg/L: ±0,5%.
- Dissolved Cu <1 mg/L: max(±2%, ±0,001 mg/L).
- Solid mass ±0,20 mg/L.
- Removal ±0,01 percentage point.
- Cu mass balance relative ≤ 1 × 10⁻⁶.

### 17.2. CP-G03

Đây là failure/regression case. Nó kiểm tra việc total dissolved Cu tăng lại do hydroxo-complex dù free Cu²⁺ rất thấp. Case ngoài pH scoring/model validity; không dùng làm dự báo thực tế.

CP-G00 dùng tolerance pH ±0,01 và dissolved Cu ±0,001 mg/L.

---

## 18. Invariant

1. Cu total = dissolved Cu + solid Cu trong tolerance.
2. Sulfate total conserved.
3. Na/Ca/C total conserved theo route.
4. Charge residual đạt tolerance.
5. Solid moles không âm.
6. Active solid có SI gần 0.
7. Settle không đổi chemistry.
8. Filter không đổi dissolved species trong ideal model.
9. Filter cake Cu + filtrate dissolved Cu = total Cu.
10. Same state/action/version cho same output.

---

## 19. Giới hạn khoa học

- Equilibrium, không kinetics.
- Cu(OH)₂ có thể aging thành CuO.
- Basic copper sulfate có thể xuất hiện tùy chemistry/order.
- Carbonate precipitate có thể amorphous/basic trước malachite.
- Hydrolysis constants có uncertainty; golden chỉ đúng với bundle khóa.
- Davies không dùng cho high-I.
- Complexant/organics/multi-metal làm model vô hiệu.
- Ca(OH)₂ slurry ngoài scope.
- Ideal filter không đại diện capture fraction thực.
- Không có jar-test, floc size, turbidity hoặc sludge volume.

EPA nhấn mạnh pH/liều tối ưu của nước thải thật phải jar-test trên matrix đó: [EPA MP&M Development Document, Chapter 8](https://www.epa.gov/sites/default/files/2015-11/documents/mp-m_dd_2003.pdf).

---

## 20. An toàn

UI hiển thị:

> Đây không phải hướng dẫn tự làm thí nghiệm. Nếu thực hiện trong phòng thí nghiệm, phải có người phụ trách, PPE và quy trình thu gom chất thải. CuSO₄ có hại khi nuốt, gây kích ứng và rất độc với sinh vật thủy sinh. NaOH ăn mòn mạnh. Không đổ dung dịch hoặc filter cake chứa Cu xuống cống.

Nguồn:

- [PubChem — Copper sulfate](https://pubchem.ncbi.nlm.nih.gov/compound/24463)
- [NIOSH — Sodium hydroxide](https://www.cdc.gov/niosh/npg/npgd0565.html)
- [NIOSH — Calcium hydroxide](https://www.cdc.gov/niosh/chemicals/pel88/pell-pages/1305-62.html)

---

## 21. Ma trận nguồn chính

| Source key | Nguồn | Claim được hỗ trợ |
| --- | --- | --- |
| `EPA-CUPROSOLVENCY` | [EPA report](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=30003CGQ.TXT) | log K Cu, uncertainty, CuOH₂/malachite models |
| `USGS-WATEQ4F` | [wateq4f.dat](https://github.com/usgs-coupled-subtrees/phreeqc3-database/blob/master/wateq4f.dat) | water/carbonate/sulfate/Na/Ca constants |
| `USGS-PHREEQC-V3` | [PHREEQC v3 manual](https://water.usgs.gov/water-resources/software/PHREEQC/Phreeqc_3_2013_manual.pdf) | activity/speciation/equilibrium convention |
| `SYMES-KESTER-1984` | [Malachite solubility](https://doi.org/10.1016/0016-7037(84)90218-7) | Ksp malachite |
| `SCHINDLER-1965` | [Cu oxide/hydroxide solubility](https://doi.org/10.1002/hlca.19650480528) | surface/particle dependence |
| `ZUEHLKE-KESTER-1983` | [Cu carbonate complexes](https://doi.org/10.1016/0304-4203(83)90015-4) | complexation/free Cu limitation |
| `EPA-MPM-2003` | [MP&M Development Document](https://www.epa.gov/sites/default/files/2015-11/documents/mp-m_dd_2003.pdf) | precipitation process, jar-test limitation |
| `EPA-PRECIP-FACTSHEET` | [Chemical precipitation fact sheet](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT) | mix/settle/separate stages |
| `EPA-METHOD-2008` | [Method 200.8](https://www.epa.gov/sites/default/files/2015-06/documents/epa-200.8.pdf) | dissolved definition/filter before acid |
| `HSU-1956` | [CuSO₄/Na₂CO₃ precipitation](https://doi.org/10.1002/jctb.5010060207) | basic carbonate/aging |
| `TANAKA-1991` | [Basic copper sulfate](https://doi.org/10.1016/0040-6031(91)80012-8) | possible sulfate phases |
| `BALTPURVINS-1996` | [Lime precipitation](https://doi.org/10.1016/S0956-053X(97)00014-7) | lime/secondary phase/kinetic limitation |
| `PUBCHEM-CUSO4` | [PubChem Copper sulfate](https://pubchem.ncbi.nlm.nih.gov/compound/24463) | safety wording |

### 21.1. Route-to-claim mapping

| Route/action | Equation/data claim | Claim IDs | Applicability |
| --- | --- | --- | --- |
| NaOH | Cu hydrolysis + fresh Cu(OH)₂ reference phase | CP-SPECIES-BUNDLE, CP-CUOH2-PHASE | synthetic CuSO₄, Davies, pH≤11 |
| Ca(OH)₂ | same Cu phase + Ca/SO₄ species | CP-SPECIES-BUNDLE, CP-CUOH2-PHASE | dissolved Ca(OH)₂ only, I<0,02 |
| Na₂CO₃ | carbonate complexes + malachite reference phase | CP-SPECIES-BUNDLE, CP-MALACHITE-PHASE, CP-CARBONATE-PHASE-LIMIT | closed carbonate, pH≤9 |
| Mix/settle/filter | equilibrium then ideal physical state transitions | CP-MIX-SETTLE-FILTER, CP-FILTER-IDEAL | no kinetics/capture fraction |
| Dissolved measurement | 0,45 µm operational concept | CP-DISSOLVED-MEASUREMENT | simulator filter remains ideal |

Chi tiết mapping cấp claim nằm tại [Scientific Evidence Register](../scientific-evidence-register.md).

---

## 22. Tiêu chí nghiệm thu

- CP-G00 initial oracle và CP-G01…G06 đạt tolerance tương ứng.
- Solver convergence/invariant đạt toàn case.
- Total dissolved Cu tính đủ species, khác free Cu.
- NaOH/CaOH route dùng Cu(OH)₂; carbonate dùng malachite.
- Invalid transition không đổi state.
- Settle/filter semantics đúng định nghĩa.
- CP-G03 tạo hydroxo-complex warning/out-of-range.
- Scoring hard gate hoạt động.
- `measured → completed` lưu evaluation result; completed report không tự fail stage gate.
- Workflow score dựa trên năm event hợp lệ, không dựa rejected commands.
- Report hiển thị reagent mass/equivalents/theoretical solid và safety categories.
- Report ghi ideal filter/equilibrium/synthetic solution disclaimers.
- UI không dùng “pH tối ưu nước thải”, “bùn thực”, “đạt pháp luật”.
- Replay deterministic.

---

## 23. Tài liệu liên quan

- [Core Project Scope](../core-project-scope.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
- [Scientific Evidence Register](../scientific-evidence-register.md)
