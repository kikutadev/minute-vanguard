//#region src/platform/cloudflare/public-player-directory-client.ts
var e = class extends Error {
	status;
	constructor(e, t) {
		super(t), this.name = "PublicPlayerDirectoryRequestError", this.status = e;
	}
}, t = class extends Error {
	constructor(e) {
		super(e), this.name = "PublicPlayerDirectoryProtocolError";
	}
}, n = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e.apiBaseUrl.replace(/\/+$/, ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async getPublicPlayer(e, n) {
		let r = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e)}/players/${encodeURIComponent(n)}`, { headers: { accept: "application/json" } });
		if (r.status === 404) return null;
		await i(r);
		let s = await r.json();
		if (!o(s) || !("player" in s)) throw new t("Expected a player response envelope.");
		return a(s.player);
	}
	async listPublicPlayers(e) {
		let n = r(e.limit), s = new URLSearchParams({ limit: String(n) });
		e.cursor !== void 0 && s.set("cursor", e.cursor);
		let c = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e.gameId)}/players?${s.toString()}`, { headers: { accept: "application/json" } });
		await i(c);
		let l = await c.json();
		if (!o(l) || !Array.isArray(l.players)) throw new t("Expected a public-player page response envelope.");
		let u = l.nextCursor;
		if (u !== null && typeof u != "string") throw new t("nextCursor must be a string or null.");
		return {
			players: l.players.map((e) => a(e)),
			nextCursor: u
		};
	}
};
function r(e) {
	return e === void 0 ? 20 : !Number.isInteger(e) || e < 1 ? 1 : Math.min(100, e);
}
async function i(t) {
	if (t.ok) return;
	let n = "";
	try {
		n = (await t.text()).trim();
	} catch {}
	throw new e(t.status, n === "" ? `Public player request failed with HTTP ${t.status}.` : n);
}
function a(e) {
	if (!o(e)) throw new t("Public player must be an object.");
	let { gameId: n, playerId: r, displayName: i, schemaVersion: a, revision: c, updatedAtMs: l } = e;
	if (typeof n != "string" || n.length === 0) throw new t("Invalid gameId.");
	if (typeof r != "string" || r.length === 0) throw new t("Invalid playerId.");
	if (typeof i != "string") throw new t("Invalid displayName.");
	if (!s(a)) throw new t("Invalid schemaVersion.");
	if (!s(c)) throw new t("Invalid revision.");
	if (typeof l != "number" || !Number.isFinite(l) || l < 0) throw new t("Invalid updatedAtMs.");
	if (!("data" in e)) throw new t("Missing public player data.");
	return {
		gameId: n,
		playerId: r,
		displayName: i,
		schemaVersion: a,
		revision: c,
		updatedAtMs: l,
		data: e.data
	};
}
function o(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function s(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 0;
}
//#endregion
export { n as CloudflarePublicPlayerDirectory, t as PublicPlayerDirectoryProtocolError, e as PublicPlayerDirectoryRequestError };
