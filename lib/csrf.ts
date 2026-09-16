export function isSameOrigin(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const requestOrigin = `${forwardedProto || requestUrl.protocol.replace(':', '')}://${forwardedHost || request.headers.get('host') || requestUrl.host}`
  const origin = request.headers.get('origin')
  if (origin) return origin === requestOrigin

  const referer = request.headers.get('referer')
  if (!referer) return request.headers.get('sec-fetch-site') === 'same-origin'
  try {
    return new URL(referer).origin === requestOrigin
  } catch {
    return false
  }
}
