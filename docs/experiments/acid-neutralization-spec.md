# ĐẶC TẢ THÍ NGHIỆM 1 — TRUNG HÒA DUNG DỊCH AXIT

**Scenario key:** `acid-neutralization`<br>
**Scenario version:** `1.0.0`<br>
**State schema version:** `1`<br>
**Trạng thái nội dung:** Đủ điều kiện triển khai mô hình giáo dục; chưa kiểm chứng bench bởi đội<br>
**Nhiệt độ mô hình:** 25,0 °C<br>
**Ngôn ngữ:** Tiếng Việt

> Đây là mô phỏng giáo dục cho dung dịch HCl tổng hợp có thành phần đã biết. Kết quả không dùng để chọn liều hóa chất cho nước thải thật, không chứng minh đạt quy chuẩn xả thải và không thay thế phép chuẩn độ hoặc đánh giá trong phòng thí nghiệm.

> **Nhãn bắt buộc:** Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Đặc tả mô hình trung hòa HCl bằng NaOH, Ca(OH)₂ hoặc Na₂CO₃ ở 25 °C. |
| 👥 **Dành cho** | Chemistry engine, content, frontend giải thích và QA khoa học. |
| ✅ **Sau khi đọc** | Có đủ state, action, solver, scoring, golden cases và giới hạn để triển khai. |
| ⚠️ **Lưu ý** | pH* là mô hình nồng độ lý tưởng; route carbonate dùng hệ carbon vô cơ kín. |

## Đọc tài liệu này khi nào?

- Khi triển khai hoặc kiểm tra Acid Neutralization domain module.
- Khi viết calculation trace, phản hồi hoặc scoring của bài trung hòa.
- Khi thay constant bundle, exploration range hoặc golden fixture.

## Các quyết định chính

- Benchmark dùng 25,00 mL HCl 0,01000 M; exploration vẫn giới hạn HCl và 25 °C.
- NaOH dùng nghiệm charge balance liên tục; Ca(OH)₂ tính thêm CaOH⁺.
- Na₂CO₃ bắt buộc giải cân bằng carbonate kín, không chỉ đếm hai đương lượng.
- Dung dịch Ca(OH)₂ phải trong, đã lọc và chuẩn hóa; vôi sữa nằm ngoài model.
- Measurement cũ bị vô hiệu ngay khi thêm hóa chất mới.

## Mục lục

