Integration Report — knockout_game (testnet)
Date: 2026-02-07

Summary
- Move package published (testnet): 0x73b82d04c7fbd7cac091dfeaddb04640f3851542e9c35779ae406330bfd07a08
- Performed full PTB integration flow on testnet: created match, created/joined with four 1000-SUI payments, finished match, payout sent.

Key objects
- Published package id: 0x73b82d04c7fbd7cac091dfeaddb04640f3851542e9c35779ae406330bfd07a08
- Match object id: 0x6403058e1d00db6bcacea3d3f02d6eb8194bc7a5b104efdabae4eff877a85a95
- Payment (1000 SUI) coin object ids created:
  - 0x5f0fc718f7f61af0e966f5232169c16d3901265f898ddb63c98bedca3b9424f8
  - 0xda2b7def77dbfc09d4d992582a612a7d17f09053f0c9c5657f2e80e3b2157d32
  - 0x0a802574ca1f766b8963aef511d44a1446a89fd4d853127fa02abc5091aedc52
  - 0x70096c63d7f3e056f0a2659f632a057c950b034600a0ae9429a96da4e2a0e8ac
- Payout coin (winner): 0x0672d57cd208b5732b1eeb2b168747da8f65f74d544580a369a23c51c8e5850c (balance 4000 SUI)
- Authority / acting address used: 0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9

Transaction digests (selected)
- create_match: 9x4ahzU2jccdH3AhxENAgNPqyGJkssDPDLXvFS5vEe9j
- created first 1000-SUI coin (transfer): 9yLUULJDkcT88dLSbsJePS7Dag4uum1QKvZqmVnMnyWg
- additional transfers / splits: huRwpXP4BVmRcNC5Ux8v2rpJdD64wAjkArNp8FaZE4w, 9b2xcR9EmGoAZo8bGdFDD6AZD9scURvH4KL3NVMxWsYr, DeBT7DaN3sRyLMfYBvZ6SZDsAyb8HJJGx5kQUVisnuws
- join_match tx digests (4 joins): BoEWDZi25VpPVpnzvcrErsHUyP5oNK4r8NQAxPEFsqSN, DnLApHxmqLiuF9TJT7PaCoh2nhd4qnhHdcwkELNSU7qf, DW38A6FoGZHpMuCnFg3segqksbwGuLyxqs5qy2vw7qJV, 39eUx5Y7Yz6SdmaWGDt3TopjcFgfFyfjnZtWr7pBrzBA
- finish_match: CCVwr7dZiPH9Y9qAWypbdN8bgE3pFu3xtaJdyYH4NQRb

Match state before finish
- started: true
- escrow: 4000

Match state after finish
- started: true
- settled: true
- escrow: 0

Notes / troubleshooting
- The testnet node enforces a minimum gas budget; some commands initially failed due to insufficient gas budget or lack of a separate gas coin. Workaround used: create 1000-SUI coins by `transfer-sui --sui-coin-object-id <large_coin> --amount 1000` with a high gas budget, generating separate coin objects, then used those coins for `join_match` calls.
- CLI errors encountered during experimentation: "Mutable object cannot appear more than one in one transaction" when attempting to use same mutable coin as both input and gas; "Cannot find gas coin" when no distinct coin had sufficient balance. These were resolved by ensuring a distinct gas coin or using `transfer-sui` to derive child coins.

Artifacts
- This report: backend/knockout_game/logs/integration_report_2026-02-07.md
- Captured CLI outputs and effects are in VS Code temp workspace storage (command history). If you want, I can save the full raw CLI outputs to files under `backend/knockout_game/logs/raw/`.

Next actions (suggested)
- Save full raw logs into `backend/knockout_game/logs/raw/` (I can do this). 
- Produce a zsh-safe automation script to reproduce the flow (recommended).
- Run session-cap PTB flow on testnet (mint -> play -> destroy) and log results.

If you want the raw logs saved and/or a reproducible script, tell me which and I'll add them to the `logs` folder.
