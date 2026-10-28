# LINKA

現実の NFC Touch Point（`:)))`）に触れると、その場所が自分の世界になる。フロントは静的な SPA、データと認証はクラウドの Supabase に置く。

この文書は、いまの本アプリケーションの技術選定と設計の記録である。Vite の雛形 README ではない。

---

## 技術選定

| 層 | 採用 | バージョン目安 | 採用理由 |
|---|---|---|---|
| UI | React | 19 | 画面・アニメ・地図はクライアント体験が本体 |
| 言語 | TypeScript | 6 | `verbatimModuleSyntax`、パス `@/*` |
| バンドル | Vite | 8 | ドアの初回描画を速くする。SSR はしていない |
| ルーティング | react-router-dom | 7 | SPA。ガードは画面用で、権限の本体ではない |
| スタイル | Tailwind CSS | 4 | `@tailwindcss/vite` |
| バックエンド | Supabase（Postgres + Auth + Storage + PostgREST） | supabase-js 2.11x | 自前サーバーも Docker も日常開発には置かない |
| 権限 | Postgres RLS と `SECURITY DEFINER` 関数 | — | ブラウザが DB を叩いても、出してよい行・列だけ |
| Lint | Oxlint | 1 | `npm run lint` |
| E2E | Playwright Core + ローカル Postgres 17 + PostgREST | — | 本番の RLS を相手にする。本番プロジェクトには触れない |

**入れてないもの（意図的）**

- Next.js / SSR — ドア・地球儀・タッチはクライアント専用。公開ページの SEO が必要になったら `/place/*` だけ足す余地はある
- Docker / `docker-compose` / `supabase start` — リポジトリに無い。日常はクラウドの共有プロジェクトを叩く
- 自前 REST / GraphQL — 書き込みの要所は SQL 関数。読みは PostgREST + RLS
- React Compiler — ビルドへの影響でオフ

---

## 全体構成

```
開発者の PC                         インターネット
npm run dev  ──────────────────►  共有 Supabase プロジェクト
localhost:5173                      Auth / Postgres / Storage
（Vite SPA）                        例: dnnnwafmfhmvuapfssuv
```

- フロントは `npm install` と `.env` の 2 変数で起動する。ローカル DB は不要
- 全員が同じクラウド DB を見る。開発用と本番用のプロジェクト分離は、運用で決める（コードはまだ 1 本）
- 環境変数が git に入らないので、相手のマシンでは動いて自分では Auth で止まる、が起きうる

`.env` は gitignore。`.env.example` をコピーする。

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

anon（publishable）key だけ。ブラウザに載せる前提の鍵。service role はリポジトリに置かない。`VITE_*` は Vite 起動時にだけ読むので、足したら dev server を再起動する。

読み出しは `src/lib/env.ts`。欠けると `getSupabase()` が例外を投げ、`AuthProvider` に `.catch()` が無いためセッション判定が終わらず、ドアのあと点滅する `:)))` で止まる。

---

## 起動

```sh
npm install
cp .env.example .env   # 値を入れる
npm run dev            # http://localhost:5173
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | `tsc -b` のあと本番ビルド |
| `npm run lint` | Oxlint |
| `npm run test:unit` | 純ロジック（戻り先パス、コミュニティ段階など） |
| `npm run test:e2e` | 実ブラウザ × ローカル Postgres。詳細は `e2e/README.md` |
| `npm run test:db` | マイグレーション履歴に対する SQL テスト |

E2E は Docker ではなく、PostgreSQL 17 バイナリ + ダウンロードした PostgREST + 偽 Auth ゲートウェイ。`VITE_SUPABASE_URL` をゲートウェイに向けてビルドし、本番プロジェクト名が成果物に入っていたら起動を拒否する。

---

## プロダクトの流れ

```
現実の NFC（またはドアの :)))）
  → / ドア体験（誰でも）
  → 未ログインなら /auth
      新規: メール OTP（6桁）→ パスワード → プロフィール
      既存: メール + パスワード（OTP は使わない）
  → /home 自分の世界
