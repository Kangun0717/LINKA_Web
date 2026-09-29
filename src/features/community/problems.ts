import type { CommunityProblem } from '@/features/community/api'
import type { CommunityCopy } from '@/lib/i18n/useCommunityMessages'

/** A refusal or failure, in the interface's own words — never the database's message. */
export function problemText(cc: CommunityCopy, problem: CommunityProblem): string {
  return problem === 'rate_limited' ? cc.act.rateLimited : problem === 'closed' ? cc.act.closed : problem === 'offline' ? cc.act.offline : cc.act.failed
}
