import { APP_STRINGS } from '@/content/index.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { PLASTIC_PROFILE, VIRGIN_POLYMERS } from '@/domain/experiments/virgin-plastic-separation/model.js'

const PRESENTATION = {
  'acid-base-extraction': {
    image: '/assets/experiments/extraction.webp',
    imageAlt: 'Phễu chiết với pha hữu cơ phía trên, pha nước phía dưới và các bình thu',
    category: 'Chiết lỏng – lỏng',
    question: 'Thứ tự chiết và cách thu pha ảnh hưởng thế nào đến sản phẩm?',
    learning: 'Tách riêng ba chất, theo dõi thất thoát và phân biệt thu hồi với độ tinh khiết.',
    tools: 'Phễu chiết, bình thu, máy đo pH, bộ lọc và cân.',
    prerequisites: 'Hiểu axit–bazơ, hai pha không trộn lẫn và cách sử dụng phễu chiết.',
    input: 'Mẫu mô phỏng A/B/N · 100 mg mỗi chất · 40 mL dung môi hữu cơ',
    parameters: 'Hướng chiết, thể tích dung dịch, số lần chiết và phần pha thu',
    outcome: 'Khối lượng đã cân, thu hồi và độ tinh khiết theo mô hình',
    procedure: ['Chọn hướng chiết, trộn, xả áp và phân lớp', 'Thu từng pha, kết tủa, lọc hoặc cô rồi làm khô', 'Cân, tự tính thu hồi và khai báo ba sản phẩm'],
  },
  'jar-test': {
    image: '/assets/experiments/jar.webp',
    imageAlt: 'Dàn Jar Test với hai cốc nước và cánh khuấy',
    category: 'Keo tụ – tạo bông',
    question: 'Điều kiện nào giúp giảm độ đục sau lắng?',
    learning: 'Thiết kế các mẫu so sánh và lựa chọn phương án xử lý.',
    tools: 'Dàn khuấy sáu vị trí, cốc và máy đo độ đục.',
    prerequisites: 'Hiểu pH, nồng độ và cách so sánh các mẫu nước.',
    input: `Mẫu kaolin ${JAR_PROFILE.initialNtu} NTU · ${JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L/cốc · Phèn nhôm`,
    parameters: `pH ${JAR_PROFILE.availableInitialPh.join(' / ')} · Liều ${JAR_PROFILE.minDoseMgL}–${JAR_PROFILE.maxDoseMgL} mg/L`,
    outcome: 'Độ đục sau lắng, hiệu suất xử lý',
    procedure: ['Chuẩn bị các cốc, đo mẫu đầu và chọn liều phèn', 'Khuấy nhanh 60 giây, khuấy chậm 20 phút và lắng 30 phút mô phỏng', 'Đo độ đục, tự tính hiệu suất và chọn phương án nộp'],
  },
  'cold-process-soap': {
    image: '/assets/experiments/soap.jpg',
    imageAlt: 'Cốc kiềm, cốc dầu, cốc trộn và khuôn silicone trên bàn xà phòng',
    category: 'Xà phòng hóa',
    question: 'Lượng NaOH, nước và dầu cần tỉ lệ nào để bánh xà phòng đạt chất lượng?',
    learning: 'Tính lượng NaOH và nước, pha kiềm đúng chiều, trộn với dầu, đợi dung dịch đặc lại và đọc pH sau ủ.',
    tools: 'Cốc chịu nhiệt, cân, máy khuấy và khuôn silicone.',
    prerequisites: 'Hiểu tỏa nhiệt khi hòa tan kiềm và vì sao không đổ nước vào NaOH rắn.',
    input: 'Một loại dầu (ô liu / dừa / cọ) · NaOH · nước cất',
    parameters: 'Khối lượng dầu, thể tích nước, khối lượng NaOH, khuấy máy hoặc tay',
    outcome: 'Tối đa 3 mẫu thử với chỉ số kiềm, dầu, hỗn hợp, pH và khối lượng. Một mẫu đạt mọi yêu cầu là đạt',
    procedure: ['Rót nước, rót NaOH vào nước và chờ kiềm nguội; chọn loại dầu và rót dầu', 'Rót kiềm và dầu vào cốc trộn, khuấy rồi đợi dung dịch đặc lại', 'Đổ khuôn, chờ 24 giờ, tháo khuôn, đợi 4 tuần rồi đo pH và cân'],
  },
  'methylene-blue-adsorption': {
    image: '/assets/experiments/adsorption.webp',
    imageAlt: 'Dung dịch xanh methylene và than hoạt tính',
    category: 'Hấp phụ',
    question: 'Liều than và thời gian tiếp xúc ảnh hưởng thế nào đến khả năng loại màu?',
    learning: 'Liên hệ điều kiện xử lý với hiệu suất hấp phụ.',
    tools: 'Cân, bình tiếp xúc, cuvet và máy đo quang.',
    prerequisites: 'Hiểu nồng độ dung dịch và cách tính phần trăm.',
    input: 'Xanh methylene, than hoạt tính',
    parameters: 'Liều than và thời gian tiếp xúc',
    outcome: 'Nồng độ màu, hiệu suất loại màu',
    procedure: ['Chuẩn bị dung dịch và lượng than hoạt tính', 'Cho tiếp xúc theo điều kiện đã chọn', 'Đo nồng độ và tính hiệu suất loại màu'],
  },
  'water-treatment': {
    image: '/assets/auth-laboratory-v2.webp',
    imageAlt: 'Phòng thí nghiệm ảo với bình khuấy, máy đo và giá đựng mẫu nước',
    category: 'Kết tủa hydroxide · Xử lý nước',
    question: 'pH và các bước xử lý ảnh hưởng thế nào đến Fe, Zn, Pb còn lại trong nước?',
    learning: 'Theo dõi riêng nồng độ kim loại và pH, rồi đối chiếu kết quả mô phỏng với mục tiêu học tập.',
    tools: 'Bình pha mẫu, máy khuấy, bộ lắng/lọc, NaOH, HCl và thiết bị đo.',
    prerequisites: 'Hiểu pH, kết tủa hydroxide, tích số tan và đơn vị nồng độ mg/L.',
    input: 'Mẫu nước tổng hợp Fe/Zn/Pb · 500–2.000 mL',
    parameters: 'Thành phần kim loại · thể tích · lượng thuốc thử thêm từng giọt',
    outcome: 'Nồng độ Fe/Zn/Pb sau lọc và pH cuối để đối chiếu riêng từng chỉ tiêu',
    procedure: ['Pha mẫu và đo pH ban đầu', 'Thêm NaOH, khuấy, lắng và lọc kết tủa', 'Cân bằng pH rồi đối chiếu các chỉ tiêu học tập'],
  },
} as const

