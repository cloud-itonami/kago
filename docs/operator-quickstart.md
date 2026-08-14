# kago — operator quickstart

**この文書の約束: ここに書いてある手順は、書いた時点で実際に実行した。**
成功した手順は成功した出力を、失敗した手順は失敗した出力を、そのまま載せている。
**踏めない手順は書いていない。**

最終実測: **2026-08-14**（commit `58029b5`、この repo の唯一の commit）。

---

## 0. 先に知っておくこと — この repo だけでは動かない

`kago` は `etzhayyim/root` の `60-apps/etzhayyim-project-kago` から抜き出された
（`migration.edn` に source revision `089210a0` / 23 files / 21,569 bytes と記録がある）。
**抜き出されたのは appview（Svelte フロントエンド）だけで、ride-hailing の実装本体は
この repo に無い。**

| 期待されるもの | この repo での実在 |
|---|---|
| `component.wasm`（`kotodama.jsonld` が `component.path` で指す本体） | **無い**（`find . -name '*.wasm'` が 0 件） |
| 10 個の MCP tool（`request_ride` / `driver_accept_ride` …、CLAUDE.md に一覧がある） | **無い**（backend 側の実装） |
| Svelte UI | **scaffold のみ**（`src/` 全体で 33 行。`App.svelte` は自分で "Vite entry scaffold after SvelteKit cleanup" と名乗る） |
| e2e 仕様（4 feature） | 在る。ただし**実行できない**（§4） |

したがって以下は「動かして確かめる」手順ではなく、
**どこまで進めて、どこで止まるかを再現する**手順である。

---

## 1. 前提ツール（実測した版）

```bash
node --version   # v26.3.0
npm --version    # 11.16.0
pnpm --version   # 10.26.2
```

これより古い版で試していない。

---

## 2. 依存の install — 素直にやると 2 通りとも失敗する

作業ディレクトリはここ:

```bash
cd appview/etzhayyim-wasm-kago-ride-y83jjx4l/svelte
```

### 2a. `npm install` → 失敗する

```console
$ npm install
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

`package.json` が `@etzhayyim/design-system` と
`@etzhayyim/vite-plugin-safe-builder` を `workspace:*` で参照している。
npm は `workspace:` プロトコルを解釈しない。

### 2b. `pnpm install` → 別の理由で失敗する

```console
$ pnpm install
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND  In : "@etzhayyim/vite-plugin-safe-builder@workspace:*"
is in the dependencies but no package named "@etzhayyim/vite-plugin-safe-builder"
is present in the workspace

Packages found in the workspace:
```

pnpm は `workspace:` を解釈するが、**参照先の package がこの repo に無い**
（"Packages found in the workspace:" の後ろが空であることに注意）。
2 つとも `etzhayyim/root` の `packages/ts/` に置いて行かれている。

### 2c. workspace 依存を外すと、今度は peer conflict が出る

**ここから先は `package.json` を書き換えた状態の話である**（repo をそのまま触るのでは
なく、使い捨ての複製で試すこと）。2 つの `workspace:*` 依存を落とす:

```bash
node -e '
const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));
for(const s of ["dependencies","devDependencies"])
  for(const k of Object.keys(p[s]||{}))
    if(String(p[s][k]).startsWith("workspace:")) delete p[s][k];
fs.writeFileSync("package.json",JSON.stringify(p,null,2));'
```

そのうえで `npm install` すると:

```console
npm error While resolving: etzhayyim-kago@0.0.1
npm error Found: vite@6.4.3
npm error Could not resolve dependency:
npm error peer vite@"^5.0.0" from @sveltejs/vite-plugin-svelte@4.0.4
```

これは workspace とは**独立した 2 つ目の破れ**である ——
`package.json` は `vite@^6.4.2` と `@sveltejs/vite-plugin-svelte@^4.0.4` を
同時に要求しているが、plugin v4 の peer は `vite@^5`。

### 2d. `--legacy-peer-deps` なら install だけは通る（**§2c を済ませた後だけ**）

```console
$ npm install --legacy-peer-deps
added 189 packages in 8s
```

⚠ **`--legacy-peer-deps` は §2a を回避しない。** 手を加えていない `package.json` に
そのまま付けても、peer 検査の手前で止まる:

```console
$ npm install --legacy-peer-deps      # ← workspace 依存を残したまま
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

つまり通るのは **§2c で workspace 依存を落とした複製に対してだけ**である。

**そしてこれは「直った」ではなく「peer 検査を黙らせた」である。** 次で壊れる。

---

## 3. build — ここで止まる

> ⚠ このワークスペースの規則により、build は resource governor 経由で起動する
> （superproject の CLAUDE.md「repo-wide resource governor」）。

```bash
node <superproject>/scripts/resource-guard.mjs run build -- npx vite build
```

実際の出力:

```console
vite v6.4.3 building for production...
transforming...
✓ 5 modules transformed.
✗ Build failed in 3.33s
error during build:
[vite:css] [postcss] Cannot find module '@etzhayyim/design-system/plugin'
Require stack:
- .../tailwind.config.js
```

**3 つ目の破れ。** `tailwind.config.js` の 1 行目が

```js
import { etzhayyimUIKit } from '@etzhayyim/design-system/plugin';
```

で、`plugins: [etzhayyimUIKit]` として使っている。
§2c で「使われていないから外せる」と読むのは誤りで、**design-system は本当に要る**
（`src/**` の import 文だけを見ると出てこない。config が `require` しているため）。

**そしてこれが build を止めている唯一の原因である。** 実測で確かめた ——
`node_modules/@etzhayyim/design-system/plugin` に空の plugin
（`export const etzhayyimUIKit = function(){}`）を置くだけで、build は最後まで通る:

