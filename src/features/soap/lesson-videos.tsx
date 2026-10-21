import { LessonVideos } from '@/features/experiment-guide/lesson-videos.js'
import { SOAP_LESSON_VIDEOS } from './lesson-video-content.js'

export function SoapLessonVideos() {
  return <LessonVideos id="soap-videos" title="Học xà phòng hóa qua video" videos={SOAP_LESSON_VIDEOS} />
}
