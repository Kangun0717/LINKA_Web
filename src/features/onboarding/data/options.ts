/** Stored values for the optional demographic fields. All are free-form text
 *  columns in `public.profiles`, so these constants are the contract. */

export type Option = {
  value: string
  label: string
}

/** Deliberately coarse — LINKA never asks for an exact birth date. */
export const AGE_RANGES: Option[] = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_24', label: '18–24' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_64', label: '55–64' },
  { value: '65_plus', label: '65+' },
]

export const GENDERS: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]
