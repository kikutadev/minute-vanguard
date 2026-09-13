//#region src/platform/web/browser-ad-adapter.ts
var e = class {
	#e;
	#t;
	#n;
	constructor(e = {}) {
		this.#e = e.resolveProvider ?? (() => typeof window > "u" ? void 0 : window.__IDLE_GAME_AD_PROVIDER__), this.#t = e.resolveBannerHost ?? t, this.#n = e.createRequestId ?? a;
	}
	async showBanner(e) {
		let t = this.#e();
		if (t === void 0) return "unavailable";
		let r = this.#t(e);
		try {
			let i = await t.showBanner({
				placementId: e,
				host: r
			});
			return i !== "shown" && i !== "unavailable" ? "error" : (n(r, i), i);
		} catch {
			return n(r, "error"), "error";
		}
	}
	async hideBanner(e) {
		let t = this.#e(), r = this.#t(e);
		try {
			await t?.hideBanner({
				placementId: e,
				host: r
			});
		} catch {} finally {
			n(r, "hidden");
		}
	}
	async showRewarded(e) {
		let t = this.#e();
		if (t === void 0) return { status: "unavailable" };
		try {
			let n = r(this.#n());
			if (n === null) return { status: "error" };
			let i = await t.showRewarded({
				offerId: e,
				requestId: n
			});
			if (i.status === "closed" || i.status === "unavailable") return i;
			if (i.status !== "reward-granted") return { status: "error" };
			let a = i.externalGrantId === void 0 ? n : r(i.externalGrantId);
			return a === null ? { status: "error" } : {
				status: "reward-granted",
				externalGrantId: a
			};
		} catch {
			return { status: "error" };
		}
	}
};
function t(e) {
	if (typeof document > "u") return null;
	let t = document.querySelectorAll("[data-ad-placement]");
	for (let n of t) if (n.dataset.adPlacement === e) return n;
	return null;
}
function n(e, t) {
	e !== null && (e.dataset.adState = t);
}
function r(e) {
	if (typeof e != "string") return null;
	let t = e.trim();
	return t.length === 0 || t.length > 256 ? null : t;
}
var i = 0;
function a() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? `client:${crypto.randomUUID()}` : (i += 1, `client:${Date.now()}:${i}`);
}
//#endregion
//#region src/platform/web/browser-purchase-provider.ts
var o = class {
	async loadProducts(e) {
		let t = s();
		if (t === null) return [];
		try {
			return (await t.loadProducts({ productIds: e })).filter(c);
		} catch {
			return [];
		}
	}
	async purchase(e) {
		let t = s();
		if (t === null) return { status: "unavailable" };
		try {
			let n = await t.purchase({ productId: e });
			return n.status === "purchased" ? l(n.transaction) && n.transaction.productId === e ? n : { status: "error" } : [
				"pending",
				"cancelled",
				"unavailable",
				"error"
			].includes(n.status) ? n : { status: "error" };
		} catch {
			return { status: "error" };
		}
	}
	async restore() {
		let e = s();
		if (e === null) return { status: "unavailable" };
		try {
			let t = await e.restore();
			return t.status === "restored" ? t.transactions.some((e) => !l(e)) ? { status: "error" } : t : t.status === "unavailable" || t.status === "error" ? t : { status: "error" };
		} catch {
			return { status: "error" };
		}
	}
	async finishTransaction(e) {
		let t = s();
		if (t === null) throw Error("Purchase provider unavailable.");
		await t.finishTransaction({ transactionId: e });
	}
};
function s() {
	return typeof window > "u" ? null : window.__IDLE_GAME_PURCHASE_PROVIDER__ ?? null;
}
function c(e) {
	return e.productId.trim().length > 0 && e.displayName.trim().length > 0 && e.priceText.trim().length > 0;
}
function l(e) {
	return e.transactionId.trim().length > 0 && e.transactionId.length <= 512 && e.productId.trim().length > 0 && e.productId.length <= 256;
}
//#endregion
//#region src/platform/web/fake-ad-adapter.ts
var u = class {
	#e;
	#t;
	#n = 0;
	#r = /* @__PURE__ */ new Set();
	constructor(e = {}) {
		this.#e = e.bannerAvailable ?? !0, this.#t = e.rewardedAvailable ?? !0;
	}
	showBanner(e) {
		return this.#e ? (this.#r.add(e), Promise.resolve("shown")) : Promise.resolve("unavailable");
	}
	hideBanner(e) {
		return this.#r.delete(e), Promise.resolve();
	}
	showRewarded(e) {
		return this.#t ? (this.#n += 1, Promise.resolve({
			status: "reward-granted",
			externalGrantId: `fake:${e}:${this.#n}`
		})) : Promise.resolve({ status: "unavailable" });
	}
	isBannerVisible(e) {
		return this.#r.has(e);
	}
}, d = class {
	#e;
	#t;
	#n;
	#r = /* @__PURE__ */ new Map();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	constructor(e) {
		this.#e = new Map(e.products.map((e) => [e.productId, e])), this.#t = e.available ?? !0, this.#n = e.purchaseOutcome ?? "purchased";
		for (let t of e.restoredTransactions ?? []) this.#r.set(t.transactionId, t);
	}
	loadProducts(e) {
		return this.#t ? Promise.resolve(e.flatMap((e) => {
			let t = this.#e.get(e);
			return t === void 0 ? [] : [t];
		})) : Promise.resolve([]);
	}
	purchase(e) {
		if (!this.#t || !this.#e.has(e)) return Promise.resolve({ status: "unavailable" });
		if (this.#n !== "purchased") return Promise.resolve({ status: this.#n });
		this.#a += 1;
		let t = {
			transactionId: `fake-purchase:${e}:${this.#a}`,
			productId: e
		};
		return this.#r.set(t.transactionId, t), Promise.resolve({
			status: "purchased",
			transaction: t
		});
	}
	restore() {
		return this.#t ? Promise.resolve({
			status: "restored",
			transactions: [...this.#r.values()]
		}) : Promise.resolve({ status: "unavailable" });
	}
	finishTransaction(e) {
		return this.#r.has(e) ? (this.#i.add(e), Promise.resolve()) : Promise.reject(/* @__PURE__ */ Error(`Unknown fake purchase transaction: ${e}`));
	}
	isTransactionFinished(e) {
		return this.#i.has(e);
	}
}, f = "profiles", p = class {
	#e;
	#t;
	#n;
	#r = null;
	constructor(e) {
		this.#e = e.dbName, this.#t = e.storeName ?? f, this.#n = e.indexedDb ?? indexedDB;
	}
	async load(e) {
		let t = await this.#i();
		return new Promise((n, r) => {
			let i = t.transaction(this.#t, "readonly").objectStore(this.#t).get(e);
			i.onsuccess = () => n(i.result ?? null), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB load failed."));
		});
	}
	async save(e) {
		let t = await this.#i();
		await new Promise((n, r) => {
			let i = t.transaction(this.#t, "readwrite");
			i.objectStore(this.#t).put(e, e.profileId), i.oncomplete = () => n(), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB save failed.")), i.onabort = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB save aborted."));
		});
	}
	async delete(e) {
		let t = await this.#i();
		await new Promise((n, r) => {
			let i = t.transaction(this.#t, "readwrite");
			i.objectStore(this.#t).delete(e), i.oncomplete = () => n(), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB delete failed.")), i.onabort = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB delete aborted."));
		});
	}
	#i() {
		return this.#r === null && (this.#r = new Promise((e, t) => {
			let n = this.#n.open(this.#e, 1);
			n.onupgradeneeded = () => {
				let e = n.result;
				e.objectStoreNames.contains(this.#t) || e.createObjectStore(this.#t);
			}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error ?? /* @__PURE__ */ Error("IndexedDB open failed."));
		})), this.#r;
	}
};
//#endregion
//#region src/platform/web/persistent-storage.ts
async function m(e = h()) {
	if (e?.persisted === void 0 || e.persist === void 0) return "unsupported";
	try {
		return await e.persisted() ? "already-persisted" : await e.persist() ? "granted" : "denied";
	} catch {
		return "error";
	}
}
function h() {
	if (!(typeof navigator > "u")) return navigator.storage;
}
//#endregion
//#region src/platform/web/service-worker.ts
function g(e, t) {
	let n = new URL(e, t);
	return new URL("sw.js", n).href;
}
async function _() {
	if (!("serviceWorker" in navigator)) return null;
	try {
		let e = g("/", document.baseURI), t = await navigator.serviceWorker.register(e);
		try {
			await t.update();
		} catch {}
		return t;
	} catch {
		return null;
	}
}
//#endregion
//#region src/platform/web/google-publisher-tag-provider.ts
var v = class {
	#e;
	#t;
	#n;
	#r;
	#i = /* @__PURE__ */ new Map();
	#a = null;
	#o = !1;
	#s = !1;
	#c = null;
	#l = 0;
	constructor(e, t = {}) {
		if (this.#e = e, this.#t = t.resolveRuntime ?? b, this.#n = t.bannerTimeoutMs ?? 15e3, this.#r = t.rewardedTimeoutMs ?? 3e4, !Number.isSafeInteger(this.#n) || this.#n <= 0) throw RangeError("bannerTimeoutMs must be a positive safe integer.");
		if (!Number.isSafeInteger(this.#r) || this.#r <= 0) throw RangeError("rewardedTimeoutMs must be a positive safe integer.");
	}
	async showBanner(e) {
		let t = this.#e.bannerPlacements?.[e.placementId];
		if (t === void 0 || e.host === null) return "unavailable";
		if (x(t.adUnitPath), t.sizes.length === 0) throw RangeError("GPT banner requires at least one size.");
		let n = this.#i.get(e.placementId);
		return n === void 0 ? this.#g((n) => {
			let r = S(e.host, () => `idle-game-ad-${++this.#l}`), i = n.defineSlot(t.adUnitPath, t.sizes, r);
			if (i === null) return Promise.resolve("unavailable");
			i.addService(n.pubads()), this.#u(n), this.#h(n);
			let a, o = new Promise((e) => {
				a = e;
			}), s = {
				slot: i,
				host: e.host,
				result: o,
				resolve: a,
				settled: !1,
				timeout: null
			};
			return s.timeout = setTimeout(() => {
				this.#i.get(e.placementId) !== s || s.settled || (this.#d(s, "unavailable"), this.#f(n, e.placementId, s));
			}, this.#n), this.#i.set(e.placementId, s), n.display(r), o;
		}, Promise.resolve("unavailable")) : n.result;
	}
	hideBanner(e) {
		let t = this.#i.get(e.placementId);
		if (t === void 0) return Promise.resolve();
		let n = this.#a ?? this.#t();
		return t.settled || this.#d(t, "unavailable"), n === void 0 ? (this.#i.delete(e.placementId), t.timeout !== null && clearTimeout(t.timeout), (t.host.isConnected || e.host === t.host) && t.host.replaceChildren()) : this.#f(n, e.placementId, t), Promise.resolve();
	}
	async showRewarded(e) {
		let t = this.#e.rewardedOffers?.[e.offerId];
		return t === void 0 || this.#c !== null ? { status: "unavailable" } : (x(t.adUnitPath), this.#g((e) => {
			let n = e.defineOutOfPageSlot(t.adUnitPath, e.enums.OutOfPageFormat.REWARDED);
			if (n === null) return Promise.resolve({ status: "unavailable" });
			n.addService(e.pubads()), this.#u(e), this.#h(e);
			let r = new Promise((t) => {
				let r = {
					slot: n,
					resolve: t,
					responseIdentifier: null,
					granted: !1,
					settled: !1,
					timeout: null
				};
				r.timeout = setTimeout(() => {
					this.#c !== r || r.settled || (this.#p(r, { status: "unavailable" }), this.#m(e, r));
				}, this.#r), this.#c = r;
			});
			return e.display(n), r;
		}, Promise.resolve({ status: "unavailable" })));
	}
	#u(e) {
		if (this.#o) return;
		this.#o = !0;
		let t = e.pubads();
		t.addEventListener("slotRenderEnded", (t) => {
			let n = [...this.#i.entries()].find(([, e]) => e.slot === t.slot);
			if (n !== void 0) {
				let [r, i] = n;
				t.isEmpty ? (this.#d(i, "unavailable"), this.#f(e, r, i)) : this.#d(i, "shown");
				return;
			}
			let r = this.#c;
			r !== null && t.slot === r.slot && (t.responseIdentifier !== null && t.responseIdentifier.trim().length > 0 && (r.responseIdentifier = t.responseIdentifier.trim()), t.isEmpty && (this.#p(r, { status: "unavailable" }), this.#m(e, r)));
		}), t.addEventListener("rewardedSlotReady", (e) => {
			let t = this.#c;
			t !== null && e.slot === t.slot && e.makeRewardedVisible();
		}), t.addEventListener("rewardedSlotGranted", (e) => {
			let t = this.#c;
			t !== null && e.slot === t.slot && (t.granted = !0, this.#p(t, t.responseIdentifier === null ? { status: "reward-granted" } : {
				status: "reward-granted",
				externalGrantId: `gpt:${t.responseIdentifier}`
			}));
		}), t.addEventListener("rewardedSlotClosed", (t) => {
			let n = this.#c;
			n !== null && t.slot === n.slot && (n.granted || this.#p(n, { status: "closed" }), this.#m(e, n));
		});
	}
	#d(e, t) {
		e.settled || (e.settled = !0, e.timeout !== null && (clearTimeout(e.timeout), e.timeout = null), e.resolve(t));
	}
	#f(e, t, n) {
		n.timeout !== null && clearTimeout(n.timeout), e.destroySlots([n.slot]), this.#i.get(t) === n && this.#i.delete(t), n.host.replaceChildren();
	}
	#p(e, t) {
		e.settled || (e.settled = !0, e.resolve(t));
	}
	#m(e, t) {
		t.timeout !== null && clearTimeout(t.timeout), e.destroySlots([t.slot]), this.#c === t && (this.#c = null);
	}
	#h(e) {
		this.#s ||= (e.enableServices(), !0);
	}
	async #g(e, t) {
		let n = this.#a ?? this.#t();
		return n === void 0 ? t : (this.#a = n, new Promise((t, r) => {
			n.cmd.push(() => {
				try {
					Promise.resolve(e(n)).then(t, r);
				} catch (e) {
					r(e instanceof Error ? e : Error(String(e)));
				}
			});
		}));
	}
};
function y(e, t = {}) {
	if (typeof window > "u") return null;
	let n = new v(e, t);
	return window.__IDLE_GAME_AD_PROVIDER__ = n, n;
}
function b() {
	if (!(typeof window > "u")) return window.googletag;
}
function x(e) {
	if (e.trim().length === 0) throw RangeError("GPT adUnitPath must not be empty.");
}
function S(e, t) {
	if (e.id.length > 0) return e.id;
	let n = t();
	return e.id = n, n;
}
//#endregion
//#region src/platform/web/public-asset-url.ts
function C(e, t = "/") {
	if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(e)) return e;
	let n = e.replace(/^\/+/, "");
	return `${t.length === 0 ? "./" : t.endsWith("/") ? t : `${t}/`}${n}`;
}
//#endregion
export { e as BrowserAdAdapter, o as BrowserNonConsumablePurchaseProvider, u as FakeAdAdapter, d as FakeNonConsumablePurchaseProvider, v as GooglePublisherTagProvider, p as IndexedDbProfileRepository, y as installGooglePublisherTagProvider, _ as registerServiceWorker, m as requestPersistentStorage, C as resolvePublicAssetUrl, g as resolveServiceWorkerScriptUrl };
