import { useMemo, useState, type ImgHTMLAttributes } from 'react'

import type { MemoryPhotoRow } from '@/features/memories/api'
import { thumbPathOf } from '@/features/memories/photos'

/**
 * A private photo: its thumbnail where one exists (lists, grids, pins), the
 * photo itself when not — or when the thumbnail fails to load.
 */
export function PrivatePhoto({
  photo,
  urls,
  size = 'thumb',
  ...img
}: {
  photo: Pick<MemoryPhotoRow, 'storage_path' | 'width' | 'height'>
  urls: Record<string, string>
  size?: 'thumb' | 'full'
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const full = urls[photo.storage_path]
  const thumb = urls[thumbPathOf(photo.storage_path)]
  const [failed, setFailed] = useState<string | null>(null)
  const src = useMemo(() => {
    const preferred = size === 'thumb' && thumb && failed !== thumb ? thumb : full
    return preferred ?? null
  }, [size, thumb, full, failed])
  if (!src) return <span aria-hidden className={`block bg-paper-shade/70 ${img.className ?? ''}`} style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...img.style }} />
  return (
    <img
      src={src}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      alt=""
      {...img}
    />
  )
}
