import { cn } from '@/lib/cn'

/**
 * A place that exists but has not been touched: ○.
 *
 * The same size as a Touch Point and in the same graphite, but open — no
 * dot, no ))), no colour. It is there to be found, not remembered. It is
 * never a pin.
 */
export default function DiscoveryMark({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden className="relative block size-3">
      <span
        className={cn(
          'absolute inset-[1px] rounded-full border bg-[#fcfaf5] transition-[scale,border-color] duration-500 ease-calm',
          selected ? 'scale-125 border-graphite/80' : 'border-graphite/50',
        )}
      />
    </span>
  )
}
