import Screen from '@/components/ui/Screen'
import TouchPointMark from '@/components/brand/TouchPointMark'

/** Shown while the stored session or profile is being restored. */
export default function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <Screen>
      <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center">
        <TouchPointMark className="animate-pulse text-sand-faint" />
        <span className="sr-only">{label}</span>
      </div>
    </Screen>
  )
}
