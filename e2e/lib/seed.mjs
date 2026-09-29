import { POINTS, USERS } from './config.mjs'
import { sql } from './db.mjs'

/** Record a touch as a test user, through record_touch() — the only way the app can. */
export function touchAs(user, publicId) {
  return sql(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${user.id}"}', false);
              select visit_id from record_touch('${publicId}'); reset role;`)
}

/** Walker's journey for perf and screenshot runs: two places touched, one memory kept. */
export function seedWalkerJourney() {
  touchAs(USERS.walker, POINTS.gate)
  touchAs(USERS.walker, POINTS.kinzan)
  sql(`insert into memories (user_id, visit_id, place_id, note, mood)
       select user_id, id, place_id, 'A quiet morning with the ibis.', 'calm' from visits
       where user_id = '${USERS.walker.id}' and place_id = (select id from places where slug = 'toki-no-mori')`)
}