```console
dist/index.html                 0.42 kB │ gzip: 0.28 kB
dist/assets/index-*.css         0.24 kB │ gzip: 0.21 kB
dist/assets/index-*.js          2.67 kB │ gzip: 1.32 kB
✓ built in 360ms
```

（出力がこれだけ小さいのは `App.svelte` が scaffold だからで、正常である。
この stub は**動作確認用であって修正ではない** —— 本物の plugin が持つ
`etzhayyimUIKit` の中身が無いので、design-system 由来のスタイルは出ない。）

### 3b. `tailwind.config.js` の `content` パスは外れている（build は止めない）

```js
content: [
  './src/**/*.{html,js,svelte,ts}',
  '../../../../../packages/ts/design-system/dist/**/*.{svelte,js}',   // ← 解決しない
]
```

この相対パスは **`etzhayyim/root` の中に居たときの深さ**で書かれており、この repo の
階層では何も指さない。**ただしこれは build を落とさない** —— 何にもマッチしない
content glob は Tailwind にとってエラーではないので、静かに
「design-system のクラスを 1 つも走査しない」状態になる。
§3 の blocker を潰した後に、**スタイルが当たらない**という形で出てくる。

---

## 4. e2e — 実行できない（対象ホストが存在しない）

```bash
npx bddgen && npx playwright test    # ← 走らせても全部落ちる
```

`playwright.config.ts` の `baseURL` は `https://kago.etzhayyim.com` が既定。
このホストは**存在しない**（2026-08-14 実測、public resolver 2 つで一致）:

```console
$ dig +short kago.etzhayyim.com @1.1.1.1     # → 空（NXDOMAIN）
$ dig +short kago.etzhayyim.com @8.8.8.8     # → 空（NXDOMAIN）
$ dig +short etzhayyim.com       @1.1.1.1     # → 104.21.51.111 172.67.179.128
```

apex の `etzhayyim.com` は生きているが、**service の subdomain は 3 つとも無い**:

| host | 2026-08-14 |
|---|---|
| `kago.etzhayyim.com` | NXDOMAIN |
| `y83jjx4l.etzhayyim.com` | NXDOMAIN |
| `maps.etzhayyim.com` | NXDOMAIN |

`BASE_URL` を差し替えれば playwright 自体は起動するが、
**向ける先の実装がこの repo に無い**（§0）ので、feature は満たされない。

---

## 5. `CLAUDE.md` の "Smoke Test" は現在通らない

repo の `CLAUDE.md` は以下を載せているが、**2026-08-14 時点でどちらも到達しない**
（§4 のとおり `y83jjx4l.etzhayyim.com` が NXDOMAIN）:

```bash
curl https://y83jjx4l.etzhayyim.com/health
curl -X POST https://y83jjx4l.etzhayyim.com/xrpc/.../EstimateFare ...
```

```console
$ curl -sS -m 20 -w 'http=%{http_code}\n' https://y83jjx4l.etzhayyim.com/health
curl: (6) Could not resolve host: y83jjx4l.etzhayyim.com
http=000
```

同じく CLAUDE.md の "maps.etzhayyim.com Integration" 節が挙げる 3 つの API も、
ホストが無いので現在は呼べない。**あの節は設計意図の記録であって、
現在の稼働状態の記述ではない。**

---

## 6. いま operator が実際にできること

| やりたいこと | 今日できるか |
|---|---|
| 仕様（ride lifecycle / MCP tool 名 / KV bucket）を読む | **できる** — `CLAUDE.md` と `e2e/features/*.feature` が正本 |
| appview を build する | **できない** — §3 の 3 blocker |
| e2e を通す | **できない** — §4、対象ホストと backend が無い |
| 本番に deploy する | **できない** — `kotodama.jsonld` の `deploy` は `{}`、`component.wasm` も無い |

**この repo は現在「動くアプリ」ではなく「抜き出しの途中結果」である。**
そう扱う限り中身は正しい。動くと期待して触ると 3 箇所で止まる。

---

## 7. build を通せるようにするには（未実施 — owner 判断が要る）

**実測した限り、build を通すのに要るのは 1 と 2 だけである**
（3 は build を止めないが、直さないとスタイルが当たらない）:

1. **`@etzhayyim/design-system` と `@etzhayyim/vite-plugin-safe-builder` の入手経路**
   を決める（`etzhayyim/root` から一緒に抜き出す / npm registry に publish する /
   tailwind plugin 依存を落とす、のいずれか）。**§3 の stub 実験のとおり、
   design-system さえ解決すれば build 自体は通る。**
   なお `@etzhayyim/vite-plugin-safe-builder` は `vite.config.ts` から参照されて
   おらず、宣言だけが残っている（外して build が通ることは §3 で確認済み）。
2. **`vite` と `@sveltejs/vite-plugin-svelte` の版を揃える**
   （plugin を v5 系に上げるか、vite を v5 に下げる）。今は
   `--legacy-peer-deps` で黙らせているだけで、解決していない。
3. **`tailwind.config.js` の `content` 相対パス**を、この repo の階層に合わせて直す
   （§3b。build は通るが、design-system のクラスが 1 つも生成されない）。

そのうえで **backend（`component.wasm`）を抜き出すのか、この repo を retire するのか**
は設計判断であり、この文書では決めない —— owner に上げる。

---

## 8. この文書の直し方

数値・ホスト・エラー文はすべて実測値である。**古くなったら測り直して上書きする**
（superproject CLAUDE.md / ADR-2607257000: 文書は最新状態のみを表し、履歴は git が持つ）。
測っていないことをここに書かない。
