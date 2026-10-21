import type { DomainError, DomainErrorCategory } from '@/domain/process/contracts.js'

/**
 * Typed domain errors.
 *
 * Errors carry a stable category plus a stable code. Logic branches on those,
 * never on message text (docs/system-architecture.md §5.1). `messageKey`
 * resolves in the content layer; the domain never renders user-facing strings.
 */

function domainError(
  category: DomainErrorCategory,
  code: string,
  messageKey: string,
  data: DomainError['data'] = {},
): DomainError {
  return { category, code, messageKey, data }
}

export function invalidInput(code: string, messageKey: string, data: DomainError['data'] = {}): DomainError {
  return domainError('invalid_input', code, messageKey, data)
}

export function preconditionFailed(
  code: string,
  messageKey: string,
  data: DomainError['data'] = {},
): DomainError {
  return domainError('precondition_failed', code, messageKey, data)
}

export function modelInvalid(code: string, messageKey: string, data: DomainError['data'] = {}): DomainError {
  return domainError('model_invalid', code, messageKey, data)
}

export function unsupportedRelease(releaseId: string): DomainError {
  return domainError('unsupported_release', 'UNSUPPORTED_SCENARIO_RELEASE', 'errors.unsupportedRelease', {
    releaseId,
  })
}

export function revisionConflict(data: DomainError['data']): DomainError {
  return domainError('conflict', 'REVISION_CONFLICT', 'errors.revisionConflict', data)
}
