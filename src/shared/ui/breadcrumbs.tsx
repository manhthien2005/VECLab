import Link from 'next/link'

type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav className="page-breadcrumbs" aria-label="Đường dẫn điều hướng">
      <ol>{items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          {index > 0 && <span className="breadcrumb-divider" aria-hidden="true">/</span>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </li>
      ))}</ol>
    </nav>
  )
}
