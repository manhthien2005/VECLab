import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'

/**
 * Only status-A citations from the source review spreadsheet
 * (xa_phong_nguon_cong_thuc.xlsx). Status-B items are omitted on purpose.
 * Neither citation validates VECLab itself.
 */
export const SOAP_SOURCES = [
  {
    key: 'canada-olive-sap-density',
    title: 'Food and Drug Regulations · B.09.003 (olive oil)',
    author: 'Department of Justice Canada',
    kind: 'Quy định · SAP và mật độ dầu ô liu',
    url: 'https://laws.justice.gc.ca/eng/regulations/c.r.c.%2c_c._870/section-B.09.003-20060322.html',
    alternativeUrl: null as string | null,
    location: 'B.09.003 khoản (i) tỉ trọng 20/20 °C; khoản (iv) saponification value',
    use: 'SAP ô liu 184–196 mg KOH/g (→ 0,131–0,140 g NaOH/g). Tỉ trọng 0,910–0,916. Engine dùng mid 0,136 g NaOH/g và ρ = 0,91.',
    limit: 'Bản quy định ghi 2006-03-22 đến 2024-12-17; cần đối chiếu bản hiện hành. Không chứng nhận bánh VECLab.',
  },
  {
    key: 'codex-coconut-sap-density',
    title: 'NSR 67.00.106:99 (chấp nhận Codex STAN 124-1981) · dầu dừa',
    author: 'FAOLEX / tiêu chuẩn quốc gia (Codex)',
    kind: 'Tiêu chuẩn · SAP và mật độ dầu dừa',
    url: 'https://faolex.fao.org/docs/pdf/els27205.pdf',
    alternativeUrl: null,
    location: 'Mục 3.1.1 tỉ trọng; mục 3.1.3 saponification value',
    use: 'SAP dừa 248–265 mg KOH/g (→ 0,177–0,189 g NaOH/g). Tỉ trọng 40 °C/nước 20 °C: 0,908–0,921. Engine dùng mid 0,183 và ρ = 0,92.',
    limit: 'Nguồn gián tiếp qua bản quốc gia; nên đối chiếu Codex gốc. Điều kiện đo mật độ khác 20 °C.',
  },
  {
    key: 'palm-sap-supplier',
    title: 'Saponification value · dầu cọ (nhà cung cấp + tổng hợp)',
    author: 'Sigma-Aldrich · Wikipedia (trích dẫn thứ cấp)',
    kind: 'Thông số · SAP dầu cọ (nguồn yếu)',
    url: 'https://www.sigmaaldrich.com/PL/en/product/sial/70905',
    alternativeUrl: 'https://en.wikipedia.org/wiki/Saponification_value',
    location: 'Thông số sản phẩm Sigma; bảng saponification value trên Wikipedia',
    use: 'Khoảng ~190–210 mg KOH/g; engine dùng mid ~199,5 → 0,142 g NaOH/g.',
    limit: 'Chưa có Codex/ISO trong kho. Không dùng để chứng nhận công thức thật.',
  },
  {
    key: 'libretexts-naoh-enthalpy',
    title: 'Chapter 9.5 · Enthalpies of Solution',
    author: 'LibreTexts · Howard University · General Chemistry',
    kind: 'Nhiệt hóa · ΔH hòa tan NaOH',
    url: 'https://chem.libretexts.org/Courses/Howard_University/General_Chemistry%3A_An_Atoms_First_Approach/Unit_4%3A__Thermochemistry/09%3A_Thermochemistry/Chapter_9.05%3A_Enthalpies_of_Solution',
    alternativeUrl: null,
    location: 'Bảng 9.5.1',
    use: 'ΔH hòa tan NaOH ≈ −44,5 kJ/mol ở 25 °C (vô hạn loãng). Engine dùng độ lớn 44 500 J/mol trong ΔT = η·n·ΔH/(m·c).',
    limit: 'Giáo trình; số ở nồng độ ~27% khác vô hạn loãng. η = ' + SOAP_PROFILE.heatRetentionEta + ' là hiệu chỉnh game, không có trong nguồn này.',
  },
  {
    key: 'vinnolit-naoh-density',
    title: 'Caustic Soda 50% · product data sheet',
    author: 'Westlake Vinnolit',
    kind: 'Bảng · mật độ dung dịch NaOH',
    url: 'https://www.westlakevinnolit.com/wp-content/uploads/2022/05/New_Product-data-sheet-NaOH50-en_05.05.2022.pdf',
    alternativeUrl: null,
    location: 'Bảng Density of various Caustic Soda Solutions (trích International Critical Tables)',
    use: 'Ở 20 °C: 24% → 1,263; 26% → 1,285; 28% → 1,306; 30% → 1,322; 32% → 1,343 g/mL.',
    limit: 'Engine vẫn dùng ρ_NaOH = 2,13 g/mL (mật độ rắn) khi ước thể tích rắn. Bảng này chưa được đưa vào tính thể tích dung dịch.',
  },
  {
    key: 'turkish-palm-density',
    title: 'Turkish Food Codex / TSE · mật độ dầu cọ',
    author: 'Tài liệu tổng hợp TSE (Gaziantep)',
    kind: 'Tiêu chuẩn · mật độ dầu cọ (một phần)',
    url: 'https://akbis.gaziantep.edu.tr/yonetim/upload/files/331366-5810.pdf',
    alternativeUrl: null,
    location: 'Bảng Palm yağı',
    use: 'Khoảng 0,891–0,899 g/mL theo bảng này.',
    limit: 'Engine đang dùng ρ cọ = ' + SOAP_PROFILE.oils.palm.densityGPerMl + ' g/mL — lệch khoảng này. Điều kiện nhiệt trên bảng không rõ.',
  },
  {
    key: 'ugm-soap-ph',
    title: 'Jurnal Rekayasa Proses · pH xà phòng sau chế biến',
    author: 'Jurnal Rekayasa Proses · UGM · 2013',
    kind: 'Nghiên cứu · pH bánh',
    url: 'https://jurnal.ugm.ac.id/v3/jrekpros/article/view/10656',
    alternativeUrl: null,
    location: 'Kết quả pH mẫu xà phòng',
    use: 'Báo cáo pH khoảng 10,2 (không citric) và 9,8 (có 2% citric). Mục tiêu học tập pH 9–10 lấy cảm hứng từ khoảng này.',
    limit: 'Một nghiên cứu, mẫu sữa; không phải đường cong pH theo superfat trong engine.',
  },
  {
    key: 'iupac-mass-fraction',
    title: 'IUPAC Gold Book · mass fraction',
    author: 'IUPAC',
    kind: 'Thuật ngữ · phần khối lượng / nồng độ % khối lượng',
    url: 'https://goldbook.iupac.org/terms/view/M03722',
    alternativeUrl: null,
    location: 'Mục mass fraction (M03722)',
    use: 'w = m(chất tan) / m(hỗn hợp). Với dung dịch hai thành phần: w = m(NaOH) / (m(NaOH) + m(nước)); c% = 100 × w.',
    limit: 'Nguồn định nghĩa. Khoảng đạt 24–33 % trên bàn vẫn là tiêu chí học tập, không do IUPAC quy định.',
  },
  {
    key: 'rdsic-solution-density',
    title: 'Công thức tính khối lượng riêng của dung dịch',
    author: 'RDSIC',
    kind: 'Giáo dục · khối lượng riêng dung dịch',
    url: 'https://rdsic.edu.vn/blog/toan/cong-thuc-tinh-khoi-luong-rieng-cua-dung-dich-bi-quyet-don-gian-de-hieu-ro-hon-vi-cb.html',
    alternativeUrl: null,
    location: 'Bài giảng khối lượng riêng dung dịch',
    use: 'ρ = m(dung dịch) / V(dung dịch). Trên bàn dùng để liên hệ khối lượng và thể tích dung dịch kiềm.',
    limit: 'Bài giảng phổ thông. Engine vẫn ước thể tích NaOH rắn bằng ρ rắn 2,13 g/mL khi cần.',
  },
] as const

