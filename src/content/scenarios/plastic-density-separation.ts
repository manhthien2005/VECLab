import {
  PLASTIC_ACTION_TYPES,
  type PlasticActionType,
} from '@/domain/experiments/virgin-plastic-separation/index.js'

export { PLASTIC_ACTION_TYPES }
export type { PlasticActionType }

export type ActionSpecification = {
  actionType: PlasticActionType
  labelKey: string
  preconditionKey: string
  undoable: boolean
}

export const PLASTIC_ACTIONS: Record<PlasticActionType, ActionSpecification> = {
  prepare_samples: {
    actionType: 'prepare_samples',
    labelKey: 'actions.plastic.prepare_samples',
    preconditionKey: 'preconditions.plastic.prepare_samples',
    undoable: false,
  },
  load_and_wet: {
    actionType: 'load_and_wet',
    labelKey: 'actions.plastic.load_and_wet',
    preconditionKey: 'preconditions.plastic.load_and_wet',
    undoable: false,
  },
  separate_water: {
    actionType: 'separate_water',
    labelKey: 'actions.plastic.separate_water',
    preconditionKey: 'preconditions.plastic.separate_water',
    undoable: false,
  },
  centrifuge_and_weigh: {
    actionType: 'centrifuge_and_weigh',
    labelKey: 'actions.plastic.centrifuge_and_weigh',
    preconditionKey: 'preconditions.plastic.centrifuge_and_weigh',
    undoable: false,
  },
  select_branch: {
    actionType: 'select_branch',
    labelKey: 'actions.plastic.select_branch',
    preconditionKey: 'preconditions.plastic.select_branch',
    undoable: false,
  },
  run_ethanol_preset: {
    actionType: 'run_ethanol_preset',
    labelKey: 'actions.plastic.run_ethanol_preset',
    preconditionKey: 'preconditions.plastic.run_ethanol_preset',
    undoable: false,
  },
  run_nacl_preset: {
    actionType: 'run_nacl_preset',
    labelKey: 'actions.plastic.run_nacl_preset',
    preconditionKey: 'preconditions.plastic.run_nacl_preset',
    undoable: false,
  },
  summarize_fractions: {
    actionType: 'summarize_fractions',
    labelKey: 'actions.plastic.summarize_fractions',
    preconditionKey: 'preconditions.plastic.summarize_fractions',
    undoable: false,
  },
  complete: {
    actionType: 'complete',
    labelKey: 'actions.plastic.complete',
    preconditionKey: 'preconditions.plastic.complete',
    undoable: false,
  },
}

export const PLASTIC_STRINGS: Record<string, string> = {
  'scenarios.plastic-separation.title': 'Phân loại nhựa nguyên sinh',
  'scenarios.plastic-separation.summary':
    'Phân loại sáu polymer nguyên sinh (PP, HDPE, PS, ABS, PA, PC) bằng phương pháp chìm–nổi qua nước máy, dung dịch ethanol và dung dịch muối NaCl theo nghiên cứu pilot.',
  'actions.plastic.prepare_samples': 'Chuẩn bị 6 mẫu polymer nguyên sinh',
  'preconditions.plastic.prepare_samples': 'Mẫu đang ở khâu chuẩn bị ban đầu.',
  'actions.plastic.load_and_wet': 'Nạp vào bể pilot và làm ướt (160 rpm, 1 giờ)',
  'preconditions.plastic.load_and_wet': 'Yêu cầu các mẫu đã sẵn sàng trong khay nạp.',
  'actions.plastic.separate_water': 'Tách sơ bộ bằng nước máy',
  'preconditions.plastic.separate_water': 'Mẫu đã được làm ướt và loại bỏ bọt khí.',
  'actions.plastic.centrifuge_and_weigh': 'Ly tâm (2.950 rpm) và cân mẫu',
  'preconditions.plastic.centrifuge_and_weigh': 'Đã hoàn tất phân lớp trong nước máy.',
  'actions.plastic.select_branch': 'Chọn phân đoạn để xử lý tiếp',
  'preconditions.plastic.select_branch': 'Đã ly tâm và cân các phân đoạn.',
  'actions.plastic.run_ethanol_preset': 'Tách bằng dung dịch Ethanol (% v/v)',
  'preconditions.plastic.run_ethanol_preset': 'Đang ở nhánh phân đoạn nhẹ (PP + HDPE).',
  'actions.plastic.run_nacl_preset': 'Tách bằng dung dịch NaCl (% w/v)',
  'preconditions.plastic.run_nacl_preset': 'Đang ở nhánh phân đoạn nặng (PS + ABS + PA + PC).',
  'actions.plastic.summarize_fractions': 'Tổng kết các phân đoạn thu hồi',
  'preconditions.plastic.summarize_fractions': 'Phải hoàn thành ít nhất một nhánh phân loại.',
  'actions.plastic.complete': 'Hoàn thành và lưu báo cáo',
  'preconditions.plastic.complete': 'Đã xem bảng tổng kết phân đoạn.',
  'limitations.plastic.pilot-conditions':
    'Thông số 800 L, 160 rpm, 1 giờ và 2,0 kg là điều kiện nghiên cứu pilot thực nghiệm; phần mềm không mô phỏng dòng chảy vi mô.',
  'limitations.plastic.discrete-presets-only':
    'Chỉ hỗ trợ các preset nồng độ định mức được bài báo công bố; không nội suy ngoài mẫu.',
  'limitations.plastic.recovery-not-purity':
    'Các tỷ lệ phần trăm là tỷ lệ thu hồi vật liệu (recovery), không phản ánh độ tinh khiết hóa học riêng biệt.',
  'limitations.plastic.ethanol-conflict-disclosed':
    'Lưu ý mâu thuẫn gán nhãn giữa phần Abstract/Conclusion và Results/Fig. 6 trong bài báo; hệ thống áp dụng theo phần Results và Hình 6.',
}
