import { useState } from 'react'

/**
 * What the user has chosen on the map — kept apart from what the map draws.
 *
 *   chosenId     a touched place whose Memory Card is open
 *                (`null`: not chosen yet; `''`: they chose nothing)
 *   discoveryId  a discoverable place whose card is open
 *   sheetId      a visited place whose full sheet was opened from its card
 *
 * Changing level (`levelKey`) puts every card away.
 */
export function useWorldSelection(levelKey: string, openPlaceId: string | null) {
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [discoveryId, setDiscoveryId] = useState<string | null>(openPlaceId)
  const [sheetId, setSheetId] = useState<string | null>(null)

  const [cardLevel, setCardLevel] = useState(levelKey)
  if (cardLevel !== levelKey) {
    setCardLevel(levelKey)
    setChosenId('')
    setDiscoveryId(null)
    setSheetId(null)
  }

  return {
    chosenId,
    discoveryId,
    sheetId,
    setSheetId,
    chooseTouched(id: string | null) {
      setDiscoveryId(null)
      setChosenId(id ?? '')
    },
    chooseDiscovery(id: string | null) {
      setChosenId('')
      setDiscoveryId(id)
    },
    /** A tap on the map away from everything: nothing chosen. */
    chooseNothing() {
      setChosenId('')
    },
  }
}
