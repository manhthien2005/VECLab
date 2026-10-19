export type EvidenceSource = {
  key: string
  title: string
  authorsOrOrganization: string
  year: number
  url: string
  sourceType: string
  checkedAt: string
  locations: string[]
  conditions: string[]
  limitations: string[]
}

export type ClaimEvidenceLink = {
  claimKey: string
  sourceKeys: string[]
  usage: 'constant' | 'procedure' | 'limitation'
  status: 'source-checked' | 'pending'
}

export const PLASTIC_EVIDENCE_REGISTER_VERSION = '1.0.0'

export const PLASTIC_SOURCES: Record<string, EvidenceSource> = {
  'MENESES-QUELAL-2022': {
    key: 'MENESES-QUELAL-2022',
    title: 'Separation of virgin and post-consumer plastics by density methods',
    authorsOrOrganization: 'Meneses Quelal, O., Velázquez-Martí, B., & Ferrer Gisbert, C. M.',
    year: 2022,
    url: 'https://doi.org/10.1007/s11356-021-15611-w',
    sourceType: 'primary-experimental',
    checkedAt: '2026-10-17',
    locations: ['Table 1', 'Section 2.2', 'Section 3.1', 'Section 3.2', 'Figure 6'],
    conditions: [
      'Bể pilot 800 L, khuấy 160 rpm trong 1 giờ làm ướt mẫu',
      'Máy ly tâm 2.950 rpm tách ẩm',
      'Khối lượng cấp liệu 2,0 kg cho mỗi loại polymer',
      'Nhiệt độ phòng thí nghiệm',
    ],
    limitations: [
      'Không công bố độ tinh khiết hóa học riêng cho từng polymer sau mỗi mẻ',
      'Mâu thuẫn gán nhãn thu hồi ethanol giữa Abstract/Conclusion và Results/Fig. 6',
      'Chỉ kiểm chứng các mốc nồng độ rời rạc, không có phương trình hàm liên tục',
    ],
  },
}

export const PLASTIC_CLAIMS: Record<string, ClaimEvidenceLink> = {
  'PDS-6-POLYMERS': {
    claimKey: 'PDS-6-POLYMERS',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'constant',
    status: 'source-checked',
  },
  'PDS-WATER-STAGE': {
    claimKey: 'PDS-WATER-STAGE',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'procedure',
    status: 'source-checked',
  },
  'PDS-ETHANOL-PRESETS': {
    claimKey: 'PDS-ETHANOL-PRESETS',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'procedure',
    status: 'source-checked',
  },
  'PDS-NACL-PRESETS': {
    claimKey: 'PDS-NACL-PRESETS',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'procedure',
    status: 'source-checked',
  },
  'PDS-CENTRIFUGE-CONDITIONS': {
    claimKey: 'PDS-CENTRIFUGE-CONDITIONS',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'procedure',
    status: 'source-checked',
  },
  'PDS-RESULTS-FIG6-ALIGNMENT': {
    claimKey: 'PDS-RESULTS-FIG6-ALIGNMENT',
    sourceKeys: ['MENESES-QUELAL-2022'],
    usage: 'limitation',
    status: 'source-checked',
  },
}

export const PLASTIC_SOURCE_KEYS = Object.keys(PLASTIC_SOURCES)
export const PLASTIC_CLAIM_KEYS = Object.keys(PLASTIC_CLAIMS)
