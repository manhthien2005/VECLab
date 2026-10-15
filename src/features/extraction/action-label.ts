import type { ExtractionActionSummary } from '@/application/scenarios/extraction-projection.js'

const format=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2})
const reagents:Record<string,string>={acid:'axit',base:'bazơ',water:'nước',solvent:'dung môi hữu cơ'}
const phases:Record<string,string>={aqueous:'pha nước',organic:'pha hữu cơ',all:'toàn mẫu'}
export function extractionActionLabel(action:ExtractionActionSummary):string {
  const p=action.parameters,id=String(p.vesselId??''),ml=typeof p.volumeL==='number'?format.format(p.volumeL*1000):'N/A'
  switch(action.actionType) {
    case 'add_reagent':return `Thêm ${reagents[String(p.reagent)]??'dung dịch'} ${ml} mL vào ${id}`
    case 'transfer':return `Chuyển ${phases[String(p.phase)]??'mẫu'} ${ml} mL · ${p.from} → ${p.to}`
    case 'filter':return `Lọc chất rắn · ${p.from} → ${p.to}`
    case 'mix':return `Trộn mẫu ${id}`
    case 'vent':return `Xả áp ${id}`
    case 'settle':return `Để phân lớp ${id}`
    case 'evaporate':return `Cô dung môi ${id}`
    case 'dry':return `Làm khô ${id}`
    case 'measure':return `${p.kind==='mass'?'Cân mẫu':'Đo pH'} ${id}`
    case 'record_product':return `Khai báo ${p.component} tại ${id} · ${typeof p.answer==='number'?format.format(p.answer):'N/A'}%`
    case 'complete':case 'completed':return 'Nộp bài'
    default:return 'Thao tác đã lưu'
  }
}
