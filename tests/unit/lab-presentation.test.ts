import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LabStorageNotice } from '@/features/learner-lab/lab-client.js'

describe('lab storage presentation', () => {
  it('makes guest persistence and its limits explicit without promising an account sync', () => {
    const html = renderToStaticMarkup(createElement(LabStorageNotice, { storageMode: 'local' }))
    expect(html).toContain('Chưa đăng nhập')
    expect(html).toContain('Lưu trên trình duyệt này')
    expect(html).toContain('không đồng bộ sang thiết bị khác')
    expect(html).toContain('href="/sign-in"')
    expect(html).not.toContain('href="/account"')
  })

  it('keeps browser persistence explicit for all lessons even for a signed-in learner', () => {
    const html = renderToStaticMarkup(createElement(LabStorageNotice, { storageMode: 'cloud' }))
    expect(html).toContain('Đã đăng nhập')
    expect(html).toContain('Lưu trên trình duyệt này')
    expect(html).toContain('Các bài thực hành hiện lưu trên trình duyệt, chưa đồng bộ vào tài khoản')
    expect(html).toContain('kể cả khi đã đăng nhập')
    expect(html).toContain('không đồng bộ sang thiết bị khác')
    expect(html).not.toContain('Dùng cùng tài khoản trên thiết bị khác')
    expect(html).toContain('href="/account"')
    expect(html).not.toContain('href="/sign-in"')
    expect(html).not.toContain('Đã đồng bộ')
  })
})
