# etzhayyim-project-kago

Uber-like ride-hailing platform (kago.etzhayyim.com). Integrated with maps.etzhayyim.com for spatial routing.

## Components

| Component | Folder | nanoid | 役割 |
|---|---|---|---|
| kago-ride | `etzhayyim-wasm-kago-ride-y83jjx4l` | y83jjx4l | Ride lifecycle, driver matching, fare, tracking |

## KV Buckets

| Bucket | Component | Store name in kotodama.jsonld |
|---|---|---|
| `kago-ride-state` | etzhayyim-wasm-kago-ride-y83jjx4l | `default` |

## maps.etzhayyim.com Integration

| 機能 | maps API | 用途 |
|---|---|---|
| Route calculation | `MapsUIService/RouteSave` | 乗車ルート計算・保存 |
| Location search | `MapsUIService/SearchResources` | 場所検索 (pickup/dropoff) |
| Runtime config | `MapsUIService/RuntimeConfig` | Map tile URL, style 取得 |

## MCP Tools (`/etzhayyim.kago.v1.KagoRideService`)

- `kago_ride.request_ride` — 配車リクエスト作成
- `kago_ride.cancel_ride` — 配車キャンセル
- `kago_ride.get_ride` — 配車ステータス取得
- `kago_ride.list_rides` — 配車一覧 (paginated)
- `kago_ride.driver_register` — ドライバー登録
- `kago_ride.driver_update_location` — ドライバー位置更新
- `kago_ride.driver_accept_ride` — ドライバーが配車を受諾
- `kago_ride.driver_complete_ride` — 乗車完了
- `kago_ride.estimate_fare` — 運賃見積もり
- `kago_ride.search_location` — 場所検索 (maps.etzhayyim.com proxy)

## API Endpoints

- kago-ride: `https://y83jjx4l.etzhayyim.com/xrpc`

## Ride States

```
requested → matched → driver_arriving → in_progress → completed
    ↓          ↓           ↓                ↓
 cancelled  cancelled   cancelled      cancelled
```

## Smoke Test

```bash
curl https://y83jjx4l.etzhayyim.com/health
curl -X POST https://y83jjx4l.etzhayyim.com/xrpc/etzhayyim.kago.v1.KagoRideService/EstimateFare \
  -H "Content-Type: application/json" \
  -d '{"pickup_lat":35.6812,"pickup_lng":139.7671,"dropoff_lat":35.6585,"dropoff_lng":139.7454}'
```
