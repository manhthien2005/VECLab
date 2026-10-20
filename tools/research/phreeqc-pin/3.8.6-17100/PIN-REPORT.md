# PHREEQC 3.8.6-17100 pin — báo cáo cho chemistry owner

**Ngày chạy:** 2026-10-16  
**Người chạy:** Cursor Assistant (agent) theo yêu cầu của chemistry owner cùng ngày  
**Trạng thái:** ✅ Pin thành công; ⏳ chưa chạy cross-check cho 6 claim

---

## 1. Bước thực thi

### 1.1. Lệnh PowerShell

```powershell
$release = "3.8.6-17100"
$url = "https://water.usgs.gov/water-resources/software/PHREEQC/phreeqc-3.8.6-17100.zip"
$pinDir = "D:\VECLab\tools\research\phreeqc-pin"
Invoke-WebRequest $url -OutFile "$pinDir\phreeqc-$release.zip" -UseBasicParsing
Get-FileHash "$pinDir\phreeqc-$release.zip" -Algorithm SHA256
Expand-Archive "$pinDir\phreeqc-$release.zip" -DestinationPath "$pinDir\$release"
```

Kết quả (xem `pin.log` đầy đủ):

- **Gói phát hành**: `phreeqc-3.8.6-17100.zip`, 13.154.618 bytes
- **SHA-256 của gói**: `91BF4998CFB5ED33B1222E034E559A9845F592F0F4F79A11819EFE229B65A847`
- **Giải nén**: 22 file database + ví dụ (`*.dat`, `ex*.dat`, `co2*.dat`)
- **Vị trí lưu**: `D:\VECLab\tools\research\phreeqc-pin\3.8.6-17100\`

### 1.2. SHA-256 của các file chemistry quan trọng

| File | SHA-256 |
| --- | --- |
| `phreeqc.dat` | `59373961d648dfbf68a40744060c1d64f57ecbec98f4f5fb89f3a1b4213ccd10` |
| `minteq.v4.dat` | `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac` |
| `minteq.dat` | `b098ba653279256c05e7ac2ffa698529442f06d0bbb82a6f3ef2b8c309101f7a` |
| `wateq4f.dat` | `7816c92eadd28f7e4703efa467a038a197748cd38f410d9aa7909fde1c8912f` |

Bốn database liên quan còn được giữ trong `database/`, cùng SHA-256 và đường dẫn tương đối trong `PIN.json`. Gói ZIP và bản giải nén trùng được gỡ khỏi source; metadata gói gốc vẫn được giữ.

---

## 2. Kết quả verify từ databases đã pin

### 2.1. Fe(III) hydrolysis

| Database | Phản ứng | `-log_k` | Ghi chú |
| --- | --- | ---: | --- |
| `phreeqc.dat` | `Fe+3 + H2O = FeOH+2 + H+` | `-2.19` | `-delta_h 10.4 kcal`, `-gamma 5 0` |

✅ **Khớp với giá trị ứng viên `WT-CHEM-K-FeOH` (−2,19).** Chemistry owner đã xác nhận.

### 2.2. Phản ứng acid-dissolution cho Fe hydroxide

| Database | Pha | Phản ứng | `log_k` | Ksp = `log_k − 3·pKw` |
| --- | --- | --- | ---: | ---: |
| `minteq.v4.dat` | Ferrihydrite | `Fe(OH)3 + 3H+ = Fe+3 + 3H2O` | `3.191` | **−38,779** |
| `minteq.v4.dat` | Goethite | `FeOOH + 3H+ = Fe+3 + 2H2O` | `0.491` | (stoichiometry khác: 2H₂O, không phải 3) |
| `phreeqc.dat` | Goethite | (cùng phản ứng) | `0.491` | (cùng stoichiometry) |

✅ **Ferrihydrite Ksp = −38,779** — verified. Spec §6.5 dùng **−38,6**, sai khác 0,18 đơn vị log.

### 2.3. Zn — phân biệt aqueous species vs Ksp

**Aqueous species:**

| Database | Phản ứng | `log_k` | Ghi chú |
| --- | --- | ---: | --- |
| `phreeqc.dat` | `Zn+2 + 2 H2O = Zn(OH)2 + 2 H+` | `-16.9` | đây là **loài hòa tan Zn(OH)₂(aq)**, KHÔNG phải Ksp |
| `minteq.v4.dat` | `Zn+2 + 2 H2O = Zn(OH)2 + 2 H+` | `-17.794` | cùng loài, giá trị khác |

✅ **Chemistry owner xác nhận:** −16,9 trong spec §6.5 là **aqueous species**, không phải Ksp.

**Ksp các pha hydroxide Zn:**

| Database | Pha | `log_k` (acid-dissolution) | Ksp = `log_k − 2·pKw` |
| --- | --- | ---: | ---: |
| `minteq.v4.dat` | Zn(OH)₂(am) | `12.474` | **−15,506** |
| `minteq.v4.dat` | Zn(OH)₂ (crystalline) | `12.2` | −15,780 |
| `minteq.v4.dat` | Zn(OH)₂(beta) | `11.754` | −16,226 |
| `minteq.v4.dat` | Zn(OH)₂(gamma) | `11.734` | −16,246 |
| `minteq.v4.dat` | Zn(OH)₂(epsilon) | `11.534` | −16,446 |
| `phreeqc.dat` | Zn(OH)₂(e) | `11.5` | −16,480 |

### 2.4. Pb — phân biệt aqueous species vs Ksp

**Aqueous species:**

| Database | Phản ứng | `log_k` | Ghi chú |
| --- | --- | ---: | --- |
| `phreeqc.dat` | `Pb+2 + 2 H2O = Pb(OH)2 + 2 H+` | `-17.12` | đây là **loài hòa tan Pb(OH)₂(aq)**, KHÔNG phải Ksp |
| `minteq.v4.dat` | `Pb+2 + 2 H2O = Pb(OH)2 + 2 H+` | `-17.094` | cùng loài, giá trị khác |

✅ **Chemistry owner xác nhận:** −17,12 (và −17,094 trong minteq.v4.dat) là aqueous species.

**Ksp của Pb(OH)₂:**

| Database | Pha | `log_k` (acid-dissolution) | Ksp = `log_k − 2·pKw` |
| --- | --- | ---: | ---: |
| `minteq.v4.dat` | Pb(OH)₂ | `8.15` | **−19,830** |
| `phreeqc.dat` | Pb(OH)₂ 389 | `8.15` | **−19,830** (cross-check khớp) |

⚠️ **−15,3 trong spec §6.5 không khớp với ứng viên nào** — cần truy ngược nguồn.

### 2.5. pKa₂ của H₂SO₄

| Database | Phản ứng | `log_k` | pKa₂ |
| --- | --- | ---: | ---: |
| `phreeqc.dat` | `SO4-2 + H+ = HSO4-` | `-log_k 1.988` | **1,99** |
| `minteq.v4.dat` | `H+ + SO4-2 = HSO4-` | `log_k 1.99` | **1,99** |

✅ Khớp tham chiếu thông dụng pKa₂ ≈ 1,99.

### 2.6. Các pha rắn đáng chú ý trong `minteq.v4.dat`

| Kim loại | Pha | Phản ứng | `log_k` |
| --- | --- | --- | ---: |
| Fe | Ferrihydrite | `Fe(OH)3 + 3 H+ = Fe+3 + 3 H2O` | `3.191` |
| Fe | Goethite | `FeOOH + 3 H+ = Fe+3 + 2 H2O` | `0.491` |
| Zn | Zn(OH)₂(am) | `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O` | `12.474` |
| Zn | Zn(OH)₂ (c) | `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O` | `12.2` |
| Zn | Zn(OH)₂(beta) | `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O` | `11.754` |
| Zn | Zn(OH)₂(gamma) | `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O` | `11.734` |
| Zn | Zn(OH)₂(epsilon) | `Zn(OH)2 + 2 H+ = Zn+2 + 2 H2O` | `11.534` |
| Zn | Smithsonite | `ZnCO3 = Zn+2 + CO3-2` | `-10` |
| Pb | Pb(OH)₂ | `Pb(OH)2 + 2 H+ = Pb+2 + 2 H2O` | `8.15` |
| Pb | PbO | `PbO + 2 H+ = Pb+2 + H2O` | (cần lấy số) |
| Pb | Hydrocerussite | `Pb3(OH)2(CO3)2 + 2 H+ = 3 Pb+2 + 2 H2O + 2 CO3-2` | `-18.7705` |

---

## 3. Trạng thái P0-D sau pin

### 3.1. Claim và verificationStatus

| Claim | logK ứng | DB verify | Status hiện tại |
| --- | --- | --- | --- |
| `WT-CHEM-K-FeOH` | −2,19 | ✅ phreeqc.dat | candidate-identified (giữ theo chỉ dẫn chemistry owner) |
| `WT-CHEM-Ksp-Fe` | −38,779 | ✅ minteq.v4.dat Ferrihydrite | candidate-identified (chờ chốt pha và chạy GC-PREC-01) |
| `WT-CHEM-Ksp-Zn` | −15,506 | ✅ minteq.v4.dat Zn(OH)₂(am) | candidate-identified (chờ chốt pha và chạy GC-PREC-02; spec −16,9 là **sai loại**) |
| `WT-CHEM-Ksp-Pb` | −19,830 | ✅ minteq.v4.dat + phreeqc.dat Pb(OH)₂ | candidate-identified (chờ truy ngược nguồn −15,3 trong spec và chạy GC-PREC-03) |
| `WT-CHEM-pKa2-H2SO4` | −1,99 | ✅ cả hai DB | candidate-identified (chờ primary citation để lên `source-checked`) |
| `WT-CHEM-SOLID-PHASE` | n/a | ✅ tổng hợp | candidate-identified (chờ chốt pha mục tiêu và chạy GC-SOLID-01) |

### 3.2. Việc cần làm tiếp theo

1. **Truy ngược nguồn** −16,9 và −15,3 trong spec §6.5 — chemistry owner đã xác nhận đây không phải Ksp; cần tìm primary citation cho −15,3 (Pb) và quyết định pha mục tiêu cho Zn và Pb.
2. **Chốt pha rắn** cho từng kim loại:
   - Fe → Ferrihydrite (đề xuất hiện tại) — hoặc Goethite nếu phù hợp.
   - Zn → Zn(OH)₂(am) (đề xuất) — có 5 lựa chọn.
   - Pb → Pb(OH)₂ (đề xuất) — cần đối chiếu −15,3 với primary source trước.
3. **Chạy 7 case chuyên biệt** (mỗi case phải có input, expected output, tolerance):
   - GC-HYD-01 — kiểm tra Fe hydrolysis
   - GC-PREC-01 — kiểm tra Fe Ksp
   - GC-PREC-02 — kiểm tra Zn Ksp (phân biải được Ksp vs aqueous)
   - GC-PREC-03 — kiểm tra Pb Ksp, **bắt buộc** giải quyết sai khác −15,3
   - GC-PREC-04 — cạnh tranh OH⁻ giữa Zn+Pb
   - GC-SO4-01 — kiểm tra pKa₂ H₂SO₄
   - GC-SOLID-01 — 3 pha cùng hiện diện, solver chọn pha khả thi
4. **Sau khi các case pass trong tolerance**, mới nâng `verificationStatus` lên `cross-checked` cho 6 claim.

### 3.3. File đã tạo

- `tools/research/phreeqc-pin/3.8.6-17100/PIN.json` — metadata pin đầy đủ
- `tools/research/phreeqc-pin/3.8.6-17100/pin.log` — log quá trình pin
- `tools/research/phreeqc-pin/3.8.6-17100/verify-output.txt` — output của verify-claims.ps1
- `tools/research/phreeqc-pin/3.8.6-17100/verify-claims.ps1`, `verify-aq.ps1`, `verify-logk.ps1` — script verify
- `tools/research/phreeqc-pin/3.8.6-17100/PIN-REPORT.md` — báo cáo này
- `tools/research/phreeqc-pin/3.8.6-17100/database/` — bốn database tham chiếu được giữ

### 3.4. Registry đã cập nhật

- `docs/scientific-evidence-register.md` §5.1 — thêm source key `PHREEQC-3.8.6-17100` ở `source-checked` (file download đã đối chiếu)
- `docs/scientific-evidence-register.md` §5.1.3 — bảng 6 claim với database hashes, line references, và chemistry owner findings
- `docs/scientific-evidence-register.md` §5.1.3 Discrepancy log — cập nhật với giá trị verify từ databases đã pin
- `docs/scientific-evidence-register.md` §5.1.3 Database pin & version lock — đã chốt giá trị (zip hash, dat hashes, pinnedAt, pinnedBy)
## Phạm vi sau dọn source (20/10/2026)

Các lệnh và đường dẫn ổ D ở trên ghi lại lần đối chiếu gốc, không phải hướng dẫn chạy trên checkout mới. Các script `verify-*.ps1` hiện dùng đường dẫn tương đối. Giữ `cases/`, `actual/`, các báo cáo đối chiếu và output được đặc tả trích dẫn. Không commit ZIP, `extracted/` hoặc ví dụ phân phối chung. `bin/phreeqc.exe` là chương trình Windows mà server action `runSampleChemistry` và test chẩn đoán hiện dùng; chưa có bản Linux trong nhánh này. Việc dọn source không xác nhận chạy được action này trên CI/hosting Linux.