/** Formula lines shown in the workbench only when a status-A citation exists. */
export const SOAP_SOURCED_FORMULAS = [
  {
    key: 'sap-naoh',
    title: 'SAP và lượng NaOH',
    lines: [
      'm(NaOH) = m(dầu) × SAP × (1 − S), với SAP đơn vị g NaOH / g dầu',
      'SAP mid khóa: ô liu 0,136 · dừa 0,183 · cọ 0,142',
      'Đổi từ mg KOH/g: SAP_NaOH = SAP_KOH × 40 / 56 / 1000',
    ],
    sourceKeys: ['canada-olive-sap-density', 'codex-coconut-sap-density', 'palm-sap-supplier'] as const,
    cups: ['W', 'O', 'M'] as const,
  },
  {
    key: 'lye-concentration',
    title: 'Nồng độ % khối lượng',
    lines: [
      'w = m(NaOH) / (m(NaOH) + m(nước))',
      'c% = 100 × w',
      'Khoảng đạt trên bàn: ' + Math.round(SOAP_PROFILE.requirements.lyeConcentration.min * 100) + '–' + Math.round(SOAP_PROFILE.requirements.lyeConcentration.max * 100) + ' % (tiêu chí học tập, không do IUPAC quy định)',
    ],
    sourceKeys: ['iupac-mass-fraction'] as const,
    cups: ['W', 'M'] as const,
  },
  {
    key: 'solution-density',
    title: 'Khối lượng riêng dung dịch',
    lines: [
      'ρ = m(dung dịch) / V(dung dịch)',
      'm(dung dịch) = m(NaOH) + m(nước)',
      'Dùng để đổi giữa khối lượng và thể tích dung dịch kiềm',
    ],
    sourceKeys: ['rdsic-solution-density'] as const,
    cups: ['W'] as const,
  },
  {
    key: 'oil-density',
    title: 'Mật độ dầu',
    lines: [
      'm (g) = V (mL) × ρ',
      'ρ ô liu ≈ 0,91 (nguồn 0,910–0,916 ở 20/20 °C)',
      'ρ dừa ≈ 0,92 (nguồn 0,908–0,921 ở 40 °C/nước 20 °C)',
      'ρ cọ trong engine = ' + SOAP_PROFILE.oils.palm.densityGPerMl + ' g/mL — lệch khoảng 0,891–0,899 của nguồn TSE',
    ],
    sourceKeys: ['canada-olive-sap-density', 'codex-coconut-sap-density', 'turkish-palm-density'] as const,
    cups: ['O'] as const,
  },
  {
    key: 'ph-cured',
    title: 'pH bánh sau ủ',
    lines: [
      'Một nghiên cứu báo cáo pH khoảng 9,8–10,2',
      'Mục tiêu học tập của bài: pH ' + SOAP_PROFILE.requirements.ph.min + '–' + SOAP_PROFILE.requirements.ph.max,
      'Đường cong pH theo superfat trong engine là mô hình game, không lấy từ nghiên cứu này',
    ],
    sourceKeys: ['ugm-soap-ph'] as const,
    cups: ['D'] as const,
  },
] as const

export const SOAP_LIMITS = [
  'Công thức nồng độ % khối lượng gắn IUPAC Gold Book (mass fraction). Các mục chưa có URL đáng tin (khoảng đạt 24–33 %, superfat 1–10 %, ΔT ≤ 15 °C, seizing, thời gian trace, nước còn sau ủ, Exp. 718) không hiện như đã xác nhận.',
  'η = ' + SOAP_PROFILE.heatRetentionEta + ', τ nguội/ủ, đường cong pH theo S và dung tích cốc cố định là giả định game.',
  'SAP mid: ô liu ' + SOAP_PROFILE.sap.olive.mid + ' · dừa ' + SOAP_PROFILE.sap.coconut.mid + ' · cọ ' + SOAP_PROFILE.sap.palm.mid + ' g NaOH/g dầu.',
  'ρ dầu cọ trong engine (' + SOAP_PROFILE.oils.palm.densityGPerMl + ' g/mL) lệch khoảng TSE (0,891–0,899). ρ dung dịch NaOH chưa thay ρ rắn 2,13.',
  'Không dùng kết quả mô phỏng để tắm, bán hoặc thiết kế công thức thật.',
] as const
