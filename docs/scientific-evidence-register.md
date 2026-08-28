# SỔ ĐĂNG KÝ BẰNG CHỨNG KHOA HỌC

**Trạng thái:** Source register chính thức cho ba thí nghiệm MVP<br>
**Ngày kiểm tra:** 27/08/2026<br>
**Phạm vi:** Quy trình, hằng số, dữ liệu vật lý, procedure, safety, giả định và giới hạn

> Sổ này trả lời câu hỏi: “Tuyên bố, con số hoặc nhánh quy trình trong sản phẩm dựa vào nguồn nào, tại điều kiện nào và được phép dùng đến đâu?” Nó không chứng nhận mô hình đã được đội kiểm chứng bằng thí nghiệm độc lập.

## Tổng quan nhanh

| | Nội dung |
| --- | --- |
| 🎯 **Mục đích** | Cho phép truy ngược mọi claim, hằng số và quy trình về nguồn cùng điều kiện áp dụng. |
| 👥 **Dành cho** | Người phụ trách hóa học, content, simulation engine và QA. |
| ✅ **Sau khi đọc** | Biết source key, claim key, evidence status và gap nào đang được chấp nhận có chủ ý. |
| ⚠️ **Lưu ý** | Nguồn chứng minh quy trình có thật không đồng nghĩa mô hình dự đoán đúng mọi mẫu thực tế. |

## Đọc tài liệu này khi nào?

- Khi thêm hoặc thay một hằng số, công thức, warning hay source.
- Khi cần kiểm tra calculation trace có resolve đúng claim/source key hay không.
- Trước khi phát hành một scenario release mới.

## Các quyết định chính

- Source key và claim key là hai namespace tách biệt, bất biến trong một release.
- Video chỉ hỗ trợ procedure/hiện tượng, không cấp constant định lượng.
- Golden values là model-derived và phải được cross-check độc lập.
- Khoảng trống bằng chứng được thu hẹp bằng scope, không lấp bằng hệ số giả.
- Cost/safety index là quy ước sư phạm, không phải claim khoa học hoặc giá thị trường.

## Mục lục

