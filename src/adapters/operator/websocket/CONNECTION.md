# OCP WebSocket connection model (RAT step 06)

Legacy `useWs` uses **one** WebSocket per operator session.

Both `WebSocketOperatorPlatformGateway` and `WebSocketOcpSyncGateway` share a single
`OcpWebSocketTransport` instance created in `createRealAccountBootstrap` when
`bootstrapConfig.mode === "ocp"`.

SIP-only real mode (`?adapters=real` without `mode=ocp`) keeps
`MockOperatorPlatformGateway` and opens no OCP WebSocket.
