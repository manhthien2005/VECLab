import { LessonVideos } from '@/features/experiment-guide/lesson-videos.js'
import { WATER_TREATMENT_LESSON_VIDEOS } from './lesson-video-content.js'

export function WaterTreatmentVideos() {
  return <LessonVideos id="water-treatment-videos" title="Video tham khảo" videos={WATER_TREATMENT_LESSON_VIDEOS} />
}
