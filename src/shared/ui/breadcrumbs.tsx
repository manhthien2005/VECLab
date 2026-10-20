import Link from 'next/link'
import styles from './breadcrumbs.module.css'

type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav className={`${styles.breadcrumbs} page-breadcrumbs`} aria-label="Đường dẫn điều hướng">
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className={styles.item}>
            {index > 0 && (
              <span className={`${styles.divider} breadcrumb-divider`} aria-hidden="true">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
