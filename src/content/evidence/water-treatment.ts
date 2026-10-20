export const WATER_TREATMENT_SOURCES = [
  {
    key: 'qcvn-40-2025',
    title: 'QCVN 40:2025/BTNMT — Quy chuẩn kỹ thuật quốc gia về nước thải công nghiệp',
    author: 'Bộ Tài nguyên và Môi trường',
    kind: 'Quy chuẩn pháp lý',
    url: 'https://monre.gov.vn/web/guest/van-ban-moi-truong?p_p_id=vanbanmoitruong_WAR_vanbanmoitruongportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=row-1&p_p_col_count=1&_vanbanmoitruong_WAR_vanbanmoitruongportlet_javax.faces.resource=livestore&_vanbanmoitruong_WAR_vanbanmoitruongportlet_document_id=215870',
    alternativeUrl: null,
    location: 'Bảng 1 · Cột A — Giới hạn nồng độ tối đa cho phép',
    use: 'Giới hạn nồng độ cột A của Fe, Zn, Pb và pH làm ngưỡng đối chiếu trong bài.',
    limit: 'Chuẩn nước thải công nghiệp; không áp dụng trực tiếp cho mẫu phòng thí nghiệm. Bài dùng giới hạn làm mục tiêu học tập, chưa phải chứng nhận chất lượng nước thải thực.',
  },
  {
    key: 'hemond-fecher-1995',
    title: 'Chemical Fate and Transport in the Environment',
    author: 'Harold F. Hemond & Elizabeth J. Fechner — Academic Press · 1995',
    kind: 'Mô hình hóa học',
    url: 'https://doi.org/10.1016/B978-0-12-342070-1.X5000-3',
    alternativeUrl: null,
    location: 'Phương trình tan–kết tủa hydroxide kim loại',
    use: 'Cơ sở phương trình tính nồng độ hydroxide tại điểm kết tủa Fe(OH)₃, Zn(OH)₂, Pb(OH)₂.',
    limit: 'Tái hiện tính toán hóa học của mô hình, chưa kiểm chứng thực nghiệm cho VECLab.',
  },
  {
    key: 'atkins-jones-2010',
    title: 'Chemical Principles: The Quest for Insight',
    author: 'Peter Atkins & Loretta Jones — W.H. Freeman · 5th ed. · 2010',
    kind: 'Giáo trình',
    url: 'https://www.macmillanihe.com/series/atkins-chemical-principles/',
    alternativeUrl: null,
    location: 'Tích số tan và điều kiện kết tủa hydroxide',
    use: 'Tham khảo giá trị Ksp cho các hydroxide Fe(III), Zn(II), Pb(II) và nguyên tắc cân bằng pH.',
    limit: 'Giá trị lý thuyết; điều kiện thực tế phụ thuộc nhiều yếu tố ngoài mô hình cân bằng.',
  },
] as const

export const WATER_TREATMENT_LIMITS = [
  'Mẫu nước tổng hợp chứa Fe, Zn, Pb dạng ion hòa tan; không đại diện cho mọi loại nước thải thực tế.',
  'Bài không mô phỏng độ đục, tổng chất rắn lơ lửng (TSS), hay vi sinh vật.',
  'Kết quả đối chiếu QCVN 40:2025 là mục tiêu học tập; không phải chứng nhận nước đạt quy chuẩn thải.',
  'NaOH và HCl trong bài được cấp sẵn với nồng độ cố định; không mô phỏng pha dung dịch thực tế.',
] as const
