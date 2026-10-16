import { useId, type ComponentProps } from 'react'

type Props = Omit<ComponentProps<'button'>, 'disabled'> & {
  reason?: string | null | undefined
  reasonClassName?: string | undefined
}

/** A disabled lab action always has a visible, associated explanation. */
export function ActionButton({ reason, reasonClassName, children, ...props }: Props) {
  const id = useId()
  const description = [props['aria-describedby'], reason ? id : null].filter(Boolean).join(' ') || undefined
  return <>
    <button type="button" {...props} disabled={!!reason} aria-describedby={description}>{children}</button>
    {reason && <p id={id} className={reasonClassName}>{reason}</p>}
  </>
}
