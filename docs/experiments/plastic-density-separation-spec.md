# ĐẶC TẢ THÍ NGHIỆM 3 — PHÂN LOẠI NHỰA NỔI–CHÌM

**Scenario key:** `plastic-separation`<br>
**Scenario version:** `1.0.0`<br>
**State schema version:** `1`<br>
**Trạng thái nội dung:** Đủ điều kiện triển khai mô hình lý tưởng có đối chiếu nguồn; chưa kiểm chứng bench bởi đội<br>
**Nhiệt độ mô hình:** 20,0 °C<br>
**Ngôn ngữ:** Tiếng Việt

> Mô phỏng này minh họa phân loại cân bằng theo mật độ, không dự đoán đầy đủ hiệu suất nhà máy. Kết quả lý tưởng giả định nhựa sạch, đặc, được làm ướt hoàn toàn và không chứa nhãn, bọt khí hoặc chất độn.

> **Nhãn bắt buộc:** Mô hình dựa trên tài liệu; chưa được nhóm phát triển kiểm chứng bằng thí nghiệm độc lập.

---

## 1. Mục tiêu giáo dục

Người học phải:

- Hiểu điều kiện nổi/chìm dựa trên mật độ vật liệu và môi trường.
- Thiết kế một cây phân tách nhiều cấp.
- Phân biệt purity, recovery và yield.
- Giữ cân bằng khối lượng qua mọi dòng.
- Nhận biết một cấp tách có thể thu hồi tốt một nhóm nhưng không tạo sản phẩm tinh khiết cho từng resin.
- So sánh water-first, ethanol-first và NaCl-first.
- Nhận biết concentration label và density không được hoán đổi nếu không có bảng vật lý.
- Phân biệt mô hình lý tưởng với recovery thực nghiệm phụ thuộc thiết bị/feed.

---

## 2. Hai lớp kết quả

### 2.1. Lớp lý tưởng — dùng để chấm điểm

- Phân loại xác định theo mật độ.
- Không dùng random.
- Bảo toàn khối lượng tuyệt đối trong tolerance số học.
- Dùng representative polymer grade/density đã khóa.
- Cho phép thay đổi thành phần theo tính tuyến tính của model.

### 2.2. Lớp evidence — không dùng làm hệ số mặc định

- Hiển thị recovery/purity được công bố cho đúng nghiên cứu.
- Gắn feed, thiết bị, medium và condition.
- Không nội suy sang concentration hoặc mixture khác.
- Không trộn empirical recovery vào ideal score.

---

## 3. Mẫu benchmark

| Thuộc tính | Giá trị |
| --- | ---: |
| PP | 3,000 g |
| HDPE | 3,000 g |
| PS đặc, không xốp | 3,000 g |
| PET | 3,000 g |
| Tổng | 12,000 g |
| Kích thước mảnh | 3–5 mm |
| Nhiệt độ | 20,0 °C |
| Thời gian lắng UI | 4 phút sau wet/mix |

Nguồn lab gốc dùng 3 g mỗi polymer, mảnh 0,3–0,5 cm và nhiều polymer hơn. Simulator dùng tập con PP/HDPE/PS/PET; phải gọi là **biến thể giáo dục dựa trên quy trình nguồn**, không tuyên bố bài báo đã thử đúng mẻ bốn resin này.

### 3.1. Giả định mẫu

- Đã loại nhãn, nắp khác resin, đất, kim loại.
- PS là compact GPPS/HIPS, không phải EPS.
- Không mineral filler hoặc flame retardant.
- Không bọt khí bị giữ trong/ngoài mảnh.
- Mảnh được làm ướt hoàn toàn.
- Không biofilm, dầu hoặc chất hoạt động bề mặt.
- Polymer mass không đổi trong quá trình.

### 3.2. Exploration composition

Người học có thể đổi khối lượng từng resin trong miền:

- 0–10,000 g mỗi resin.
- Ít nhất hai resin có mass > 0.
- Tổng 2,000–40,000 g.

Khi khác benchmark, UI gắn nhãn:

