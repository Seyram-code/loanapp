export const TOAST_EVENT = 'lendgh:toast'

export function notifyToast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }))
}
