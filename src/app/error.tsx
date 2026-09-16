'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unexpected application error', { message: error.message, digest: error.digest })
  }, [error])

  return <main className="error-page"><section className="error-panel panel"><p className="eyebrow">Unexpected error</p><h1>Something went wrong.</h1><p>We could not complete that request. Your data was not exposed.</p><button className="primary-button" type="button" onClick={() => reset()}>Try again</button></section></main>
}