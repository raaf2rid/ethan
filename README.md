# OpenClaw Project Technical Runbook

## Scope
This document is for this specific project: your OpenClaw assistant running on a Contabo VPS (Ubuntu 24.04) and accessed from your local machine through SSH tunneling.

## Current Topology
- VPS host: Ubuntu 24.04 (Contabo)
- OpenClaw installed for user: `admin`
- Gateway mode: local loopback on `127.0.0.1:18789`
- Access pattern: SSH local port forward from your PC to VPS loopback
- Dashboard URL (local machine): `http://localhost:18789`

## Critical Rule: Correct User Context
OpenClaw config and auth are tied to `admin` on VPS.
- Use `root` only to login SSH if needed
- Immediately switch for OpenClaw ops:

```bash
su - admin
```

If commands are run as `root`, you can see auth/config mismatch errors.

## Daily Access Flow
### 1) Start tunnel on local machine
Keep this terminal open:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@144.91.76.206
```

### 2) Open dashboard locally

```text
http://localhost:18789
```

### 3) Authenticate
- If gateway is in password mode: enter password, token empty
- If gateway is in token mode: open URL with `#token=...` or paste token in Gateway Token

## Device Pairing Flow
If UI says `Device pairing required`:

```bash
# on VPS as admin
openclaw devices list
openclaw devices approve <request-id>
```

Then click `Connect` again.

## Gateway Operations
Run on VPS as `admin`:

```bash
openclaw gateway status
openclaw gateway restart
openclaw dashboard --no-open
```

## Known Failure Modes and Fixes
### 1) `unauthorized: gateway token missing`
Cause:
- wrong user context (`root` vs `admin`), or mismatched auth mode

Fix:
1. `su - admin`
2. `openclaw gateway restart`
3. Reconnect with correct auth (password or token)

### 2) Dashboard loads but won’t connect
Cause:
- stale browser state/token or pairing missing

Fix:
1. Hard refresh or Incognito
2. Re-approve device request
3. Retry connect

### 3) Tunnel appears stuck
Cause:
- normal behavior of `ssh -N` tunnel

Fix:
- Leave that terminal running; it should look idle

### 4) `openclaw: command not found` on local machine
Cause:
- command run on your PC instead of VPS

Fix:
- SSH into VPS first, then run OpenClaw commands there

## Security Posture (Current)
- Good: loopback-only gateway (not internet-exposed)
- Good: SSH tunnel access pattern
- Good: device pairing required
- Good: password auth available

Recommended next hardening:
1. Disable root-password SSH login; use SSH keys
2. Restrict SSH by IP if possible
3. Rotate any leaked API keys immediately
4. Keep OpenClaw and OS patched

## Project Environment Variables
Current local `.env` contains OpenRouter credential material.

Recommended format:

```env
OPENROUTER_API_KEY=<your_key_here>
```

Use uppercase standard key names and avoid custom one-off names unless intentionally mapped.

## Minimal Operating Checklist
Before working:
1. Tunnel is running
2. Logged in as `admin` for OpenClaw commands
3. `openclaw gateway status` is healthy

If broken:
1. `openclaw gateway restart`
2. Re-open dashboard
3. Approve device request
4. Retry connection

## Runbook Commands (Copy/Paste)
```bash
# VPS login
ssh root@144.91.76.206

# switch user
su - admin

# health
openclaw gateway status

# restart gateway
openclaw gateway restart

# get dashboard link
openclaw dashboard --no-open

# list and approve pending devices
openclaw devices list
openclaw devices approve <request-id>
```

---
This file is intentionally specific to this project and current deployment flow.