<!-- TOC:START -->
- [1. Mục tiêu giáo dục](#1-mục-tiêu-giáo-dục)
- [2. Kịch bản chuẩn](#2-kịch-bản-chuẩn)
- [3. Miền đầu vào](#3-miền-đầu-vào)
- [4. Mô hình trạng thái](#4-mô-hình-trạng-thái)
- [5. Hành động và điều kiện](#5-hành-động-và-điều-kiện)
- [6. Hằng số mô hình](#6-hằng-số-mô-hình)
- [7. Thuật toán NaOH](#7-thuật-toán-naoh)
- [8. Thuật toán Ca(OH)₂](#8-thuật-toán-caoh)
- [9. Thuật toán Na₂CO₃](#9-thuật-toán-naco)
- [10. Dữ liệu giải thích phép tính bắt buộc](#10-dữ-liệu-giải-thích-phép-tính-bắt-buộc)
- [11. Các chiến lược định liều hợp lệ](#11-các-chiến-lược-định-liều-hợp-lệ)
- [12. Nhánh sai và phục hồi](#12-nhánh-sai-và-phục-hồi)
- [13. Kết quả trả về](#13-kết-quả-trả-về)
- [14. Cách chấm điểm](#14-cách-chấm-điểm)
- [15. Các ca chuẩn (golden cases)](#15-các-ca-chuẩn-golden-cases)
- [16. Kiểm tra hợp lệ và bất biến](#16-kiểm-tra-hợp-lệ-và-bất-biến)
- [17. Giả định và giới hạn](#17-giả-định-và-giới-hạn)
- [18. An toàn và cách diễn đạt](#18-an-toàn-và-cách-diễn-đạt)
- [19. Những tính năng loại khỏi scenario 1.0.0](#19-những-tính-năng-loại-khỏi-scenario-100)
- [20. Ma trận nguồn chính](#20-ma-trận-nguồn-chính)
- [21. Tiêu chí nghiệm thu thí nghiệm](#21-tiêu-chí-nghiệm-thu-thí-nghiệm)
- [22. Tài liệu liên quan](#22-tài-liệu-liên-quan)
<!-- TOC:END -->

---


## 1. Mục tiêu giáo dục

Người học phải:

- Hiểu pH ban đầu không đồng nghĩa với tổng độ acid của một mẫu chưa biết.
- Sử dụng số mol và đương lượng để ước lượng liều trung hòa.
- Nhìn thấy độ nhạy của pH gần vùng tương đương.
- Chọn aliquot nhỏ hơn khi tiến gần mục tiêu.
- So sánh NaOH, Ca(OH)₂ và Na₂CO₃ trong cùng điều kiện đương lượng.
- Nhận biết Na₂CO₃ không thể được mô phỏng đúng bằng quy tắc “2 mol H⁺ trên 1 mol CO₃²⁻” nếu cần pH cuối.
- Hiểu giới hạn của mô hình nồng độ lý tưởng và hệ carbon kín.

---


## 2. Kịch bản chuẩn

### 2.1. Mẫu axit

| Đại lượng | Giá trị chuẩn |
| --- | ---: |
| Dung dịch | HCl trong nước tinh khiết |
| Thể tích ban đầu | 25,00 mL |
| Nồng độ HCl | 0,01000 mol/L |
| Số mol HCl | 0,2500 mmol |
| pH* ban đầu | 2,00000 |
| Nhiệt độ | 25,0 °C |
| Áp suất tham chiếu | 0,1 MPa |

Dấu `*` trong pH* nghĩa là pH mô hình dùng nồng độ H⁺ và hệ số hoạt độ bằng 1. IUPAC định nghĩa pH bằng hoạt độ H⁺; vì vậy UI phải ghi “pH mô phỏng” ở phần kỹ thuật: [IUPAC Gold Book — pH](https://goldbook.iupac.org/terms/view/P04524).

### 2.2. Chất trung hòa

Ba dung dịch có cùng nồng độ đương lượng 0,01000 eq/L:

| Route | Nồng độ mol | Số đương lượng mỗi mol | Nồng độ đương lượng |
| --- | ---: | ---: | ---: |
| NaOH | 0,01000 mol/L | 1 | 0,01000 eq/L |
| Ca(OH)₂ | 0,005000 mol/L | 2 | 0,01000 eq/L |
| Na₂CO₃ | 0,005000 mol/L | 2 danh nghĩa | 0,01000 eq/L danh nghĩa |

Ca(OH)₂ phải được mô tả là **dung dịch trong đã lọc và chuẩn hóa**, không phải vôi sữa hoặc huyền phù. Nồng độ này thấp hơn đáng kể độ tan khoảng 0,0203 molal ở 25 °C được báo cáo trong nghiên cứu NBS/NIST: [Bates và cộng sự, mục 5.1](https://nvlpubs.nist.gov/nistpubs/jres/56/jresv56n6p305_A1b.pdf).

### 2.3. HCl hiệu chỉnh

- Benchmark: HCl 0,01000 mol/L; exploration: correction HCl concentration bằng sample HCl concentration.
- Chỉ mở sau khi pH đã vượt dải mục tiêu.
- Benchmark cap 0–6,25 mL; exploration cap 0–0,25× initial sample volume.
- Không gọi đây là “hoàn tác”; đây là một phản ứng hiệu chỉnh mới, có chi phí và lịch sử riêng.

### 2.4. Mục tiêu

| Đại lượng | Giá trị |
| --- | ---: |
| pH* trung tâm | 6,995 |
| Dải đạt nội bộ | 6,795–7,195 |
| UI làm tròn | 6,80–7,20 |

Dải này là rubric sư phạm, không phải ngưỡng pháp luật hoặc tuyên bố nước an toàn.

---


## 3. Miền đầu vào

### 3.1. Liều chất trung hòa benchmark

| Route | Tổng thể tích cho phép | Ý nghĩa |
| --- | ---: | --- |
| NaOH | 0–30,00 mL | 0–120% đương lượng acid |
| Ca(OH)₂ | 0–30,00 mL | 0–120% đương lượng acid |
| Na₂CO₃ | 0–50,00 mL | 0–200% khả năng nhận 2 H⁺ danh nghĩa |

Exploration scale theo sample:

```text
maxNaOHVolumeL = 1.20 × initialAcidEquivalents / baseEquivalentConcentration
maxCaOH2SolutionVolumeL = 1.20 × initialAcidEquivalents / baseEquivalentConcentration
maxNa2CO3SolutionVolumeL = 2.00 × initialAcidEquivalents / baseEquivalentConcentration
maxCorrectionHClVolumeL = 0.25 × initialAcidVolumeL
```

Vì exploration giữ base equivalent concentration bằng HCl concentration, các giới hạn tương đương 1,20× thể tích mẫu cho NaOH/Ca(OH)₂ và 2,00× cho Na₂CO₃. Ví dụ sample 50 mL có cap 60 mL và 100 mL tương ứng.

### 3.2. Cỡ aliquot

- 0,05 mL.
- 0,10 mL.
- 0,50 mL.
- 1,00 mL.
- 5,00 mL.

Không cho nhập aliquot tùy ý trong scenario 1.0.0. Việc dùng tập giá trị cố định giúp kiểm thử, so sánh và tránh precision input không có ý nghĩa thực hành.

### 3.3. Quy tắc route

- Chọn đúng một route trước lần thêm đầu tiên.
- Sau khi đã thêm chất trung hòa, không đổi route.
- Không trộn Ca²⁺ với carbonate trong cùng lượt vì sẽ mở thêm cân bằng/kết tủa ngoài mô hình.
- Muốn thử route khác phải tạo lượt mới hoặc branch từ trạng thái ban đầu.

### 3.4. Hợp đồng tham số

Benchmark cố định sample, temperature và stock concentrations để giữ evidence validity. Người học điều khiển sáu dimension có ý nghĩa:

1. Neutralizer route.
2. Aliquot size.
3. Cumulative base dose.
4. Addition/mix/measure sequence.
5. HCl correction aliquot khi quá liều.
6. Completion decision.

### 3.5. Chế độ khám phá

Ngoài benchmark, người học có thể thay đổi:

- HCl volume: 25,00–50,00 mL.
- HCl concentration: 0,00500–0,02000 mol/L.
- Stock equivalent concentration luôn bằng HCl concentration:
  - NaOH molarity = `CHCl`.
  - Ca(OH)₂ molarity = `CHCl/2`.
  - Na₂CO₃ molarity = `CHCl/2`.
- Target pH* center: 6,5–7,5, step 0,1; tolerance ±0,2.

Nhiệt độ vẫn khóa 25 °C và acid vẫn là HCl. Golden/benchmark score dùng mục tiêu 6,995. Exploration tính route-specific `E*` bằng solver cho target được chọn và gắn nhãn “ngoài benchmark chuẩn”.

### 3.6. Giới hạn sự kiện

- Tối đa 120 reagent additions trong một attempt.
- Tối đa 500 accepted events toàn attempt.
- Khi đạt giới hạn trước goal, UI yêu cầu bắt đầu lượt mới với aliquot lớn hơn; import không cắt bớt event.

---


## 4. Mô hình trạng thái

### 4.1. State bất biến

```ts
type AcidNeutralizationConstants = {
  temperatureC: 25.0
  pressureMPa: 0.1
  acidVolumeL: number
  acidConcentrationMolL: number
  baseEquivalentConcentrationEqL: number
  kw: number
  carbonateKa1: number
  carbonateKa2: number
  calciumHydrolysisK: number
  targetPH: number
  targetTolerancePH: 0.200
}
```

### 4.2. State thay đổi

```ts
type AcidNeutralizationState = {
  route: 'naoh' | 'calcium-hydroxide' | 'sodium-carbonate' | null
  phase: 'setup' | 'ready' | 'mixed' | 'stable' | 'completed'
  compositionRevision: number

  totalVolumeL: number
  chlorideMoles: number
  sodiumMoles: number
  calciumMoles: number
  totalInorganicCarbonMoles: number

  baseVolumeL: number
  correctionAcidVolumeL: number
  aliquotHistory: AliquotRecord[]
  directionChangeCount: number

  meterCalibrated: boolean
  mixedSinceLastAddition: boolean
  readingStable: boolean
  lastMeasuredPH: number | null
  lastMeasuredCompositionRevision: number | null
  measurements: Array<{
    sequence: number
    compositionRevision: number
    simulatedPH: number
    baseVolumeL: number
    correctionAcidVolumeL: number
  }>

  equilibrium: AcidEquilibriumResult | null
  modelValid: boolean
  invalidReasonCodes: string[]
}
```

### 4.3. AcidEquilibriumResult

```ts
type AcidEquilibriumResult = {
  hydrogenMolL: number
  hydroxideMolL: number
  simulatedPH: number
  chargeBalanceResidualMolL: number
  calciumMolL?: number
  calciumHydroxideComplexMolL?: number
  totalInorganicCarbonMolL?: number
  carbonFractions?: {
    co2Star: number
    bicarbonate: number
    carbonate: number
  }
}
```

---


## 5. Hành động và điều kiện

| Action type | Điều kiện trước | State thay đổi | Có event |
| --- | --- | --- | --- |
| `select_route` | chưa thêm base | route | Có |
| `calibrate_meter` | chưa completed | meterCalibrated | Có |
| `add_base` | route đã chọn; aliquot hợp lệ; chưa completed | inventory/volume; compositionRevision+1; xóa reading/equilibrium cũ | Có |
| `mix` | có addition chưa trộn | mixed=true; readingStable=false | Có |
| `wait_for_stable_reading` | đã trộn | readingStable=true | Có |
| `measure_ph` | meter calibrated; mixed; stable | lastMeasuredPH | Có |
| `add_correction_acid` | pH đo vượt target high | chloride/volume; compositionRevision+1; xóa reading/equilibrium cũ | Có |
| `complete` | pH đo ổn định; model valid | completed | Có |
| `restart` | mọi trạng thái chưa bị xóa | dừng lượt; tạo lượt mới | Không phải action trong lượt cũ |

### 5.1. Khả năng hoàn tác

| Action | Reversible? | Boundary/restored state |
| --- | --- | --- |
| `select_route` | Có, nếu chưa addition | trả route về null |
| `calibrate_meter` | Không cần undo | có thể calibrate lại bằng event mới |
| `add_base` | Không | phản ứng hóa học; dùng correction hoặc restart |
| `mix` / `wait_for_stable_reading` / `measure_ph` | Không | thêm event mới, không xóa lịch sử |
| `add_correction_acid` | Không | restart nếu không muốn giữ correction |
| `complete` | Không | completed attempt bất biến |

Vì vậy nút undo chemistry không xuất hiện trong bài này; generic undo service chỉ áp dụng `select_route` khi nó là action cuối.

### 5.2. Measurement freshness

Mọi addition phải atomically đặt:

```text
mixedSinceLastAddition = false
readingStable = false
lastMeasuredPH = null
lastMeasuredCompositionRevision = null
equilibrium = null
modelValid = false
```

`mix` giải lại equilibrium cho composition revision hiện tại. `measure_ph` gắn `compositionRevision`; `complete` chỉ nhận measurement có revision bằng state hiện tại.

### 5.3. Không mô phỏng động học máy đo

`wait_for_stable_reading` là quy tắc thao tác. Không dùng số giây để tuyên bố tốc độ phản ứng hoặc thời gian cân bằng thật. Tài liệu lab yêu cầu chờ số đọc ổn định và giảm aliquot gần vùng dốc nhưng không đưa một thời gian chung cho mọi điện cực: [Valencia College, tr. 71](https://frontdoor.valenciacollege.edu/file/vprasadpermaul/CHM%201046%20Experimental%20Lab%20Manual%20-%20Barnett%20-%20First%20Edition%202012.pdf), [Florida State University — Procedure](https://www.chem.fsu.edu/chemlab/chm3120l/acid/procedure.html).

---


## 6. Hằng số mô hình

| Hằng số | Giá trị implementation | Điều kiện/nguồn |
| --- | ---: | --- |
| `pKw` | 13,990 | 25 °C, 0,1 MPa; [IAPWS R11-24](https://iapws.org/documents/release/Ionization.download) |
| `Kw` | 1,023292992 × 10⁻¹⁴ | Tính từ pKw |
| `pKa1`, CO₂* | 6,352 | PHREEQC official data |
| `Ka1` | 4,446312675 × 10⁻⁷ | Tính từ pKa1 |
| `pKa2` | 10,329 | PHREEQC official data |
| `Ka2` | 4,688133821 × 10⁻¹¹ | Tính từ pKa2 |
| `log10 Kh,Ca` | −12,780 | Ca²⁺ + H₂O ⇌ CaOH⁺ + H⁺ |
| `Kh,Ca` | 1,659586907 × 10⁻¹³ | Tính từ log K |

Hằng số carbonate và CaOH⁺ tham chiếu cơ sở dữ liệu PHREEQC của USGS: [PHREEQC User Guide, Attachment B](https://pubs.usgs.gov/wri/1995/4227/report.pdf).

### 6.1. Quy tắc không trộn nguồn

- Bộ hằng số trên là một bundle bất biến của scenario 1.0.0.
- Không thay riêng một hằng số mà giữ scenario release.
- Không dùng golden case tạo từ bộ hằng số khác để đánh giá implementation.

### 6.2. Quy ước khác bài Cu

Bài này dùng `pKw=13,990` và pH* concentration-ideal theo bundle IAPWS/USGS đã khóa. Bài Cu dùng activity model Davies và database convention `log Kw=-14,000`. Không so chữ số pH chi tiết giữa hai bài như cùng một thang mô hình.

---


## 7. Thuật toán NaOH

Đặt:

- `h = [H⁺]`.
- `V` là tổng thể tích L.
- `nCl` là mol chloride từ HCl ban đầu và HCl hiệu chỉnh.
- `nNa` là mol sodium từ NaOH.

```text
D = (nCl - nNa) / V
```

Cân bằng điện tích với tự ion hóa nước:

```text
h - Kw/h = D
```

Nghiệm:

```text
h = (D + sqrt(D² + 4Kw)) / 2        khi D >= 0
h = 2Kw / (sqrt(D² + 4Kw) - D)     khi D < 0
pH* = -log10(h)
```

Công thức dạng ổn định cho `D < 0` tránh mất chữ số do trừ hai số gần nhau.

Không dùng logic ba đoạn acid dư/tương đương/base dư ở gần điểm tương đương.

---


## 8. Thuật toán Ca(OH)₂

Tổng calcium:

```text
CCaT = nCa / V
chloride = nCl / V
r = Kh,Ca / h
[Ca²⁺] = CCaT / (1 + r)
[CaOH⁺] = r × CCaT / (1 + r)
```

Giải theo `pH*`:

```text
f(h) = h + 2[Ca²⁺] + [CaOH⁺] - Kw/h - [Cl⁻] = 0
```

### 8.1. Solver

- Solve biến pH trong `[-2, 16]`.
- Bisection hoặc Brent có bracket.
- Tối đa 100 vòng.
- Stop khi width < 1 × 10⁻¹⁰ pH hoặc `|f| < 1 × 10⁻¹² mol/L`.
- Không hội tụ/bracket fail: trả domain error; không tạo state mới.

### 8.2. Không có pha rắn Ca(OH)₂

Scenario giả định dung dịch trong. Nếu triển khai UI có “vôi sữa”, đó là phạm vi khác và không được gọi engine này.

---


## 9. Thuật toán Na₂CO₃

### 9.1. Mô hình carbon vô cơ kín

Đặt `CO₂* = CO₂(aq) + H₂CO₃` và tổng carbon ở pha nước được bảo toàn.

```text
CT = nCT / V
[Na⁺] = 2nCT / V
[Cl⁻] = nCl / V

delta = h² + Ka1×h + Ka1×Ka2
alpha0 = h² / delta
alpha1 = Ka1×h / delta
alpha2 = Ka1×Ka2 / delta

[CO₂*] = alpha0×CT
[HCO₃⁻] = alpha1×CT
[CO₃²⁻] = alpha2×CT
```

Cân bằng điện tích:

```text
f(h) = h + [Na⁺] - Kw/h - [Cl⁻] - CT(alpha1 + 2alpha2) = 0
```

### 9.2. Solver

- Solve theo pH trong `[-2, 16]`.
- Bisection/Brent có bracket.
- Tối đa 100 vòng.
- Width < 1 × 10⁻¹⁰ pH.
- `|f| < 1 × 10⁻¹² mol/L`.
- Sau solve, kiểm tra `alpha0 + alpha1 + alpha2 = 1` trong tolerance.

### 9.3. Hệ quả quan trọng

- 25,00 mL Na₂CO₃ có đúng 2 H⁺ capacity danh nghĩa nhưng pH* khoảng 4,47992.
- Để đạt pH* gần 6,995 trong hệ kín cần khoảng 42,198 mL.
- UI phải giải thích đây là cân bằng carbonate, không phải bug.

### 9.4. Giới hạn khí

Không mô phỏng CO₂ thoát ra hoặc hấp thụ từ không khí. USGS ghi nhận trao đổi CO₂ có thể thay đổi pH đáng kể: [USGS Alkalinity Calculator FAQ, mục 3.1](https://or.water.usgs.gov/alk/faq.html).

Không trả “thể tích CO₂ phát thải”. `[CO₂*]` là carbon hòa tan trong mô hình.

---


## 10. Dữ liệu giải thích phép tính bắt buộc

### 10.1. NaOH

- Total volume.
- nCl, nNa.
- D.
- Kw.
- h, OH, pH*.
- Charge balance residual.

### 10.2. Ca(OH)₂

- Total calcium.
- Kh,Ca.
- Ca²⁺ và CaOH⁺.
- Chloride.
- h, OH, pH*.
- Solver iterations/residual.

### 10.3. Na₂CO₃

- Total inorganic carbon.
- Na, Cl.
- Ka1, Ka2, Kw.
- alpha0/1/2.
- Concentration từng species.
- h, OH, pH*.
- Solver iterations/residual.

Trace lưu full precision; UI format riêng.

---


## 11. Các chiến lược định liều hợp lệ

Chemical route là NaOH, Ca(OH)₂ hoặc Na₂CO₃. Các mục dưới đây là `dosingStrategy`; không phải route hóa học mới.

### 11.1. Tính trước rồi tinh chỉnh

1. Hiệu chuẩn máy đo.
2. Tính khoảng 80% thể tích mục tiêu của route.
3. Thêm tối đa 5,00 mL mỗi lần trong vùng xa mục tiêu.
4. Trộn và đo.
5. Giảm xuống 0,50 mL, sau đó 0,10/0,05 mL gần mục tiêu.

### 11.2. Titration phản hồi hoàn toàn

1. Bắt đầu bằng aliquot 5,00 mL.
2. Trộn và đo sau mỗi addition.
3. Khi pH > 5,8 hoặc độ dốc tăng rõ, giảm aliquot.
4. Dùng 0,10/0,05 mL trong vùng 6,5–7,3.

### 11.3. Lượt thăm dò rồi lượt chính xác

1. Lượt đầu tìm vùng dốc bằng aliquot thô.
2. Tạo lượt mới từ mẫu HCl mới.
3. Đưa nhanh đến trước vùng dốc.
4. Tinh chỉnh bằng aliquot nhỏ.

Không rewind mẫu hóa học cũ.

### 11.4. Route carbonate có kiểm soát

- Không dừng ở 25,00 mL chỉ vì đủ đương lượng danh nghĩa.
- Đến khoảng 35 mL bằng aliquot phù hợp.
- Từ 40 mL dùng 0,05–0,10 mL.
- Luôn hiển thị “mô hình carbon kín”.

---


## 12. Nhánh sai và phục hồi

| Trường hợp | Mã | Hậu quả mô hình | Hành động hợp lệ |
| --- | --- | --- | --- |
| Chưa hiệu chuẩn | `METER_NOT_CALIBRATED` | không cho measure | calibrate |
| Thêm nhưng chưa trộn | `SAMPLE_NOT_MIXED` | không cho stable reading | mix |
| Chưa ổn định | `READING_NOT_STABLE` | không cho quyết định complete | wait/measure |
| Thiếu base | `TARGET_LOW` | pH dưới dải | thêm aliquot nhỏ |
| Quá base | `TARGET_HIGH` | pH trên dải | HCl correction hoặc restart |
| Đổi route | `ROUTE_LOCKED` | ngoài mô hình | new attempt/branch initial |
| Ca(OH)₂ đục/rắn | `CALCIUM_SOLUTION_INVALID` | ngoài mô hình | restart với dung dịch trong |
| Carbonate để hở | `CO2_EXCHANGE_UNMODELED` | không so pH tuyệt đối | restart/ghi giới hạn |
| Ngoài nhiệt độ | `TEMPERATURE_OUT_OF_SCOPE` | hằng số không hợp lệ | đưa về 25 °C |
| Solver fail | `EQUILIBRIUM_NO_CONVERGENCE` | không có kết quả | không commit action |

---


## 13. Kết quả trả về

### 13.1. Khoa học

- pH* cuối.
- H và OH concentration.
- Tổng thể tích.
- Tổng mL/mmol hóa chất.
- Base equivalent percent.
- Route-specific species.
- Charge/material balance residual.
- Target status.
- Tổng acid/base equivalents đã phản ứng theo route.
- Acid/base mạnh dư cho NaOH/Ca(OH)₂ hoặc carbonate species distribution cho Na₂CO₃.
- Measurement curve gồm sequence, cumulative dose và pH*.

### 13.2. Quy trình

- Số aliquot.
- Cỡ aliquot cuối.
- Số lần đổi chiều base/acid.
- Calibration/mixing/stable-reading compliance.
- Resource vector: reagent moles, equivalents, solute mass, operation count và correction amount.
- Hazard profile theo reagent và pedagogical safety index; không trình bày index như đại lượng khoa học.

Blocked/rejected commands không tạo domain event và không dùng để chấm điểm. Nếu sản phẩm cần audit UX, log đó thuộc telemetry riêng, không tham gia replay khoa học.

### 13.3. Reagent mass

```text
massNaOH_g   = nNaOH × 39.997
massCaOH2_g  = nCaOH2 × 74.0927
massNa2CO3_g = nNa2CO3 × 105.9888
massHCl_g    = nCorrectionHCl × 36.4609
```

### 13.4. Chỉ số chi phí sư phạm 1.0.0

Không dùng tiền tệ hoặc giá thị trường. Coefficient theo mmol reagent:

| Reagent | Coefficient |
| --- | ---: |
| NaOH | 1,00 |
| Ca(OH)₂ | 1,30 |
| Na₂CO₃ | 1,00 |
| HCl correction | 1,00 |

```text
rawCost = nNaOH_mmol×1.00 + nCaOH2_mmol×1.30
        + nNa2CO3_mmol×1.00 + nCorrectionHCl_mmol×1.00
relativeCostIndex = rawCost / initialHClMmol
```

Benchmark stoichiometric NaOH có index 1,00. Coefficients là quy ước giáo dục versioned, được lựa chọn để minh họa khác biệt lượng thuốc thử/handling; không phải báo giá.

### 13.5. Chỉ số an toàn sư phạm 1.0.0

```text
safetyIndex = clamp(100 - sum(committedPenaltyPoints), 0, 100)
```

| Penalty code | Điều kiện committed | Điểm |
| --- | --- | ---: |
| `EXCESS_BASE_OVER_110_PERCENT_TARGET` | base equivalents >110% route-specific E* | 20 |
| `CORRECTION_ACID_USED` | có HCl correction event | 15 |
| `FINAL_PH_OUTSIDE_6_TO_8` | complete exploration với pH* <6 hoặc >8 | 30 |

Model invalid → safety index N/A. Hazard profile HCl/NaOH/Ca(OH)₂/Na₂CO₃ luôn hiển thị riêng và không bị che bởi index.

### 13.6. Hiển thị

- pH: 2 chữ số thập phân ở summary; technical view tối đa 5.
- Volume: 2 chữ số mL.
- mmol: 4 significant figures khi phù hợp.
- Không làm tròn state nội bộ.

---


## 14. Cách chấm điểm

### 14.1. Success

```text
success = modelValid
       && meterCalibrated
       && readingStable
       && lastMeasuredCompositionRevision == compositionRevision
       && abs(pH* - targetPH) <= targetTolerancePH
```

### 14.2. pH score — 60 điểm

```text
SpH = 60 × clamp(1 - abs(pH* - targetPH) / 0.50, 0, 1)
```

### 14.3. Resource score — 20 điểm

`E*` là tổng equivalent base tối thiểu của route để đạt target pH*. Bảng dưới là benchmark 6,995:

| Route | E* |
| --- | ---: |
| NaOH | 0,2500 mmol eq |
| Ca(OH)₂ | xấp xỉ 0,2500002 mmol eq |
| Na₂CO₃ kín | 0,4219783 mmol eq |

`Egross` bằng tổng equivalent base cộng equivalent HCl correction. Chỉ tính khi final measurement hợp lệ và `Egross > 0`; nếu không, resource score là N/A và run không evaluable.

```text
Sresource = 20 × min(1, E* / Egross)
```

### 14.4. Process score — 20 điểm

- 5: meter calibrated.
- 5: mọi reading dùng để quyết định đều sau mix/stable.
- 5: aliquot base cuối ≤ 0,50 mL.
- 5: không HCl correction.

### 14.5. Tổng điểm và success

```text
Soverall = round(SpH + Sresource + Sprocess)
```

`success` là hard goal status độc lập. Điểm không biến một run ngoài target thành success và không phải probability.

### 14.6. Công khai rubric

Scoring là quyết định sư phạm, không phải hằng số khoa học và không phải xác suất thành công. UI phải hiển thị điểm thành phần.

---


## 15. Các ca chuẩn (golden cases)

Bộ hằng số tại mục 6, `gamma = 1`, có CaOH⁺ và carbon kín.

| ID | Điều kiện | Expected |
| --- | --- | ---: |
| AN-G01 | Chưa thêm base | pH* 2,00000 |
| AN-G02 | +22,50 mL NaOH | pH* 3,27875 |
| AN-G03 | +25,00 mL NaOH | pH* 6,99500 |
| AN-G04 | +27,50 mL Ca(OH)₂ | pH* 10,64984 |
| AN-G05 | +25,00 mL Na₂CO₃ | pH* 4,47992 |
| AN-G06 | +42,25 mL Na₂CO₃ | pH* 6,99921 |
| AN-G07 | +25,00 mL Ca(OH)₂ | pH* 6,98637 |
| AN-G08 | +27,50 mL NaOH, sau đó +2,50 mL HCl correction | pH* 6,99500 |

### 15.1. Carbonate detail

AN-G05:

- `CT = 0,0025000 mol/L`.
- `alpha0 = 0,98675256`.
- `alpha1 = 0,01324743`.
- `alpha2 = 1,8752 × 10⁻⁸`.

AN-G06:

- `CT = 0,003141264 mol/L`.
- `alpha0 = 0,18381434`.
- `alpha1 = 0,81580390`.
- `alpha2 = 0,000381762`.

### 15.2. Tolerance engine

- pH*: ±0,002.
- Mỗi alpha: ±2 × 10⁻⁵ tuyệt đối.
- Carbon mass balance relative error ≤ 1 × 10⁻¹⁰.
- Charge residual ≤ 1 × 10⁻¹⁰ mol/L trong test acceptance; solver target chặt hơn.

Đây là tolerance của implementation so với model, không phải độ đúng bench.

### 15.3. Independent check

Tám expected value đã được tính lại độc lập bằng một implementation bisection riêng trước khi đưa vào tài liệu.

---


## 16. Kiểm tra hợp lệ và bất biến

### 16.1. Chung

- Volume > 0.
- Mole inventory không âm ngoài tolerance 1 × 10⁻¹⁵ mol.
- pH hữu hạn.
- Charge residual trong tolerance.
- Same state/action/version cho same output.

### 16.2. Carbonate

- `alpha0 + alpha1 + alpha2 = 1` ± 1 × 10⁻¹².
- Mỗi alpha trong [0,1].
- Sum carbon species = CT.
- Total inorganic carbon không đổi khi thêm HCl correction.

### 16.3. Calcium

- `[Ca²⁺] + [CaOH⁺] = CCaT`.
- Không có solid calcium trong state.

---


## 17. Giả định và giới hạn

- HCl/NaOH điện ly hoàn toàn.
- Ca(OH)₂ đã hòa tan, lọc, chuẩn hóa.
- Thể tích cộng tuyến tính.
- Hằng nhiệt 25 °C.
- Hoạt độ xấp xỉ nồng độ.
- Không buffer, kim loại, phosphate, sulfate, hữu cơ, rắn hoặc sinh học.
- Carbonate là hệ kín trong pha nước.
- Không nhiệt phản ứng, truyền khối, tốc độ khuấy hoặc thời gian động học.
- Không suy liều cho mẫu không biết thành phần.

ASTM D1067 nhấn mạnh endpoint và tính phù hợp phụ thuộc matrix, mục tiêu và khả năng đệm: [ASTM D1067-16](https://store.astm.org/d1067-16.html).

---


## 18. An toàn và cách diễn đạt

UI hiển thị:

> Thí nghiệm thật chỉ thực hiện dưới sự giám sát của người phụ trách phòng thí nghiệm, với kính chống bắn hóa chất, áo choàng, găng phù hợp và giày kín. Không hút pipet bằng miệng. Thêm acid/base từ từ khi khuấy và làm theo SDS/quy trình của cơ sở khi tràn đổ. Không tự ý đổ chất thải xuống cống. Acid tác dụng với carbonate có thể tạo CO₂; không đậy kín trong bình không được thiết kế chịu áp.

Nguồn hazard:

- [NIOSH — Hydrogen chloride](https://www.cdc.gov/niosh/npg/npgd0332.html)
- [NIOSH — Sodium hydroxide](https://www.cdc.gov/niosh/npg/npgd0565.html)
- [NIOSH — Calcium hydroxide](https://www.cdc.gov/niosh/chemicals/pel88/pell-pages/1305-62.html)
- [PubChem — Sodium carbonate](https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-carbonate)

---


## 19. Những tính năng loại khỏi scenario 1.0.0

- Nhập pH nước thải chưa biết rồi tự suy liều.
- Acid khác HCl.
- Buffer hoặc hỗn hợp acid.
- Ca(OH)₂ slurry/vôi sữa.
- Đổi base giữa lượt.
- Cốc carbonate hở nhưng chấm theo golden hệ kín.
- Thể tích CO₂ thoát.
- Thời gian phản ứng thật.
- Nhiệt tăng.
- Tốc độ khuấy tối ưu.
- Nồng độ/nhiệt độ tùy ý.
- Nhãn “đạt quy chuẩn”, “an toàn để xả” hoặc “liều tối ưu thực tế”.

---


## 20. Ma trận nguồn chính

| Source key | Nguồn | Claim được hỗ trợ |
| --- | --- | --- |
| `IUPAC-PH` | [IUPAC Gold Book — pH](https://goldbook.iupac.org/terms/view/P04524) | pH là hoạt độ; wording pH* |
| `IAPWS-KW-2024` | [IAPWS R11-24](https://iapws.org/documents/release/Ionization.download) | Kw/pKw tại 25 °C |
| `USGS-PHREEQC-1995` | [PHREEQC User Guide](https://pubs.usgs.gov/wri/1995/4227/report.pdf) | carbonate/CaOH+ equilibrium constants |
| `NIST-CAOH2-1956` | [NBS/NIST Ca(OH)₂ solubility](https://nvlpubs.nist.gov/nistpubs/jres/56/jresv56n6p305_A1b.pdf) | concentration boundary/clear solution |
| `USGS-ALK-FAQ` | [USGS Alkalinity FAQ](https://or.water.usgs.gov/alk/faq.html) | CO₂ exchange limitation |
| `VALENCIA-TITRATION` | [Valencia lab manual](https://frontdoor.valenciacollege.edu/file/vprasadpermaul/CHM%201046%20Experimental%20Lab%20Manual%20-%20Barnett%20-%20First%20Edition%202012.pdf) | stable reading/small aliquot |
| `FSU-TITRATION` | [FSU procedure](https://www.chem.fsu.edu/chemlab/chm3120l/acid/procedure.html) | potentiometric titration procedure |
| `ASTM-D1067-16` | [ASTM D1067-16](https://store.astm.org/d1067-16.html) | matrix/buffering/endpoint limitation |
| `NIOSH-HCL` | [NIOSH HCl](https://www.cdc.gov/niosh/npg/npgd0332.html) | hazard wording |
| `NIOSH-NAOH` | [NIOSH NaOH](https://www.cdc.gov/niosh/npg/npgd0565.html) | hazard wording |
| `NIOSH-CAOH2` | [NIOSH Ca(OH)₂](https://www.cdc.gov/niosh/chemicals/pel88/pell-pages/1305-62.html) | hazard wording |
| `PUBCHEM-NA2CO3` | [PubChem Na₂CO₃](https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-carbonate) | irritation/safety wording |

### 20.1. Route-to-claim mapping

| Route/action | Equation/data claim | Claim IDs | Applicability |
| --- | --- | --- | --- |
| NaOH | strong charge balance + Kw | AN-PH-DEFINITION, AN-KW-25C | HCl/NaOH ideal, 25 °C |
| Ca(OH)₂ | Ca total + CaOH⁺ hydrolysis | AN-CAOH-COMPLEX, AN-CAOH2-CONCENTRATION | clear standardized solution only |
| Na₂CO₃ | carbonate mass/charge balance | AN-CARBONATE-CONSTANTS, AN-CLOSED-CARBON | closed inorganic carbon only |
| Mix/measure | stable reading/small aliquot | AN-ALIQUOT-PROCEDURE | interaction rule, not kinetics |
| Safety | reagent hazard wording | AN-SAFETY-WORDING | supervised lab only |

Chi tiết mapping cấp claim nằm tại [Scientific Evidence Register](../scientific-evidence-register.md).

---


## 21. Tiêu chí nghiệm thu thí nghiệm

- Tám golden case đạt tolerance.
- Solver không trả NaN/Infinity trong toàn range.
- Action invalid không tạo state/event mới.
- Route lock hoạt động.
- Carbon fractions và mass balance đạt invariant.
- Meter/mix/stable preconditions hoạt động.
- Scoring đúng công thức và công khai component.
- Addition invalidates equilibrium/measurement; stale measurement không thể complete.
- AN-G08 phản ánh correction event và resource/process penalty.
- Report hiển thị model closed-carbon disclaimer khi dùng Na₂CO₃.
- UI không dùng “probability”, “đạt pháp luật” hoặc “liều nước thải”.
- Replay cùng event chain trả cùng final state.

---


## 22. Tài liệu liên quan

- [Core Project Scope](../core-project-scope.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
- [Scientific Evidence Register](../scientific-evidence-register.md)
