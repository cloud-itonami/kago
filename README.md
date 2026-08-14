# kago

**kago（駕籠）は配車プラットフォームの appview である。** 名前は乗り物（人を乗せて
運ぶ籠）から採っており、機能を字面で示さないので、ここで名乗る。
canonical な識別子は `com-etzhayyim-app-kago`、host は `kago.etzhayyim.com` を想定。

> ⚠ **この repo は現在「動くアプリ」ではなく、抜き出しの途中結果である。**
> build は通らず、e2e は実行できず、documented なホストは存在しない。
> 何がどこで止まるかは **[docs/operator-quickstart.md](docs/operator-quickstart.md)**
> に実測値で書いてある。**触る前にそちらを読むこと。**

---

## 何が入っていて、何が入っていないか

`migration.edn` のとおり、この repo は `etzhayyim/root` の
`60-apps/etzhayyim-project-kago`（revision `089210a0`、23 files / 21,569 bytes）
から抜き出された。**抜き出されたのは appview だけである。**

| | 実在 | 置き場 |
|---|---|---|
| Svelte appview（**scaffold のみ**、`src/` 全体で 33 行） | ✅ | `appview/etzhayyim-wasm-kago-ride-y83jjx4l/svelte/` |
| e2e 仕様 4 feature（health / ride / driver / debug） | ✅ | `.../svelte/e2e/features/` |
| service manifest（route / trigger / KV / governance） | ✅ | `.../kotodama.jsonld` |
| 仕様の記述（ride lifecycle・MCP tool・API endpoint） | ✅ | `CLAUDE.md` |
| **ride-hailing の実装本体 `component.wasm`** | ❌ | `etzhayyim/root` に残っている |
| **`@etzhayyim/design-system` / `@etzhayyim/vite-plugin-safe-builder`** | ❌ | 同上（`packages/ts/`） |

`kotodama.jsonld` は `component.path: "component.wasm"` を宣言しているが、
**そのファイルはこの repo に無い。**

## 状態（2026-08-14 実測）

| 問い | 答え |
|---|---|
| `npm install` は通るか | **通らない**（`workspace:*` を解釈できない） |
| `pnpm install` は通るか | **通らない**（参照先 package がこの repo に無い） |
| build は通るか | **通らない**（tailwind config が design-system を要求する。ただし実測では**これが唯一の build blocker**で、plugin を解決すれば通る） |
| e2e は通るか | **実行できない**（`kago.etzhayyim.com` が NXDOMAIN） |
| `CLAUDE.md` の Smoke Test は通るか | **通らない**（`y83jjx4l.etzhayyim.com` が NXDOMAIN） |

install と build の blocker は独立している。再現手順・実測した出力・
「どれが本当に build を止めているか」は
[docs/operator-quickstart.md](docs/operator-quickstart.md) §2–§3 と §7。

## 読む順番

1. **[docs/operator-quickstart.md](docs/operator-quickstart.md)** — 実際に踏める手順と、止まる場所
2. `CLAUDE.md` — ride lifecycle・MCP tool 一覧・KV bucket・maps 連携の**設計意図**
   （⚠ 末尾の Smoke Test は現在到達しない。稼働状態の記述として読まない）
3. `appview/.../svelte/e2e/features/*.feature` — 期待される振る舞いの実行可能な記述
   （現在は実行できないが、仕様としては最も具体的）
4. `kotodama.jsonld` — route / trigger / KV / governance の宣言
5. `migration.edn` — どこから何が抜き出されたか

## この先の判断（owner 待ち）

**backend を抜き出してこの repo を完成させるのか、retire するのか**は設計判断であり、
まだ決まっていない。決まるまでは、この repo を「仕様の置き場」として読むのが正しい。

## メタデータ

- `README.edn` — 機械可読な repo 記述子（`etzhayyim.repository/v1`）
- `PROJECT.jsonld` — schema.org Project 記述
- `NOTICE` — 帰属表示
