import type { SoapProjection } from '@/application/scenarios/soap-projection.js'
import type { SoapSample } from '@/domain/experiments/soap/model.js'
import { OIL_LABEL, formatNumber, formatPercent } from './guidance.js'
import notes from '@/features/extraction/notebook.module.css'

function degrees(value: number | null): string {
  return value === null ? 'N/A' : formatNumber(value, 1) + ' °C'
}

function SampleRow({ sample }: { sample: SoapSample }) {
  return <tr>
    <th scope="row">Mẫu {sample.index}</th>
    <td>{OIL_LABEL[sample.oilType]}</td>
    <td>{formatPercent(sample.lye.concentration)}<br/>{degrees(sample.lye.maxTempC)}</td>
    <td>{formatNumber(sample.oil.massG, 1)} g<br/>{degrees(sample.oil.temperatureC)}</td>
    <td>S {formatPercent(sample.mix.superfat)}<br/>ΔT {degrees(sample.mix.deltaTC)}<br/>{degrees(sample.mix.mixtureTempC)}</td>
    <td>pH {formatNumber(sample.soap.ph, 2)}<br/>{formatNumber(sample.soap.massG, 1)} g</td>
    <td><strong>{sample.passed ? 'Đạt' : 'Chưa đạt'}</strong></td>
  </tr>
}

export function SoapNotebook({ projection, revision }: { projection: SoapProjection; revision: number }) {
  return <div className={notes.notebook}>
    <div className={notes.heading}>
      <h2>Sổ đo</h2>
      <span>Bản {revision} · thiếu phép đo hiện N/A</span>
    </div>
    <article className={notes.measurements}>
      <div className={notes.cardHeading}><h3>Mẫu thử đã đo</h3><span>{projection.samples.length} mẫu</span></div>
      <p className={notes.context}>Mỗi mẫu ghi chỉ số hai dung dịch (kiềm, dầu), chỉ số hỗn hợp và chỉ số xà phòng. Chỉ có sau khi bấm Đo pH và cân.</p>
      {projection.samples.length === 0
        ? <p className={notes.missing}>Chưa có mẫu thử.</p>
        : <table className={notes.latestTable}>
          <thead><tr><th>Mẫu</th><th>Dầu</th><th>Kiềm (nồng độ, nhiệt)</th><th>Dầu (khối lượng, nhiệt)</th><th>Hỗn hợp</th><th>Xà phòng</th><th>Kết quả</th></tr></thead>
          <tbody>{projection.samples.map((sample) => <SampleRow key={sample.index} sample={sample}/>)}</tbody>
        </table>}
    </article>
  </div>
}
