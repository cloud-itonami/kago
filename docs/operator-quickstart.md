# kago — operator quickstart

**この文書の約束: ここに書いてある手順は、書いた時点で実際に実行した。**
成功した手順は成功した出力を、失敗した手順は失敗した出力を、そのまま載せている。
**踏めない手順は書いていない。**

最終実測: **2026-08-26**（Svelte → ClojureScript フロントエンド移行後）。
旧実測（2026-08-14、Svelte 時代の commit `58029b5`）は git 履歴に残っている。

---

## 0. 先に知っておくこと — この repo だけでは動かない

`kago` は `etzhayyim/root` の `60-apps/etzhayyim-project-kago` から抜き出された
（`migration.edn` に source revision `089210a0` / 23 files / 21,569 bytes と記録がある）。
**抜き出されたのは appview（フロントエンド）だけで、ride-hailing の実装本体は
この repo に無い。**

| 期待されるもの | この repo での実在 |
|---|---|
| `component.wasm`（`kotodama.jsonld` が `component.path` で指す本体） | **無い**（`find . -name '*.wasm'` が 0 件） |
| 10 個の MCP tool（`request_ride` / `driver_accept_ride` …、AGENTS.md に一覧がある） | **無い**（backend 側の実装） |
| backend TypeScript / Cloudflare Worker（`src/app.ts` 等） | **無い**（この repo は元から appview のみを抜き出したもの） |
| フロントエンド UI | **scaffold のみ**。2026-08-26 に Svelte から ClojureScript
  （reagent + re-frame + jp-go-dds）へ移行、build/test は通る（§2） |
| e2e 仕様（旧 4 feature、Playwright + playwright-bdd） | **移行時に撤去**。backend API を対象にした仕様で、
  backend 自体がこの repo に無いためもとから実行できなかった（§0 参照。§4 に旧記録） |

したがって以下は「動かして確かめる」手順ではなく、
**どこまで進めて、どこで止まるかを再現する**手順である。

---

## 1. 前提ツール（実測した版）

```bash
node --version   # v26.7.0
npm --version    # 11.19.0
```

これより古い版で試していない。

---

## 2. フロントエンド — ClojureScript（shadow-cljs + reagent + re-frame + jp-go-dds）

作業ディレクトリ:

```bash
cd appview/etzhayyim-wasm-kago-ride-y83jjx4l/cljs
```

### 2a. `npm install` — 通る

```console
$ npm install
added 129 packages, and audited 130 packages in 3s
```

### 2b. build — 通る

> ⚠ このワークスペースの規則により、build は resource governor 経由で起動する
> （superproject の AGENTS.md「repo-wide resource governor」）。

```bash
node <superproject>/scripts/resource-guard.mjs run build -- amu compile --target wasm32-browser app
```

実際の出力:

```console
shadow-cljs - config: appview/etzhayyim-wasm-kago-ride-y83jjx4l/cljs/shadow-cljs.edn
shadow-cljs - starting via "clojure"
[:app] Compiling ...
[:app] Build completed. (111 files, 110 compiled, 0 warnings, 16.91s)
```

出力先は `public/js/`（`public/index.html` と一緒に配信する static bundle）。

### 2c. test — 通る

```bash
node <superproject>/scripts/resource-guard.mjs run build -- amu compile --target wasm32-browser test
node out/tests.js
```

実際の出力:

```console
[:test] Build completed. (112 files, 111 compiled, 0 warnings, 9.24s)
Testing kago.app-test

Ran 4 tests containing 6 assertions.
0 failures, 0 errors.
```

（`re-frame: Subscribe was called outside of a reactive context.` という警告行が
標準出力に出るが、これは re-frame が subscription を reactive context の外
（テストの `deref`）で呼んだことを知らせるだけの無害な warning で、
`0 failures, 0 errors` の結果には影響しない。）

### 2d. 旧 Svelte scaffold との違い

旧 `svelte/` は次の 3 つの build blocker を持っていた（2026-08-14 実測、
git 履歴に旧版のこの文書として残っている）:

1. `package.json` の `workspace:*` 依存（`@etzhayyim/design-system` /
   `@etzhayyim/vite-plugin-safe-builder`）— この repo にも npm/pnpm の
   workspace にも実体が無い。
2. `vite@^6` と `@sveltejs/vite-plugin-svelte@^4`（peer は `vite@^5`）の
   バージョン不整合。
3. `tailwind.config.js` が `@etzhayyim/design-system/plugin` を `require` する
   （`src/**` の import だけを見ても分からない、config 側の依存）。

ClojureScript 版はこれらの依存を一切持たない（reagent/re-frame は
`deps.edn` の `:cljs` alias、jp-go-dds は git 依存、react/react-dom は
`package.json` の直接依存）。**3 つの blocker は「直った」のではなく
「構造的に存在しなくなった」。**

---

## 3. backend — この repo には無い

`kotodama.jsonld` が指す `component.wasm` はこの repo に存在しない
（`find . -name '*.wasm'` は 0 件）。AGENTS.md が列挙する 10 個の MCP tool、
maps.etzhayyim.com との連携、ride lifecycle の実装はすべて `etzhayyim/root`
側に残っている。**フロントエンドの移行はこのギャップを埋めない**
（スコープ外 — 移行はフロントエンドのビルドツールチェーンだけを対象にした）。

---

## 4. `AGENTS.md` の "Smoke Test" は現在通らない（変化なし）

repo の `AGENTS.md` は以下を載せているが、**2026-08-14 時点でどちらも到達せず、
backend が無い以上 2026-08-26 時点でも変わらない**:

```bash
curl https://y83jjx4l.etzhayyim.com/health
curl -X POST https://y83jjx4l.etzhayyim.com/xrpc/.../EstimateFare ...
```

```console
$ curl -sS -m 20 -w 'http=%{http_code}\n' https://y83jjx4l.etzhayyim.com/health
curl: (6) Could not resolve host: y83jjx4l.etzhayyim.com
http=000
```

（2026-08-14 実測。DNS 状態を再確認していないので、値そのものは当時のまま
引用している——backend が無いという結論は変わらない。）

同じく AGENTS.md の "maps.etzhayyim.com Integration" 節が挙げる 3 つの API も、
backend が無いので現在は呼べない。**あの節は設計意図の記録であって、
現在の稼働状態の記述ではない。**

---

## 5. いま operator が実際にできること

| やりたいこと | 今日できるか |
|---|---|
| 仕様（ride lifecycle / MCP tool 名 / KV bucket）を読む | **できる** — `AGENTS.md` が正本 |
| フロントエンドを build する | **できる**（§2b） |
| フロントエンドの test を通す | **できる**（§2c） |
| e2e を通す | **仕様ごと撤去済み**（旧 Svelte/Playwright ツールチェーンの一部。backend が無いため実行対象も無かった） |
| 本番に deploy する | **できない** — `kotodama.jsonld` の `deploy` は `{}`、`component.wasm` も無い |

**この repo は現在「動くアプリ」ではなく「抜き出しの途中結果」である。**
そう扱う限り中身は正しい。backend が要る操作は今日もできない。

---

## 6. この文書の直し方

数値・ホスト・エラー文はすべて実測値である。**古くなったら測り直して上書きする**
（superproject AGENTS.md / ADR-2607257000: 文書は最新状態のみを表し、履歴は git が持つ）。
測っていないことをここに書かない。
