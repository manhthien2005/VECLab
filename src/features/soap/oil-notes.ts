import type { SoapOil } from '@/domain/experiments/soap/model.js'

/** How each oil shapes the finished bar. Teaching summary, not a formulation guide. */
export const OIL_NOTES: Record<SoapOil, string> = {
  olive: 'Ô liu: bánh dịu, ít bọt nhưng bọt mịn, cứng chậm nên cần ủ lâu hơn. SAP thấp hơn dừa nên cần ít NaOH hơn cho cùng khối lượng dầu.',
  coconut: 'Dừa: bánh cứng nhanh, bọt nhiều và to, tẩy dầu mạnh nên dễ làm khô da. SAP cao hơn ô liu nên cần nhiều NaOH hơn cho cùng khối lượng dầu.',
  palm: 'Cọ: bánh cứng và bền, bọt ổn định. SAP nằm giữa ô liu và dừa.',
}
