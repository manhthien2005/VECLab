import Image from 'next/image'
import styles from '@/features/experiment-guide/lesson-videos.module.css'

export function WaterTreatmentLessonVideos() {
  return <section id="water-treatment-videos" className={styles.section} aria-label="Video bài học xử lý nước">
    <div className={styles.heading}><h2>Video bài học</h2><p>Nội dung đang được cập nhật.</p></div>
    <Image
      src="/assets/water-treatment-videos/water-treatment-lesson-cover.jpg"
      alt="Bìa bài học xử lý nước nhiễm kim loại nặng Zn, Pb, Fe"
      width={1024}
      height={683}
      sizes="(max-width: 850px) 100vw, 900px"
      style={{ width: '100%', height: 'auto' }}
    />
  </section>
}
