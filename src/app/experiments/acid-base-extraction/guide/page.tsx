import { ExtractionLesson } from '@/features/extraction/lesson.js'
export const metadata={title:'Lý thuyết & cách làm chiết tách axit–bazơ'}
export default async function Page({searchParams}:{searchParams:Promise<{attempt?:string|string[]}>}){const p=await searchParams;return <ExtractionLesson guide {...(typeof p.attempt==='string'?{attemptId:p.attempt}:{})}/>}
