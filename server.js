const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, ".data");
const FILE_STORE = path.join(DATA_DIR, "sync-store.json");
const SYNC_SECRET = process.env.SYNC_SECRET || "";
const DATABASE_URL = process.env.DATABASE_URL || "";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
};

let pgPool = null;

async function getPgPool() {
    if (!DATABASE_URL) return null;
    if (!pgPool) {
        const { Pool } = require("pg");
        pgPool = new Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
        });
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS app_sync (
                sync_key TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                updated_at BIGINT NOT NULL
            )
        `);
    }
    return pgPool;
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
            if (body.length > 5 * 1024 * 1024) {
                reject(new Error("Payload demasiado grande"));
                req.destroy();
            }
        });
        req.on("end", () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}

function sendJson(res, status, payload) {
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,PUT,OPTIONS",
        "access-control-allow-headers": "content-type,x-sync-secret"
    });
    res.end(JSON.stringify(payload));
}

function checkSecret(req, url) {
    if (!SYNC_SECRET) return true;
    const headerSecret = req.headers["x-sync-secret"];
    const querySecret = url.searchParams.get("secret");
    return headerSecret === SYNC_SECRET || querySecret === SYNC_SECRET;
}

function sanitizeKey(key) {
    return String(key || "default").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "default";
}

function readFileStore() {
    if (!fs.existsSync(FILE_STORE)) return {};
    try {
        return JSON.parse(fs.readFileSync(FILE_STORE, "utf8"));
    } catch {
        return {};
    }
}

function writeFileStore(store) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE_STORE, JSON.stringify(store, null, 2));
}

async function readSyncDoc(syncKey) {
    const pool = await getPgPool();
    if (pool) {
        const result = await pool.query("SELECT payload, updated_at FROM app_sync WHERE sync_key = $1", [syncKey]);
        if (!result.rows[0]) return { syncKey, updatedAt: 0, state: null };
        return {
            syncKey,
            updatedAt: Number(result.rows[0].updated_at) || 0,
            state: result.rows[0].payload
        };
    }

    const store = readFileStore();
    return store[syncKey] || { syncKey, updatedAt: 0, state: null };
}

async function writeSyncDoc(syncKey, state, updatedAt) {
    const safeUpdatedAt = Number(updatedAt) || Date.now();
    const pool = await getPgPool();
    if (pool) {
        await pool.query(
            `INSERT INTO app_sync (sync_key, payload, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (sync_key)
             DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
            [syncKey, state, safeUpdatedAt]
        );
        return { syncKey, updatedAt: safeUpdatedAt, state };
    }

    const store = readFileStore();
    store[syncKey] = { syncKey, updatedAt: safeUpdatedAt, state };
    writeFileStore(store);
    return store[syncKey];
}

async function handleApi(req, res, url) {
    if (req.method === "OPTIONS") {
        sendJson(res, 204, {});
        return;
    }

    if (url.pathname === "/api/health") {
        sendJson(res, 200, {
            ok: true,
            store: DATABASE_URL ? "postgres" : "file",
            time: new Date().toISOString()
        });
        return;
    }

    const match = url.pathname.match(/^\/api\/sync\/([^/]+)$/);
    if (!match) {
        sendJson(res, 404, { error: "Ruta API no encontrada" });
        return;
    }

    if (!checkSecret(req, url)) {
        sendJson(res, 401, { error: "SYNC_SECRET invalido" });
        return;
    }

    const syncKey = sanitizeKey(match[1]);

    if (req.method === "GET") {
        sendJson(res, 200, await readSyncDoc(syncKey));
        return;
    }

    if (req.method === "PUT") {
        const body = await readJsonBody(req);
        if (!body || typeof body.state !== "object") {
            sendJson(res, 400, { error: "Falta state" });
            return;
        }
        sendJson(res, 200, await writeSyncDoc(syncKey, body.state, body.updatedAt));
        return;
    }

    sendJson(res, 405, { error: "Metodo no permitido" });
}

function serveStatic(req, res, url) {
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = path.normalize(path.join(ROOT, pathname));

    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": ext === ".html" ? "no-store" : "public, max-age=60"
    });
    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    try {
        if (url.pathname.startsWith("/api/")) {
            await handleApi(req, res, url);
            return;
        }
        serveStatic(req, res, url);
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { error: "Error interno" });
    }
});

server.listen(PORT, () => {
    console.log(`App Fitness escuchando en http://localhost:${PORT}`);
});
