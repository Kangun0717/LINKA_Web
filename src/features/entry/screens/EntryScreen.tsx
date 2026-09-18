import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import Door from '@/features/entry/components/Door'

/**
 * The door.
 *
 * "Enter LINKA" is a development affordance only — in the shipped product this
 * transition is triggered by physically touching an NFC Touch Point.
 */
export default function EntryScreen() {
  const navigate = useNavigate()

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center">
        <Door />

        <p className="mt-14 text-center text-sm leading-relaxed text-sand-muted">
          Somewhere in the real world,
          <br />
          there is a Touch Point waiting.
        </p>
      </div>

      <div className="mt-12 shrink-0">
        <Button onClick={() => navigate('/legacy/reveal')}>Enter LINKA</Button>
        <p className="mt-5 text-center text-xs leading-relaxed text-sand-faint">
          Temporary entry for development.
          <br />
          The door will open by touch.
        </p>
      </div>
    </Screen>
  )
}
