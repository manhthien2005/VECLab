import { SoapWorkbench } from '@/features/soap/workbench.js'

export const metadata = { title: 'Thực hành xà phòng hóa', robots: { index: false, follow: false } }

export default async function SoapPage({ searchParams }: {
  searchParams: Promise<{ attempt?: string | string[]; view?: string }>
}) {
  const params = await searchParams
  return <SoapWorkbench
    key={typeof params.attempt === 'string' ? params.attempt : 'new'}
    attemptId={typeof params.attempt === 'string' ? params.attempt : null}
    openReport={params.view === 'report'}
    initialPane={params.view === 'notebook' ? 'notebook' : 'simulation'}
  />
}
