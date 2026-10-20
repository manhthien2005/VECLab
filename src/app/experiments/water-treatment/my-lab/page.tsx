'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoredReports, deleteReport, getReportStatistics, type StoredReport } from '@/features/water-treatment/storage.js'
import { FlaskIcon, ArrowRightIcon, CheckCircleIcon } from '@/features/landing/icons.js'
import { InfoIcon, ReportIcon } from '@/features/workbench/icons.js'
import styles from './my-lab.module.css'

const fmt = (value: number | null, digits = 1): string =>
  value === null ? 'N/A' : value.toLocaleString('vi-VN', { maximumFractionDigits: digits })

function ReportCard({ stored, onDelete }: { stored: StoredReport; onDelete: () => void }) {
  const { report } = stored
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <article className={styles.card} data-met={report.goalStatus.goalMet}>
      <header>
        <div className={styles.cardIcon}>
          {report.goalStatus.goalMet ? <CheckCircleIcon /> : <InfoIcon />}
        </div>
        <div className={styles.cardMeta}>
          <time dateTime={stored.savedAt.toISOString()}>
            {stored.savedAt.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
          {report.goalStatus.evaluable && (
            <span className={styles.badge} data-met={report.goalStatus.goalMet}>
              {report.goalStatus.goalMet ? 'Đạt chuẩn' : 'Chưa đạt'}
            </span>
          )}
        </div>
      </header>

      <div className={styles.cardBody}>
        <h3>
          {report.goalStatus.goalMet
            ? 'Xử lý thành công'
            : report.goalStatus.evaluable
              ? 'Cần cải thiện'
              : 'Chưa hoàn thành'}
        </h3>

        {report.sampleCalculation && report.ban2LockedData && (
          <dl className={styles.metrics}>
            <div>
              <dt>Fe</dt>
              <dd>
                {fmt(report.sampleCalculation.dissolvedMgL.fe)} → {fmt(report.ban2LockedData.feAfterMgL)} mg/L
              </dd>
            </div>
            <div>
              <dt>Zn</dt>
              <dd>
                {fmt(report.sampleCalculation.dissolvedMgL.zn)} → {fmt(report.ban2LockedData.znAfterMgL)} mg/L
              </dd>
            </div>
            <div>
              <dt>Pb</dt>
              <dd>
                {fmt(report.sampleCalculation.dissolvedMgL.pb)} → {fmt(report.ban2LockedData.pbAfterMgL)} mg/L
              </dd>
            </div>
          </dl>
        )}

        {report.removalEfficiency.fe !== null && (
          <p className={styles.efficiency}>
            Hiệu suất: Fe {fmt(report.removalEfficiency.fe)}%, Zn {fmt(report.removalEfficiency.zn)}%, Pb{' '}
            {fmt(report.removalEfficiency.pb)}%
          </p>
        )}
      </div>

      <footer className={styles.cardActions}>
        {confirmDelete ? (
          <>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setConfirmDelete(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={() => {
                onDelete()
                setConfirmDelete(false)
              }}
            >
              Xác nhận xóa
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setConfirmDelete(true)}
            >
              Xóa
            </button>
            <Link
              href={`/experiments/water-treatment/workbench?attemptId=${stored.id}&openReport=true`}
              className={styles.primary}
            >
              <ReportIcon />
              Xem báo cáo
            </Link>
          </>
        )}
      </footer>
    </article>
  )
}

export default function WaterTreatmentMyLabPage() {
  const [reports, setReports] = useState<StoredReport[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getReportStatistics> | null>(null)

  useEffect(() => {
    setReports(getStoredReports())
    setStats(getReportStatistics())
  }, [])

  const handleDelete = (id: string) => {
    deleteReport(id)
    setReports(getStoredReports())
    setStats(getReportStatistics())
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Trang chủ VECLab">
          <span>
            <FlaskIcon />
          </span>
          <strong>VECLab</strong>
        </Link>
        <Link href="/experiments" className={styles.back}>
          <ArrowRightIcon />
          Thí nghiệm
        </Link>
        <div className={styles.title}>
          <h1>Lab của tôi — Xử lý nước</h1>
          <p>Các lượt đã lưu trên thiết bị này</p>
        </div>
      </header>

      {stats && stats.totalReports > 0 && (
        <section className={styles.stats} aria-label="Thống kê">
          <div className={styles.statCard}>
            <strong>{stats.totalReports}</strong>
            <span>Tổng lượt</span>
          </div>
          <div className={styles.statCard}>
            <strong>{stats.successfulReports}</strong>
            <span>Đạt chuẩn</span>
          </div>
          {stats.averageRemovalEfficiency && (
            <>
              <div className={styles.statCard}>
                <strong>{fmt(stats.averageRemovalEfficiency.fe)}%</strong>
                <span>Trung bình Fe</span>
              </div>
              <div className={styles.statCard}>
                <strong>{fmt(stats.averageRemovalEfficiency.zn)}%</strong>
                <span>Trung bình Zn</span>
              </div>
              <div className={styles.statCard}>
                <strong>{fmt(stats.averageRemovalEfficiency.pb)}%</strong>
                <span>Trung bình Pb</span>
              </div>
            </>
          )}
        </section>
      )}

      <main className={styles.main}>
        {reports.length === 0 ? (
          <div className={styles.empty}>
            <InfoIcon />
            <h2>Chưa có lượt nào được lưu</h2>
            <p>Hoàn thành và nộp bài ở workbench để lưu báo cáo vào Lab của tôi.</p>
            <Link href="/experiments/water-treatment/workbench" className={styles.cta}>
              Bắt đầu thực hành
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {reports.map((stored) => (
              <ReportCard key={stored.id} stored={stored} onDelete={() => handleDelete(stored.id)} />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p className={styles.note}>
          Dữ liệu lưu trên trình duyệt này. Xóa cache hoặc dùng thiết bị khác sẽ mất dữ liệu.
        </p>
        <Link href="/experiments/water-treatment/workbench" className={styles.newAttempt}>
          + Tạo lượt mới
        </Link>
      </footer>
    </div>
  )
}