```

NFC の URL は `/t/:publicId`。場所を先に見せ、記録はサインイン後。`record_touch` が訪問を書く。

ナビは Map `/home`、Moments `/moments`、Me `/me`。場所の追加は画面の「+」ではなく、物理 Touch Point。

言語は `ja` / `en` / `zh-Hans`。`place_translations.locale` と `profiles.preferred_locale` と同じキー。

---

## 画面とルート

権限の本体は RLS。下記のガードは「どの画面を出すか」だけ。

| パス | ガード | 内容 |
|---|---|---|
| `/` | なし | ドア。セッションの有無で出さない、ということはしない |
| `/t/:publicId` | なし | NFC。場所を見せ、必要ならサインインに迂回 |
| `/place/:slug` | なし | 公開の場所。共有リンク・QR。記録しない |
| `/auth` `/auth/signup` `/auth/verify` `/auth/signin` `/auth/forgot` | GuestOnly | ログイン済みなら次のステップへ |
| `/auth/reset` | なし | 復旧リンクのセッションを先に読む |
| `/auth/password` | RequireSession | コード確認直後のパスワード設定 |
| `/onboarding` | RequireSession + RequirePassword | ニックネームなど |
| `/home` `/moments` `/me` `/community…` | MemberOrGuest | ゲストも地図と Community は読める。個人の旅はゲート |

開発用プレビュー（モック。クラウドに書かない）:

- `/preview/4c/*` — Community / Journal の見た目
- `/preview/my-world` — 地図のシナリオ
- `/preview/emergency`
- `/legacy/entry` `/legacy/reveal` — 旧入口の比較

チャンク: ドアは supabase-js を待たない。地球儀は大きいので別チャンク。`/` 以外ではセッション用クライアントを先読みする（`vite.config.ts`、`src/lib/supabase.ts`、`src/routes/lazyScreens.ts`）。

---

## 認証

3 系統を混ぜない（`src/features/auth/api.ts`）。

1. **新規** — `signInWithOtp` で 6 桁コード。所有確認のあとパスワード。毎回コードでは入らない
2. **ログイン** — メール（または将来の電話）+ パスワード
3. **復旧** — Supabase のリセットメール。戻り先 `/auth/reset` は Dashboard の Redirect URLs に入れる

`password_set` は `user_metadata` のルーティング用。改ざんされてもパスワード設定画面を飛ばせるだけで、権限には使わない。

電話はプロジェクトで SMS が On のときだけ出す（`/auth/v1/settings`）。

OTP は One-Time Password。新規登録のコード送信は `POST /auth/v1/otp`。500 / `unexpected_failure` はフロントではなく、Supabase Auth のメール送信（Email OTP のトグル、テスト用メールの上限、Custom SMTP、Send Email フック）で落ちている。ローカルに Docker を足しても、いまのクライアントはクラウドへ行く。

---

## データと権限

公開・検証済み・私有を混ぜない。

| 概念 | 誰が見るか | 書き方 |
|---|---|---|
| 場所（`places` など） | 公開。ゲストも | スタッフ / service role |
| 検証済みの訪問（タッチ） | 本人の色として地図に乗る | `record_touch(public_id)` のみ。クライアントの直 INSERT は不可 |
| 訪問に紐づく記憶 | 本人 | RLS。訪問があるときだけ |
| 過去の日記（Touch なし） | 本人 | `kind = 'past'`。地図の色・来場者数・進捗には使わない |
| Community の提案 | 公開は moderation 後。列は公開してよいものだけ | 公開読みは `community_suggestions` 等。user_id・住所・座標・内部メモは出さない |

スキーマは `supabase/migrations/`。baseline は 2026-09-28 の本番カタログの記録。その後 harden、places、touch、memories、events/suggestions、visits、community/journal。

セキュリティで意識していること:

- `profiles.role` は列 GRANT で本人が `admin` にできない
- タッチの偽造 INSERT ポリシーは削除
- Storage は `<user_id>/…`。`memory-photos` は private
- ログイン後の戻り先は自サイトのパスだけ（`pendingReturn`、ユニットテストあり）
- `is_admin()` は DEFINER だが、呼んだ人についてだけ答える
- NFC の URL を知っていればタッチできる。物理証明ではない（署名タグは後のスプリント、と SQL に書いてある）

リポジトリの SQL と、クラウドに当たっているマイグレーションは別。harden が未適用だと、古い「自分で admin」穴が残る。

---

## ディレクトリ

```
src/
  features/     画面とドメイン（auth, door, world, places, journey, community, memories, touch, onboarding）
  routes/       ガードと lazy 画面
  data/         場所・旅の読み出しキャッシュ
  lib/          supabase, env, i18n, cn
  components/   ノート UI、ブランド、共通部品
  layouts/      シェル、下部ナビ
supabase/migrations/   本番と同じ順で当てる SQL
e2e/                   ローカルスタックとスペック
```

---

## フロントの設計メモ

- ドアはユニバーサル入口。見たことがあるからスキップ、にはしない。OTP 成功後に `/` へ戻るときだけ `doorSession` で再生を避ける
- ブランド画面の `:)))` はボタンではない。`LinkaReveal` は `pointer-events-none`。`brand` のあと約 2 秒で `/auth` へ。Skip はブランドより前だけ
- 認証待ちの `LoadingScreen` は紙の上の点滅する `:)))` だけ。ラベルはスクリーンリーダー用
- 地図の色は検証済み訪問だけ。ゲストは地理は見えて色は付かない
- プレビュールートのモックは本番データに書かない。見た目確認用

---

## テストが守っているもの

`e2e/README.md` が本体。要約:

- タッチ → 訪問 → 記憶 → Moments / Me
- ゲストの公開場所（私的リクエストを出さない）
- アカウント切り替えで前の人の痕跡が残らない
- Community の公開面に user id・住所・座標が乗らない
- 過去の日記が検証済み訪問を変えない
- ログイン後の戻りが外部 URL に逃げない

---

## いまの限界（設計の欠陥というより、次の境界）

1. **メール OTP** — 新規登録の単一障害点。SMTP（Resend 等）と Dashboard の Email OTP が要る
2. **開発と本番が同じプロジェクトになりやすい** — データ集約するなら dev / staging / prod を分ける
3. **ブラウザが PostgREST を直接叩く** — 単純な読みは RLS で足りる。業務ルールが増えた書き込みは、今の `record_touch` のように関数（または後から同じ Postgres の前の薄い API）に閉じる
4. **CSP が `index.html` に無い** — 公開前に足す余地
5. **Next.js への作り直しは、データ堅さの解決にならない** — 公開ページの SEO 用。Postgres + RLS + 書き込みを関数に閉じる、が拡張の土台

ロバストにする順の目安: メールと環境分離 → マイグレーションが prod に当たっているか → 新しい書き込みは関数/API に閉じる → 公開ページが必要なら `/place/*` に SSR を足す。Auth の自前化や枠の載せ替えは、そのあとで足りる。
