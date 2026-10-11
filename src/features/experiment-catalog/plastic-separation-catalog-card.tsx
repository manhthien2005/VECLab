import Link from 'next/link'

const SIMULATION_HREF = '/simulate/plastic-density-separation'
const DETAIL_HREF = '/experiments/plastic-density-separation'

/** Catalog card for the interactive plastic separation prototype. */
export function PlasticSeparationCatalogCard() {
  return (
    <article className="card card-interactive scenario-card">
      <div className="stack-tight">
        <div className="row">
          <span className="badge badge-mono">mô phỏng nghiên cứu</span>
          <span className="badge badge-mono">6 loại polymer</span>
        </div>
        <h3>
          <Link href={DETAIL_HREF}>Phân loại nhựa nguyên sinh</Link>
        </h3>
      </div>

      <p className="summary">
        Tách sáu loại nhựa theo phương pháp nổi–chìm trong nước, ethanol và dung dịch NaCl.
      </p>

      <dl className="scenario-stats">
        <div>
          <dt>Phương pháp</dt>
          <dd>Nổi–chìm</dd>
        </div>
        <div>
          <dt>Môi trường</dt>
          <dd>H₂O, ethanol, NaCl</dd>
        </div>
        <div>
          <dt>Kết quả</dt>
          <dd>Vị trí và thu hồi</dd>
        </div>
      </dl>

      <div className="row">
        <Link className="btn btn-primary" href={SIMULATION_HREF}>
          Bắt đầu mô phỏng
        </Link>
        <Link className="btn btn-ghost" href={DETAIL_HREF}>
          Xem chi tiết
          <span className="visually-hidden"> — Phân loại nhựa nguyên sinh</span>
        </Link>
      </div>
    </article>
  )
}
