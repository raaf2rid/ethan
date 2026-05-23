#!/usr/bin/env node

/**
 * Minimal Notion bridge for OpenClaw tool calls.
 *
 * Usage:
 *   node notion-bridge.js search "keyword"
 *   node notion-bridge.js page <page_id>
 *   node notion-bridge.js db <database_id>
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION || "2022-06-28";

if (!NOTION_API_KEY) {
  console.error("Missing NOTION_API_KEY env var.");
  process.exit(1);
}

async function notion(path, method = "GET", body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(JSON.stringify({ status: res.status, error: data }, null, 2));
    process.exit(1);
  }
  return data;
}

function pickTitle(item) {
  if (!item || !item.properties) return item?.id || "untitled";
  for (const key of Object.keys(item.properties)) {
    const prop = item.properties[key];
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      return prop.title.map((t) => t?.plain_text || "").join("") || key;
    }
  }
  return item.id || "untitled";
}

async function cmdSearch(query) {
  const out = await notion("/search", "POST", {
    query,
    page_size: 10,
    sort: { direction: "descending", timestamp: "last_edited_time" },
  });

  const compact = (out.results || []).map((r) => ({
    id: r.id,
    object: r.object,
    title: r.object === "page" ? pickTitle(r) : (r.title?.[0]?.plain_text || r.id),
    url: r.url,
    last_edited_time: r.last_edited_time,
  }));

  console.log(JSON.stringify({ count: compact.length, results: compact }, null, 2));
}

async function cmdPage(pageId) {
  const page = await notion(`/pages/${pageId}`);
  const blocks = await notion(`/blocks/${pageId}/children?page_size=50`);

  const text = (blocks.results || [])
    .map((b) => {
      const rt = b[b.type]?.rich_text;
      if (!Array.isArray(rt)) return null;
      const line = rt.map((x) => x?.plain_text || "").join("");
      return line || null;
    })
    .filter(Boolean)
    .join("\n");

  console.log(
    JSON.stringify(
      {
        id: page.id,
        title: pickTitle(page),
        url: page.url,
        last_edited_time: page.last_edited_time,
        text_preview: text.slice(0, 4000),
      },
      null,
      2
    )
  );
}

async function cmdDb(databaseId) {
  const out = await notion(`/databases/${databaseId}/query`, "POST", {
    page_size: 10,
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });

  const rows = (out.results || []).map((r) => ({
    id: r.id,
    title: pickTitle(r),
    last_edited_time: r.last_edited_time,
    url: r.url,
  }));

  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "search") {
    const query = args.join(" ").trim();
    if (!query) throw new Error("Usage: search <query>");
    await cmdSearch(query);
    return;
  }

  if (command === "page") {
    const pageId = args[0];
    if (!pageId) throw new Error("Usage: page <page_id>");
    await cmdPage(pageId);
    return;
  }

  if (command === "db") {
    const databaseId = args[0];
    if (!databaseId) throw new Error("Usage: db <database_id>");
    await cmdDb(databaseId);
    return;
  }

  throw new Error("Usage: node notion-bridge.js <search|page|db> <arg>");
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
