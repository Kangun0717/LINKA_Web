import { useEffect, useState } from 'react'

import { signedPhotoUrls, type MemoryPhotoRow } from '@/features/memories/api'
import { thumbPathOf } from '@/features/memories/photos'

/**
 * Short-lived URLs for a set of private photos — each photo and its
 * thumbnail — signed together in one request and reused until they expire.
 * A photo without a thumbnail (every photo from before 4C) simply has none.
 */
export function usePhotoUrls(photos: readonly Pick<MemoryPhotoRow, 'storage_path'>[], { thumbs = true } = {}): Record<string, string> {
  const key = photos.map((p) => p.storage_path).join('|')
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!key) return
    let active = true
    const paths = key.split('|')
    signedPhotoUrls(thumbs ? [...paths, ...paths.map(thumbPathOf)] : paths).then(
      (next) => active && setUrls((prev) => ({ ...prev, ...next })),
      () => {},
    )
    return () => {
      active = false
    }
  }, [key, thumbs])
  return urls
}
