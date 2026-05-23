# Notion Integration Setup (OpenClaw)

## 1) Create Notion integration
1. Go to: https://www.notion.so/my-integrations
2. Create a new internal integration.
3. Copy the integration token.

## 2) Share content with the integration
Open each target Notion page/database:
- Click `Share`
- Invite your new integration

Without this, API calls return permission errors.

## 3) Set environment variables on VPS (admin user)
On your VPS where OpenClaw runs:

```bash
su - admin
nano ~/.openclaw/.env
```

Add:

```env
NOTION_API_KEY=secret_xxx
NOTION_VERSION=2022-06-28
```

Save and restart gateway:

```bash
openclaw gateway restart
```

## 4) Put bridge script in your OpenClaw workspace
Copy `notion-bridge.js` to the OpenClaw workspace used by your `main` agent, typically:
- `~/.openclaw/workspace/notion-bridge.js`

Make executable (optional):

```bash
chmod +x ~/.openclaw/workspace/notion-bridge.js
```

## 5) Test commands on VPS

```bash
cd ~/.openclaw/workspace
node notion-bridge.js search "project"
node notion-bridge.js page <page_id>
node notion-bridge.js db <database_id>
```

## 6) Tell OpenClaw how to use it
In your agent instructions/BOOTSTRAP, add a short rule such as:

- For Notion reads, run `node ~/.openclaw/workspace/notion-bridge.js search <query>` first.
- For page details, run `node ~/.openclaw/workspace/notion-bridge.js page <page_id>`.
- For database rows, run `node ~/.openclaw/workspace/notion-bridge.js db <database_id>`.

## Notes
- This starter is read-oriented (search/page/db query).
- For writes (create/update page), extend the script with `/v1/pages` and `/v1/blocks` endpoints.
- Never commit real `NOTION_API_KEY` values.
