// Community data for the tests, written straight into the LOCAL test
// database the way LINKA's staff tooling would (as the table owner: RLS does
// not apply, triggers do). Nothing here touches a real project.
import { USERS } from './config.mjs'
import { sql } from './db.mjs'

const one = (query) => sql(query).split('\n')[0].trim()

export const PRIVATE_ADDRESS = '佐渡市相川北沢町 3-1 PRIVATE-ADDRESS'
export const ORIGINAL_REASON = 'ORIGINAL words, with my phone 090-0000-0000 and where the owner lives.'
export const PUBLIC_REASON = 'Ruins like a castle in the green, lit by the evening. [detail removed by LINKA]'
export const SECRET = 'SECRET-SPOT-NOT-PUBLIC'

/**
 *   kitazawa   walker's, opened (moderated public text, LINKA's point), one approved photo + one pending
 *   tarai      returning's, opened, anonymous, no photo
 *   shukunegi  legacy's, supported by walker and returning, then published as 宿根木
 *   secret     legacy's, still submitted (private)
 */
export function seedCommunity(stack) {
  const kitazawa = one(`insert into place_suggestions (user_id, name, address, latitude, longitude, reason, attribution, locale)
    values ('${USERS.walker.id}', '北沢浮遊選鉱場跡', '${PRIVATE_ADDRESS}', 38.0282, 138.2382, '${ORIGINAL_REASON}', 'nickname', 'ja') returning id`)
  sql(`update place_suggestions set status = 'open', public_area = '佐渡・相川', public_latitude = 38.03, public_longitude = 138.24,
       public_reason = '${PUBLIC_REASON}', region_id = (select id from places where slug = 'sado') where id = '${kitazawa}'`)
  sql(`insert into place_suggestion_photos (suggestion_id, user_id, storage_path, width, height, position, review_status, public_path) values
       ('${kitazawa}', '${USERS.walker.id}', '${USERS.walker.id}/${kitazawa}/approved.jpg', 800, 533, 0, 'approved', 'kitazawa/cover.jpg'),
       ('${kitazawa}', '${USERS.walker.id}', '${USERS.walker.id}/${kitazawa}/pending.jpg', 800, 533, 1, 'pending', null)`)
  sql(`insert into place_suggestion_events (suggestion_id, kind, public_note, internal_note) values
       ('${kitazawa}', 'update', '{"en":"Checking a safe route for visitors.","ja":"安全な見学ルートを確認しています。"}', 'INTERNAL: owner phone 090-1111-1111')`)
  stack.publishPhoto(`${USERS.walker.id}/${kitazawa}/approved.jpg`, 'kitazawa/cover.jpg')

  const tarai = one(`insert into place_suggestions (user_id, name, address, reason, locale)
    values ('${USERS.returning.id}', '小木のたらい舟', '佐渡市小木町', 'Rowing a wooden tub boat around the harbour.', 'en') returning id`)
  sql(`update place_suggestions set status = 'open', public_area = '佐渡・小木', public_latitude = 37.81, public_longitude = 138.28 where id = '${tarai}'`)

  const shukunegi = one(`insert into place_suggestions (user_id, name, address, reason, locale)
    values ('${USERS.legacy.id}', '宿根木の町並み', '佐渡市宿根木', 'A village of ship-carpenters’ houses.', 'ja') returning id`)
  sql(`update place_suggestions set status = 'open', public_area = '佐渡・宿根木', public_latitude = 37.81, public_longitude = 138.22 where id = '${shukunegi}'`)
  sql(`insert into place_suggestion_supports (suggestion_id, user_id) values ('${shukunegi}', '${USERS.walker.id}'), ('${shukunegi}', '${USERS.returning.id}')`)
  sql(`update place_suggestions set status = 'approved' where id = '${shukunegi}'`)
  sql(`update place_suggestions set status = 'published', place_id = (select id from places where slug = 'shukunegi') where id = '${shukunegi}'`)

  const secret = one(`insert into place_suggestions (user_id, name, address, reason, locale)
    values ('${USERS.legacy.id}', '${SECRET}', 'SECRET ADDRESS', 'SECRET REASON', 'en') returning id`)

  return { kitazawa, tarai, shukunegi, secret }
}

export const supportCount = (id) => Number(sql(`select support_count from place_suggestions where id = '${id}'`))
export const setLimit = (action, window, max) =>
  sql(`update community_rate_limits set max_count = ${max} where action = '${action}' and window_length = interval '${window}'`)
