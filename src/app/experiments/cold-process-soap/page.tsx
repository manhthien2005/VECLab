import type { Metadata } from 'next'
import Link from 'next/link'
import { SOAP_LIMITS, SOAP_SOURCES } from '@/content/evidence/soap.js'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'

export const metadata: Metadata = {
  title: 'Xà phòng hóa (cold process)',
  description: 'Pha kiềm, trộn dầu, khuấy rồi đợi dung dịch đặc lại và ủ bánh trên workbench.',
}

export default function SoapLessonPage() {
  return <div className="page experiment-detail">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: 'Xà phòng hóa' }]} />
    <header className="experiment-detail-header">
      <div>
        <div className="experiment-detail-tags"><span className="experiment-topic">Xà phòng hóa</span><span className="experiment-availability is-available">Có thể thực hành · Lưu trên trình duyệt</span></div>
        <h1>Xà phòng hóa (cold process)</h1>
        <p>Thứ tự rót quyết định an toàn và chất lượng bánh. NaOH vào nước; kiềm vào dầu.</p>
      </div>
      <Link className="btn experiment-library-start" href="/simulate/cold-process-soap">Bắt đầu thực hành</Link>
    </header>
    <section className="experiment-detail-panel">
      <h2>Hồ sơ đã khóa</h2>
      <p>SAP mid khóa: ô liu {SOAP_PROFILE.sap.olive.mid}, dừa {SOAP_PROFILE.sap.coconut.mid}, cọ {SOAP_PROFILE.sap.palm.mid} g NaOH/g dầu. Chỉ công thức có nguồn A mới hiện trên bàn và trang nguồn.</p>
      <ul>{SOAP_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
      <p>Nguồn đã gắn ({SOAP_SOURCES.length}): {SOAP_SOURCES.map((source) => source.title).join(' · ')}</p>
      <Link href="/experiments/cold-process-soap/guide">Lý thuyết & cách làm bài</Link>
    </section>
  </div>
}
