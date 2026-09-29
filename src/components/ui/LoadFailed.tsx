import { useMessages } from '@/lib/i18n/useMessages'

/** "This could not be loaded." with a way to try again — never a blank screen. */
export default function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const copy = useMessages()
  return (
    <div role="alert" className="mt-16 text-center">
      <p className="text-[0.84rem] text-graphite-soft">{copy.loadFailed}</p>
      <button type="button" onClick={onRetry} className="mt-3 min-h-11 text-[0.8rem] text-graphite underline decoration-graphite/30 underline-offset-4">
        {copy.retry}
      </button>
    </div>
  )
}
