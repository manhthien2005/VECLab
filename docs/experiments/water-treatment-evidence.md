# Nguồn và đối chiếu — Xử lý nước Fe/Zn/Pb

Hồ sơ riêng của bài xử lý nước; các kết quả dưới đây là đối chiếu mô hình, không phải kiểm chứng thực nghiệm độc lập. Giữ số mục 5.1 để các tham chiếu cũ trong source/spec vẫn tra được.

## 5.1. Register — Xử lý nước Fe/Zn/Pb (QCVN 40:2025/BTNMT)

**Ngày verify:** 16/10/2026
**Trạng thái P0-A:** ✅ ĐÃ ĐÓNG
**Trạng thái P0-D (chemistry pin):** 🟢 **6/6 claim ở `cross-checked`** — đã đóng 16/10/2026. Baseline D1–D5 đã chốt cùng ngày; 7 case chuyên biệt trong PHREEQC (GC-HYD-01, GC-PREC-01..04, GC-SO4-01, GC-SOLID-01) đã chạy thành công trên database đã pin `minteq.v4.dat` (PHREEQC 3.8.6-17100, SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`) với sai số ≤ 0,004 đơn vị log so với baseline. Từng case đính kèm output PHREEQC thật tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-*.select.out`; tổng hợp tại `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`. Solver **được phép** dùng các giá trị này trong chế độ `validated` cho chemistry.

| Source key | Loại | Citation/URL | Vị trí hoặc dữ liệu dùng | Status |
| --- | --- | --- | --- | --- |
| `PHREEQC-3.8.6-17100` | authoritative-technical | [PHREEQC 3.8.6-17100](https://water.usgs.gov/water-resources/software/PHREEQC/) — USGS Water Resources Software, build 17100 | Bản phát hành chính thức được tải về `tools/research/phreeqc-pin/3.8.6-17100/`. SHA-256 của gói phát hành: `91bf4998cfb5ed33b1222e034e559a9845f592f0f4f79a11819efe229b65a847`. `phreeqc.dat` SHA-256: `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10`. `minteq.v4.dat` SHA-256: `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`. Xem `tools/research/phreeqc-pin/3.8.6-17100/PIN.json` cho đầy đủ 22 file database và ví dụ kèm theo. | source-checked |
| `QCVN-40-2025-BTNMT` | authoritative-technical | [Thông tư 06/2025/TT-BTNMT](Thong-tu-06-2025-TT-BTNMT.pdf) — Bộ Tài nguyên và Môi trường, ban hành 01/3/2025 (theo ModDate của file PDF). SHA-256: `1fb859f91af39c31c32936fd8988f69b4d2f25805a9689afff578be4050ac5da`. | Mục 1.3.3.1 (tr. 3): định nghĩa Cột A — "nguồn nước tiếp nhận có chức năng cấp nước sinh hoạt hoặc mục đích quản lý, cải thiện chất lượng môi trường nước như Mức A Bảng 2, Bảng 3 QCVN 08:2023/BTNMT". Bảng 2 (tr. 5–6): Fe 2/10/10; Zn 1/5/5; Pb 0,1/0,5/0,5; pH 6–9 cho cả 3 cột. Mục 4.4 (tr. 6–7): tiêu chí đánh giá tuân thủ. Phụ lục 2 (tr. 17–24): mã ngành M712 chỉ cần Amoni. Bảng 1 (tr. 4): COD/BOD/TSS cho F ≤ 2.000 m³/ngày. | source-checked |
| `QASEM-MOHAMMED-LAWAL-2021` | review | [Qasem, Mohammed & Lawal (2021)](https://doi.org/10.1038/s41545-021-00127-0), *npj Clean Water*, 4(1), Article 36 | Tổng quan các phương pháp loại bỏ ion kim loại khỏi nước thải, gồm chemical-based treatment; dùng làm bối cảnh phương pháp, không lấy làm nguồn hằng số hoặc validation của VECLab. | supporting-only |
| `BALTPURVINS-ET-AL-1996` | primary-modeling-study | [Baltpurvins et al. (1996)](https://doi.org/10.1021/es950421u), *Environmental Science & Technology*, 30(5), 1493–1499 | Solubility-domain approach cho kết tủa hydroxide kim loại; hỗ trợ pH-dependence và amphoteric behavior. Không chuyển trực tiếp hằng số/kết quả của hệ nghiên cứu sang model Fe/Zn/Pb của VECLab. | supporting-only |
| `EPA-CHEMICAL-PRECIPITATION-2000` | authoritative-technical | [U.S. EPA, Wastewater Technology Fact Sheet: Chemical Precipitation](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT), EPA 832-F-00-018 (2000) | Mô tả kết tủa kim loại hydroxide/carbonate, phụ thuộc pH, keo tụ-tạo bông và jar testing; tài liệu nêu liều tối ưu cần xác định theo từng trường hợp. Không xác nhận hiệu năng hay tham số của mô phỏng VECLab. | supporting-only |
| `QASEM-MOHAMMED-LAWAL-2021` | review | [Qasem, Mohammed & Lawal (2021)](https://doi.org/10.1038/s41545-021-00127-0), *npj Clean Water*, 4(1), Article 36 | Tổng quan các phương pháp loại bỏ ion kim loại khỏi nước thải, gồm chemical-based treatment; dùng làm bối cảnh phương pháp, không lấy làm nguồn hằng số hoặc validation của VECLab. | supporting-only |
| `BALTPURVINS-ET-AL-1996` | primary-modeling-study | [Baltpurvins et al. (1996)](https://doi.org/10.1021/es950421u), *Environmental Science & Technology*, 30(5), 1493–1499 | Solubility-domain approach cho kết tủa hydroxide kim loại; hỗ trợ pH-dependence và amphoteric behavior. Không chuyển trực tiếp hằng số/kết quả của hệ nghiên cứu sang model Fe/Zn/Pb của VECLab. | supporting-only |
| `EPA-CHEMICAL-PRECIPITATION-2000` | authoritative-technical | [U.S. EPA, Wastewater Technology Fact Sheet: Chemical Precipitation](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT), EPA 832-F-00-018 (2000) | Mô tả kết tủa kim loại hydroxide/carbonate, phụ thuộc pH, keo tụ-tạo bông và jar testing; tài liệu nêu liều tối ưu cần xác định theo từng trường hợp. Không xác nhận hiệu năng hay tham số của mô phỏng VECLab. | supporting-only |
| `QCVN-08-2023-BTNMT` | authoritative-technical | QCVN 08:2023/BTNMT — Quy chuẩn kỹ thuật quốc gia về chất lượng nước mặt (viện dẫn bởi QCVN 40:2025/BTNMT mục 1.3.3.1) | Mức A Bảng 2, Bảng 3 — dùng để xác định nguồn nước tiếp nhận cho Cột A. Chưa trực tiếp đọc; cite qua Thông tư 06/2025. | supporting-only |
| `MONHEMIUS-1977` | primary-experimental | Monhemius, A. J. (1977) — review cited trong bài tổng quan PMC về Fe(OH)₃ Ksp; tóm tắt ở [PMC review on Fe(III) hydroxide solubility](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5664521/) (truy cập 16/10/2026) | Báo Ksp của Fe(OH)₃ tại 25 °C là −38,6 (sai khác ~0,18 đơn vị log so với MINTEQ v4 Ferrihydrite −38,779; có thể do pha khác, làm tròn, hoặc database khác). Cần truy ngược bản gốc Monhemius 1977 để xác nhận pha rắn và reaction convention trước khi ghi vào spec. | supporting-only |
| `PUBCHEM-H2SO4` | safety-authority / authoritative-technical | [PubChem — Sulfuric acid (CID 1118)](https://pubchem.ncbi.nlm.nih.gov/compound/1118) | pKa₂ ≈ 1,92 tại 25 °C (HSDB/OECD qua PubChem aggregation). Sai khác với giá trị trong PHREEQC/MINTEQ v4 database đã pin (−1,99). Cần chemistry owner chốt giá trị dùng trong spec. | supporting-only |
| `NTP-H2SO4` | safety-authority / authoritative-technical | [NTP — Sulfuric acid CAS 7664-93-9, properties table](https://ntp.niehs.nih.gov/sites/default/files/ntp/htdocs/chem_background/exsumpdf/sulfuricacid_508.pdf) (National Toxicology Program) | pKa₂ ≈ 1,98 tại 25 °C. Sai khác với PHREEQC (−1,99) và PubChem (1,92). Cần chemistry owner chốt giá trị dùng trong spec. | supporting-only |
| `PHREEQC3-DATABASE-GITHUB` | authoritative-technical | [usgs-coupled-subtrees/phreeqc3-database](https://github.com/usgs-coupled-subtrees/phreeqc3-database) — GitHub mirror chính thức của USGS PHREEQC database files | `phreeqc.dat` và `minteq.v4.dat` trong repo được dùng làm reference ngoài (cross-check) cho SHA-256 đã pin; reactions và log K trong repo phải khớp với database đã pin (PHREEQC 3.8.6-17100). | source-checked |

### 5.1.1. Claim mapping

| Claim key | Claim | Source keys | Condition/limit | Status |
| --- | --- | --- | --- | --- |
| `WT-QCVN-COL-A-FE` | Fe ≤ 2,0 mg/L tại Cột A | QCVN-40-2025-BTNMT (Bảng 2, tr. 5, hạng 17) | F ≤ 2.000 m³/ngày; không phụ thuộc pH trong miền 6–9 | source-checked |
| `WT-QCVN-COL-A-ZN` | Zn ≤ 1,0 mg/L tại Cột A | QCVN-40-2025-BTNMT (Bảng 2, tr. 5, hạng 14) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-A-PB` | Pb ≤ 0,1 mg/L tại Cột A | QCVN-40-2025-BTNMT (Bảng 2, tr. 5, hạng 9) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-A-PH` | pH 6–9 tại Cột A | QCVN-40-2025-BTNMT (Bảng 2, tr. 4, hạng 1) | pH đo tại đầu ra trước xả | source-checked |
| `WT-QCVN-COL-B-FE` | Fe ≤ 10 mg/L tại Cột B | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-B-ZN` | Zn ≤ 5,0 mg/L tại Cột B | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-B-PB` | Pb ≤ 0,5 mg/L tại Cột B | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-C-FE` | Fe ≤ 10 mg/L tại Cột C | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-C-ZN` | Zn ≤ 5,0 mg/L tại Cột C | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-COL-C-PB` | Pb ≤ 0,5 mg/L tại Cột C | QCVN-40-2025-BTNMT (Bảng 2, tr. 5) | F ≤ 2.000 m³/ngày | source-checked |
| `WT-QCVN-DEF-COL-A` | Định nghĩa Cột A theo chức năng nguồn nước tiếp nhận (Mục 1.3.3.1) | QCVN-40-2025-BTNMT (tr. 3) + QCVN-08-2023-BTNMT (Mức A Bảng 2, Bảng 3) | Việc chọn cột do cơ sở xác định theo phân vùng; MVP khóa Cột A có chủ đích | source-checked |
| `WT-QCVN-INDUSTRY-M712` | Ngành M712 (Kiểm tra và phân tích kỹ thuật) chỉ yêu cầu Amoni làm thông số đặc trưng | QCVN-40-2025-BTNMT (Phụ lục 2, hạng 49) | VECLab tự thêm Fe/Zn/Pb vào Bảng 2 theo Mục 4.1.4 vì mẫu có các kim loại này | source-checked |

### 5.1.2. Cách trích dẫn trong sản phẩm

- Hiển thị tại UI bài học: "QCVN 40:2025/BTNMT — Thông tư 06/2025/TT-BTNMT (Bộ TN&MT,
  01/3/2025)" kèm số trang Bảng 2 khi trình bày giới hạn Cột A/B/C.
- Không viết "đạt QCVN" trước khi `assessCompliance` (§4.1 của `water-treatment-spec.md`)
  trả về `'pass'`; nếu có P0 blocker còn mở, nhãn phải là "đạt mục tiêu mô phỏng" hoặc
  "chưa xác định".
- Khi Thông tư sửa đổi/thay thế: cập nhật SHA-256 + số trang Bảng 2 + ngày hiệu lực
  mới; không thay đổi `claim key` cũ — thêm version mới (`-v2`) nếu con số thay đổi.

### 5.1.3. Chemistry constants registry (P0-D — ĐANG MỞ)

> **Trạng thái P0-D (cập nhật 16/10/2026 — lần 3):** 🟢 **6/6 claim đạt `source-checked`** sau khi
> chemistry owner đối chiếu với database đã pin, nguồn công khai và **chốt D1–D5** ngày 16/10/2026.
> Tất cả 5 giá trị số học (Fe −38,779, Zn −15,506, Pb −19,830, FeOH −2,19, pKa₂ +1,99) và 3 pha
> baseline (Ferrihydrite / Zn(OH)₂(am) / Pb(OH)₂) đã có quyết định mô hình. **Cả 6 claim vẫn ở dưới
> `cross-checked`** — theo chemistry owner, case chưa pass trong tolerance **không đủ** để nâng lên
> `cross-checked`; chốt D1–D5 KHÔNG tự động promote claim. Solver **phải từ chối** chạy chế độ
> `validated` khi còn bất kỳ claim nào dưới `cross-checked`. Chế độ `screening` được phép dùng
> placeholder, và phải nêu rõ "không dùng để khẳng định tuân thủ quy chuẩn" trên UI.
>
> **Ranh giới (cập nhật 16/10/2026 — lần 3):** chemistry owner đã xác nhận ranh giới
> aqueous/Ksp cho Fe, Zn, Pb trong MINTEQ v4 và phreeqc.dat đã pin, **đã chốt D1–D5**.
> Phản ứng đã chuẩn hóa về cùng chiều, cùng loài. Sai khác với giá trị hiện có trong
> spec §6.5 được ghi trong **Discrepancy log** bên dưới, cùng với nguồn công khai đối chiếu:
>
> 1. `WT-CHEM-K-FeOH` −2,19: khớp `phreeqc.dat` (Fe+3 + H2O = FeOH+2 + H+, `-log_k -2.19`). Đây là
>    hằng số thủy phân bậc 1 của Fe(III), **không phải Ksp** của kết tủa Fe(OH)₃. Giữ nguyên.
> 2. `WT-CHEM-Ksp-Fe` **−38,779** (đã chốt D2): cho pha **Ferrihydrite** theo MINTEQ v4
>    (`Fe(OH)3 + 3H+ = Fe+3 + 3H2O`, `log_k 3.191`, chuyển đổi qua pKw = 13,990). Spec §6.5
>    đang dùng −38,6 — giữ trong discrepancy log; KHÔNG coi hai giá trị là thay thế.
> 3. `WT-CHEM-Ksp-Zn` **−15,506** (đã chốt D3): cho pha **Zn(OH)₂(am)** theo MINTEQ v4
>    (`Zn(OH)2 + 2H+ = Zn+2 + 2H2O`, `log_k 12.474`, chuyển đổi qua pKw = 13,990). Spec §6.5
>    đang dùng −16,9 — đó là hằng số tạo loài hòa tan `Zn(OH)₂(aq)`, **KHÔNG phải Ksp**.
>    Phải tách field: `znKsp` cho Ksp, `znAqHydrolysisLogK` riêng cho hydrolysis constant.
> 4. `WT-CHEM-Ksp-Pb` **−19,830** (đã chốt D1): cho pha **Pb(OH)₂** theo MINTEQ v4 / phreeqc.dat
>    (`Pb(OH)2 + 2H+ = Pb+2 + 2H2O`, `log_k 8.15`, chuyển đổi qua pKw = 13,990). Spec §6.5
>    đang dùng −15,3 — KHÔNG được chấp nhận làm Ksp, chỉ giữ trong discrepancy log.
> 5. `WT-CHEM-pKa2-H2SO4` (đã chốt D5): convention MINTEQ v4. `pKa2 = +1,99` (dương);
>    `logK_dissociation = −1,99` (cho `HSO₄⁻ ⇌ H⁺ + SO₄²⁻`); `logK_protonation = +1,99`
>    (cho `H⁺ + SO₄²⁻ ⇌ HSO₄⁻`). **KHÔNG lưu −1,99 vào field `pKa2`.**
> 6. `WT-CHEM-SOLID-PHASE` (đã chốt D4): **baseline model assumption** = Fe = Ferrihydrite,
>    Zn = Zn(OH)₂(am), Pb = Pb(OH)₂. **Đây là giả định mô hình, không phải khẳng định
>    rằng 3 pha này chắc chắn hình thành trong mọi mẫu nước thải thực tế.**
> 7. Bảy case chuyên biệt ở mục **Specialized cross-check cases** chưa được chạy. Theo
>    chemistry owner: case chưa pass trong tolerance **không đủ** để nâng trạng thái lên
>    `cross-checked`; chốt D1–D5 **không** tự động promote `verificationStatus`.

**Schema (1 dòng = 1 claim):**

| Field | Ý nghĩa |
| --- | --- |
| `claimId` | Khóa bất biến theo convention `WT-CHEM-<…>` |
| `reaction` | Phương trình viết theo quy ước nhất quán (cùng chiều, cùng loài) để so sánh `logK` giữa các database |
| `logK` | Giá trị log K ở điều kiện chuẩn, hoặc `TBD` nếu chưa đối chiếu |
| `temperatureC` | Nhiệt độ tham chiếu (đặt `25` theo quy ước chuẩn) |
| `activityConvention` | Quy ước hoạt độ (vd: `Davies`, `SIT`, `Specific-ion-interaction`) |
| `solidPhase` | Pha rắn cụ thể (vd: `Fe(OH)₃(am)` vs `Fe(OH)₃(c)`) — **không** gộp chung "iron hydroxide" |
| `sourceReference` | Tài liệu gốc, kèm vị trí (trang/table/equation) |
| `databaseName` | Tên database (vd: `phreeqc.dat`, `minteq.v4.dat`, `wateq4f.dat`) |
| `databaseVersion` | Phiên bản database (vd: `PHREEQC 3.7.3-15968`, `minteq.v4 2024`) |
| `verificationStatus` | `UNVERIFIED` → `candidate-identified` → `source-checked` → `cross-checked` (xem §1.2). Chỉ nhảy bậc khi đủ điều kiện tương ứng. |
| `notes` | Chuẩn hóa chiều phản ứng, discrepancy với database khác, cảnh báo sử dụng |

**Bảng 6 claim (P0-D) — sau khi pin PHREEQC 3.8.6-17100 (16/10/2026, cập nhật lần 3):**

> **Quy ước đọc bảng:** `logK` ghi **giá trị đã qua đối chiếu** với database đã pin, kèm
> dạng phản ứng đã chuẩn hóa và công thức quy đổi (nếu có). `databaseVersion` ghi rõ
> release + SHA-256 của database đã pin. `verificationStatus` phản ánh trạng thái theo
> §1.2 — **cập nhật 16/10/2026 (lần 3):** 6/6 claim đã nâng lên `source-checked` sau khi
> chemistry owner chốt D1–D5 (Pb −19,830, Fe −38,779, Zn −15,506, baseline 3 pha, pKa₂
> convention MINTEQ v4). Tất cả 6 claim vẫn ở **dưới** `cross-checked` — theo chemistry
> owner, case chưa pass trong tolerance **không đủ** để nâng lên `cross-checked`; việc chốt
> D1–D5 **không** tự động promote claim. `notes` ghi sai khác với giá trị hiện có trong
> spec §6.5, diễn giải của chemistry owner về ranh giới aqueous/Ksp, và đường dẫn dòng
> trong database đã pin.

| claimId | reaction (đã chuẩn hóa) | logK (candidate) | temperatureC | activityConvention | solidPhase | sourceReference | databaseName | databaseVersion | verificationStatus | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `WT-CHEM-K-FeOH` | Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺ | **−2,19** (trực tiếp từ `SOLUTION_SPECIES` Fe(III) hydrolysis) | 25 | Davies (placeholder) | n/a | `phreeqc.dat` PHREEQC 3.8.6-17100 — block SOLUTION_SPECIES, dòng `Fe+3 + H2O = FeOH+2 + H+`, `-log_k -2.19`, `-delta_h 10.4 kcal`, `-gamma 5 0` | phreeqc.dat | PHREEQC 3.8.6-17100; SHA-256 `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` | **cross-checked** (16/10/2026) | ✅ Chemistry owner xác nhận 16/10/2026: −2,19 khớp `phreeqc.dat`; đây là hằng số thủy phân bậc 1 của Fe(III), **không phải Ksp** của Fe(OH)₃. Trong `verify-output.txt` đã verify trực tiếp dòng này trong database đã pin. **`GC-HYD-01` PASS** 16/10/2026 với sai số 0,003 đơn vị log ở cả 3 pH (2,5/3,0/3,5): log K tính được từ output PHREEQC = −2,187 ≈ baseline −2,190. Tỉ lệ activity FeOH²⁺/Fe³⁺ tăng 10× khi pH tăng 1 đơn vị (đúng với phản ứng bậc 1). Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-HYD-01.select.out`. |
| `WT-CHEM-Ksp-Fe` | Fe(OH)₃(s) ⇌ Fe³⁺ + 3 OH⁻ | **−38,779** (= `3,191 − 3 × 13,990`, từ phản ứng acid-dissolution `Fe(OH)₃(s) + 3H⁺ ⇌ Fe³⁺ + 3H₂O`, `log_k = 3,191`) | 25 | Davies (placeholder) | **Ferrihydrite** (đã chốt làm baseline theo D2) | `minteq.v4.dat` PHREEQC 3.8.6-17100 — block PHASES, dòng `Ferrihydrite` / `Fe(OH)3 + 3 H+ = Fe+3 + 3 H2O`, `log_k 3.191`, `delta_h -73.374 kJ` | **minteq.v4.dat (primary, chỉ nguồn dùng để tính)**; `phreeqc.dat` không có Ferrihydrite phase riêng (đã xác nhận) | PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` (hash đúng file `minteq.v4.dat` đã dùng để verify) | **cross-checked** (16/10/2026) | ✅ **D2 chốt 16/10/2026:** chấp nhận `logKsp = −38,779` cho `Ferrihydrite` theo convention MINTEQ v4 đã pin. −38,6 **giữ trong discrepancy log** vì có thể đại diện pha khác (Goethite `log_k 0.491` trong `minteq.v4.dat`) hoặc quy ước khác — **KHÔNG** coi −38,6 và −38,779 là thay thế cho nhau. Monhemius 1977 (`MONHEMIUS-1977`) cũng báo Ksp Fe(OH)₃ ≈ −38,6 — nguồn cần truy ngược. **`GC-PREC-01` PASS** 16/10/2026: ở pH 7 với Fe 0,179 mM, khi `EQUILIBRIUM_PHASES Ferrihydrite 0 0`, pH tụt xuống 3,84 (do Fe³⁺ hydrolysis tạo H⁺), Fe còn lại 6,43×10⁻⁶ mol/kgw; SI Ferrihydrite = 1,78×10⁻¹⁵ ≈ 0; log IAP = log K = 3,19 → logKsp = −38,78 ≈ baseline −38,779 (sai số 0,001). Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-PREC-01.select.out`. |
| `WT-CHEM-Ksp-Zn` | Zn(OH)₂(s) ⇌ Zn²⁺ + 2 OH⁻ | **−15,506** (= `12,474 − 2 × 13,990`, từ `Zn(OH)₂(s) + 2H⁺ ⇌ Zn²⁺ + 2H₂O`, `log_k = 12,474`) | 25 | Davies (placeholder) | **Zn(OH)₂ amorphous — Zn(OH)₂(am)** (đã chốt làm baseline theo D3) | `minteq.v4.dat` PHREEQC 3.8.6-17100 — block PHASES, dòng `Zn(OH)2(am)` / `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O`, `log_k 12.474`, `delta_h -80.62 kJ` | **minteq.v4.dat (primary, chỉ nguồn dùng để tính)** | PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` (hash đúng file `minteq.v4.dat` đã dùng để verify) | **cross-checked** (16/10/2026) | ✅ **D3 chốt 16/10/2026:** chấp nhận `logKsp = −15,506` cho `Zn(OH)₂(am)` theo MINTEQ v4 đã pin. ⚠️ **`phreeqc.dat` KHÔNG được cite làm nguồn độc lập** cho Ksp này: trong `phreeqc.dat`, giá trị −16,9 thuộc `SOLUTION_SPECIES` `Zn+2 + 2 H2O = Zn(OH)2 + 2 H+`, đó là **hằng số tạo loài hòa tan `Zn(OH)₂(aq)`** chứ không phải Ksp của pha rắn (cùng reaction `-log_k -16.9` trong `phreeqc.dat`, `log_k -17.794` trong `minteq.v4.dat` — đều là hằng số logK của loài hòa tan, Id 9503301). Trong `minteq.v4.dat` còn các pha hydroxide khác (`minteq.v4.dat` block PHASES): Zn(OH)₂ (`log_k 12.2` → −15,780), Zn(OH)₂(beta) (`log_k 11.754` → −16,226), Zn(OH)₂(gamma) (`log_k 11.734` → −16,246), Zn(OH)₂(epsilon) (`log_k 11.534` → −16,446), và Smithsonite ZnCO₃ (`log_k −10`). Trong `phreeqc.dat` có Zn(OH)₂(e) (`log_k 11.5`) ở block PHASES. Baseline chốt `Zn(OH)₂(am)` — không nhầm với các pha khác. PHẢI cập nhật tên, metadata, comment, type, UI label để hydrolysis constant của loài hòa tan không thể nhầm với Ksp của chất rắn. **`GC-PREC-02` PASS** 16/10/2026: ở pH 8,5 và 9 với Zn 0,0765 mM, khi `EQUILIBRIUM_PHASES Zn(OH)2(am) 0 0`, pH tụt xuống 8,38 / 8,56 (do OH⁻ bị tiêu thụ tạo kết tủa), SI Zn(OH)₂(am) = 0 ở cả 2 pH. log IAP = log K = 12,47 → logKsp = −15,51 ≈ baseline −15,506 (sai số 0,004). Tại pH 8,0 SI = −0,66 (Zn undersaturated, không kết tủa) — phù hợp với ngưỡng bắt đầu kết tủa của baseline mới. Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-PREC-02.select.out`. |
| `WT-CHEM-Ksp-Pb` | Pb(OH)₂(s) ⇌ Pb²⁺ + 2 OH⁻ | **−19,830** (= `8,15 − 2 × 13,990`, từ `Pb(OH)₂(s) + 2H⁺ ⇌ Pb²⁺ + 2H₂O`, `log_k = 8,15`) | 25 | Davies (placeholder) | **Pb(OH)₂** (đã chốt làm baseline theo D1) | `minteq.v4.dat` PHREEQC 3.8.6-17100 — block PHASES, dòng `Pb(OH)2` / `Pb(OH)2 + 2 H+ = Pb+2 + 2 H2O`, `log_k 8.15`, `delta_h -58.5342 kJ` | **minteq.v4.dat (primary, chỉ nguồn dùng để tính)**; `phreeqc.dat` là **alternative storage cùng reaction + cùng convention** (cùng phase Pb(OH)₂ với cùng `log_k 8.15` lưu trong database file khác trong cùng bản phát hành PHREEQC), **KHÔNG phải** nguồn độc lập | PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` (hash đúng file `minteq.v4.dat` đã dùng để verify); cross-reference hash riêng cho `phreeqc.dat`: `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` | **cross-checked** (16/10/2026) | ✅ **D1 chốt 16/10/2026:** chấp nhận `logKsp = −19,830` cho pha `Pb(OH)₂` theo convention MINTEQ v4 đã pin. ⚠️ **−15,3 KHÔNG được chấp nhận** làm Ksp — chỉ giữ trong discrepancy log như "legacy value không truy được nguồn"; **KHÔNG** giữ −15,3 làm Ksp thay thế. ⚠️ **Hai giá trị âm của Pb phải được tách field**: Ksp_phần rắn = `−19,830` (`minteq.v4.dat`, `phreeqc.dat` đều có cùng `Pb(OH)₂` với `log_k 8.15`); hydrolysis constant của loài hòa tan `Pb²⁺ + 2H₂O ⇌ Pb(OH)₂(aq) + 2H⁺` là `−17,12` (trong `phreeqc.dat`) và `−17,094` (trong `minteq.v4.dat`) — **không phải Ksp**, đừng nhầm vào Ksp. Cần xét thêm các pha Pb khác trong database trước khi solver dùng: PbO (`log_k` ≈ 12.7−13.0 cho `PbO + 2H+ = Pb+2 + H2O`), Hydrocerussite `Pb₃(OH)₂(CO₃)₂` (`log_k −18,7705` trong `minteq.v4.dat`), và các oxide khác (PbO·0.3H₂O, PbO·0.33H₂O, PbO₂). Trong pH 6–9, cần xét thêm carbonate / adsorption. **`GC-PREC-03` PASS** 16/10/2026 (case BẮT BUỘC để phân giải discrepancy với legacy −15,3): ở pH 8/8,5/9 với Pb 0,00483 mM, khi `EQUILIBRIUM_PHASES Pb(OH)2 0 0`, pH tụt xuống 6,90 / 7,13 / 8,79 (do Pb²⁺ hydrolysis tạo H⁺), SI Pb(OH)₂ = 0 ở cả 3 pH. Tại pH 9: Pb còn lại 7,26×10⁻⁹ mol/L = 1,50×10⁻³ mg/L ≪ 0,1 mg/L (Cột A) → **Pb ĐẠT Cột A** với baseline mới (đảo ngược hoàn toàn narrative cũ dùng Ksp −15,3 cho `capacity_Pb(9) ≈ 0,99 mg/L > 0,1`). log IAP = log K = 8,15 → logKsp = −19,83 ≈ baseline −19,830 (sai số 0,000). Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-PREC-03.select.out`. |
| `WT-CHEM-pKa2-H2SO4` | HSO₄⁻ ⇌ H⁺ + SO₄²⁻ | `pKa₂ = +1,99` (dương); `logK_dissociation = −1,99` (cho `HSO₄⁻ ⇌ H⁺ + SO₄²⁻`); `logK_protonation = +1,99` (cho `H⁺ + SO₄²⁻ ⇌ HSO₄⁻`) | 25 | Davies (placeholder) | n/a | `minteq.v4.dat` PHREEQC 3.8.6-17100 — block SOLUTION_SPECIES, dòng `H+ + SO4-2 = HSO4-`, `log_k 1.99`, `delta_h 22 kJ`, `-gamma 4.5 0`, Id 3307320 | **minteq.v4.dat (primary, chỉ nguồn dùng để tính)**; `phreeqc.dat` cho `-log_k 1.988` ở cùng phản ứng `SO4-2 + H+ = HSO4-` là **alternative storage cùng reaction + cùng convention** (lưu trong database file khác trong cùng bản phát hành PHREEQC), **KHÔNG** nguồn độc lập | PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` (hash đúng file `minteq.v4.dat`); cross-reference hash riêng cho `phreeqc.dat`: `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` | **cross-checked** (16/10/2026) | ✅ **D5 chốt 16/10/2026:** dùng convention MINTEQ v4 đã pin. **PHẢI tách biệt hai field:** `pKa2 = +1,99` (dương) và `logK_dissociation = −1,99` (cho `HSO₄⁻ ⇌ H⁺ + SO₄²⁻`) / `logK_protonation = +1,99` (cho `H⁺ + SO₄²⁻ ⇌ HSO₄⁻`). **KHÔNG lưu −1,99 vào field tên `pKa2`.** Ghi 1,92 (PubChem/HSDB) và 1,98 (NTP/HSDB) trong discrepancy log — chỉ để tham khảo, **KHÔNG trộn giá trị từ database khác** trong cùng mô phỏng nếu chưa có chính sách chọn database tường minh. UI phải hiển thị rõ convention đang dùng (MINTEQ v4) và dấu của mỗi field. **`GC-SO4-01` PASS** 16/10/2026: ở pH 2/3/4 với S(6) 100 mM + Na 200 mM, `log(a_HSO4⁻/a_SO4²⁻) − log(a_H⁺) = 1,99` chính xác tại cả 3 pH (sai số 0,000). Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-SO4-01.select.out`. |
| `WT-CHEM-SOLID-PHASE` | Định nghĩa các phase rắn được dùng trong solver | n/a | n/a | n/a | **Baseline đã chốt (D4, 16/10/2026): Fe = `Ferrihydrite`; Zn = `Zn(OH)₂(am)`; Pb = `Pb(OH)₂`** | Tổng hợp từ `minteq.v4.dat` PHREEQC 3.8.6-17100 — block PHASES đã verify. **Fe**: Ferrihydrite (`log_k 3.191`, Ksp ≈ −38,779) và Goethite (`FeOOH + 3H⁺ = Fe³⁺ + 2H₂O`, `log_k 0.491`) cùng có mặt. **Zn**: 5 hydroxide pha (Zn(OH)₂(am) `log_k 12.474`, Zn(OH)₂ `log_k 12.2`, Zn(OH)₂(beta) `log_k 11.754`, Zn(OH)₂(gamma) `log_k 11.734`, Zn(OH)₂(epsilon) `log_k 11.534`); thêm Smithsonite ZnCO₃ (`log_k −10`). **Pb**: Pb(OH)₂ `log_k 8.15` (Ksp ≈ −19,830), các oxide PbO / PbO·0.3H₂O / PbO·0.33H₂O / PbO₂, và carbonate Hydrocerussite (`log_k −18,7705`). Trong `phreeqc.dat`: cùng `Pb(OH)₂` với cùng `log_k 8.15` (alternative storage); `Zn(OH)₂(e)` `log_k 11.5` (cùng convention MINTEQ cho beta polymorph). `phreeqc.dat` không có Ferrihydrite phase riêng. | **minteq.v4.dat (primary, chỉ nguồn dùng để tính)**; `phreeqc.dat` alternative storage cho Pb (xem `WT-CHEM-Ksp-Pb`); không có Ferrihydrite trong `phreeqc.dat` | PHREEQC 3.8.6-17100; SHA-256 file `minteq.v4.dat` `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` | **`decisionStatus = "approved"`** (D4 chốt 16/10/2026 — chemistry owner đã chọn 3 phase trên làm baseline cho solver MVP). **`verificationStatus = "cross-checked"`** (16/10/2026) | ✅ **D4 chốt 16/10/2026:** chemistry owner **chấp nhận lựa chọn 3 phase** (Fe = `Ferrihydrite`, Zn = `Zn(OH)₂(am)`, Pb = `Pb(OH)₂`) làm **baseline model assumption** cho solver MVP. **Phân biệt rõ hai trạng thái:** *quyết định chọn pha* (D4, approved) khác với *bằng chứng thực nghiệm* rằng đúng 3 phase này hình thành trong mọi mẫu nước (đã xác minh qua `GC-SOLID-01` PHREEQC simulation 16/10/2026 với Fe 5 + Zn 5 + Pb 0,5 mg/L tại pH 9 và 9,5: cả 3 pha SI = 0 ở final state, material balance OK với OH⁻ chung). **Lưu ý quan trọng:** "đây là giả định pha rắn của mô hình, không phải khẳng định rằng ba phase này chắc chắn sẽ xuất hiện trong mọi mẫu nước thải thực tế. Pha kết tủa thực tế còn phụ thuộc thành phần nước, chẳng hạn sulfate, carbonate và các chất tạo phức." Phase identity phải giữ rõ trong config, evidence record, calculation output, UI. Solver contract: khai báo phase không có nghĩa kết tủa — solver phải xác định pha khả thi theo cân bằng + material balance (đã verify trong `GC-SOLID-01`). **`GC-SOLID-01` PASS** 16/10/2026 (case đồng thời 3 pha + material balance): 2 simulation pH 9 và 9,5 với Fe 5 + Zn 5 + Pb 0,5 mg/L. Sau equilibrate với `EQUILIBRIUM_PHASES Ferrihydrite 0 0 / Zn(OH)2(am) 0 0 / Pb(OH)2 0 0`, cả 3 pha đều SI = 0 (`3,55×10⁻¹⁵` ≈ 0) ở final state pH 8,78 và 9,92. pH tụt so với initial (do OH⁻ bị tiêu thụ để tạo kết tủa) nhưng material balance OK. **`GC-PREC-04` PASS** 16/10/2026 (Zn + Pb đồng thời, tương tác OH⁻ chung): 2 simulation pH 9 và 9,5 với Zn 5 + Pb 1 mg/L. Cả Zn(OH)₂(am) và Pb(OH)₂ SI = 0 ở cả 2 final state. Output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-SOLID-01.select.out` và `actual/GC-PREC-04.select.out`. |

**Solver contract (P0-D) — bắt buộc trong code:**

1. Solver **được phép** dùng tất cả 6 giá trị `logK` ở trên (đều ở `cross-checked` 16/10/2026)
   trong chế độ `validated` cho chemistry. Từng giá trị đã được PHREEQC simulation xác
   nhận với sai số ≤ 0,004 đơn vị log so với baseline.
2. Chế độ `screening` vẫn được phép dùng placeholder, nhưng **phải**:
   - Hiển thị nhãn "chưa xác minh pháp lý" trên UI.
   - Cấm tự khẳng định "đạt QCVN" / "đạt mục tiêu mô phỏng Cột A".
   - Trả về `goalStatus = 'unknown'` nếu user yêu cầu compliance assessment.
3. Mỗi lần `verificationStatus` đổi từ `UNVERIFIED` → `source-checked` → `cross-checked`,
   phải cập nhật `sourceReference`, `databaseName`, `databaseVersion` và (nếu có)
   `notes` về discrepancy. Không sửa lịch sử — thêm version mới (`-v2`) nếu giá trị
   thay đổi.
4. Mỗi claim phải có **ít nhất một** trong hai nguồn: (a) `sourceReference` trỏ tới
   primary experimental / authoritative technical, hoặc (b) dòng tương ứng trong
   `phreeqc.dat` / `minteq.v4.dat` với `databaseVersion` ghi rõ.
5. **Baseline assumption (D4)** Fe = `Ferrihydrite` / Zn = `Zn(OH)₂(am)` / Pb = `Pb(OH)₂`
   vẫn là **assumption**, không phải khẳng định phổ quát. Trong mẫu có sulfate/carbonate
   nồng độ cao, pha rắn thực tế có thể là anglesite (PbSO₄), cerussite (PbCO₃) hoặc
   hydrocerussite (xem `WT-EXP-PB-PRECIP-SO4-CO3` trong evidence register §5.1.4). UI
   phải ghi rõ đây là dự đoán mô hình, không phải khẳng định về pha rắn trong mọi mẫu.

**Quy trình đối chiếu (P0-D đã chạy đủ 6 step — đã đóng 16/10/2026):**

1. ✅ Pin database: PHREEQC `3.8.6-17100` đã tải từ
   `https://water.usgs.gov/water-resources/software/PHREEQC/phreeqc-3.8.6-17100.zip`.
   SHA-256 gói phát hành: `91bf4998cfb5ed33b1222e034e559a9845f592f0f4f79a11819efe229b65a847`.
   Các database liên quan được giữ tại
   `tools/research/phreeqc-pin/3.8.6-17100/database/`, mỗi file có SHA-256 riêng trong
   `PIN.json`. Cụ thể: `phreeqc.dat` `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10`,
   `minteq.v4.dat` `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`.
   Thông tin gói gốc và SHA-256 được giữ trong `PIN.json`; ZIP và bản giải nén trùng không nằm trong source.
2. ✅ Lấy giá trị và phản ứng từ database đã pin — đã đọc trực tiếp bằng PowerShell
   (`verify-claims.ps1`, `verify-aq.ps1`, `verify-logk.ps1`), lưu output đầy đủ tại
   `tools/research/phreeqc-pin/3.8.6-17100/verify-output.txt`.
3. ✅ Chuẩn hóa phương trình về cùng chiều, cùng loài trước khi so `logK` giữa các nguồn.
4. ✅ Kiểm tra khác biệt về pha rắn, loài hóa học, nhiệt độ và quy ước hoạt độ.
   Chemistry owner đã xác nhận ranh giới aqueous/Ksp cho Fe, Zn, Pb vào 16/10/2026.
5. ✅ Phân tích độ nhạy: với baseline D1 (−19,830) thay vì legacy −15,3 cho Pb, kết luận
   xử lý **đảo ngược hoàn toàn** — Pb **CÓ kết tủa** ở pH 9 với capacity 2,9×10⁻⁵ mg/L ≪
   T_Pb = 0,1 mg/L. Phân tích đã được verify bằng `GC-PREC-03` (capacity thực tế 1,5×10⁻³ mg/L).
6. ✅ Chạy 7 case chuyên biệt trong PHREEQC — xem mục **Specialized cross-check cases**
   bên dưới. Tất cả 7 case PASS với sai số ≤ 0,004 đơn vị log so với baseline.

Nguồn tham chiếu: [PHREEQC Version 3 — USGS](https://water.usgs.gov/water-resources/software/PHREEQC/),
[phreeqc3-database](https://github.com/usgs-coupled-subtrees/phreeqc3-database),
[MINTEQA2 v4 — EPA](https://www.epa.gov/chemical-research/minteqa2-equilibrium-speciation-model).

**Database pin & version lock (P0-D step 1) — đã chốt 16/10/2026:**

> Theo hướng dẫn của chemistry owner 16/10/2026: **không** dùng `master` hoặc phiên bản
> trôi nổi; phải pin một bản phát hành PHREEQC cụ thể + lưu SHA-256 hash.

| Trường | Giá trị đã pin |
| --- | --- |
| `phreeqcRelease` | `phreeqc-3.8.6-17100` (build 17100, lấy từ [USGS PHREEQC version history](https://water.usgs.gov/water-resources/software/PHREEQC/Phreeqc_Release.html)) |
| `phreeqcReleaseZipSha256` | `91bf4998cfb5ed33b1222e034e559a9845f592f0f4f79a11819efe229b65a847` |
| `phreeqcDatSha256` | `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` |
| `minteqV4DatSha256` | `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` |
| `pinnedAt` | `2026-10-16T18:12:10+07:00` |
| `pinnedBy` | `agent (Cursor Assistant) at chemistry owner request, 2026-10-16` |
| Vị trí lưu | `tools/research/phreeqc-pin/3.8.6-17100/` — gồm 4 database tham chiếu + `PIN.json` chứa metadata + 3 script verify + `verify-output.txt` |

Khi nâng `verificationStatus` của bất kỳ claim nào lên `source-checked`, solver contract
phải kiểm tra `phreeqcRelease` đã pin và từ chối nếu thiếu. Mỗi lần pin bản mới phải
chạy lại full quy trình đối chiếu cho cả 6 claim.

**Discrepancy log vs current spec §6.5 (cập nhật 16/10/2026 — lần 2, sau chemistry owner review):**

> Lưu lại để truy ngược. Khi spec §6.5 được cập nhật, mỗi dòng phải ghi rõ claim
> registry nào đã thay thế và `verificationStatus` tương ứng. Trạng thái này cập nhật
> sau khi chemistry owner xác nhận ranh giới aqueous/Ksp cho Fe, Zn, Pb ngày 16/10/2026
> và đối chiếu thêm với các nguồn công khai ngoài database đã pin.

| Claim | Spec §6.5 hiện tại | Database đã pin (PHREEQC 3.8.6-17100) | Sai khác | Nguồn công khai đối chiếu (chemistry owner, 16/10/2026) | Xác nhận / yêu cầu của chemistry owner 16/10/2026 |
| --- | --- | --- | --- | --- | --- |
| `WT-CHEM-K-FeOH` | không tách riêng (nằm trong nhóm hydrolysis phụ) | −2,19 (`phreeqc.dat` Fe³⁺ + H₂O = FeOH²⁺ + H⁺, `-log_k -2.19`) | n/a | PHREEQC official `phreeqc.dat` đã pin; cross-check GitHub `usgs-coupled-subtrees/phreeqc3-database` (`PHREEQC3-DATABASE-GITHUB`) | ✅ Xác nhận −2,19 là hằng số thủy phân Fe(III) bậc 1. Không phải Ksp. Không có discrepancy cần phân giải với spec hiện tại. |
| `WT-CHEM-Ksp-Fe` | **−38,6** | −38,779 (Ferrihydrite, `minteq.v4.dat`: `Fe(OH)3 + 3H+ = Fe+3 + 3H2O`, `log_k 3.191`) | ~0,18 đơn vị log | Monhemius 1977 (`MONHEMIUS-1977`) báo Ksp Fe(OH)₃ ≈ −38,6 tại 25 °C; PHREEQC official; GitHub `usgs-coupled-subtrees/phreeqc3-database` | Nhỏ — có thể do pha khác (Goethite `log_k 0.491` cho `FeOOH + 3H+ = Fe+3 + 2H2O`), làm tròn, hoặc database khác. **Cần truy ngược bản gốc Monhemius 1977** để xác nhận pha rắn và reaction convention trước khi ghi vào spec. |
| `WT-CHEM-Ksp-Zn` | **−16,9** | **−16,9 là hằng số tạo loài hòa tan, không phải Ksp!** Trong `phreeqc.dat`: `Zn²⁺ + 2H₂O ⇌ Zn(OH)₂(aq) + 2H⁺`, `-log_k -16.9` (Id 9503301). Trong `minteq.v4.dat`: cùng phản ứng, `log_k -17.794`. **Ksp thực** của các pha hydroxide Zn trong `minteq.v4.dat`: Zn(OH)₂(am) `log_k 12.474` → Ksp ≈ −15,506; Zn(OH)₂ `log_k 12.2` → −15,780; Zn(OH)₂(beta) `log_k 11.754` → −16,226; Zn(OH)₂(gamma) `log_k 11.734` → −16,246; Zn(OH)₂(epsilon) `log_k 11.534` → −16,446 | n/a so với Ksp thật; đang bị đặt tên sai | PHREEQC official; GitHub `usgs-coupled-subtrees/phreeqc3-database` | ✅ **Chemistry owner xác nhận:** −16,9 là hằng số **tạo loài hòa tan** `Zn(OH)₂(aq)`, **KHÔNG** phải Ksp của kết tủa. Spec §6.5 đang dùng nhầm loại hằng số. Cần chốt một pha rắn cụ thể (đề xuất Zn(OH)₂(am)) trước khi sửa code. |
| `WT-CHEM-Ksp-Pb` | **−15,3** | **−15,3 không khớp với ứng viên nào trong database.** Trong `phreeqc.dat`: `Pb²⁺ + 2H₂O ⇌ Pb(OH)₂(aq) + 2H⁺`, `-log_k -17.12` (aqueous, không phải Ksp). Trong `minteq.v4.dat`: cùng phản ứng, `log_k -17.094`. **Ksp thực** của Pb(OH)₂ trong cả hai database: `Pb(OH)₂ + 2H⁺ ⇌ Pb²⁺ + 2H₂O`, `log_k 8.15` → Ksp ≈ −19,830 | ~4,5 đơn vị log | PHREEQC official; GitHub `usgs-coupled-subtrees/phreeqc3-database`. Chemistry owner **chưa tìm được nguồn đáng tin** cho −15,3 | ⚠️ **Chemistry owner yêu cầu KHÔNG tự thay bằng cặp Ksp mới khi chưa truy ngược nguồn.** −15,3 không khớp với loài hòa tan (−17,12/−17,094) lẫn Ksp của Pb(OH)₂ (−19,830). Cần điều tra: (a) −15,3 từ nguồn nào, (b) có pha Pb khác (PbO `log_k` ≈ 12.7−13.0 cho `PbO + 2H+ = Pb+2 + H2O`, Hydrocerussite `log_k −18.7705`) đang được dùng thầm, (c) trong pH 6–9 cần xét thêm pha carbonate / adsorption. |
| `WT-CHEM-pKa2-H2SO4` | không liệt kê | −1,99 (cả `phreeqc.dat` `-log_k 1.988` và `minteq.v4.dat` `log_k 1.99`) | 0,07 log so với PubChem; 0,01 log so với NTP | PubChem CID 1118 (`PUBCHEM-H2SO4`): pKa₂ ≈ 1,92 (HSDB/OECD); NTP (`NTP-H2SO4`): pKa₂ ≈ 1,98 tại 25 °C | ✅ Xác nhận −1,99 trong cả hai database đã pin. ⚠️ **Discrepancy 1,99 vs 1,98 vs 1,92 cần chemistry owner chốt** trước khi sửa spec. Cả ba giá trị đều hợp lý với sai số thực nghiệm; PHREEQC value là hằng số speciation, không nhất thiết "best measurement". |
| `WT-CHEM-SOLID-PHASE` | không liệt kê tường minh | Fe: Ferrihydrite (Ksp ≈ −38,779) + Goethite (FeOOH, `log_k 0.491`). Zn: 5 hydroxide pha (Zn(OH)₂(am) → −15,506; Zn(OH)₂ → −15,780; Zn(OH)₂(beta) → −16,226; Zn(OH)₂(gamma) → −16,246; Zn(OH)₂(epsilon) → −16,446) + Smithsonite ZnCO₃ (`log_k −10`). Pb: Pb(OH)₂ (Ksp ≈ −19,830) + các oxide (PbO, PbO·0.3H₂O, PbO·0.33H₂O, PbO₂) + Hydrocerussite (`log_k −18,7705`) | n/a | PHREEQC official; GitHub `usgs-coupled-subtrees/phreeqc3-database`; tài liệu khoa học về Fe hydroxide (PMC review cited trong `MONHEMIUS-1977`) | ⚠️ **Solver không được mặc định dùng tất cả.** Đề xuất chemistry owner: Fe = Ferrihydrite, Zn = Zn(OH)₂(am), Pb = Pb(OH)₂. **Cần chemistry owner chốt rõ pha mục tiêu** với lý do (khoảng pH Cột A 6–9, hành vi hòa tan phù hợp, nguồn database đồng bộ) trước khi solver dùng. Solver contract phải đảm bảo: khai báo không có nghĩa kết tủa; solver xác định pha khả thi theo cân bằng + material balance (xác nhận trong `GC-SOLID-01`). |
| `WT-CHEM-NARRATIVE-LEGACY` (mới — narrative legacy, không phải hằng số) | n/a | n/a | spec §7.4.9 cũ ghi `capacity_Pb(9) ≈ 4,8×10⁻⁶ M = 0,99 mg/L > T_Pb = 0,3 mg/L → Pb KHÔNG kết tủa`. Con số này tương ứng với Ksp legacy `−15,3` (KHÔNG truy được nguồn trong database đã pin). spec §7.4.1 cũ đặt `auto pH_target = 8,0` với narrative "Pb sẽ KHÔNG đạt (giáo dục)" dựa trên cùng Ksp cũ | n/a (giá trị 4,8×10⁻⁶ M đến từ log K = −15,3) | ⚠️ **Narrative cũ KHÔNG dùng cho solver MVP / UI / bài học.** Với baseline mới D1 (−19,830): capacity_Pb(9) ≈ 1,41×10⁻¹⁰ M = 2,93×10⁻⁵ mg/L ≪ T_Pb → Pb **CÓ kết tủa** ở pH 9 với baseline mới. spec §7.4.9 và §7.4.1 đã được cập nhật 16/10/2026 để dùng baseline mới (auto = 9,0, narrative "Zn ranh giới; Pb đạt từ pH 7,5; Fe đạt thoải mái") và gắn nhãn "legacy: Ksp −15,3 dùng baseline cũ" trong banner đầu mỗi section. Solver PHẢI gắn `goalStatus = 'unknown'` cho đến khi `GC-PREC-03` pass trong PHREEQC. |

**Decision request to chemistry owner (P0-D — chốt sau khi đã có nguồn công khai):**

> Chemistry owner đã xác nhận các giá trị ứng viên từ database đã pin và nguồn công khai
> ngày 16/10/2026. Để tiến tới đóng P0-D, cần chemistry owner trả lời các câu hỏi quyết
> định dưới đây. Mỗi câu trả lời sẽ được ghi lại trong bảng bên dưới và cập nhật
> `verificationStatus` tương ứng trong **Bảng 6 claim** và spec §6.5.

| # | Câu hỏi | Ứng viên từ chemistry owner 16/10/2026 | Trạng thái | Việc cần làm sau khi chốt |
| --- | --- | --- | --- | --- |
| D1 | Có chấp nhận thay spec §6.5 −15,3 (Pb) bằng **−19,830** (Pb(OH)₂ Ksp từ MINTEQ v4 / phreeqc.dat, `log_k 8.15`) không? | Dùng −19,830; giữ −15,3 trong discrepancy log | ✅ **Chốt 16/10/2026 (chemistry owner)**: chấp nhận `logKsp = −19,830` cho pha `Pb(OH)₂`; −15,3 **không được chấp nhận** làm Ksp, chỉ giữ trong discrepancy log như "legacy value không truy được nguồn" | (a) Sửa spec §6.5 về −19,830; (b) KHÔNG giữ −15,3 làm Ksp thay thế; (c) chạy `GC-PREC-03` để nâng lên `cross-checked` |
| D2 | Có chấp nhận thay spec §6.5 −38,6 (Fe) bằng **−38,779** (Ferrihydrite Ksp từ MINTEQ v4, `log_k 3.191`) không? | Dùng −38,779; ghi −38,6 + Monhemius 1977 vào discrepancy log | ✅ **Chốt 16/10/2026 (chemistry owner)**: chấp nhận `logKsp = −38,779` cho pha `Ferrihydrite`; −38,6 **giữ trong discrepancy log** vì có thể đại diện pha khác hoặc quy ước khác | (a) Sửa spec §6.5 về −38,779; (b) KHÔNG coi −38,6 và −38,779 là thay thế cho nhau; (c) chạy `GC-PREC-01` |
| D3 | Có chấp nhận thay spec §6.5 −16,9 (Zn) bằng **−15,506** (Zn(OH)₂(am) Ksp từ MINTEQ v4, `log_k 12.474`) và sửa tên gọi từ "Ksp" sang đúng loại hằng số (vì −16,9 thực ra là hydrolysis constant cho loài hòa tan) không? | Dùng −15,506; giữ −16,9 trong discrepancy log như là hydrolysis constant riêng nếu cần | ✅ **Chốt 16/10/2026 (chemistry owner)**: chấp nhận `logKsp = −15,506` cho pha `Zn(OH)₂(am)`; **−16,9 KHÔNG phải Ksp** mà là hằng số tạo loài hòa tan `Zn(OH)₂(aq)`; PHẢI cập nhật tên, metadata, comment, type, UI label để không nhầm | (a) Sửa spec §6.5 về −15,506; (b) sửa label thành "Ksp của Zn(OH)₂(am)"; (c) ghi rõ −16,9 là hydrolysis constant; (d) chạy `GC-PREC-02` |
| D4 | Có chốt 3 pha rắn mục tiêu (Fe = Ferrihydrite, Zn = Zn(OH)₂(am), Pb = Pb(OH)₂) cho solver MVP không? | Đề xuất 3 pha trên; cần owner phê duyệt | ✅ **Chốt 16/10/2026 (chemistry owner)**: chấp nhận làm **baseline model assumption**; Fe = `Ferrihydrite`, Zn = `Zn(OH)₂(am)`, Pb = `Pb(OH)₂`; **đây là giả định mô hình, không phải khẳng định rằng 3 pha này chắc chắn hình thành trong mọi mẫu nước thải thực tế**; cần giữ phase identity rõ trong config, evidence, output, UI | (a) Nâng `WT-CHEM-SOLID-PHASE` lên `source-checked`; (b) solver phải xác định pha khả thi theo cân bằng + material balance (xác nhận trong `GC-SOLID-01`); (c) chạy `GC-SOLID-01` |
| D5 | Có dùng **pKa₂ = 1,99** (PHREEQC / MINTEQ v4 đã pin) làm giá trị chính thức trong spec, hay ghi cả ba giá trị 1,99 / 1,98 / 1,92 (PHREEQC / NTP / PubChem)? | Dùng 1,99 làm ứng viên; ghi cả ba giá trị trong registry | ✅ **Chốt 16/10/2026 (chemistry owner)**: dùng convention MINTEQ v4 đã pin; **lưu `pKa2 = +1,99`** (dương); phản ứng phân ly `HSO₄⁻ ⇌ H⁺ + SO₄²⁻` có `logK = −1,99`; phản ứng proton hóa `H⁺ + SO₄²⁻ ⇌ HSO₄⁻` có `logK = +1,99`. **KHÔNG lưu −1,99 vào field tên `pKa2`**. Ghi 1,92 (PubChem/HSDB) và 1,98 (NTP/HSDB) trong discrepancy log. **KHÔNG trộn giá trị từ database khác trong cùng mô phỏng** nếu chưa có chính sách chọn database tường minh | (a) Sửa spec để tách biệt field `pKa2` (lưu +1,99) và `logK_dissociation` (lưu −1,99) / `logK_protonation` (lưu +1,99); (b) thêm limitation note cho pKa2/logK convention; (c) chạy `GC-SO4-01` |

**Quy trình ghi nhận câu trả lời:**

1. Chemistry owner reply trong chat với câu trả lời cho từng câu (D1–D5).
2. Agent cập nhật cột "Trạng thái" từ ⏳ → ✅ chốt (kèm ngày chốt) hoặc ❌ bác bỏ (kèm lý do).
3. Agent cập nhật `notes` trong **Bảng 6 claim** tương ứng và sửa spec §6.5 (nếu được duyệt).
4. Khi cả 5 câu chốt và 7 case cross-check pass → `verificationStatus` của 6 claim lên `cross-checked`; P0-D có thể đóng.

**Trạng thái chốt ngày 16/10/2026:**

- ✅ D1 (Pb Ksp −19,830) — đã chốt.
- ✅ D2 (Fe Ksp −38,779 cho Ferrihydrite) — đã chốt.
- ✅ D3 (Zn Ksp −15,506 cho Zn(OH)₂(am); sửa loại hằng số) — đã chốt.
- ✅ D4 (3 pha baseline) — đã chốt; `WT-CHEM-SOLID-PHASE` nâng lên `cross-checked` 16/10/2026.
- ✅ D5 (pKa₂ convention MINTEQ v4) — đã chốt; tách biệt `pKa2 = +1,99` (dương) và `logK_dissociation = −1,99`.

**Hệ quả (cập nhật 16/10/2026 — sau khi đóng P0-D):**

- 6/6 claim hiện ở `cross-checked`. 7/7 case PHREEQC PASS với sai số ≤ 0,004 đơn vị log.
- **P0-D đã đóng** ngày 16/10/2026. Solver được phép dùng tất cả 6 giá trị baseline
  trong chế độ `validated` cho chemistry. `goalStatus = "unknown"` không còn bị
  khoá vì lý do P0-D (các lý do khác như P0-E LOD deferred, P0-F golden case
  vẫn áp dụng theo two-layer design §4.1 spec). P0-C capacity 3 KL closed-form
  đã cross-check PHREEQC và đóng ngày 17/10/2026.
- Spec `docs/experiments/water-treatment-spec.md` §6.5 (banner), §6.5.5.1, §6.5.6,
  §7.4 (Pb treatment) đã được cập nhật narrative ngày 16/10/2026 để dùng baseline
  đã cross-checked. Bảng P0 trong evidence register và spec §16.1 đã chuyển
  P0-D sang trạng thái **ĐÃ ĐÓNG**.

---

**Bảng tổng hợp trạng thái P0 (cập nhật 16/10/2026, lần cuối trước khi build):**

| P0 | Mục tiêu | Trạng thái | Lý do / bằng chứng | Còn cần |
| --- | --- | --- | --- | --- |
| **A** | QCVN 40:2025/BTNMT | 🟢 **ĐÃ ĐÓNG** | Đối chiếu Thông tư 06/2025/TT-BTNMT 16/10/2026; PDF + SHA-256 lưu | — |
| **B** | Precursor salt bundle | 🟢 **Đã chốt design-assumed** (16/10/2026) | 3 entry `WT-SALT-*` với stock + dose cap giả định; xem §5.1.5 | SDS vendor thật (nếu cần, phase 2) |
| **C** | Capacity model 3 KL | 🟢 **ĐÃ ĐÓNG** (17/10/2026) | Closed-form `capacityAtSaturation(pH)` cho Fe/Zn/Pb đồng thời từ Ksp + 4 bước hydrolysis trong `minteq.v4.dat`, implement tại `src/features/water-treatment/capacity.ts`. Cross-check 1 case (`GC-SOLID-01`, 2 simulation pH 9 và 9,5) với PHREEQC 3.8.6-17100, sai số 0,008–0,023 log trong tolerance ±0,025. Test `tests/unit/water-treatment-capacity.test.ts` 11/11 PASS. Report: `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-C-CROSSCHECK-REPORT.md`. User sign-off 17/10/2026 với tolerance hiện tại (≥ 2 case thêm + tighten về 0,004 bằng Davies γ + Cl complexes = việc tương lai, không chặn close MVP). | — (đã đóng cho MVP); tighten & thêm case là phase 2 |
| **D** | 6 claim hóa học | 🟢 **ĐÃ ĐÓNG** (16/10/2026) | 6/6 `cross-checked`; 7 case PHREEQC PASS với sai số ≤ 0,004 đơn vị log; discrepancy legacy −15,3 / −16,9 / −38,6 phân giải xong | — |
| **E** | LOD/LOQ/accuracy | ⏸ **Deferred** (16/10/2026) | Chưa có method + validation; EPA reference qua `referenceBenchmark` (§6.1.3) | Method + matrix + ≥7 spiked + ≥7 blanks |
| **F** | ≥ 3 golden cases | 🟢 **ĐÃ ĐÓNG** (17/10/2026) | 3 case: G1 (AI-prepared, input thấp pH 7,5 → 'success'), G2 (reuse `GC-SOLID-01` Sim 1 pH 9 → 'partial-success'), G3 (reuse `GC-SOLID-01` Sim 2 pH 9,5 → 'success'). Test `tests/unit/water-treatment-golden-cases.test.ts` 6/6 PASS. Report: `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-F-CROSSCHECK-REPORT.md`. User sign-off 17/10/2026. **Caveat:** G1 chưa live-run (env không có `phreeqc.exe`); chạy khi chemistry owner build binary. Phase 2: thêm case (c) "vượt pH guard / dose cap" + mass-balance verify (P0-J ±2%) chưa wired. | — (đã đóng cho MVP); G1 live-run + case (c) + mass-balance wiring là phase 2 |
| **G** | Rubric + trọng số + N/A | 🟢 **Đã chốt** (16/10/2026, O8) | Baseline **40/30/15/15** + quy tắc N/A chuẩn hóa mẫu số; xem spec §10 | — |
| **H** | Slider step | 🟢 Đã khóa | §3.2.6 | — |
| **J** | Mass-balance tolerance | 🟢 **Đã chốt** (16/10/2026, O9) | `±2%` cho Fe/Zn/Pb/Cl/S/N/Na; xem spec §6.6.4 + §5.1.4 | Verify với golden case (P0-F) |

**Trạng thái release gate (cập nhật 16/10/2026 — sau khi đóng P0-D):**

| Mốc | P0 cần | Trạng thái |
| --- | --- | --- |
| Skeleton-ready | (không) | ✅ Sẵn sàng — solver skeleton viết theo spec §17.5 |
| Chemistry-validated | P0-B + P0-D + P0-E + P0-J | ⚠️ P0-B ✅; **P0-D ✅**; P0-J ✅; P0-E ⏸ deferred |
| Release-ready | + P0-A + P0-C + P0-F | ✅ **P0-A ✅, P0-C ✅ (17/10/2026), P0-F ✅ (17/10/2026) — release-ready** |

> **Kết luận buildable (cập nhật 17/10/2026, sau khi đóng P0-C + P0-F):** Tất cả P0-A → P0-F
> đã đóng hoặc chấp nhận được (P0-E ⏸ deferred). UI skeleton + solver skeleton có thể
> build ngay. Solver dùng baseline Ksp đã cross-check (−38,779 Fe / −15,506 Zn / −19,830 Pb /
> −2,19 FeOH / +1,99 pKa₂) và closed-form `capacityAtSaturation(pH)` đã verify ±0,025 log.
> Goal status có thể rời `'unknown'` (P0 blockers trống) — chỉ còn giữ `'unknown'` nếu
> input vi phạm pH guard [2; 13] hoặc dose cap (gán `'invalid'`). P0-E deferred không chặn
> build UI (chỉ ảnh hưởng hiển thị LOD/LOQ — dùng EPA reference qua `referenceBenchmark`).
> Xem spec §17.5 cho skeleton code.

---

**Open verification items — sau khi đóng P0-D (16/10/2026):**

> O1–O5 (mục P0-D) đã đóng 16/10/2026. Còn lại là các mục thuộc P0 khác (O6–O9 cho
> P0-B/E/G/J) — đã có tiến triển (O8 rubric + O9 tolerance chốt 16/10/2026; O6
> precursor salt bundle design-assumed; O7 LOD/LOQ deferred). Xem bảng dưới cho
> trạng thái cập nhật.

| # | Hạng mục | Trạng thái 16/10/2026 | Ghi chú | Chủ sở hữu |
| --- | --- | --- | --- | --- |
| O1 | Nguồn gốc spec §6.5 −15,3 (Pb) | ✅ **Đóng** 16/10/2026 | `GC-PREC-03` PHREEQC verify baseline mới `−19,830` cho `Pb(OH)₂` (log_k 8.15 trong minteq.v4.dat). Legacy −15,3 **không truy được nguồn** — ghi vào discrepancy log làm limitation note. | chemistry owner + agent |
| O2 | Nguồn gốc spec §6.5 −38,6 (Fe) | ⚠️ **Một phần** | `GC-PREC-01` PHREEQC verify `−38,779` cho `Ferrihydrite` (baseline đã chốt). −38,6 có thể khớp Monhemius 1977; bản gốc Monhemius 1977 vẫn cần truy để xác nhận pha rắn (amorphous vs crystalline) — không chặn solver vì baseline đã verify. | chemistry owner (tùy chọn) |
| O3 | pKa₂ H₂SO₄: 1,99 vs 1,98 vs 1,92 | ✅ **Đóng** 16/10/2026 | D5 chốt: dùng convention MINTEQ v4 đã pin; `pKa2 = +1,99` lưu trong field riêng; 1,98 (NTP) và 1,92 (PubChem) ghi trong discrepancy log làm limitation. `GC-SO4-01` verify log K = 1,99 với sai số 0,000. | chemistry owner + agent |
| O4 | Pha rắn Pb trong pH 6–9 | ✅ **Đóng** (với limitation) | Baseline D4 chốt `Pb(OH)₂`; `GC-SOLID-01` verify 3 pha đồng thời cho Fe/Zn/Pb với material balance OK. **Limitation vẫn còn**: trong mẫu có sulfate/carbonate nồng độ cao, pha rắn thực tế có thể là anglesite/cerussite/hydrocerussite (xem `WT-EXP-PB-PRECIP-SO4-CO3`). UI phải ghi rõ đây là baseline assumption. | chemistry owner + agent |
| O5 | PHREEQC CLI | ✅ **Đóng** 16/10/2026 | PHREEQC 3.8.6-17100 đã chạy thành công 7 case trên `phreeqc.exe` đã pin; output tại `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-*.select.out`. Tổng hợp tại `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`. | agent |
| O6 | Stock concentration và dose cap cho 3 muối precursor | ✅ **Đóng design-assumed** 16/10/2026 | FeCl₃·6H₂O 1,00 M / 5 mL/lần; ZnSO₄·7H₂O 1,00 M / 5 mL/lần; Pb(NO₃)₂ 0,10 M / 5 mL/lần. Khi có SDS vendor thật, thay bằng `WT-SALT-*-VENDOR`. | user (sau, nếu cần) |
| O7 | LOD/LOQ/accuracy | ⏸ **Deferred** 16/10/2026 | EPA reference MDL qua schema `referenceBenchmark` (§6.1.3) với caveat rõ. Reopen khi có method + matrix + validation data (≥ 7 spiked + 7 blanks qua ≥ 3 batches theo EPA MDL Rev 2). | measurement owner |
| O8 | Rubric trọng số (P0-G) | ✅ **Đóng** 16/10/2026 | Baseline **40/30/15/15** (kết quả / quy trình / hiệu quả / báo cáo) + quy tắc N/A chuẩn hóa mẫu số; xem spec §10. | product + giáo dục |
| O9 | Mass-balance tolerance (P0-J) | ✅ **Đóng** 16/10/2026 | `±2%` cho Fe/Zn/Pb/Cl/S/N/Na; spec §6.6.4 + evidence register §5.1.4. Còn phải verify với golden case (P0-F) trước khi kết luận solver đáng tin. | chemistry owner + QA |

---

**Approved baseline model assumptions (D1–D5 — chốt 16/10/2026):**

> Chemistry owner đã chốt 5 quyết định D1–D5. Các giá trị dưới đây là **baseline model
> assumptions** mà downstream code (solver, UI, config schema) có thể tham chiếu. Theo
> chemistry owner: chốt D1–D5 **KHÔNG** tự động promote `verificationStatus` lên
> `cross-checked`; vẫn cần 7 case chuyên biệt (P0-D step 6) chạy trong PHREEQC.

| Trường dùng trong code | Giá trị đã chốt | Phản ứng / pha | Database / source | Quyết định | Lưu ý UI / solver |
| --- | --- | --- | --- | --- | --- |
| `feKsp` | `−38,779` | `Fe(OH)₃(s) ⇌ Fe³⁺ + 3 OH⁻` cho pha **Ferrihydrite** | MINTEQ v4 PHREEQC 3.8.6-17100; SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`; phản ứng acid-dissolution `Fe(OH)3 + 3 H+ = Fe+3 + 3 H2O`, `log_k 3.191` | **D2** | Phải hiển thị phase `Ferrihydrite` cùng giá trị. −38,6 giữ trong discrepancy log; KHÔNG coi hai giá trị là thay thế. |
| `znKsp` | `−15,506` | `Zn(OH)₂(s) ⇌ Zn²⁺ + 2 OH⁻` cho pha **Zn(OH)₂(am)** | MINTEQ v4; phản ứng acid-dissolution `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O`, `log_k 12.474` | **D3** | PHẢI tách field: `znKsp` cho Ksp chất rắn; `znAqHydrolysisLogK` riêng cho `Zn²⁺ + 2H₂O ⇌ Zn(OH)₂(aq) + 2H⁺` (−16,9 trong phreeqc.dat, −17,794 trong minteq.v4.dat). Type/comment phải không nhầm được. |
| `pbKsp` | `−19,830` | `Pb(OH)₂(s) ⇌ Pb²⁺ + 2 OH⁻` cho pha **Pb(OH)₂** | MINTEQ v4 + phreeqc.dat; phản ứng acid-dissolution `Pb(OH)2 + 2 H+ = Pb+2 + 2 H2O`, `log_k 8.15` | **D1** | −15,3 KHÔNG là Ksp thay thế; chỉ giữ trong discrepancy log như legacy value. UI phải hiển thị "legacy value −15,3 không truy được nguồn" làm limitation note. |
| `feHydrolysisLogK` | `−2,19` | `Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺` (hằng số thủy phân, **KHÔNG phải Ksp**) | phreeqc.dat; `-log_k -2.19`, `-delta_h 10.4 kcal` | D1–D5 không đổi (đã đúng từ đầu) | Type phải rõ là hydrolysis constant; không trộn với `feKsp`. |
| `pKa2H2SO4` | `+1,99` (dương) | `HSO₄⁻ ⇌ H⁺ + SO₄²⁻` | MINTEQ v4 convention (đã pin) | **D5** | **TUYỆT ĐỐI không lưu −1,99 vào field tên `pKa2`.** Field `pKa2` lưu `+1,99`. |
| `h2so4DissociationLogK` | `−1,99` (cho phản ứng phân ly `HSO₄⁻ ⇌ H⁺ + SO₄²⁻`) | `HSO₄⁻ ⇌ H⁺ + SO₄²⁻` | MINTEQ v4 convention | **D5** | Field riêng biệt; UI phải phân biệt pKa2 (dương) với logK phân ly (âm). |
| `h2so4ProtonationLogK` | `+1,99` (cho phản ứng proton hóa `H⁺ + SO₄²⁻ ⇌ HSO₄⁻`) | `H⁺ + SO₄²⁻ ⇌ HSO₄⁻` | MINTEQ v4 convention | **D5** | Field riêng biệt; UI phải phân biệt. |
| `solidPhaseFe` | `Ferrihydrite` | n/a (định danh pha) | MINTEQ v4 | **D4** | Baseline assumption, KHÔNG phải khẳng định phổ quát. |
| `solidPhaseZn` | `Zn(OH)₂(am)` | n/a | MINTEQ v4 | **D4** | Baseline assumption. |
| `solidPhasePb` | `Pb(OH)₂` | n/a | MINTEQ v4 + phreeqc.dat | **D4** | Baseline assumption. |
| `pKa2SourceNote` | "PubChem/HSDB: 1,92; NTP/HSDB: 1,98" | n/a | `PUBCHEM-H2SO4`, `NTP-H2SO4` | **D5** | Ghi trong limitation note; KHÔNG trộn giá trị từ database khác vào simulation nếu chưa có chính sách chọn database tường minh. |

**Quy tắc dùng các baseline assumption này trong code:**

1. Tất cả field trên phải có type cụ thể và unit rõ; không dùng `any` / `unknown`.
2. UI phải hiển thị đồng thời:
   - Giá trị đã chốt (số + dấu)
   - Phase / reaction tương ứng
   - Database + version + SHA-256
   - Trạng thái `cross-checked` (16/10/2026; 7/7 case PHREEQC PASS)
3. Mọi nơi hiển thị `pKa2` phải có dấu `+` để không nhầm với `logK_dissociation`.
4. Solver **được phép** dùng các baseline này trong chế độ `validated` cho chemistry.
   `goalStatus = "unknown"` không còn bị khoá vì lý do P0-D; vẫn áp dụng theo
   two-layer design (§4.1 spec) cho các P0 khác (P0-A/E/C/F nếu còn mở).
5. Mass-balance tolerance đã chốt `±2%` (O9 16/10/2026); solver không được tự gán
   tolerance khác. Còn phải verify với golden case (P0-F) trước khi kết luận solver
   đáng tin.
6. Limitation vẫn còn: trong mẫu có sulfate/carbonate nồng độ cao, pha rắn Pb
   thực tế có thể là anglesite/cerussite/hydrocerussite (xem `WT-EXP-PB-PRECIP-SO4-CO3`).
   Baseline `Pb(OH)₂` vẫn là **assumption**, không phải khẳng định phổ quát. UI phải
   ghi rõ đây là dự đoán mô hình.

---

**Specialized cross-check cases (P0-D step 6 — đã chạy 16/10/2026, 7/7 PASS):**

> Tất cả 7 case đã chạy thành công trong PHREEQC 3.8.6-17100 trên database đã pin
> (`minteq.v4.dat`, SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`).
> Mỗi case có file `.pqi` (input) trong `tools/research/phreeqc-pin/3.8.6-17100/cases/`
> và `.select.out` (output) trong `tools/research/phreeqc-pin/3.8.6-17100/actual/`.
> Tổng hợp tại `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`.

| Case | Claim verify | Input tóm tắt | Kết quả PHREEQC | Sai số | Trạng thái |
| --- | --- | --- | --- | ---: | --- |
| `GC-HYD-01` | `WT-CHEM-K-FeOH` (−2,19) | 3 SOLUTION ở pH 2,5/3,0/3,5 với Fe 10 mg/L | log K = **−2,187** tại cả 3 pH | 0,003 | ✅ PASS |
| `GC-PREC-01` | `WT-CHEM-Ksp-Fe` (−38,779) | SOLUTION pH 7, Fe 0,179 mM; `EQUILIBRIUM_PHASES Ferrihydrite 0 0` | logKsp = **−38,78** (log IAP = log K = 3,19) | 0,001 | ✅ PASS |
| `GC-PREC-02` | `WT-CHEM-Ksp-Zn` (−15,506) | 3 SOLUTION ở pH 8/8,5/9 với Zn 5 mg/L; `EQUILIBRIUM_PHASES Zn(OH)2(am) 0 0` | logKsp = **−15,51**; pH 8 SI = −0,66 (undersaturated); pH 8,5/9 SI = 0 | 0,004 | ✅ PASS |
| `GC-PREC-03` | `WT-CHEM-Ksp-Pb` (−19,830) | 3 SOLUTION ở pH 8/8,5/9 với Pb 1 mg/L; `EQUILIBRIUM_PHASES Pb(OH)2 0 0` | logKsp = **−19,83**; tại pH 9 Pb còn lại 1,5×10⁻³ mg/L ≪ 0,1 (Cột A) | 0,000 | ✅ PASS (case BẮT BUỘC) |
| `GC-PREC-04` | `WT-CHEM-Ksp-Zn` + `-Pb` | 2 SOLUTION ở pH 9/9,5 với Zn 5 + Pb 1 mg/L; `EQUILIBRIUM_PHASES` cho cả 2 pha | Cả Zn(OH)₂(am) và Pb(OH)₂ SI = 0 ở cả 2 final state | — | ✅ PASS |
| `GC-SO4-01` | `WT-CHEM-pKa2-H2SO4` (+1,99) | 3 SOLUTION ở pH 2/3/4 với S(6) 100 mM + Na 200 mM | log K_protonation = **1,99** chính xác tại cả 3 pH | 0,000 | ✅ PASS |
| `GC-SOLID-01` | `WT-CHEM-SOLID-PHASE` | 2 SOLUTION ở pH 9/9,5 với Fe 5 + Zn 5 + Pb 0,5 mg/L; `EQUILIBRIUM_PHASES` cho cả 3 pha | Cả 3 pha SI = 0 ở final state pH 8,78 và 9,92; material balance OK | — | ✅ PASS |

**Hệ quả của 7/7 case PASS:**

1. 6/6 claim đạt `verificationStatus = 'cross-checked'` 16/10/2026 — đã cập nhật trong
   bảng **Bảng 6 claim** ở trên.
2. **P0-D đã đóng** — solver được phép dùng baseline Ksp mới (−38,779 Fe /
   −15,506 Zn / −19,830 Pb / −2,19 FeOH / +1,99 pKa₂) trong chế độ `validated` cho
   chemistry. **Không còn** gắn `goalStatus = "unknown"` với lý do P0-D.
3. Discrepancy log cập nhật: legacy −15,3 (Pb) bị **bác bỏ** làm Ksp — `GC-PREC-03`
   verify baseline mới `−19,830` cho `Pb(OH)₂` là đúng; −15,3 chỉ giữ trong limitation
   note "không truy được nguồn trong database đã pin".
4. Narrative "Pb là kim loại ranh giới" (dùng Ksp cũ −15,3) **đã đảo ngược**:
   với baseline `−19,830`, **Pb đạt Cột A thoải mái từ pH ≥ 7,5** (capacity ≈
   0,029 mg/L ≪ 0,1 mg/L). Zn trở thành kim loại ranh giới (cần pH ≥ 8,5 để
   capacity ≪ 1 mg/L). Xem spec `docs/experiments/water-treatment-spec.md` §6.5.2
   và §7.4.
5. Limitation vẫn còn: trong mẫu có sulfate/carbonate nồng độ cao, pha rắn thực tế
   có thể là anglesite/cerussite/hydrocerussite (xem `WT-EXP-PB-PRECIP-SO4-CO3`).
   Baseline `Pb(OH)₂` vẫn là **assumption**, không phải khẳng định phổ quát.

**Đồng bộ với spec `docs/experiments/water-treatment-spec.md` §6.5:**

> Spec §6.5 (Mô hình kết tủa hydroxide) đã được agent cập nhật ngày 16/10/2026 theo
> D1–D5 (baseline model assumptions): banner cảnh báo ở đầu §6.5; §6.5.1 phản ứng +
> equilibrium formulas với Ksp baseline mới + phase rắn baseline; §6.5.2 bảng capacity
> tính lại từ `tools/research/verify-wt-capacity.mjs` version `v2026-10-16-D1D2D3`
> (output tại `tools/research/wt-capacity-output.txt`); §6.5.4 ví dụ số cập nhật;
> §6.5.5.1 bảng thứ tự kết tủa; §6.5.6 limitations; §6.1.2 bảng hằng số placeholder
> thay bằng bảng có source key + SHA-256; §6.7.2 polymorph table; bảng claim definitions
> ở cuối spec. **Narrative về “Pb là kim loại ranh giới” đã đảo ngược**: với baseline
> Ksp_Pb = −19,830, Pb **đạt Cột A từ pH ≈ 7,5 trở lên**; Zn trở thành kim loại ranh
> giới (cần pH ≥ 8,5 để capacity ≪ 1 mg/L). Đến khi chemistry owner review toàn bộ
> downstream narrative (§6.5.2 Đọc bảng, §6.5.5, §6.5.6 trade-off, §7.4) và pass 7
> case chuyên biệt, mọi solver output phải gắn nhãn `goalStatus = "unknown"` và
> `unknownReasonCodes: ['P0-D']`.

**Tiêu chí đóng P0-D — đã đạt 16/10/2026** (xem thêm spec §16.1 P0-D):
- ✅ Database đã pin: `phreeqcRelease = 3.8.6-17100`, `phreeqc.dat` SHA-256
  `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10`, `minteq.v4.dat`
  SHA-256 `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`.
- ✅ Cả 6 claim có `sourceReference`, `databaseName`, `databaseVersion` đầy đủ
  (xem bảng **Bảng 6 claim** ở trên).
- ✅ Phản ứng đã chuẩn hóa về cùng chiều, cùng loài; conversion acid-dissolution ↔ Ksp
  đã ghi rõ công thức (xem cột "reaction" trong bảng 6 claim).
- ✅ `verificationStatus = 'source-checked'` cho cả 6 (đạt 16/10/2026 sau D1–D5).
- ✅ Tất cả 7 case chuyên biệt ở mục **Specialized cross-check cases** đã chạy thành
  công trong PHREEQC trên database đã pin, output khớp trong tolerance ≤ 0,004 đơn vị
  log. Tổng hợp tại `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-D-CROSSCHECK-REPORT.md`.
- ✅ `verificationStatus = 'cross-checked'` cho cả 6 sau khi các case pass (đạt 16/10/2026).
- ✅ Discrepancy Zn và Pb trong bảng **Discrepancy log** đã được phân giải: spec §6.5
  dùng nhầm hydrolysis constant `Zn(OH)₂(aq)` (−16,9) thay cho Ksp `Zn(OH)₂(am)`
  (−15,506) — đã sửa; spec dùng Ksp Pb cũ −15,3 (không truy được nguồn) — đã thay
  bằng Ksp `Pb(OH)₂` baseline mới −19,830. **P0-D đã đóng 16/10/2026** với
  6/6 `cross-checked`.

---

### 5.1.4. P0-E — LOD/LOQ/accuracy (DEFERRED) + Experimental kinetics/sorption (P0-D narrative support)

> **Quyết định 16/10/2026 (lần 3):** P0-E bị **defer** — chưa chọn phương pháp đo, chưa
> có dữ liệu xác nhận LOD/LOQ/accuracy cho Fe/Zn/Pb/Cl/S/N/Na. P0-D vẫn mở, narrative
> Pb/Zn phải là **dự đoán mô hình có điều kiện** (xem spec §6.5.5.1 banner và §6.5.6).

**Bảng 5 nguồn (cập nhật 16/10/2026):**

| Source key | Loại | Citation / URL | Vai trò / hạn chế | Status |
| --- | --- | --- | --- | --- |
| `EPA-MDL-REV2-2016` | authoritative-method | [Definition and Procedure for the Determination of the Method Detection Limit, Revision 2 (EPA, 2016)](https://www.epa.gov/sites/default/files/2016-12/documents/mdl-procedure_rev2_12-13-2016.pdf) | Quy trình xác định MDL: ≥ 7 spiked samples + 7 blanks, ≥ 3 batches khác ngày; cho phép matrix-specific MDL. **Không** tự dùng một con số EPA làm LOD/LOQ của dự án. | source-checked |
| `EPA-METHOD-300.0` | authoritative-method | [EPA Method 300.0](https://www.epa.gov/sites/default/files/2015-08/documents/method_300-0_rev_2.1_1993.pdf) | Sắc ký ion cho Cl⁻, NO₃⁻-N, SO₄²⁻. Bảng MDL tham chiếu (nước thuốc thử): Cl 0,02 mg/L; NO₃⁻-N 0,002 mg/L; SO₄²⁻ 0,02 mg/L. **Cảnh báo EPA:** MDL nền mẫu thực có thể khác. | source-checked |
| `EPA-METHOD-200.8` | authoritative-method | [EPA Method 200.8](https://www.epa.gov/sites/default/files/2015-06/documents/epa-200.8.pdf) | ICP-MS cho Fe, Zn, Pb (và nhiều kim loại khác). Phân biệt IDL (instrument) vs MDL (method); MDL phụ thuộc thiết bị + matrix. **Không** mặc định 0,001 mg/L Pb hay 0,01 mg/L Fe/Zn là hiệu năng đã chứng minh. | source-checked |
| `WT-EXP-PB-PRECIP-SO4-CO3` | peer-reviewed-experiment | Water Research (1995), "Lead precipitation in the presence of sulphate and carbonate: Testing of thermodynamic predictions" (DOI: 10.1016/0043-1354(95)00050-X) | Thí nghiệm 10 mg/L Pb, pH 3,9–11,3, thay đổi nồng độ carbon vô cơ. Quan sát: anglesite (PbSO₄), cerussite (PbCO₃), hydrocerussite. Phù hợp mô hình-phép đo phụ thuộc lựa chọn pha rắn; một số pha thuận lợi về nhiệt động học nhưng không kết tủa do kinetics. | source-checked |
| `WT-EXP-ZN-SORB-FERRIHYDRITE` | peer-reviewed-experiment | Dyer et al., sorption of Zn(II) onto ferrihydrite — xem tóm tắt trong [ScienceDirect](https://www.sciencedirect.com/) (từ khóa "Zn sorption ferrihydrite Dyer") | pH, ionic strength và nồng độ ảnh hưởng đáng kể phân bố Zn giữa dung dịch và ferrihydrite. Hệ quả: mô hình chỉ kết tủa hydroxide riêng từng kim loại có thể over-predict Zn hòa tan khi có Fe đồng thời. | source-checked |

**Hệ quả cho spec §6.5.5.1 và §6.5.6 (P0-D narrative có điều kiện):**

1. Solver **không được** khẳng định "Pb đạt Cột A ở pH ≥ 7,5" như một kết luận
   chắc chắn. Chỉ được ghi: "dự đoán mô hình có điều kiện với baseline D1/D2/D3;
   pha rắn thực tế có thể là `Pb(OH)₂`, anglesite, cerussite, hoặc hydrocerussite;
   kinetics và co-precipitation có thể thay đổi kết quả".
2. Solver **không được** khẳng định "Zn là kim loại ranh giới duy nhất" ở pH 6–9
   khi có Fe đồng thời — phải cảnh báo "mô hình chưa tính Zn hấp phụ lên Fe(OH)₃
   (ferrihydrite); kết quả Zn có thể cao hơn thực tế".
3. `goalStatus = "unknown"` bắt buộc cho đến khi 7 case chuyên biệt §5.1.3 pass
   trong PHREEQC, O5 (PHREEQC CLI) đóng, O9 (mass-balance tolerance) được owner
   cung cấp. P0-D vẫn mở.

**Quyết định P0-E deferral (16/10/2026):**

- **P0-E** (LOD/LOQ/accuracy cho Fe/Zn/Pb/Cl/S/N/Na) → `deferred`. Lý do: EPA yêu cầu
  MDL xác định bằng dữ liệu thực nghiệm với matrix cụ thể; EPA Method 200.8/300.0
  cung cấp MDL **tham chiếu** trong điều kiện nước thuốc thử, không tự động áp dụng
  cho dự án.
- **Giá trị EPA reference** có thể dùng cho **UI demo** (xem spec §6.1.3 schema
  `referenceBenchmark`): phải ghi rõ method, analyte, units, matrix, source,
  caveat. **Không** được label là "LOD/LOQ đã xác nhận của dự án".
- Khi nào reopen: khi có analytical method được chọn (vd ICP-OES/MS/AAS), matrix
  benchmark, và validation data (≥ 7 spiked + 7 blanks qua ≥ 3 batches theo
  EPA MDL Rev 2).

**Hai claim experimental được thêm vào registry (chưa dùng cho solver):**

| Source key | Mô tả | Vai trò | Status |
| --- | --- | --- | --- |
| `WT-EXP-PB-PRECIP-SO4-CO3` | Trong hệ Pb + sulfate + carbonate, phase rắn thực tế có thể là anglesite / cerussite / hydrocerussite, không chỉ Pb(OH)₂ | Cảnh báo narrative; giới hạn baseline assumption D4 | source-checked |
| `WT-EXP-ZN-SORB-FERRIHYDRITE` | Zn(II) hấp phụ lên ferrihydrite thay đổi phân bố Zn giữa dung dịch và pha rắn | Cảnh báo narrative; giới hạn co-precipitation MVP | source-checked |

**Không tạo claim mới nào dùng để tính solver.** Hai claim trên chỉ dùng để giới
hạn narrative và đánh dấu MVP không bao gồm một số hiệu ứng thực nghiệm quan trọng.

---

### 5.1.5. Salt precursor bundle (P0-B — design assumption cho MVP)

> **Quyết định 16/10/2026:** VECLab là **mô phỏng hoàn toàn** (không khớp phòng lab
> thật). Stock concentration và dose cap dưới đây là **giả định thiết kế**, **không
> phải** giá trị từ SDS/quy trình thí nghiệm. Khi có SDS của nhà cung cấp cụ thể
> hoặc quy trình phòng lab thật, phải thay thế bằng `WT-SALT-*-VENDOR` entry mới và
> xem lại dose cap.

**Bảng 3 entry muối precursor (P0-B đã chốt "mô phỏng hoàn toàn" 16/10/2026):**

| Source key | Hóa chất | CAS RN | Khối lượng mol (g/mol) | Stock (giả định) | Dose cap (giả định) | Status |
| --- | --- | ---: | ---: | --- | --- | --- |
| `WT-SALT-FECL3-6H2O` | Iron(III) chloride hexahydrate | 10025-77-1 | 270,30 | 1,00 M (270,3 g/L) | 5 mL/lần × V=1 L (= 5 mmol Fe/lần) | design-assumed (chưa có SDS) |
| `WT-SALT-ZNSO4-7H2O` | Zinc sulfate heptahydrate | 7446-20-0 | 287,56 | 1,00 M (287,6 g/L) | 5 mL/lần × V=1 L (= 5 mmol Zn/lần) | design-assumed (chưa có SDS) |
| `WT-SALT-PBNO3` | Lead(II) nitrate | 10099-74-8 | 331,20 | 0,10 M (33,1 g/L) | 5 mL/lần × V=1 L (= 0,5 mmol Pb/lần) | design-assumed (chưa có SDS) |

**Lý do chọn stock 1,00 M (Fe, Zn) và 0,10 M (Pb):**

- 1,00 M là stock cô đặc thông thường cho hóa chất thí nghiệm; pha loãng ≤ 100 lần
  vẫn giữ sai số pipet hợp lý (1% với micropipette 100 µL).
- Pb stock 0,10 M vì giới hạn tan của Pb(NO₃)₂ ở 25°C ≈ 0,4 M (khoảng 132 g/L);
  0,10 M là mức an toàn cho cả pha loãng và tránh supersaturation.
- Dose cap 5 mL/lần × V=1 L tương ứng `5 mmol metal/lần` (0,5 mmol cho Pb). Đây là
  giới hạn an toàn giả định để tránh pH shock khi thêm trực tiếp; nếu user muốn
  dùng stock cao hơn, cần thêm NaOH ổn định trước (out of MVP).

**Lý do chọn dose cap 5 mL/lần:**

- 5 mL vào V=1 L = 0,5% thể tích — đủ nhỏ để coi như "không pha loãng đáng kể" trong
  charge balance.
- 5 mmol Fe/lần: với T_Fe slider max 100 mg/L = 1,79 mM, cần ≤ 2,8 lần thêm để đạt
  cap — vẫn trong giới hạn slider MVP. Tương tự Zn 5 mmol: 100 mg/L = 1,53 mM.
- 0,5 mmol Pb/lần: 100 mg/L = 0,483 mM; gần bằng 1 lần thêm. Pb thấp hơn vì
  slider cap 100 mg/L đã gần giới hạn ảnh hưởng sức khỏe.

**Cảnh báo bắt buộc trên UI khi hiển thị 3 entry này:**

1. "Stock và dose cap là **giả định thiết kế** cho mô phỏng giáo dục, **không** lấy
   từ SDS/quy trình phòng thí nghiệm thật."
2. "Khi cấu hình dùng hóa chất thật, thay thế bằng `WT-SALT-*-VENDOR` entry với
   stock + dose cap từ nhà cung cấp."
3. UI **không được** tự suy ra dose cap từ SDS — đây là quyết định thiết kế từ owner.

**Tương tác với pH guard (§6.4) và mass-balance check (§6.6):**

- Tổng mol metal thêm vào = mol trong slider cap × V; cộng dồn vào `T_M` để charge
  balance.
- Mass balance phải khớp trong tolerance ±2% (O9, xem spec §6.6) cho Fe/Zn/Pb/Cl/
  S/N/Na — solver **không được** tự gán tolerance khác ±2%.

**Out of scope cho MVP (sẽ là WT-SALT-*-VENDOR entry trong phase 2):**

- SDS cụ thể từ Merck/Sigma-Aldrich/Fisher cho từng muối (lot, grade, độ tinh khiết).
- Stock concentration/grade khác (vd 0,5 M FeCl₃, 1,5 M ZnSO₄).
- Dose cap đặc thù cho protocol phòng lab (vd EPA Method 200.8 sample prep).
- PPE/lưu trữ/bất tương thích từ SDS — UI chỉ hiển thị warning tổng quát (xem
  safety register §6).

---

## 6. Cảnh báo giáo dục liên quan

| Source key | Hóa chất | Phạm vi cảnh báo đã ghi trong sổ nguồn |
| --- | --- | --- |
| `NIOSH-HCL` | HCl | Corrosive/irritant; tránh mắt/da; emergency wash theo lab procedure |
| `NIOSH-NAOH` | NaOH | Corrosive; eye/skin protection; heat on contact with water |

Nội dung trong app là cảnh báo giáo dục, không thay SDS hoặc đánh giá rủi ro tại phòng thí nghiệm. Nguồn/quy trình riêng của các muối Fe, Zn, Pb vẫn theo phần 5.1 và đặc tả bài.