<!-- TOC:START -->
- [1. Cách sử dụng](#1-cách-sử-dụng)
- [2. Quy tắc release evidence](#2-quy-tắc-release-evidence)
- [3. Register — Trung hòa axit](#3-register--trung-hòa-axit)
- [4. Register — Kết tủa Cu](#4-register--kết-tủa-cu)
- [5. Register — Phân loại nhựa](#5-register--phân-loại-nhựa)
- [6. Safety register dùng chung](#6-safety-register-dùng-chung)
- [7. Evidence card schema](#7-evidence-card-schema)
- [8. Hồ sơ golden case provenance](#8-hồ-sơ-golden-case-provenance)
- [9. Evidence gaps đã biết và cách xử lý](#9-evidence-gaps-đã-biết-và-cách-xử-lý)
- [10. Quy tắc trích dẫn trong sản phẩm](#10-quy-tắc-trích-dẫn-trong-sản-phẩm)
- [11. Release gate theo thí nghiệm](#11-release-gate-theo-thí-nghiệm)
- [12. Tài liệu liên quan](#12-tài-liệu-liên-quan)
<!-- TOC:END -->

---


## 1. Cách sử dụng

Mỗi source có `source_key` bất biến. Scenario config và calculation trace tham chiếu key này thay vì copy URL rời rạc.

```text
Claim trong spec/content
→ source_key
→ citation + vị trí
→ condition
→ phạm vi được phép
→ limitation
```

### 1.1. Loại nguồn

| Loại | Ý nghĩa |
| --- | --- |
| `authoritative-definition` | IUPAC, IAPWS hoặc định nghĩa chuẩn |
| `authoritative-technical` | EPA, USGS, NIST, OECD, NMI, OIV |
| `primary-experimental` | Bài báo báo trực tiếp phép đo/thí nghiệm |
| `laboratory-procedure` | Manual/procedure đại học |
| `safety-authority` | NIOSH, PubChem aggregate có nguồn authority |
| `supporting-study` | Nghiên cứu hỗ trợ tính thực tế nhưng không cấp constant chính |

### 1.2. Trạng thái kiểm tra

| Status | Điều kiện |
| --- | --- |
| `source-checked` | URL và nội dung liên quan đã được đọc/đối chiếu |
| `model-derived` | Giá trị suy ra bằng phương trình từ source bundle |
| `cross-checked` | Kết quả được tái tạo bằng implementation độc lập |
| `supporting-only` | Không dùng làm constant/golden value |
| `excluded-from-model` | Nguồn có bất nhất hoặc ngoài condition; chỉ ghi limitation |

Không dùng status `experimentally-validated-by-team` vì đội không có bench validation.

---


## 2. Quy tắc release evidence

Một claim số học được phát hành khi có:

1. Source key.
2. Reaction/property definition rõ.
3. Temperature/pressure/ionic strength hoặc condition cần thiết.
4. Unit và convention.
5. Transformation từ source value đến implementation value.
6. Golden hoặc invariant kiểm tra implementation.
7. Limitation hiển thị khi người dùng có thể hiểu sai.

Một process branch được phát hành khi có:

- Nguồn kỹ thuật hoặc primary study chứng minh process có thật.
- Model hẹp, input range và precondition.
- Không dựa riêng vào video.
- Không suy từ process existence thành industrial performance prediction.

---


## 3. Register — Trung hòa axit

| Source key | Loại | Citation/URL | Vị trí hoặc dữ liệu dùng | Status |
| --- | --- | --- | --- | --- |
| `IUPAC-PH` | authoritative-definition | [IUPAC Gold Book — pH](https://goldbook.iupac.org/terms/view/P04524) | Định nghĩa pH và notes về measurement | source-checked |
| `IAPWS-KW-2024` | authoritative-definition | [IAPWS R11-24](https://iapws.org/documents/release/Ionization.download) | §1, §3, Table 3; pKw tại 25 °C/0,1 MPa | source-checked |
| `USGS-PHREEQC-1995` | authoritative-technical | [PHREEQC User Guide](https://pubs.usgs.gov/wri/1995/4227/report.pdf) | Attachment B, PHREEQC.DAT; carbonate và CaOH⁺ log K | source-checked |
| `NIST-CAOH2-1956` | primary-experimental | [Bates và cộng sự](https://nvlpubs.nist.gov/nistpubs/jres/56/jresv56n6p305_A1b.pdf) | §5.1, tr. 307–308; Ca(OH)₂ solubility khoảng 0,0203 molal, lọc/chuẩn hóa | source-checked |
| `USGS-ALK-FAQ` | authoritative-technical | [USGS Alkalinity Calculator FAQ](https://or.water.usgs.gov/alk/faq.html) | §3.1; CO₂ exchange làm thay đổi pH | source-checked |
| `USGS-FIELD-ALK` | authoritative-technical | [USGS National Field Manual Ch. 6.6](https://pubs.usgs.gov/twri/twri9a6/twri9a66/twri9a_chapter6.6._v3.pdf) | Sample preparation/titration; giảm air exposure | source-checked |
| `VALENCIA-TITRATION` | laboratory-procedure | [Valencia College lab manual](https://frontdoor.valenciacollege.edu/file/vprasadpermaul/CHM%201046%20Experimental%20Lab%20Manual%20-%20Barnett%20-%20First%20Edition%202012.pdf) | tr. 71, bước 19–24; stable reading, nhỏ aliquot, repeat | source-checked |
| `FSU-TITRATION` | laboratory-procedure | [Florida State University procedure](https://www.chem.fsu.edu/chemlab/chm3120l/acid/procedure.html) | Potentiometric titration procedure | source-checked |
| `ASTM-D1067-16` | authoritative-technical | [ASTM D1067-16](https://store.astm.org/d1067-16.html) | §§1.2–1.3, 4.1–4.2; matrix/buffer/endpoint suitability | source-checked |
| `SJSU-NEUTRALIZATION-VIDEO` | laboratory-procedure | [San José State University](https://www.sjsu.edu/people/resa.kelly/general_chemistry_animations_and_videos/Acid-Base_Neutralization_Experiment/index.html) | Video HCl–NaOH, pH/indicator observation | supporting-only |
| `MIT-TITRATION-VIDEO` | laboratory-procedure | [MIT OpenCourseWare](https://ocw.mit.edu/courses/res-5-0001-digital-lab-techniques-manual-spring-2007/resources/titration/) | Titration technique video | supporting-only |
| `EPA-AMD-NEUTRALIZATION` | authoritative-technical | [EPA Design Manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=20007H0I.TXT) | Chemical treatment/alkali selection; lime, limestone, caustic, soda ash | supporting-only |
| `APPLIED-WATER-NEUTRALIZATION` | primary-experimental | [Comparison of neutralization efficiency](https://link.springer.com/article/10.1007/s13201-016-0391-6) | Experimental comparison of neutralizing agents | supporting-only |
| `NIOSH-HCL` | safety-authority | [NIOSH Hydrogen chloride](https://www.cdc.gov/niosh/npg/npgd0332.html) | Exposure routes, symptoms, PPE/first aid | source-checked |
| `NIOSH-NAOH` | safety-authority | [NIOSH Sodium hydroxide](https://www.cdc.gov/niosh/npg/npgd0565.html) | Corrosive hazard, eye/skin protection | source-checked |
| `PUBCHEM-NA2CO3` | safety-authority | [PubChem Sodium carbonate](https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-carbonate) | Hazard/irritation information và source aggregation | source-checked |

### 3.1. Claim mapping

| Claim key | Claim | Source keys | Condition/limit | Status |
| --- | --- | --- | --- | --- |
| `AN-PH-DEFINITION` | pH là activity-based; simulator báo pH* ideal concentration | IUPAC-PH | gamma=1 model | source-checked |
| `AN-KW-25C` | pKw 13,990 | IAPWS-KW-2024 | 25 °C, 0,1 MPa | source-checked |
| `AN-CARBONATE-CONSTANTS` | pKa1 6,352; pKa2 10,329 | USGS-PHREEQC-1995 | database bundle, 25 °C convention | source-checked |
| `AN-CAOH-COMPLEX` | log Kh,Ca −12,780 | USGS-PHREEQC-1995 | ideal activity bundle | source-checked |
| `AN-CAOH2-CONCENTRATION` | 0,005 M clear solution defensible | NIST-CAOH2-1956 | dưới độ tan; no slurry | source-checked |
| `AN-CLOSED-CARBON` | pH carbonate golden dùng closed inorganic carbon | USGS-PHREEQC-1995, USGS-ALK-FAQ | không gas exchange | model-derived |
| `AN-ALIQUOT-PROCEDURE` | chờ stable, giảm aliquot gần endpoint | VALENCIA-TITRATION, FSU-TITRATION | interaction rule, không kinetics | source-checked |
| `AN-MATRIX-LIMIT` | không suy liều từ pH mẫu chưa biết | ASTM-D1067-16, EPA-AMD-NEUTRALIZATION | unknown real sample excluded | source-checked |
| `AN-SAFETY-WORDING` | hazard/waste wording cho HCl, NaOH, Ca(OH)₂, Na₂CO₃ | NIOSH-HCL, NIOSH-NAOH, NIOSH-CAOH2, PUBCHEM-NA2CO3 | supervised lab; follow SDS/site procedure | source-checked |
| `AN-G01-G08` | Tám golden pH/speciation/correction cases | IAPWS-KW-2024, USGS-PHREEQC-1995 | exact bundle scenario 1.0.0 | cross-checked |

### 3.2. Derived values

| Derived key | Transformation |
| --- | --- |
| `AN-KW` | `10^-13.990 = 1.023292992×10^-14` |
| `AN-KA1` | `10^-6.352 = 4.446312675×10^-7` |
| `AN-KA2` | `10^-10.329 = 4.688133821×10^-11` |
| `AN-KH-CA` | `10^-12.780 = 1.659586907×10^-13` |

---


## 4. Register — Kết tủa Cu

| Source key | Loại | Citation/URL | Vị trí hoặc dữ liệu dùng | Status |
| --- | --- | --- | --- | --- |
| `EPA-CUPROSOLVENCY` | authoritative-technical | [EPA Cuprosolvency report](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=30003CGQ.TXT) | Table 2 pp. 10–11; Table 3 p. 19; CuOH₂ pp. 23–26; malachite pp. 31–32 | source-checked |
| `USGS-WATEQ4F` | authoritative-technical | [USGS wateq4f.dat](https://github.com/usgs-coupled-subtrees/phreeqc3-database/blob/master/wateq4f.dat) | SOLUTION_SPECIES water/carbonate/sulfate/Na/Ca | source-checked |
| `USGS-PHREEQC-V3` | authoritative-technical | [PHREEQC v3 manual](https://water.usgs.gov/water-resources/software/PHREEQC/Phreeqc_3_2013_manual.pdf) | Activity/speciation, equilibrium phases, log K convention | source-checked |
| `IUPAC-CU-OH-SDS23` | authoritative-technical | [IUPAC Solubility Data Series 23](https://iupac.github.io/SolubilityDataSeries/volumes/SDS-23.pdf) | Critical review of CuO/Cu(OH)₂ solubility and system instability | source-checked |
| `SYMES-KESTER-1984` | primary-experimental | [Malachite solubility](https://doi.org/10.1016/0016-7037(84)90218-7) | pp. 2219–2229; Ksp 3,5±0,6×10⁻³⁴ at 25 °C | source-checked |
| `SCHINDLER-1965` | primary-experimental | [Cu oxide/hydroxide solubility](https://doi.org/10.1002/hlca.19650480528) | pp. 1204–1215; surface/particle dependence | source-checked |
| `ZUEHLKE-KESTER-1983` | primary-experimental | [Copper carbonate complexes](https://doi.org/10.1016/0304-4203(83)90015-4) | pp. 203–226; CuCO₃(aq)/CuHCO₃⁺ | source-checked |
| `PAULSON-KESTER-1980` | primary-experimental | [Copper hydrolysis](https://doi.org/10.1007/BF00644552) | pp. 269–277; Cu(OH)₂(aq) constant | source-checked |
| `EPA-MPM-2003` | authoritative-technical | [EPA MP&M Development Document](https://www.epa.gov/sites/default/files/2015-11/documents/mp-m_dd_2003.pdf) | Ch. 8 pp. 8-49–8-52; Eq. 8-8; Fig. 8-14 | source-checked |
| `EPA-PRECIP-FACTSHEET` | authoritative-technical | [EPA chemical precipitation fact sheet](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT) | pp. 1–2; mix/precipitate/settle/separate | source-checked |
| `EPA-METHOD-2008` | authoritative-technical | [EPA Method 200.8](https://www.epa.gov/sites/default/files/2015-06/documents/epa-200.8.pdf) | §§3.3, 8.2, 11.1; dissolved analyte/filter first | source-checked |
| `HSU-1956` | primary-experimental | [CuSO₄/Na₂CO₃ precipitation](https://doi.org/10.1002/jctb.5010060207) | pp. 84–88; basic carbonate/aging/order | source-checked |
| `TANAKA-1991` | primary-experimental | [Basic copper sulfate](https://doi.org/10.1016/0040-6031(91)80012-8) | pp. 281–292; possible sulfate phase | source-checked |
| `BALTPURVINS-1996` | primary-experimental | [Lime precipitation](https://doi.org/10.1016/S0956-053X(97)00014-7) | pp. 717–725; kinetic/secondary phase limitation | source-checked |
| `CARBONATE-HYDROXIDE-2022` | primary-experimental | [Sustainable Environment Research](https://link.springer.com/article/10.1186/s42834-022-00140-z) | Jar tests at multiple pH and P/M ratio; Na₂CO₃ vs NaOH | supporting-only |
| `PUBCHEM-CUSO4` | safety-authority | [PubChem Copper sulfate pentahydrate](https://pubchem.ncbi.nlm.nih.gov/compound/24463) | Hazard identification/environmental toxicity | source-checked |
| `NIOSH-CAOH2` | safety-authority | [NIOSH Calcium hydroxide](https://www.cdc.gov/niosh/chemicals/pel88/pell-pages/1305-62.html) | Eye/skin/respiratory irritation | source-checked |

### 4.1. Claim mapping

| Claim key | Claim | Source keys | Condition/limit | Status |
| --- | --- | --- | --- | --- |
| `CP-SPECIES-BUNDLE` | Cu hydrolysis/sulfate/carbonate species log K | EPA-CUPROSOLVENCY, USGS-WATEQ4F | locked 25 °C bundle | source-checked |
| `CP-CUOH2-PHASE` | Cu(OH)₂ fresh precipitate log Kd 8,89 | EPA-CUPROSOLVENCY, SCHINDLER-1965 | surface-large precipitate model | source-checked |
| `CP-MALACHITE-PHASE` | Malachite log Kd −5,48/Ksp ~3,3×10⁻³⁴ | EPA-CUPROSOLVENCY, SYMES-KESTER-1984 | 25 °C, infinite dilution value comparison | source-checked |
| `CP-TOTAL-DISSOLVED` | Total dissolved Cu gồm complex, không chỉ free Cu²⁺ | ZUEHLKE-KESTER-1983, EPA-CUPROSOLVENCY | specified species bundle | source-checked |
| `CP-MIX-SETTLE-FILTER` | Chemistry equilibrium tách khỏi physical settling/filter | EPA-PRECIP-FACTSHEET, EPA-METHOD-2008 | idealized workflow | model-derived |
| `CP-JARTEST-LIMIT` | Real wastewater cần jar test | EPA-MPM-2003 | real matrix only | source-checked |
| `CP-CARBONATE-PHASE-LIMIT` | CuSO₄/Na₂CO₃ có basic/aging phase, không pure CuCO₃ claim | HSU-1956, SYMES-KESTER-1984 | closed teaching model uses malachite endpoint | source-checked |
| `CP-FILTER-IDEAL` | 100% solid retention là model definition, không empirical claim | EPA-METHOD-2008 | scenario-specific | model-derived |
| `CP-DISSOLVED-MEASUREMENT` | dissolved analyte operationally requires filtration before acidification | EPA-METHOD-2008 | EPA method concept; simulator filter remains ideal | source-checked |
| `CP-G00-G06` | Initial oracle + six dosed equilibrium cases | EPA-CUPROSOLVENCY, USGS-WATEQ4F, SYMES-KESTER-1984, SCHINDLER-1965 | 1 L, 100 mg/L, Davies, closed carbonate | cross-checked |

### 4.2. Discrepancy decision

IUPAC critical review và EPA report cho thấy “Ksp của Cu(OH)₂” không phải một con số phổ quát do phase/particle/surface/aging. Scenario khóa `log Kd=8,89` và gọi rõ **fresh precipitate model**. Không dùng value này để dự đoán sludge/wastewater ngoài scenario.

---


## 5. Register — Phân loại nhựa

| Source key | Loại | Citation/URL | Vị trí hoặc dữ liệu dùng | Status |
| --- | --- | --- | --- | --- |
| `QUELAL-2022` | primary-experimental | [Quelal, Velázquez-Martí & Gisbert](https://d-nb.info/1255832649/34), [DOI](https://doi.org/10.1007/s11356-021-15611-w) | Methods pp. 1365–1366; Table 1; Figs. 5–6; results/discussion | source-checked |
| `PONGSTABODEE-2008` | primary-experimental | [Waste Management paper](https://pubmed.ncbi.nlm.nih.gov/17493796/) | 3-stage sink-float, post-consumer PET/HDPE/PP/PS, water/ethanol | source-checked |
| `PLASTIC-COMPANION` | supporting-study | [Companion Chapter III](https://digital.library.tu.ac.th/tu_dc/digital/api/DownloadDigitalFile/dowload/73396) | §3.1, p.15; flowchart; 3 g/polymer, 3–5 mm, rinse/dry, PP card | source-checked |
| `BAUER-2018` | primary-experimental | [Sink–float pilot study](https://link.springer.com/article/10.1007/s10163-018-0748-z) | Pilot multi-stage; one vs two stage; ~90 wt% PO content/recovery | supporting-only |
| `NIST-WATER-20C` | authoritative-technical | [NISTIR 7383-2019](https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.7383-2019.pdf) | §7.1, Table 2; water density 0,99820675 | source-checked |
| `NMI-NACL-20C` | authoritative-technical | [Australian NMI NITP 17.1](https://www.industry.gov.au/sites/default/files/2019-04/nitp_17.1_density_hydrometers_part_1_brix_hydrometers_for_cane_juice.pdf) | Appendix E.1; NaCl density table 20 °C | source-checked |
| `SWISS-ALCOHOL-20C` | authoritative-technical | [Swiss Federal Alcohol Tables](https://www.bazg.admin.ch/dam/en/sd-web/6W4i9qP2S9vZ/alkoholtafel-de.pdf) | 50,0% v/v → 0,93014 g/cm³ | source-checked |
| `OIV-ALCOHOL-TABLE` | authoritative-technical | [OIV alcoholometric table](https://www.oiv.int/index.php/standards/annex-a-methods-of-analysis-of-wines-and-musts/section-3-chemical-analysis/section-3-1-organic-compounds/section-3-1-2-alcohols) | 31% v/v at 20 °C ~0,96095 | source-checked |
| `HAQUE-FAN-2022` | supporting-study | [Journal of Cleaner Production paper](https://doi.org/10.1016/j.jclepro.2022.133027) | Table 1 polymer density ranges | source-checked |
| `OECD-PLASTIC-DENSITY` | authoritative-technical | [OECD ENV/JM/MONO(2019)10](https://one.oecd.org/document/ENV/JM/MONO%282019%2910/en/pdf) | §3.2.2(1), Table 8 p.22; ranges/representative | source-checked |
| `NIOSH-ETHANOL` | safety-authority | [NIOSH Ethyl alcohol](https://www.cdc.gov/niosh/npg/npgd0262.html) | Flammability/physical hazards | source-checked |
| `EPA-SALT` | safety-authority | [U.S. EPA — Salt](https://www.epa.gov/risk/salt) | Freshwater/ecosystem impact wording | source-checked |

### 5.1. Claim mapping

| Claim key | Claim | Source keys | Condition/limit | Status |
| --- | --- | --- | --- | --- |
| `PS-BENCHMARK-MASS-SIZE` | 3 g/resin, 3–5 mm educational subset | PLASTIC-COMPANION, PONGSTABODEE-2008 | subset of published procedure, not exact four-resin tested batch | model-derived |
| `PS-POLYMER-DENSITY` | PP 0,910; HDPE 0,953; PS 1,040; PET 1,380 | QUELAL-2022, OECD-PLASTIC-DENSITY | representative grades/values | source-checked |
| `PS-WATER-DENSITY` | 0,998207 g/cm³ at 20 °C | NIST-WATER-20C | clean water, 20 °C | source-checked |
| `PS-NACL-PRESETS` | 8% 1,0559; 14% 1,1008; 20% 1,1478; 26% 1,1972 | NMI-NACL-20C | mass fraction, 20 °C | source-checked |
| `PS-ETHANOL-PRESET` | 50% v/v → 0,93014 | SWISS-ALCOHOL-20C | 20 °C | source-checked |
| `PS-DENSITY-SEPARATION-REAL` | water/ethanol/NaCl sink-float process thực | QUELAL-2022, PONGSTABODEE-2008, BAUER-2018 | lab/pilot-specific performance | source-checked |
| `PS-CONCENTRATION-INCONSISTENCY` | Không dùng 31% v/v ↔ 0,935 pair | QUELAL-2022, OIV-ALCOHOL-TABLE | discrepancy documented | excluded-from-model |
| `PS-IDEAL-ENGINE` | Binary partition theo representative density | QUELAL-2022, OECD-PLASTIC-DENSITY, NIST-WATER-20C, NMI-NACL-20C, SWISS-ALCOHOL-20C | clean compact fully-wetted model | model-derived |
| `PS-EMPIRICAL-CARD` | Recovery/purity chỉ hiển thị đúng condition | QUELAL-2022, PLASTIC-COMPANION | no default coefficient | source-checked |
| `PS-SAFETY-ENVIRONMENT` | ethanol flammability và brine freshwater warning | NIOSH-ETHANOL, EPA-SALT | supervised handling; no direct discharge | source-checked |
| `PS-G01-G08` | Eight ideal/range/goal golden cases | QUELAL-2022, OECD-PLASTIC-DENSITY, NIST-WATER-20C, NMI-NACL-20C, SWISS-ALCOHOL-20C | benchmark 12 g, 20 °C | cross-checked |

### 5.2. Discrepancy decision

Quelal et al. báo một số cặp nồng độ–mật độ không khớp bảng alcoholometric/NaCl authority và có attribution recovery ethanol không nhất quán giữa sections. Quyết định:

- Dùng density từ NIST/NMI/Swiss tables cho engine.
- Chỉ dùng Quelal process/recovery ở evidence card với condition rõ.
- Không dùng concentration label bất nhất để tạo recipe.

---


## 6. Safety register dùng chung

| Source key | Hóa chất/material | Wording được phép |
| --- | --- | --- |
| `NIOSH-HCL` | HCl | Corrosive/irritant; tránh mắt/da; emergency wash theo lab procedure |
| `NIOSH-NAOH` | NaOH | Corrosive; eye/skin protection; heat on contact with water |
| `NIOSH-CAOH2` | Ca(OH)₂ | Alkaline irritant; eye/skin/respiratory protection |
| `PUBCHEM-NA2CO3` | Na₂CO₃ | Eye/respiratory irritation wording; follow SDS/site procedure |
| `PUBCHEM-CUSO4` | CuSO₄ | Harmful if swallowed; eye/skin irritation; very toxic aquatic life |
| `NIOSH-ETHANOL` | Ethanol | Flammable liquid/vapor; eliminate ignition sources |
| `EPA-SALT` | NaCl brine | Excess salt harms freshwater ecosystems/infrastructure |

Safety content trong app là cảnh báo giáo dục, không thay SDS/site-specific risk assessment.

### 6.1. Pedagogical cost/safety conventions

Các chỉ số dưới đây là **quy ước sản phẩm**, không phải claim khoa học hoặc giá thị trường:

- `pedagogical-cost-1.0.0`: coefficients được định nghĩa trong từng experiment spec và chỉ so trong cùng scenario release.
- `pedagogical-safety-1.0.0`: bắt đầu 100, trừ committed penalty points đã công khai; inherent reagent hazards hiển thị riêng.
- Model/run không evaluable trả N/A, không trả 0.

Calculation trace cho hai index dùng `decisionKeys` thay vì giả một `sourceKey` khoa học.

---


## 7. Evidence card schema

```ts
type EvidenceSource = {
  key: string
  title: string
  authorsOrOrganization: string
  year: number | null
  url: string
  sourceType: string
  checkedAt: string
  locations: string[]
  conditions: string[]
  limitations: string[]
}

type ClaimEvidenceLink = {
  claimKey: string
  sourceKeys: string[]
  usage: 'constant' | 'procedure' | 'limitation' | 'safety' | 'supporting'
  transformation?: string
  status: string
}
```

Scenario bundle lưu source keys/claim keys. UI render citation từ registry, không hard-code lại metadata ở nhiều component.

---


## 8. Hồ sơ golden case provenance

Mỗi golden fixture phải lưu:

```json
{
  "caseId": "CP-G02",
  "scenarioVersion": "1.0.0",
  "constantBundle": "copper-equilibrium-1.0.0",
  "sourceKeys": ["EPA-CUPROSOLVENCY", "USGS-WATEQ4F"],
  "derivation": "locked equilibrium solver",
  "independentCheck": true,
  "tolerances": {
    "pH": 0.01
  }
}
```

### 8.1. Cross-check hiện tại

- AN-G01…AN-G08: tái tạo độc lập bằng bisection/charge balance implementation.
- CP-G00…CP-G06: tái tạo độc lập bằng log-activity/Davies/speciation solver khác.
- PS-G01…PS-G08: kiểm tra bằng deterministic partition và mass-balance tree/goal formulas.

Cross-check chứng minh implementation target nội bộ nhất quán, không biến nó thành bench validation.

---


## 9. Evidence gaps đã biết và cách xử lý

| Gap | Quyết định scope |
| --- | --- |
| Không có bench validation của đội | Disclaimer bắt buộc; không claim experimentally validated |
| Không có mẫu wastewater thật | Dùng synthetic HCl/CuSO₄; không suy compliance/dose thực |
| Không có gas-transfer data carbonate | Acid scenario dùng closed-carbon model |
| Không có jar-test settling/filter efficiency | Copper uses instantaneous equilibrium + ideal separation definition |
| Không có full sludge composition | Output theoretical dry precipitate, không “sludge mass” |
| Không có contaminated plastic benchmark | Plastic ideal benchmark clean/compact; empirical as cards |
| Không có medium recycle rate | Report fresh bath loads only |
| Không có LCA/cost industry data | Không tạo environmental/cost claim tuyệt đối |

Không dùng một hệ số giả để “lấp” gap.

---


## 10. Quy tắc trích dẫn trong sản phẩm

- Hiển thị organization/author, title, year và link.
- Hiển thị condition/limitation cạnh số liệu nhạy cảm.
- Không dùng “theo nghiên cứu” nếu không chỉ rõ nghiên cứu nào.
- Không trích dài nội dung có bản quyền.
- Không dùng blog/vendor page làm nguồn constant chính.
- Video chỉ hỗ trợ procedure/observable phenomenon.
- Source unavailable tạm thời không làm mất final report metadata đã snapshot.

---


## 11. Release gate theo thí nghiệm

### 11.1. Acid neutralization

- Constants bundle source-linked.
- Eight golden cases cross-checked.
- Closed-carbon disclaimer.
- Ca(OH)₂ clear-solution boundary.
- Safety sources linked.

### 11.2. Copper precipitation

- Full species/log K bundle source-linked.
- CuOH₂/malachite phase wording.
- Total dissolved vs free Cu distinction.
- Initial oracle + six dosed golden cases cross-checked.
- Ideal filter/jar-test disclaimer.

### 11.3. Plastic separation

- Polymer/medium density table source-linked.
- Concentration-density discrepancy documented.
- Ideal/empirical layers separate.
- Eight golden cases cross-checked.
- Ethanol/brine safety/environment wording.

---


## 12. Tài liệu liên quan

- [Acid Neutralization Specification](experiments/acid-neutralization-spec.md)
- [Copper Precipitation Specification](experiments/copper-precipitation-spec.md)
- [Plastic Density Separation Specification](experiments/plastic-density-separation-spec.md)
- [Verification and Acceptance](verification-and-acceptance.md)
- [Core Project Scope](core-project-scope.md)