> Kết quả được ngoại suy tuyến tính từ mô hình mật độ lý tưởng; không phải mẻ đã được nghiên cứu thực nghiệm trực tiếp.

### 3.3. Parameter contract

Người học điều khiển bảy dimension:

1. Goal mode.
2. Target resin khi dùng target goal.
3. Khối lượng PP/HDPE/PS/PET trong exploration mode.
4. Classification mode.
5. Medium preset.
6. Active stream được đưa sang stage tiếp.
7. Số thứ tự và điểm dừng của các stage.

---

## 4. Mật độ polymer

| Polymer | Khoảng điển hình g/cm³ | Representative g/cm³ | Nguồn/ghi chú |
| --- | ---: | ---: | --- |
| PP | 0,89–0,91 | 0,910 | grade BJ750 trong nghiên cứu |
| HDPE | 0,94–0,97 | 0,953 | grade Lotrène Q TR-571 |
| PS compact | 1,04–1,08 | 1,040 | grade 124 N/L |
| PET | 1,29–1,40 | 1,380 | representative OECD |

Representative density dùng cho golden scoring. Density range dùng cho technical warning/range-guard.

OECD báo range sản phẩm có thể rộng do grade/additive, vì vậy không suy kết quả sang mọi vật phẩm: [OECD ENV/JM/MONO(2019)10, Table 8](https://one.oecd.org/document/ENV/JM/MONO%282019%2910/en/pdf).

---

## 5. Môi trường phân tách

### 5.1. Preset phát hành

| Medium key | Thành phần ở 20 °C | Density g/cm³ | Vai trò |
| --- | --- | ---: | --- |
| `water` | nước sạch | 0,998207 | PP+HDPE / PS+PET |
| `ethanol-50-vv` | ethanol–water 50,0% v/v | 0,93014 | PP / HDPE+PS+PET |
| `nacl-8-ww` | NaCl 8,0% w/w | 1,0559 | low/evidence; PS không bảo đảm theo full range |
| `nacl-14-ww` | NaCl 14,0% w/w | 1,1008 | PP+HDPE+PS / PET |
| `nacl-20-ww` | NaCl 20,0% w/w | 1,1478 | cùng topology với 14%, tốn muối hơn |
| `nacl-26-ww` | NaCl 26,0% w/w | 1,1972 | upper preset; PET vẫn chìm |

### 5.2. Nguồn density

- Nước ở 20 °C: [NISTIR 7383-2019, mục 7.1, Table 2](https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.7383-2019.pdf).
- NaCl ở 20 °C: [Australian NMI NITP 17.1, Appendix E.1](https://www.industry.gov.au/sites/default/files/2019-04/nitp_17.1_density_hydrometers_part_1_brix_hydrometers_for_cane_juice.pdf).
- Ethanol 50,0% v/v ở 20 °C: [Swiss Federal Alcohol Tables](https://www.bazg.admin.ch/dam/en/sd-web/6W4i9qP2S9vZ/alkoholtafel-de.pdf).

### 5.3. Quy tắc input

- Người dùng chọn preset, không nhập density tùy ý trong benchmark mode.
- Có thể xem density technical value.
- Không cho NaCl > 26% w/w trong scenario 1.0.0.
- Không cho ethanol > 60% v/v; scenario 1.0.0 chỉ phát hành preset 50% v/v.
- Nhiệt độ không có slider.

### 5.4. Cửa sổ bảo đảm theo range

| Tách | Cửa sổ medium density g/cm³ |
| --- | --- |
| PP / HDPE | 0,91 < ρm < 0,94 |
| HDPE / PS | 0,97 < ρm < 1,04 |
| PS / PET | 1,08 < ρm < 1,29 |

Water, ethanol 50% và NaCl 14% nằm trong ba cửa sổ tương ứng.

### 5.5. Không suy concentration từ density bằng nội suy thô

Một số bài báo báo cặp concentration–density không khớp bảng alcoholometric/NaCl. Engine dùng preset table đã kiểm chứng. Evidence card có thể hiển thị density nghiên cứu nhưng không dùng nhãn concentration không nhất quán để pha dung dịch.

---

## 6. Bath normalization và resource ledger

Scenario dùng bath normalization để so sánh tài nguyên, không tuyên bố là thể tích pilot/lab nguồn:

- Mỗi stage dùng 1,000 L fresh medium.
- Không mô phỏng recycle percentage.
- Rửa/làm khô là precondition; không gán volume nước rửa nếu không có source.

### 6.1. Tính vật chất medium

Với volume `Vs` L và density `rho` kg/L:

```text
solutionMassKg = rho × Vs
```

NaCl mass:

```text
naclMassKg = massFraction × rho × Vs
```

Ví dụ 1 L NaCl 14%:

```text
0,14 × 1,1008 = 0,154112 kg NaCl
```

Output chính thức đổi sang `154,112 g NaCl`.

Ethanol equivalent volume:

```text
ethanolEquivalentL = volumeFraction × Vs
```

1 L preset 50% v/v ghi 0,500 L ethanol tuyệt đối tương đương. Không hướng dẫn “trộn 500 mL ethanol + 500 mL nước” vì có volume contraction.

### 6.2. Chỉ số resource

```text
mediumIntensity = sum(freshMediumVolumeL) / feedMassKg
```

Chỉ số này dùng so sánh trong cùng scenario normalization, không phải chỉ số thiết kế nhà máy.

---

## 7. State machine

```text
DRY_READY
  → LOADED
  → WETTED
  → SETTLED
  → SPLIT
  → COLLECTED
  → RINSED_DRY
  → DRY_READY hoặc FINAL
```

### 7.1. Stream state

```ts
type PolymerMassVector = {
  ppG: number
  hdpeG: number
  psG: number
  petG: number
}

type MaterialStream = {
  id: string
  label: string
  phase: 'dry-ready' | 'loaded' | 'wetted' | 'settled' | 'split' | 'collected' | 'rinsed-dry' | 'final'
  composition: PolymerMassVector
  parentStreamId: string | null
  stageId: string | null
  unresolved: boolean
  closed: boolean
}
```

### 7.2. Scenario state

```ts
type PlasticSeparationState = {
  attemptPhase: 'in-progress' | 'completed'
  mode: 'benchmark' | 'exploration'
  classificationMode: 'representative' | 'range-guard'
  goalMode: 'isolate-target-resin' | 'isolate-all-resins'
  targetResin: 'PP' | 'HDPE' | 'PS' | 'PET' | null
  temperatureC: 20.0
  initialComposition: PolymerMassVector
  streams: Record<string, MaterialStream>
  stages: SeparationStage[]
  activeStreamId: string | null
  collectedProductIds: string[]
  resources: PlasticResourceLedger
  goalStatus: PlasticGoalStatus
  evidenceCards: EmpiricalEvidenceCard[]
}
```

---

## 8. Actions và preconditions

| Action | Preconditions | Kết quả |
| --- | --- | --- |
| `select_stream` | stream chưa closed; mass > 0 | active stream |
| `select_medium` | preset hợp lệ; active dry stream | medium staged |
| `load_bath` | dry-ready; chưa consumed | loaded |
| `wet_and_mix` | loaded | wetted |
| `wait_settle` | wetted | settled |
| `split_stream` | settled | atomically đóng parent; tạo float/sink/unresolved child streams |
| `collect_streams` | split | đổi phase child streams thành collected |
| `rinse_and_dry` | collected | rinsed-dry |
| `start_next_stage` | rinsed-dry child | child becomes active dry-ready |
| `finalize_product` | dry stream | final product |
| `complete_attempt` | mọi leaf stream final; không stage đang chạy | final evaluation + completed lifecycle/report snapshot |

### 8.1. Preconditions bắt buộc

- Parent stream đóng sau split; không reuse để tránh nhân đôi mass.
- Không đổi medium nếu chưa rinse/dry.
- Không collect trước settle.
- Unresolved stream không tự gán float/sink.
- Invalid concentration không đổi state.
- Empirical missing mass chỉ nằm trong `EvidenceCardAccounting`; không đi vào ideal/range mass tree.

### 8.2. Completion contract

Chung:

- Mọi leaf stream phải ở phase `final`; mass closure đạt tolerance.
- Không còn stream `loaded/wetted/settled/split/collected`.
- `complete_attempt` tạo final evaluation, lifecycle event và report snapshot; attempt sau đó bất biến.

Theo goal:

- `isolate-target-resin`: `targetResin` bắt buộc; ít nhất một finalized product được chọn cho target và purity/recovery evaluable. Residual leaf streams vẫn phải finalize để đóng mass tree.
- `isolate-all-resins`: bốn finalized product riêng, mỗi product ứng với đúng một resin; không unresolved mass.
- `range-guard`: được complete để xem report nhưng goal/score là N/A nếu còn unresolved.

### 8.3. Reversibility

| Action | Reversible? | Boundary/restored state |
| --- | --- | --- |
| `select_stream` | Có trước load | active stream trước đó |
| `select_medium` | Có trước load | medium selection trước đó |
| `load_bath` | Có nếu là action cuối và chưa wet | stream về dry-ready; resource reservation rollback |
| `wet_and_mix` trở đi | Không | dùng next stage/restart; không xóa history |
| `finalize_product` | Không | final stream bất biến trong attempt |
| `complete_attempt` | Không | completed attempt bất biến |

### 8.4. Event budget

- Tối đa 20 separation stages.
- Tối đa 200 accepted events.
- Giới hạn nằm trong scenario release và thấp hơn guest import ceiling.

### 8.5. 4 phút

`wait_settle` dùng một bước UI 4 phút theo benchmark lab reference. Đây là quy tắc scenario; engine ideal không tính settling velocity và không tuyên bố 4 phút tối ưu cho mọi mảnh.

---

## 9. Phương trình phân loại lý tưởng

Lực nổi ròng:

```text
Fnet,i = (rhoMedium - rhoPolymer,i) × particleVolume × g
```

Representative mode:

```text
abs(rhoPolymer - rhoMedium) <= epsilon => UNRESOLVED
rhoPolymer < rhoMedium                 => FLOAT
rhoPolymer > rhoMedium                 => SINK
```

Mass:

```text
m[i,float] = m[i] khi rho[i] < rhoMedium; ngược lại 0
m[i,sink]  = m[i] khi rho[i] > rhoMedium; ngược lại 0
m[i,unresolved] = m[i] khi abs(rho[i]-rhoMedium) <= epsilon; ngược lại 0
```

### 9.1. Density epsilon

- `epsilon = 1 × 10⁻⁶ g/cm³` chỉ để xử lý equality số học.
- Không phải uncertainty vật lý.

### 9.2. Range-guard mode

```text
rhoMax < rhoMedium => GUARANTEED_FLOAT
rhoMin > rhoMedium => GUARANTEED_SINK
otherwise          => UNRESOLVED_NOT_GUARANTEED
```

Range-guard là exploration partition thật: resin không được bảo đảm đi vào `UNRESOLVED`. Mode này bảo toàn mass nhưng không tạo separation score, vì không dùng representative grade để quyết định vị trí.

---

## 10. Mass balance, purity, recovery và yield

### 10.1. Stage balance

```text
Min = sum_i mi
Min = Mfloat + Msink + Munresolved
```

### 10.2. Tree balance

```text
M0 = sum(terminalStreamMass)
```

### 10.3. Purity

```text
purity(i, stream) = 100 × mass(i, stream) / streamMass
```

### 10.4. Recovery

```text
recovery(i, stream) = 100 × mass(i, stream) / initialMass(i)
```

### 10.5. Yield

```text
yield(stream) = 100 × streamMass / initialTotalMass
```

Zero-denominator metric trả `not-applicable`, không trả 0 hoặc NaN.

---

## 11. Empirical evidence card

Chỉ khi source báo đủ recovery `R` và purity `P`:

```text
targetMassInProduct = R × targetMassInFeed
productMass = targetMassInProduct / P
unidentifiedContamination = productMass - targetMassInProduct
targetNotRecovered = (1 - R) × targetMassInFeed
```

Không phân bổ unidentified contamination cho resin cụ thể.

### 11.1. Ví dụ evidence card PP

Nguồn companion báo `R = 99,64%`, `P = 99,90%` cho PP ở 50% ethanol. Với 3 g PP:

- PP trong product: 2,9892 g.
- Product total: 2,99219 g.
- Unidentified contamination: 0,00299 g.
- PP not recovered: 0,0108 g.

Các số này chỉ hiển thị trong card có source/condition, không thay ideal engine.

### 11.2. Không dùng

- Water recovery 97,5% cho nhóm PP+HDPE để suy riêng từng resin.
- PS recovery 80,3% nếu source không báo đủ purity để dựng composition.
- Ethanol recovery attribution không nhất quán giữa Results/Conclusion.

---

## 12. Ba process family hoàn chỉnh

### 12.1. Water-first — route mặc định để minh họa all-resins

```text
Feed PP+HDPE+PS+PET
→ Water
  FLOAT: PP+HDPE
    → Ethanol 50%
      FLOAT: PP
      SINK: HDPE
  SINK: PS+PET
    → NaCl 14%
      FLOAT: PS
      SINK: PET
```

### 12.2. Ethanol-first

```text
Feed
→ Ethanol 50%
  FLOAT: PP
  SINK: HDPE+PS+PET
    → Water
      FLOAT: HDPE
      SINK: PS+PET
        → NaCl 14%
          FLOAT: PS
          SINK: PET
```

### 12.3. NaCl-first

```text
Feed
→ NaCl 14%
  FLOAT: PP+HDPE+PS
    → Water
      FLOAT: PP+HDPE
        → Ethanol 50%
          FLOAT: PP
          SINK: HDPE
      SINK: PS
  SINK: PET
```

Ba split là minimum để biến một feed bốn resin thành bốn terminal product.

Không route nào trong ba route complete được gọi “tốt nhất” tuyệt đối; với cùng three baths, ideal output/resource ledger giống nhau. Route mặc định chỉ phục vụ cách giải thích trực quan.

---

## 13. Process một stage hợp lệ nhưng chưa hoàn tất

| Medium | Kết quả |
| --- | --- |
| Water | PP+HDPE / PS+PET |
| Ethanol 50% | PP / HDPE+PS+PET |
| NaCl 14% | PP+HDPE+PS / PET |

Một dòng mixed-resin có thể được finalize như residual stream, nhưng không được tính là target product hoặc all-resins product.

### 13.1. Route tối thiểu theo target resin

| Target | Route tối thiểu |
| --- | --- |
| PP | Ethanol 50% → collect float, 1 stage |
| PET | NaCl 14% → collect sink, 1 stage |
| HDPE | Water → take float; ethanol 50% → collect sink, 2 stages |
| PS | Water → take sink; NaCl 14% → collect float, 2 stages |

Các route dừng sớm tạo trade-off stages/resources có ý nghĩa mà all-resins route không có.

---

## 14. Nhánh lỗi và phục hồi

| Trường hợp | Mã | Kết quả | Phục hồi |
| --- | --- | --- | --- |
| NaCl 8% với PS range | `PS_NOT_RANGE_GUARANTEED` | PS unresolved trong range mode | rinse/dry, NaCl 14% |
| Ethanol medium không trong preset | `MEDIUM_UNVERIFIED` | từ chối action | chọn 50% preset |
| NaCl >26% | `NACL_OUT_OF_RANGE` | từ chối action | chọn preset hợp lệ |
| Chưa wet/mix | `STREAM_NOT_WETTED` | không settle | wet_and_mix |
| Chưa settle | `STREAM_NOT_SETTLED` | không split | wait_settle |
| Chưa rinse/dry | `CARRYOVER_RISK` | không next stage | rinse_and_dry |
| Bọt khí/không ướt | `WETTING_INVALID` | unresolved | de-air/wet/retest hoặc restart |
| EPS/filler/label | `MATERIAL_OUT_OF_SCOPE` | không phân loại | loại khỏi benchmark |
| Reuse parent | `STREAM_CLOSED` | từ chối | chọn child open |
| Empirical card thiếu accounting | `EVIDENCE_ACCOUNTING_INCOMPLETE` | card không phát hành | không tác động ideal state |

---

## 15. Output

### 15.1. Mỗi stream

- Composition vector.
- Total mass.
- Purity mỗi resin.
- Recovery mỗi resin.
- Yield.
- Float/sink/unresolved status.
- Parent/stage lineage.

### 15.2. Toàn lượt

- Terminal products.
- Mass closure và residual.
- Separation stages/baths.
- L medium, g NaCl, L ethanol equivalent.
- Unresolved mass; empirical unidentified mass chỉ ở evidence card.
- Route family.
- Separation score/badge hoặc N/A trong range-guard.
- Evidence cards riêng.

### 15.3. Không hiển thị như fact

- Plant throughput.
- Settling velocity.
- Industrial cost.
- Wastewater load.
- LCA/carbon footprint.

### 15.4. Pedagogical cost index 1.0.0

Không dùng tiền tệ. Coefficient theo mỗi liter fresh bath:

| Medium | Cost units/L |
| --- | ---: |
| Water | 1,00 |
| NaCl solution | 2,00 |
| Ethanol 50% v/v | 5,00 |

```text
relativeCostIndex = waterL×1 + naclBathL×2 + ethanolBathL×5
```

Với bath normalization 1 L: target PP =5; PET =2; HDPE =6; PS =3; complete all-resins =8. Đây là quy ước giáo dục versioned, không phải cost công nghiệp.

### 15.5. Pedagogical safety index 1.0.0

```text
safetyIndex = clamp(100 - sum(committedPenaltyPoints), 0, 100)
```

| Penalty code | Điều kiện | Điểm |
| --- | --- | ---: |
| `EXTRA_ETHANOL_STAGE_BEYOND_GOAL_MINIMUM` | dùng thêm ethanol bath sau khi goal có route tối thiểu hoàn tất | 10 |
| `HIGH_BRINE_PRESET_WITHOUT_SEPARATION_BENEFIT` | dùng NaCl 20/26% khi NaCl 14% cho cùng topology goal | 10 |

Model/out-of-scope material invalid → index N/A. Ethanol flammability và brine environmental hazard luôn hiển thị riêng.

---

## 16. Scoring

### 16.1. Goal `isolate-all-resins`

Với mỗi resin `i`, đặt `Ii = 1` khi tồn tại một product stream riêng thỏa:

- Chỉ định cho resin `i`.
- Purity ≥ 99,5%.
- Recovery ≥ 99,5%.
- Không dùng chung làm product cho resin khác.

```text
Ssep = 100 × sum_i(initialMass_i / initialTotalMass × Ii)
```

Với benchmark bằng nhau, mỗi resin đáng 25 điểm.

### 16.2. Goal `isolate-target-resin`

Người dùng chọn `targetResin` và một product stream mục tiêu:

```text
Starget = min(purityTargetPercent, recoveryTargetPercent)
```

Goal đạt khi purity và recovery đều ≥99,5%. Report vẫn hiển thị hai đại lượng riêng.

### 16.3. Classification mode

- `representative`: score theo goal mode.
- `range-guard`: score = N/A; chỉ hiển thị guaranteed/unresolved và mass closure.

### 16.4. Run validity

- Mass closure error > 0,1%: run invalid.
- Ideal/range mass tree phải đóng; empirical evidence accounting tách riêng.

### 16.5. Badge

- All-resins score 100 + đúng 3 split: `Tối ưu trong mô hình`.
- Target goal đạt với minimum stage ở bảng 13.1: `Tối ưu trong mô hình`.
- Goal đạt nhưng nhiều stage hơn minimum: `Hoàn tất nhưng dư công đoạn`.
- Score <100: hiển thị resin/group chưa được cô lập.

Không trừ điểm môi trường bằng trọng số tùy ý. Resource ledger hiển thị riêng để người học tự so sánh.

Ngưỡng 99,5% là rubric giáo dục, không phải hằng số khoa học hoặc ngưỡng ngành.

---

## 17. Golden cases

Vector theo thứ tự `[PP, HDPE, PS, PET]`, đơn vị g.

| ID | Action/route | Expected |
| --- | --- | --- |
| PS-G01 | Water 0,998207 | float `[3,3,0,0]`; sink `[0,0,3,3]`; 6 g/6 g; score 0 |
| PS-G02 | Ethanol 50%, 0,93014 | float `[3,0,0,0]`; sink `[0,3,3,3]`; PP P=R=100%; score 25 |
| PS-G03 | NaCl 14%, 1,1008 | float `[3,3,3,0]`; sink `[0,0,0,3]`; PET P=R=100%; score 25 |
| PS-G04 | Water-first complete | 4 terminal streams 3 g; each P=R=100%; 3 split; score 100 |
| PS-G05 | NaCl-first complete | 4 terminal streams 3 g; each P=R=100%; 3 split; score 100 |
| PS-G06 | Range mode NaCl 8% | guaranteed float PP+HDPE; unresolved PS; sink PET; retry PS with 14% isolates PS; score N/A |
| PS-G07 | Ethanol-first complete | 4 terminal streams 3 g; each P=R=100%; 3 split; all-resins score 100 |
| PS-G08 | Target HDPE: water→ethanol | HDPE product 3 g, P=R=100%; 2 stages; Starget 100 |

### 17.1. Resource golden

- Complete all-resins route: 3,000 L fresh medium, 154,112 g NaCl, 0,500 L ethanol-equivalent.
- Target PP one-stage: 1,000 L medium, 0,500 L ethanol-equivalent.
- Target PET one-stage: 1,000 L medium, 154,112 g NaCl.
- Target HDPE/PS two-stage: 2,000 L total medium và reagent của route tương ứng.

### 17.2. Tolerance phần mềm

- Mass: ±0,001 g.
- Purity/recovery: ±0,01 percentage point.
- Density: ±0,00001 g/cm³.
- Whole-batch closure: ±0,004 g.

Đây là tolerance implementation, không phải experimental uncertainty.

---

## 18. Invariant

1. Parent stream closed sau split.
2. Child masses sum parent mass trong tolerance.
3. Whole ideal/range tree terminal streams = initial mass.
4. Không có negative polymer mass.
5. Purity/recovery/yield trong [0,100] hoặc N/A.
6. Same state/action/version cho same partition.
7. Medium density đúng preset/version.
8. Stage chỉ nhận dry-ready stream.
9. Empirical card không đổi ideal state/score.
10. Final product không chạy stage mới.

---

## 19. An toàn và môi trường

UI hiển thị:

> Dung dịch nước không đồng nghĩa với không gây ô nhiễm. Dung dịch muối, ethanol, nước rửa và mọi mảnh nhựa phải được thu hồi, lọc và quản lý theo quy trình của cơ sở; không đổ trực tiếp xuống cống hoặc nguồn nước.

> Ethanol dễ cháy. Thí nghiệm thật phải tránh lửa, tia lửa và nguồn nhiệt, dùng thông gió, bình phù hợp và PPE theo SDS. Dùng mảnh nhựa đã cắt sẵn; không cho người học vận hành máy nghiền trong bài này.

Nguồn:

- [NIOSH — Ethyl alcohol](https://www.cdc.gov/niosh/npg/npgd0262.html)
- [U.S. EPA — Salt](https://www.epa.gov/risk/salt)

---

## 20. Giới hạn

- Không settling velocity/viscosity/surface tension/turbulence.
- Không hình dạng/độ dày/kết tụ/bọt khí động.
- Không crystallinity/aging/pigment/filler/flame retardant.
- Không EPS.
- Không sensor sorting hoặc froth flotation.
- Không empirical recovery như material constant.
- Không recycle percentage nếu source không cung cấp.
- Không plant scale, LCA hoặc “zero pollution”.

---

## 21. Ma trận nguồn chính

| Source key | Nguồn | Claim được hỗ trợ |
| --- | --- | --- |
| `QUELAL-2022` | [Quelal và cộng sự](https://d-nb.info/1255832649/34) | density grades, procedure, media, selected recovery, limitations |
| `PONGSTABODEE-2008` | [Waste Management paper](https://pubmed.ncbi.nlm.nih.gov/17493796/) | post-consumer 3-stage sink-float, water/ethanol route |
| `PLASTIC-COMPANION` | [Companion Chapter III](https://digital.library.tu.ac.th/tu_dc/digital/api/DownloadDigitalFile/dowload/73396) | 3 g/resin, size, rinse/dry flow, PP evidence card |
| `NIST-WATER-20C` | [NISTIR 7383-2019](https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.7383-2019.pdf) | water density |
| `NMI-NACL-20C` | [NMI NITP 17.1](https://www.industry.gov.au/sites/default/files/2019-04/nitp_17.1_density_hydrometers_part_1_brix_hydrometers_for_cane_juice.pdf) | NaCl density table |
| `SWISS-ALCOHOL-20C` | [Swiss Alcohol Tables](https://www.bazg.admin.ch/dam/en/sd-web/6W4i9qP2S9vZ/alkoholtafel-de.pdf) | ethanol 50% density |
| `OIV-ALCOHOL-TABLE` | [OIV Table I](https://www.oiv.int/index.php/standards/annex-a-methods-of-analysis-of-wines-and-musts/section-3-chemical-analysis/section-3-1-organic-compounds/section-3-1-2-alcohols) | kiểm tra inconsistency 31% v/v |
| `OECD-PLASTIC-DENSITY` | [OECD 2019](https://one.oecd.org/document/ENV/JM/MONO%282019%2910/en/pdf) | range/additive limitation, PET representative |
| `NIOSH-ETHANOL` | [NIOSH Ethanol](https://www.cdc.gov/niosh/npg/npgd0262.html) | flammability/safety |
| `EPA-SALT` | [EPA Salt](https://www.epa.gov/risk/salt) | environmental wording brine |

Chi tiết mapping cấp claim nằm tại [Scientific Evidence Register](../scientific-evidence-register.md).

### 21.1. Route-to-claim mapping

| Route/action | Equation/data claim | Claim IDs | Applicability |
| --- | --- | --- | --- |
| Water split | polymer representative density + water density | PS-POLYMER-DENSITY, PS-WATER-DENSITY | clean compact 20 °C |
| Ethanol 50% | ethanol density preset + polymer density | PS-ETHANOL-PRESET, PS-POLYMER-DENSITY | 50% v/v at 20 °C |
| NaCl presets | standard NaCl density table | PS-NACL-PRESETS | mass fraction at 20 °C |
| Ideal partition | Archimedes/density comparison | PS-IDEAL-ENGINE | no bubbles/filler/kinetics |
| Empirical card | source-specific recovery/purity | PS-EMPIRICAL-CARD | no default coefficient |
| Safety/environment | ethanol/brine wording | PS-SAFETY-ENVIRONMENT | supervised handling only |

---

## 22. Tiêu chí nghiệm thu

- Tám golden case đạt tolerance/semantics tương ứng.
- Three complete process families tạo đúng four terminal streams.
- Target PP/PET routes đạt goal trong 1 stage; HDPE/PS trong 2 stages.
- Mass closure đạt invariant qua tree.
- Invalid action không đổi state.
- Carryover/rinse precondition hoạt động.
- Range mode tạo unresolved đúng G06.
- Range mode không tạo separation score.
- Parent stream đóng atomically tại split.
- Resource mass của NaCl/ethanol đúng formula.
- Empirical cards không tác động score.
- Benchmark/exploration label hiển thị đúng.
- Không gọi ideal result là pilot prediction.
- Report hiển thị density source, assumptions và disclaimer.
- Replay event chain deterministic.

---

## 23. Tài liệu liên quan

- [Core Project Scope](../core-project-scope.md)
- [System Architecture](../system-architecture.md)
- [Data and State Model](../data-and-state-model.md)
- [Verification and Acceptance](../verification-and-acceptance.md)
- [Scientific Evidence Register](../scientific-evidence-register.md)