export const PLASTIC_OVERVIEW = {
  scenarioKey: 'plastic-density-separation',
  title: 'Phân loại nhựa nguyên sinh',
  image: '/assets/experiments/plastic-density-separation.webp',
  imageAlt: 'Minh họa bể khuấy với hạt nhựa nổi và chìm, máy ly tâm, cân và hai khay thu phân đoạn',
  category: 'Phân tách chìm – nổi',
  question: 'Vì sao cần nhiều môi trường chất lỏng để phân loại sáu loại nhựa?',
  learning: 'Liên hệ khối lượng riêng với hiện tượng nổi–chìm và phân biệt thu hồi với độ tinh khiết.',
  tools: 'Bể pilot, máy ly tâm và cân; các khay thu phân đoạn.',
  prerequisites: 'Hiểu khối lượng riêng, khối lượng và cách đọc nồng độ % v/v, % w/v.',
  input: `${VIRGIN_POLYMERS.map(polymer => polymer.id).join(', ')} · ${PLASTIC_PROFILE.sampleFeedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 1 })} kg/loại · Nước máy, ethanol, NaCl`,
  parameters: 'Ethanol 23 / 31% v/v · NaCl 11–12 / 20 / 40% w/v · Các preset cố định',
  outcome: 'Phân đoạn nổi–chìm, khối lượng đã cân và tỷ lệ thu hồi theo preset',
  procedure: ['Chuẩn bị mẫu, làm ướt và tách sơ bộ bằng nước máy', 'Ly tâm, cân và chọn nhánh ethanol hoặc NaCl để tách tiếp', 'Đọc tổng kết phân đoạn, sổ thực hành và báo cáo'],
} as const

const HOME_OVERVIEWS = APP_STRINGS.home.showcaseCards.map(({ scenarioKey, title }) => ({
  scenarioKey, title, ...PRESENTATION[scenarioKey],
}))

const SOAP_OVERVIEW = {
  scenarioKey: 'cold-process-soap' as const,
  title: 'Xà phòng hóa (cold process)',
  ...PRESENTATION['cold-process-soap'],
}

/** Library lessons can expand without changing the approved landing picker. */
export const EXPERIMENT_OVERVIEWS = [
  ...HOME_OVERVIEWS.filter(item => item.scenarioKey !== 'methylene-blue-adsorption'),
  PLASTIC_OVERVIEW,
  SOAP_OVERVIEW,
  ...HOME_OVERVIEWS.filter(item => item.scenarioKey === 'methylene-blue-adsorption'),
]

export type ExperimentOverview = (typeof EXPERIMENT_OVERVIEWS)[number]
