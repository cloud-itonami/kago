# kago

**kago（駕籠）は配車プラットフォームの appview である。** 名前は乗り物（人を乗せて
運ぶ籠）から採っており、機能を字面で示さないので、ここで名乗る。
canonical な識別子は `com-etzhayyim-app-kago`、host は `kago.etzhayyim.com` を想定。

> ⚠ **この repo は現在「動くアプリ」ではなく、抜き出しの途中結果である。**
> フロントエンド（下記）は build も test も通るが、backend（ride-hailing の
> 実装本体）はこの repo に無く、documented なホストも存在しない。
> 何がどこで止まるかは **[docs/operator-quickstart.md](docs/operator-quickstart.md)**
> に実測値で書いてある。**触る前にそちらを読むこと。**

---

## 何が入っていて、何が入っていないか

`migration.edn` のとおり、この repo は `etzhayyim/root` の
`60-apps/etzhayyim-project-kago`（revision `089210a0`、23 files / 21,569 bytes）
から抜き出された。**抜き出されたのは appview だけである。**

| | 実在 | 置き場 |
|---|---|---|
| ClojureScript appview（reagent + re-frame + jp-go-dds、**scaffold のみ**） | ✅ | `appview/etzhayyim-wasm-kago-ride-y83jjx4l/cljs/` |
| service manifest（route / trigger / KV / governance） | ✅ | `.../kotodama.jsonld` |
| 仕様の記述（ride lifecycle・MCP tool・API endpoint） | ✅ | `CLAUDE.md` |
| **ride-hailing の実装本体 `component.wasm`** | ❌ | `etzhayyim/root` に残っている |
| **backend TypeScript / Cloudflare Worker logic** | ❌ | この repo には元々存在しない（appview だけが抜き出された） |
| Svelte appview（旧・scaffold のみ、`src/` 全体で 33 行） | ❌（2026-08-26 に ClojureScript へ移行し削除） | — |
| e2e 仕様 4 feature（health / ride / driver / debug、Playwright + playwright-bdd） | ❌（同上。Svelte/Vite/Playwright ツールチェーンごと撤去。**バックエンド API を対象にした仕様であって、フロントエンドのロジックではない** — 内容は git 履歴と `migration.edn` の provenance に残る） | — |

`kotodama.jsonld` は `component.path: "component.wasm"` を宣言しているが、
**そのファイルはこの repo に無い。**

## フロントエンド — Svelte から ClojureScript へ移行済み（2026-08-26）

`appview/etzhayyim-wasm-kago-ride-y83jjx4l/cljs/` は
ClojureScript（shadow-cljs）+ reagent 1.2.0 + re-frame 1.4.3 + `jp-go-dds.core`
（デジタル庁デザインシステム）hiccup — このワークスペースの標準スタック
（`kotoba-uiux` skill）。旧 `svelte/` の `App.svelte` は "Vite entry scaffold
after SvelteKit cleanup" という一見出し・一段落だけの scaffold で、機能は
何も持っていなかった。移行で作り替えたのはツールチェーンだけで、機能は
一切足していない（発明しない）。

```bash
cd appview/etzhayyim-wasm-kago-ride-y83jjx4l/cljs
npm install
amu compile --target wasm32-browser app                          # -> public/js/, public/index.html と一緒に配信
amu compile --target wasm32-browser test && node out/tests.js     # cljs.test — re-frame event/sub logic
```

実測（2026-08-26、この repo で）:

| コマンド | 結果 |
|---|---|
| `npm install` | 通る（129 packages） |
| `amu compile --target wasm32-browser app` | 通る（111 files, 110 compiled, 0 warnings） |
| `amu compile --target wasm32-browser test && node out/tests.js` | 通る（4 tests, 6 assertions, 0 failures, 0 errors） |

`public/index.html` の inline `<style>` は `jp-go-dds.page/->page` を JVM 上で
1 度実行して生成した静的ファイル（`src/kago/app.cljs` の namespace docstring に
再生成コマンドあり）。実行時に require するのは `jp-go-dds.core` だけで、
`jp-go-dds.page` / `html.core` は shell を著者が書くための JVM 専用ツール。

旧 Svelte scaffold は `workspace:*` 依存・vite/plugin の peer 不整合・
design-system 未解決という 3 つの build blocker を持っていた（旧版の
この README と `docs/operator-quickstart.md` §2–3 に実測が残っている —
git 履歴参照）。ClojureScript 版はこれらの依存を持たないため、そもそも
その 3 つの blocker が構造的に存在しない。

## 状態（2026-08-26 実測）

| 問い | 答え |
|---|---|
| フロントエンドの `npm install` は通るか | **通る** |
| フロントエンドの build は通るか | **通る** |
| フロントエンドの test は通るか | **通る** |
| backend（ride-hailing 実装本体）は動くか | **無い**（`component.wasm` が repo に無い。§ 上表） |
| e2e は通るか | **仕様ごと撤去済み**（旧 Svelte/Playwright ツールチェーンの一部だった。backend が無いので実行対象も無かった） |
| `CLAUDE.md` の Smoke Test は通るか | **通らない**（`y83jjx4l.etzhayyim.com` が NXDOMAIN — backend が無い以上変わらない） |

## 読む順番

1. **[docs/operator-quickstart.md](docs/operator-quickstart.md)** — 実際に踏める手順と、止まる場所
2. `CLAUDE.md` — ride lifecycle・MCP tool 一覧・KV bucket・maps 連携の**設計意図**
   （⚠ 末尾の Smoke Test は現在到達しない。稼働状態の記述として読まない）
3. `kotodama.jsonld` — route / trigger / KV / governance の宣言
4. `migration.edn` — どこから何が抜き出されたか

## この先の判断（owner 待ち）

**backend を抜き出してこの repo を完成させるのか、retire するのか**は設計判断であり、
まだ決まっていない。決まるまでは、この repo を「仕様の置き場」として読むのが正しい。

## メタデータ

- `README.edn` — 機械可読な repo 記述子（`etzhayyim.repository/v1`）
- `PROJECT.jsonld` — schema.org Project 記述
- `NOTICE` — 帰属表示
