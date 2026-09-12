import { useSyncExternalStore as e } from "react";
import { jsx as t, jsxs as n } from "react/jsx-runtime";
//#region src/react-bindings/use-application-store.ts
function r(t) {
	return e(t.subscribe, t.getSnapshot, t.getSnapshot);
}
//#endregion
//#region src/react-ui/BottomSheet.tsx
function i({ title: e, onClose: r, children: i, ariaLabel: a = e, closeLabel: o = "Close", backdropClassName: s, sheetClassName: c, headerClassName: l, closeButtonClassName: u }) {
	return /* @__PURE__ */ t("div", {
		className: s,
		role: "presentation",
		onMouseDown: (e) => {
			e.target === e.currentTarget && r();
		},
		children: /* @__PURE__ */ n("section", {
			className: c,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": a,
			children: [/* @__PURE__ */ n("header", {
				className: l,
				children: [/* @__PURE__ */ t("h2", { children: e }), /* @__PURE__ */ t("button", {
					className: u,
					type: "button",
					onClick: r,
					"aria-label": o,
					children: "×"
				})]
			}), i]
		})
	});
}
//#endregion
//#region src/react-ui/ProgressBar.tsx
function a({ value: e, label: n, className: r, fillClassName: i, style: a }) {
	let o = (Number.isFinite(e) ? Math.min(1, Math.max(0, e)) : 0) * 100;
	return /* @__PURE__ */ t("div", {
		className: r,
		role: "progressbar",
		"aria-label": n,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(o),
		style: a,
		children: /* @__PURE__ */ t("span", {
			className: i,
			style: { width: `${o}%` }
		})
	});
}
//#endregion
export { i as BottomSheet, a as ProgressBar, r as useApplicationStore };
