import { ExtractionWorkbench } from '@/features/extraction/workbench.js'
export const metadata = { title: 'Thực hành chiết tách axit–bazơ' }
export default async function ExtractionPage({ searchParams }: { searchParams: Promise<{ attempt?: string | string[]; view?: string }> }) {
 const params=await searchParams
 return <ExtractionWorkbench key={typeof params.attempt === 'string' ? params.attempt : 'new'} attemptId={typeof params.attempt === 'string' ? params.attempt : null} openReport={params.view === 'report'} initialPane={params.view === 'notebook' ? 'notebook' : 'simulation'}/>
}
