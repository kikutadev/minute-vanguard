//#region src/platform/cloudflare/d1-public-player-directory.ts
var e = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	async getPublicPlayer(e, n) {
		let r = await this.#e.prepare("\n      SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n      FROM public_player_snapshots\n      WHERE game_id = ? AND player_id = ?\n    ").bind(e, n).first();
		return r === null ? null : t(r);
	}
	async listPublicPlayers(e) {
		let a = n(e.limit), o = i(e.cursor), s = [...(await (o === null ? this.#e.prepare("\n          SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n          FROM public_player_snapshots\n          WHERE game_id = ?\n          ORDER BY updated_at_ms DESC, player_id ASC\n          LIMIT ?\n        ").bind(e.gameId, a + 1) : this.#e.prepare("\n          SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n          FROM public_player_snapshots\n          WHERE game_id = ?\n            AND (updated_at_ms < ? OR (updated_at_ms = ? AND player_id > ?))\n          ORDER BY updated_at_ms DESC, player_id ASC\n          LIMIT ?\n        ").bind(e.gameId, o.updatedAtMs, o.updatedAtMs, o.playerId, a + 1)).all()).results ?? []], c = s.length > a, l = c ? s.slice(0, a) : s, u = l.at(-1);
		return {
			players: l.map((e) => t(e)),
			nextCursor: c && u !== void 0 ? r(u.updated_at_ms, u.player_id) : null
		};
	}
	async publishPublicPlayer(e) {
		await this.#e.prepare("\n      INSERT INTO public_player_snapshots (\n        game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n      ) VALUES (?, ?, ?, ?, ?, ?, ?)\n      ON CONFLICT(game_id, player_id) DO UPDATE SET\n        display_name = excluded.display_name,\n        schema_version = excluded.schema_version,\n        revision = excluded.revision,\n        updated_at_ms = excluded.updated_at_ms,\n        payload_json = excluded.payload_json\n      WHERE excluded.revision > public_player_snapshots.revision\n    ").bind(e.gameId, e.playerId, e.displayName, e.schemaVersion, e.revision, e.updatedAtMs, JSON.stringify(e.data)).run();
	}
};
function t(e) {
	let t;
	try {
		t = JSON.parse(e.payload_json);
	} catch {
		throw Error(`Invalid public player payload JSON for ${e.game_id}/${e.player_id}.`);
	}
	return {
		gameId: e.game_id,
		playerId: e.player_id,
		displayName: e.display_name,
		schemaVersion: e.schema_version,
		revision: e.revision,
		updatedAtMs: e.updated_at_ms,
		data: t
	};
}
function n(e) {
	return e === void 0 ? 20 : !Number.isInteger(e) || e < 1 ? 1 : Math.min(100, e);
}
function r(e, t) {
	return encodeURIComponent(JSON.stringify([e, t]));
}
function i(e) {
	if (e === void 0 || e === "") return null;
	try {
		let t = JSON.parse(decodeURIComponent(e));
		if (!Array.isArray(t) || t.length !== 2) throw Error("shape");
		let n = t[0], r = t[1];
		if (typeof n != "number" || !Number.isFinite(n) || n < 0 || typeof r != "string") throw Error("value");
		return {
			updatedAtMs: n,
			playerId: r
		};
	} catch {
		throw Error("Invalid public-player cursor.");
	}
}
//#endregion
//#region src/platform/cloudflare/public-player-directory-client.ts
var a = class extends Error {
	status;
	constructor(e, t) {
		super(t), this.name = "PublicPlayerDirectoryRequestError", this.status = e;
	}
}, o = class extends Error {
	constructor(e) {
		super(e), this.name = "PublicPlayerDirectoryProtocolError";
	}
}, s = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e.apiBaseUrl.replace(/\/+$/, ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async getPublicPlayer(e, t) {
		let n = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e)}/players/${encodeURIComponent(t)}`, { headers: { accept: "application/json" } });
		if (n.status === 404) return null;
		await l(n);
		let r = await n.json();
		if (!d(r) || !("player" in r)) throw new o("Expected a player response envelope.");
		return u(r.player);
	}
	async listPublicPlayers(e) {
		let t = c(e.limit), n = new URLSearchParams({ limit: String(t) });
		e.cursor !== void 0 && n.set("cursor", e.cursor);
		let r = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e.gameId)}/players?${n.toString()}`, { headers: { accept: "application/json" } });
		await l(r);
		let i = await r.json();
		if (!d(i) || !Array.isArray(i.players)) throw new o("Expected a public-player page response envelope.");
		let a = i.nextCursor;
		if (a !== null && typeof a != "string") throw new o("nextCursor must be a string or null.");
		return {
			players: i.players.map((e) => u(e)),
			nextCursor: a
		};
	}
};
function c(e) {
	return e === void 0 ? 20 : !Number.isInteger(e) || e < 1 ? 1 : Math.min(100, e);
}
async function l(e) {
	if (e.ok) return;
	let t = "";
	try {
		t = (await e.text()).trim();
	} catch {}
	throw new a(e.status, t === "" ? `Public player request failed with HTTP ${e.status}.` : t);
}
function u(e) {
	if (!d(e)) throw new o("Public player must be an object.");
	let { gameId: t, playerId: n, displayName: r, schemaVersion: i, revision: a, updatedAtMs: s } = e;
	if (typeof t != "string" || t.length === 0) throw new o("Invalid gameId.");
	if (typeof n != "string" || n.length === 0) throw new o("Invalid playerId.");
	if (typeof r != "string") throw new o("Invalid displayName.");
	if (!f(i)) throw new o("Invalid schemaVersion.");
	if (!f(a)) throw new o("Invalid revision.");
	if (typeof s != "number" || !Number.isFinite(s) || s < 0) throw new o("Invalid updatedAtMs.");
	if (!("data" in e)) throw new o("Missing public player data.");
	return {
		gameId: t,
		playerId: n,
		displayName: r,
		schemaVersion: i,
		revision: a,
		updatedAtMs: s,
		data: e.data
	};
}
function d(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function f(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 0;
}
//#endregion
//#region src/platform/cloudflare/public-player-directory-handler.ts
function p(e, t = {}) {
	let n = t.cacheControl ?? "public, max-age=15, stale-while-revalidate=45";
	return async (t) => {
		if (t.method !== "GET") return null;
		let r = new URL(t.url), i = r.pathname.split("/").filter(Boolean);
		if (i.length < 4 || i[0] !== "v1" || i[1] !== "games" || i[3] !== "players") return null;
		let a = decodeURIComponent(i[2] ?? "");
		if (a === "") return m({ error: "invalid-game-id" }, 400, n);
		if (i.length === 4) {
			let t = r.searchParams.get("limit"), i = t === null ? void 0 : Number(t), o = r.searchParams.get("cursor") ?? void 0;
			return m(await e.listPublicPlayers({
				gameId: a,
				...i === void 0 ? {} : { limit: i },
				...o === void 0 ? {} : { cursor: o }
			}), 200, n);
		}
		if (i.length === 5) {
			let t = decodeURIComponent(i[4] ?? "");
			if (t === "") return m({ error: "invalid-player-id" }, 400, n);
			let r = await e.getPublicPlayer(a, t);
			return r === null ? m({ error: "not-found" }, 404, n) : m({ player: r }, 200, n);
		}
		return null;
	};
}
function m(e, t, n) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": n,
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
export { s as CloudflarePublicPlayerDirectory, e as D1PublicPlayerDirectory, o as PublicPlayerDirectoryProtocolError, a as PublicPlayerDirectoryRequestError, p as createPublicPlayerDirectoryHandler };
