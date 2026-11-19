# Stage 2 — Frontend vs services and shared contracts

Goal: the same React UI can call **remote** or **local** adapters without changing business operation names.

## Split

| Runs in browser / WebView | Needs a service (local or remote) |
| --- | --- |
| React layout, Canvas, admin screens | Workbench configuration (`/api` + MySQL) |
| AI prefs UI, artifact window chrome | LibreChat / model backends |
| Blockly / workspace UI (other repos) | Persistence, GEMs, auth |
| Payment checkout UI (`payment_gateway/web`) | Razorpay orders, webhooks, entitlements |

## Shared operation shape

Every PBMP operation should expose the same semantics across channels:

```ts
type PbmpResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string }

type PbmpCapability =
  | 'online'
  | 'local-rust'
  | 'local-python'
  | 'node-remote'
```

Example operations (names stable; adapters vary):

| Operation | Web adapter today | Desktop local later |
| --- | --- | --- |
| `GetWorkbenchConfig` | Express + MySQL | SQLite / local cache |
| `AnalyzeVideo` | Cloud / browser path | Rust + ONNX / Node Agent |
| `ChatAssistant` | LibreChat remote | OpenClaw local gateway |
| `CreatePaymentOrder` | `payment_gateway` billing | Same remote billing API |
| `GetMachineInfo` | N/A in browser | Tauri `system_info` |

## Channel detection

```ts
export function isPbmpDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
```

UI may show desktop-only controls when `isPbmpDesktop()` is true. Business screens stay shared.
