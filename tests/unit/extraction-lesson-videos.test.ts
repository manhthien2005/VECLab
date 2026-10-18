import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExtractionLesson } from '@/features/extraction/lesson.js'

describe('Extraction lesson videos on both reading surfaces', () => {
  for (const guide of [false, true]) {
    it(`offers the lesson and practice without loading a player on the ${guide ? 'guide' : 'overview'}`, () => {
      const html = renderToStaticMarkup(createElement(ExtractionLesson, { guide }))
      const videoSection = html.match(/<section[^>]*id="extraction-videos"[\s\S]*?<\/section>/)?.[0]
      expect(videoSection).toBeDefined()
      expect(videoSection).toContain('Học chiết tách axit–bazơ qua video')
      expect(videoSection).toContain('Phát video bài học chiết tách axit–bazơ')
      expect(videoSection).toContain('Chọn video: Thao tác thực hành trên VECLab')
      expect(videoSection).toContain('aria-controls="extraction-videos-player"')
      expect(videoSection).toContain('acid-base-extraction-lesson-cover.webp')
      expect(videoSection).toContain('acid-base-extraction-practice-cover.webp')
      expect(videoSection).not.toContain('<video')
      expect(videoSection).not.toContain('supabase.co')
      expect(videoSection).not.toContain('Jar Test')
      expect(videoSection).not.toContain('bản tạm')
    })
  }
})
