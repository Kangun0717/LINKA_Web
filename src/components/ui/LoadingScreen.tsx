import Screen from '@/components/ui/Screen'
import TouchPointMark from '@/components/brand/TouchPointMark'
import { cn } from '@/lib/cn'

type LoadingScreenProps = {
  label?: string
  /**
   * Which surface this is loading onto.
   *
   * `ink` is LINKA's default and what every guarded route wants. `paper` exists
   * for one situation only: the Door hands a visitor to the OTP flow and gets
   * them back at `/`, and a dark screen in the middle of that returns a warm
   * off-white entrance to black for a frame. It is opt-in so the dark screens
   * that rely on the default keep it.
   */
  tone?: 'ink' | 'paper'
}

/** Shown while the stored session or profile is being restored. */
export default function LoadingScreen({ label = 'Loading', tone = 'ink' }: LoadingScreenProps) {
  const isPaper = tone === 'paper'

  return (
    <Screen className={cn(isPaper && 'bg-paper')}>
      <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center">
        <TouchPointMark
          className={cn('animate-pulse', isPaper ? 'text-graphite-faint' : 'text-sand-faint')}
        />
        <span className="sr-only">{label}</span>
      </div>
    </Screen>
  )
}
