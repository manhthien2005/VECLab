import { LessonVideos } from '@/features/experiment-guide/lesson-videos.js'
import { WATER_TREATMENT_LESSON_VIDEOS } from './lesson-video-content.js'

export function WaterTreatmentLessonVideos() {
  return <LessonVideos id="water-treatment-videos" title="Học xử lý nước qua video" videos={WATER_TREATMENT_LESSON_VIDEOS} />
}
