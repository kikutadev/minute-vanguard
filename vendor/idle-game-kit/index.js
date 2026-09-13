import { a as e, i as t, n, o as r, r as i, s as a, t as o } from "./purchases-CYzvMLE9.js";
//#region \0rolldown/runtime.js
var s = Object.create, c = Object.defineProperty, l = Object.getOwnPropertyDescriptor, u = Object.getOwnPropertyNames, d = Object.getPrototypeOf, f = Object.prototype.hasOwnProperty, p = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), ee = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = u(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !f.call(e, s) && s !== n && c(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = l(t, s)) || r.enumerable
	});
	return e;
}, m = /* @__PURE__ */ ((e, t, n) => (n = e == null ? {} : s(d(e)), ee(t || !e || !e.__esModule || !f.call(e, "default") ? c(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)))((/* @__PURE__ */ p(((e, t) => {
	t.exports = function(e, t, n) {
		if (e == null || t == null) return e;
		var r = String(e), i = typeof t == "number" ? t : parseInt(t, 10);
		if (isNaN(i) || !isFinite(i)) return r;
		var a = r.length;
		if (a >= i) return r;
		var o = n == null ? "" : String(n);
		o === "" && (o = " ");
		for (var s = i - a; o.length < s;) o += o;
		return r + (o.length > s ? o.substr(0, s) : o);
	};
})))()), h = 9e15, g = function() {
	for (var e = [], t = -323; t <= 308; t++) e.push(Number("1e" + t));
	return function(t) {
		return e[t + 323];
	};
}(), _ = function(e) {
	return e instanceof b ? e : new b(e);
}, v = function(e, t) {
	return new b().fromMantissaExponent(e, t);
}, y = function(e, t) {
	return new b().fromMantissaExponent_noNormalize(e, t);
};
function te(e, t, n, r) {
	var i = t.mul(n.pow(r));
	return b.floor(e.div(i).mul(n.sub(1)).add(1).log10() / n.log10());
}
function ne(e, t, n, r) {
	return t.mul(n.pow(r)).mul(b.sub(1, n.pow(e))).div(b.sub(1, n));
}
var b = function() {
	function e(t) {
		this.mantissa = NaN, this.exponent = NaN, t === void 0 ? (this.m = 0, this.e = 0) : t instanceof e ? this.fromDecimal(t) : typeof t == "number" ? this.fromNumber(t) : this.fromString(t);
	}
	return Object.defineProperty(e.prototype, "m", {
		get: function() {
			return this.mantissa;
		},
		set: function(e) {
			this.mantissa = e;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "e", {
		get: function() {
			return this.exponent;
		},
		set: function(e) {
			this.exponent = e;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "s", {
		get: function() {
			return this.sign();
		},
		set: function(e) {
			if (e === 0) return this.e = 0, void (this.m = 0);
			this.sgn() !== e && (this.m = -this.m);
		},
		enumerable: !1,
		configurable: !0
	}), e.fromMantissaExponent = function(t, n) {
		return new e().fromMantissaExponent(t, n);
	}, e.fromMantissaExponent_noNormalize = function(t, n) {
		return new e().fromMantissaExponent_noNormalize(t, n);
	}, e.fromDecimal = function(t) {
		return new e().fromDecimal(t);
	}, e.fromNumber = function(t) {
		return new e().fromNumber(t);
	}, e.fromString = function(t) {
		return new e().fromString(t);
	}, e.fromValue = function(t) {
		return new e().fromValue(t);
	}, e.fromValue_noAlloc = function(t) {
		return t instanceof e ? t : new e(t);
	}, e.abs = function(e) {
		return _(e).abs();
	}, e.neg = function(e) {
		return _(e).neg();
	}, e.negate = function(e) {
		return _(e).neg();
	}, e.negated = function(e) {
		return _(e).neg();
	}, e.sign = function(e) {
		return _(e).sign();
	}, e.sgn = function(e) {
		return _(e).sign();
	}, e.round = function(e) {
		return _(e).round();
	}, e.floor = function(e) {
		return _(e).floor();
	}, e.ceil = function(e) {
		return _(e).ceil();
	}, e.trunc = function(e) {
		return _(e).trunc();
	}, e.add = function(e, t) {
		return _(e).add(t);
	}, e.plus = function(e, t) {
		return _(e).add(t);
	}, e.sub = function(e, t) {
		return _(e).sub(t);
	}, e.subtract = function(e, t) {
		return _(e).sub(t);
	}, e.minus = function(e, t) {
		return _(e).sub(t);
	}, e.mul = function(e, t) {
		return _(e).mul(t);
	}, e.multiply = function(e, t) {
		return _(e).mul(t);
	}, e.times = function(e, t) {
		return _(e).mul(t);
	}, e.div = function(e, t) {
		return _(e).div(t);
	}, e.divide = function(e, t) {
		return _(e).div(t);
	}, e.recip = function(e) {
		return _(e).recip();
	}, e.reciprocal = function(e) {
		return _(e).recip();
	}, e.reciprocate = function(e) {
		return _(e).reciprocate();
	}, e.cmp = function(e, t) {
		return _(e).cmp(t);
	}, e.compare = function(e, t) {
		return _(e).cmp(t);
	}, e.eq = function(e, t) {
		return _(e).eq(t);
	}, e.equals = function(e, t) {
		return _(e).eq(t);
	}, e.neq = function(e, t) {
		return _(e).neq(t);
	}, e.notEquals = function(e, t) {
		return _(e).notEquals(t);
	}, e.lt = function(e, t) {
		return _(e).lt(t);
	}, e.lte = function(e, t) {
		return _(e).lte(t);
	}, e.gt = function(e, t) {
		return _(e).gt(t);
	}, e.gte = function(e, t) {
		return _(e).gte(t);
	}, e.max = function(e, t) {
		return _(e).max(t);
	}, e.min = function(e, t) {
		return _(e).min(t);
	}, e.clamp = function(e, t, n) {
		return _(e).clamp(t, n);
	}, e.clampMin = function(e, t) {
		return _(e).clampMin(t);
	}, e.clampMax = function(e, t) {
		return _(e).clampMax(t);
	}, e.cmp_tolerance = function(e, t, n) {
		return _(e).cmp_tolerance(t, n);
	}, e.compare_tolerance = function(e, t, n) {
		return _(e).cmp_tolerance(t, n);
	}, e.eq_tolerance = function(e, t, n) {
		return _(e).eq_tolerance(t, n);
	}, e.equals_tolerance = function(e, t, n) {
		return _(e).eq_tolerance(t, n);
	}, e.neq_tolerance = function(e, t, n) {
		return _(e).neq_tolerance(t, n);
	}, e.notEquals_tolerance = function(e, t, n) {
		return _(e).notEquals_tolerance(t, n);
	}, e.lt_tolerance = function(e, t, n) {
		return _(e).lt_tolerance(t, n);
	}, e.lte_tolerance = function(e, t, n) {
		return _(e).lte_tolerance(t, n);
	}, e.gt_tolerance = function(e, t, n) {
		return _(e).gt_tolerance(t, n);
	}, e.gte_tolerance = function(e, t, n) {
		return _(e).gte_tolerance(t, n);
	}, e.log10 = function(e) {
		return _(e).log10();
	}, e.absLog10 = function(e) {
		return _(e).absLog10();
	}, e.pLog10 = function(e) {
		return _(e).pLog10();
	}, e.log = function(e, t) {
		return _(e).log(t);
	}, e.log2 = function(e) {
		return _(e).log2();
	}, e.ln = function(e) {
		return _(e).ln();
	}, e.logarithm = function(e, t) {
		return _(e).logarithm(t);
	}, e.pow10 = function(e) {
		return Number.isInteger(e) ? y(1, e) : v(10 ** (e % 1), Math.trunc(e));
	}, e.pow = function(e, t) {
		return typeof e == "number" && e === 10 && typeof t == "number" && Number.isInteger(t) ? y(1, t) : _(e).pow(t);
	}, e.exp = function(e) {
		return _(e).exp();
	}, e.sqr = function(e) {
		return _(e).sqr();
	}, e.sqrt = function(e) {
		return _(e).sqrt();
	}, e.cube = function(e) {
		return _(e).cube();
	}, e.cbrt = function(e) {
		return _(e).cbrt();
	}, e.dp = function(e) {
		return _(e).dp();
	}, e.decimalPlaces = function(e) {
		return _(e).dp();
	}, e.affordGeometricSeries = function(e, t, n, r) {
		return te(_(e), _(t), _(n), r);
	}, e.sumGeometricSeries = function(e, t, n, r) {
		return ne(e, _(t), _(n), r);
	}, e.affordArithmeticSeries = function(e, t, n, r) {
		return function(e, t, n, r) {
			var i = t.add(r.mul(n)).sub(n.div(2)), a = i.pow(2);
			return i.neg().add(a.add(n.mul(e).mul(2)).sqrt()).div(n).floor();
		}(_(e), _(t), _(n), _(r));
	}, e.sumArithmeticSeries = function(e, t, n, r) {
		return function(e, t, n, r) {
			var i = t.add(r.mul(n));
			return e.div(2).mul(i.mul(2).plus(e.sub(1).mul(n)));
		}(_(e), _(t), _(n), _(r));
	}, e.efficiencyOfPurchase = function(e, t, n) {
		return function(e, t, n) {
			return e.div(t).add(e.div(n));
		}(_(e), _(t), _(n));
	}, e.randomDecimalForTesting = function(e) {
		if (20 * Math.random() < 1) return y(0, 0);
		var t = 10 * Math.random();
		10 * Math.random() < 1 && (t = Math.round(t)), t *= Math.sign(2 * Math.random() - 1);
		var n = Math.floor(Math.random() * e * 2) - e;
		return v(t, n);
	}, e.prototype.normalize = function() {
		if (this.m >= 1 && this.m < 10) return this;
		if (this.m === 0) return this.m = 0, this.e = 0, this;
		var e = Math.floor(Math.log10(Math.abs(this.m)));
		return this.m = e === -324 ? 10 * this.m / 1e-323 : this.m / g(e), this.e += e, this;
	}, e.prototype.fromMantissaExponent = function(e, t) {
		return isFinite(e) && isFinite(t) ? (this.m = e, this.e = t, this.normalize(), this) : (e = NaN, t = NaN, this);
	}, e.prototype.fromMantissaExponent_noNormalize = function(e, t) {
		return this.m = e, this.e = t, this;
	}, e.prototype.fromDecimal = function(e) {
		return this.m = e.m, this.e = e.e, this;
	}, e.prototype.fromNumber = function(e) {
		return isNaN(e) ? (this.m = NaN, this.e = NaN) : e === Infinity ? (this.m = 1, this.e = h) : e === -Infinity ? (this.m = -1, this.e = h) : e === 0 ? (this.m = 0, this.e = 0) : (this.e = Math.floor(Math.log10(Math.abs(e))), this.m = this.e === -324 ? 10 * e / 1e-323 : e / g(this.e), this.normalize()), this;
	}, e.prototype.fromString = function(e) {
		if (e.indexOf("e") !== -1) {
			var t = e.split("e");
			this.m = parseFloat(t[0]), this.e = parseFloat(t[1]), this.normalize();
		} else if (e === "NaN") this.m = NaN, this.e = NaN;
		else if (this.fromNumber(parseFloat(e)), isNaN(this.m)) throw Error("[DecimalError] Invalid argument: " + e);
		return this;
	}, e.prototype.fromValue = function(t) {
		return t instanceof e ? this.fromDecimal(t) : typeof t == "number" ? this.fromNumber(t) : typeof t == "string" ? this.fromString(t) : (this.m = 0, this.e = 0, this);
	}, e.prototype.toNumber = function() {
		if (!isFinite(this.e)) return NaN;
		if (this.e > 308) return this.m > 0 ? Infinity : -Infinity;
		if (this.e < -324) return 0;
		if (this.e === -324) return this.m > 0 ? 5e-324 : -5e-324;
		var e = this.m * g(this.e);
		if (!isFinite(e) || this.e < 0) return e;
		var t = Math.round(e);
		return Math.abs(t - e) < 1e-10 ? t : e;
	}, e.prototype.mantissaWithDecimalPlaces = function(e) {
		if (isNaN(this.m) || isNaN(this.e)) return NaN;
		if (this.m === 0) return 0;
		var t = e + 1, n = Math.ceil(Math.log10(Math.abs(this.m))), r = Math.round(this.m * 10 ** (t - n)) * 10 ** (n - t);
		return parseFloat(r.toFixed(Math.max(t - n, 0)));
	}, e.prototype.toString = function() {
		return isNaN(this.m) || isNaN(this.e) ? "NaN" : this.e >= h ? this.m > 0 ? "Infinity" : "-Infinity" : this.e <= -h || this.m === 0 ? "0" : this.e < 21 && this.e > -7 ? this.toNumber().toString() : this.m + "e" + (this.e >= 0 ? "+" : "") + this.e;
	}, e.prototype.toExponential = function(e) {
		if (isNaN(this.m) || isNaN(this.e)) return "NaN";
		if (this.e >= h) return this.m > 0 ? "Infinity" : "-Infinity";
		if (this.e <= -h || this.m === 0) return "0" + (e > 0 ? (0, m.default)(".", e + 1, "0") : "") + "e+0";
		if (this.e > -324 && this.e < 308) return this.toNumber().toExponential(e);
		isFinite(e) || (e = 17);
		var t = e + 1, n = Math.max(1, Math.ceil(Math.log10(Math.abs(this.m))));
		return (Math.round(this.m * 10 ** (t - n)) * 10 ** (n - t)).toFixed(Math.max(t - n, 0)) + "e" + (this.e >= 0 ? "+" : "") + this.e;
	}, e.prototype.toFixed = function(e) {
		return isNaN(this.m) || isNaN(this.e) ? "NaN" : this.e >= h ? this.m > 0 ? "Infinity" : "-Infinity" : this.e <= -h || this.m === 0 ? "0" + (e > 0 ? (0, m.default)(".", e + 1, "0") : "") : this.e >= 17 ? this.m.toString().replace(".", "").padEnd(this.e + 1, "0") + (e > 0 ? (0, m.default)(".", e + 1, "0") : "") : this.toNumber().toFixed(e);
	}, e.prototype.toPrecision = function(e) {
		return this.e <= -7 ? this.toExponential(e - 1) : e > this.e ? this.toFixed(e - this.e - 1) : this.toExponential(e - 1);
	}, e.prototype.valueOf = function() {
		return this.toString();
	}, e.prototype.toJSON = function() {
		return this.toString();
	}, e.prototype.toStringWithDecimalPlaces = function(e) {
		return this.toExponential(e);
	}, e.prototype.abs = function() {
		return y(Math.abs(this.m), this.e);
	}, e.prototype.neg = function() {
		return y(-this.m, this.e);
	}, e.prototype.negate = function() {
		return this.neg();
	}, e.prototype.negated = function() {
		return this.neg();
	}, e.prototype.sign = function() {
		return Math.sign(this.m);
	}, e.prototype.sgn = function() {
		return this.sign();
	}, e.prototype.round = function() {
		return this.e < -1 ? new e(0) : this.e < 17 ? new e(Math.round(this.toNumber())) : this;
	}, e.prototype.floor = function() {
		return this.e < -1 ? Math.sign(this.m) >= 0 ? new e(0) : new e(-1) : this.e < 17 ? new e(Math.floor(this.toNumber())) : this;
	}, e.prototype.ceil = function() {
		return this.e < -1 ? Math.sign(this.m) > 0 ? new e(1) : new e(0) : this.e < 17 ? new e(Math.ceil(this.toNumber())) : this;
	}, e.prototype.trunc = function() {
		return this.e < 0 ? new e(0) : this.e < 17 ? new e(Math.trunc(this.toNumber())) : this;
	}, e.prototype.add = function(e) {
		var t, n, r = _(e);
		return this.m === 0 ? r : r.m === 0 ? this : (this.e >= r.e ? (t = this, n = r) : (t = r, n = this), t.e - n.e > 17 ? t : v(Math.round(0x5af3107a4000 * t.m + 0x5af3107a4000 * n.m * g(n.e - t.e)), t.e - 14));
	}, e.prototype.plus = function(e) {
		return this.add(e);
	}, e.prototype.sub = function(e) {
		return this.add(_(e).neg());
	}, e.prototype.subtract = function(e) {
		return this.sub(e);
	}, e.prototype.minus = function(e) {
		return this.sub(e);
	}, e.prototype.mul = function(t) {
		if (typeof t == "number") return t < 1e307 && t > -1e307 ? v(this.m * t, this.e) : v(1e-307 * this.m * t, this.e + 307);
		var n = typeof t == "string" ? new e(t) : t;
		return v(this.m * n.m, this.e + n.e);
	}, e.prototype.multiply = function(e) {
		return this.mul(e);
	}, e.prototype.times = function(e) {
		return this.mul(e);
	}, e.prototype.div = function(e) {
		return this.mul(_(e).recip());
	}, e.prototype.divide = function(e) {
		return this.div(e);
	}, e.prototype.divideBy = function(e) {
		return this.div(e);
	}, e.prototype.dividedBy = function(e) {
		return this.div(e);
	}, e.prototype.recip = function() {
		return v(1 / this.m, -this.e);
	}, e.prototype.reciprocal = function() {
		return this.recip();
	}, e.prototype.reciprocate = function() {
		return this.recip();
	}, e.prototype.cmp = function(e) {
		var t = _(e);
		if (this.m === 0) {
			if (t.m === 0) return 0;
			if (t.m < 0) return 1;
			if (t.m > 0) return -1;
		}
		if (t.m === 0) {
			if (this.m < 0) return -1;
			if (this.m > 0) return 1;
		}
		if (this.m > 0) return t.m < 0 || this.e > t.e ? 1 : this.e < t.e ? -1 : this.m > t.m ? 1 : this.m < t.m ? -1 : 0;
		if (this.m < 0) return t.m > 0 || this.e > t.e ? -1 : this.e < t.e || this.m > t.m ? 1 : this.m < t.m ? -1 : 0;
		throw Error("Unreachable code");
	}, e.prototype.compare = function(e) {
		return this.cmp(e);
	}, e.prototype.eq = function(e) {
		var t = _(e);
		return this.e === t.e && this.m === t.m;
	}, e.prototype.equals = function(e) {
		return this.eq(e);
	}, e.prototype.neq = function(e) {
		return !this.eq(e);
	}, e.prototype.notEquals = function(e) {
		return this.neq(e);
	}, e.prototype.lt = function(e) {
		var t = _(e);
		return this.m === 0 ? t.m > 0 : t.m === 0 ? this.m <= 0 : this.e === t.e ? this.m < t.m : this.m > 0 ? t.m > 0 && this.e < t.e : t.m > 0 || this.e > t.e;
	}, e.prototype.lte = function(e) {
		return !this.gt(e);
	}, e.prototype.gt = function(e) {
		var t = _(e);
		return this.m === 0 ? t.m < 0 : t.m === 0 ? this.m > 0 : this.e === t.e ? this.m > t.m : this.m > 0 ? t.m < 0 || this.e > t.e : t.m < 0 && this.e < t.e;
	}, e.prototype.gte = function(e) {
		return !this.lt(e);
	}, e.prototype.max = function(e) {
		var t = _(e);
		return this.lt(t) ? t : this;
	}, e.prototype.min = function(e) {
		var t = _(e);
		return this.gt(t) ? t : this;
	}, e.prototype.clamp = function(e, t) {
		return this.max(e).min(t);
	}, e.prototype.clampMin = function(e) {
		return this.max(e);
	}, e.prototype.clampMax = function(e) {
		return this.min(e);
	}, e.prototype.cmp_tolerance = function(e, t) {
		var n = _(e);
		return this.eq_tolerance(n, t) ? 0 : this.cmp(n);
	}, e.prototype.compare_tolerance = function(e, t) {
		return this.cmp_tolerance(e, t);
	}, e.prototype.eq_tolerance = function(t, n) {
		var r = _(t);
		return e.lte(this.sub(r).abs(), e.max(this.abs(), r.abs()).mul(n));
	}, e.prototype.equals_tolerance = function(e, t) {
		return this.eq_tolerance(e, t);
	}, e.prototype.neq_tolerance = function(e, t) {
		return !this.eq_tolerance(e, t);
	}, e.prototype.notEquals_tolerance = function(e, t) {
		return this.neq_tolerance(e, t);
	}, e.prototype.lt_tolerance = function(e, t) {
		var n = _(e);
		return !this.eq_tolerance(n, t) && this.lt(n);
	}, e.prototype.lte_tolerance = function(e, t) {
		var n = _(e);
		return this.eq_tolerance(n, t) || this.lt(n);
	}, e.prototype.gt_tolerance = function(e, t) {
		var n = _(e);
		return !this.eq_tolerance(n, t) && this.gt(n);
	}, e.prototype.gte_tolerance = function(e, t) {
		var n = _(e);
		return this.eq_tolerance(n, t) || this.gt(n);
	}, e.prototype.log10 = function() {
		return this.e + Math.log10(this.m);
	}, e.prototype.absLog10 = function() {
		return this.e + Math.log10(Math.abs(this.m));
	}, e.prototype.pLog10 = function() {
		return this.m <= 0 || this.e < 0 ? 0 : this.log10();
	}, e.prototype.log = function(e) {
		return Math.LN10 / Math.log(e) * this.log10();
	}, e.prototype.log2 = function() {
		return 3.321928094887362 * this.log10();
	}, e.prototype.ln = function() {
		return 2.302585092994045 * this.log10();
	}, e.prototype.logarithm = function(e) {
		return this.log(e);
	}, e.prototype.pow = function(t) {
		var n, r = t instanceof e ? t.toNumber() : t, i = this.e * r;
		if (Number.isSafeInteger(i) && (n = this.m ** +r, isFinite(n) && n !== 0)) return v(n, i);
		var a = Math.trunc(i), o = i - a;
		if (n = 10 ** (r * Math.log10(this.m) + o), isFinite(n) && n !== 0) return v(n, a);
		var s = e.pow10(r * this.absLog10());
		return this.sign() === -1 ? Math.abs(r % 2) === 1 ? s.neg() : Math.abs(r % 2) === 0 ? s : new e(NaN) : s;
	}, e.prototype.pow_base = function(e) {
		return _(e).pow(this);
	}, e.prototype.factorial = function() {
		var t = this.toNumber() + 1;
		return e.pow(t / Math.E * Math.sqrt(t * Math.sinh(1 / t) + 1 / (810 * t ** 6)), t).mul(Math.sqrt(2 * Math.PI / t));
	}, e.prototype.exp = function() {
		var t = this.toNumber();
		return -706 < t && t < 709 ? e.fromNumber(Math.exp(t)) : e.pow(Math.E, t);
	}, e.prototype.sqr = function() {
		return v(this.m ** 2, 2 * this.e);
	}, e.prototype.sqrt = function() {
		return this.m < 0 ? new e(NaN) : this.e % 2 == 0 ? v(Math.sqrt(this.m), Math.floor(this.e / 2)) : v(3.16227766016838 * Math.sqrt(this.m), Math.floor(this.e / 2));
	}, e.prototype.cube = function() {
		return v(this.m ** 3, 3 * this.e);
	}, e.prototype.cbrt = function() {
		var e = 1, t = this.m;
		t < 0 && (e = -1, t = -t);
		var n = e * t ** (1 / 3), r = this.e % 3;
		return v(r === 1 || r === -1 ? 2.154434690031883 * n : r === 0 ? n : 4.641588833612778 * n, Math.floor(this.e / 3));
	}, e.prototype.sinh = function() {
		return this.exp().sub(this.negate().exp()).div(2);
	}, e.prototype.cosh = function() {
		return this.exp().add(this.negate().exp()).div(2);
	}, e.prototype.tanh = function() {
		return this.sinh().div(this.cosh());
	}, e.prototype.asinh = function() {
		return e.ln(this.add(this.sqr().add(1).sqrt()));
	}, e.prototype.acosh = function() {
		return e.ln(this.add(this.sqr().sub(1).sqrt()));
	}, e.prototype.atanh = function() {
		return this.abs().gte(1) ? NaN : e.ln(this.add(1).div(new e(1).sub(this))) / 2;
	}, e.prototype.ascensionPenalty = function(e) {
		return e === 0 ? this : this.pow(10 ** -e);
	}, e.prototype.egg = function() {
		return this.add(9);
	}, e.prototype.lessThanOrEqualTo = function(e) {
		return this.cmp(e) < 1;
	}, e.prototype.lessThan = function(e) {
		return this.cmp(e) < 0;
	}, e.prototype.greaterThanOrEqualTo = function(e) {
		return this.cmp(e) > -1;
	}, e.prototype.greaterThan = function(e) {
		return this.cmp(e) > 0;
	}, e.prototype.decimalPlaces = function() {
		return this.dp();
	}, e.prototype.dp = function() {
		if (!isFinite(this.mantissa)) return NaN;
		if (this.exponent >= 17) return 0;
		for (var e = this.mantissa, t = -this.exponent, n = 1; Math.abs(Math.round(e * n) / n - e) > 1e-10;) n *= 10, t++;
		return t > 0 ? t : 0;
	}, Object.defineProperty(e, "MAX_VALUE", {
		get: function() {
			return re;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "MIN_VALUE", {
		get: function() {
			return ie;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "NUMBER_MAX_VALUE", {
		get: function() {
			return ae;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "NUMBER_MIN_VALUE", {
		get: function() {
			return oe;
		},
		enumerable: !1,
		configurable: !0
	}), e;
}(), re = y(1, h), ie = y(1, -h), ae = _(Number.MAX_VALUE), oe = _(Number.MIN_VALUE), x = class e {
	#e;
	constructor(e) {
		if (!Number.isFinite(e.m) || !Number.isFinite(e.e)) throw RangeError("GameNumber cannot contain NaN or Infinity.");
		this.#e = e;
	}
	static zero() {
		return new e(b.fromNumber(0));
	}
	static one() {
		return new e(b.fromNumber(1));
	}
	static from(t) {
		return t instanceof e ? t : typeof t == "number" || typeof t == "string" ? new e(b.fromValue(t)) : e.deserialize(t);
	}
	static deserialize(t) {
		if (!Number.isFinite(t.mantissa) || !Number.isFinite(t.exponent)) throw RangeError("Serialized GameNumber must be finite.");
		return new e(b.fromMantissaExponent(t.mantissa, t.exponent));
	}
	add(t) {
		return new e(this.#e.add(e.decimalOf(t)));
	}
	subtract(t) {
		return new e(this.#e.sub(e.decimalOf(t)));
	}
	multiply(t) {
		return new e(this.#e.mul(e.decimalOf(t)));
	}
	divide(t) {
		let n = e.decimalOf(t);
		if (n.eq(0)) throw RangeError("Division by zero.");
		return new e(this.#e.div(n));
	}
	pow(t) {
		if (!Number.isFinite(t)) throw RangeError("GameNumber exponent must be finite.");
		return new e(this.#e.pow(t));
	}
	floor() {
		return new e(this.#e.floor());
	}
	ceil() {
		return new e(this.#e.ceil());
	}
	round() {
		return new e(this.#e.round());
	}
	compare(t) {
		return this.#e.cmp(e.decimalOf(t));
	}
	equals(e) {
		return this.compare(e) === 0;
	}
	greaterThanOrEqual(e) {
		return this.compare(e) >= 0;
	}
	greaterThan(e) {
		return this.compare(e) > 0;
	}
	lessThan(e) {
		return this.compare(e) < 0;
	}
	isNegative() {
		return this.compare(0) < 0;
	}
	isZero() {
		return this.compare(0) === 0;
	}
	log10() {
		return this.#e.log10();
	}
	toNumber() {
		return this.#e.toNumber();
	}
	serialize() {
		return Object.freeze({
			mantissa: this.#e.m,
			exponent: this.#e.e
		});
	}
	toString() {
		return this.#e.toString();
	}
	static decimalOf(t) {
		return t instanceof e ? b.fromMantissaExponent(t.#e.m, t.#e.e) : typeof t == "number" || typeof t == "string" ? b.fromValue(t) : b.fromMantissaExponent(t.mantissa, t.exponent);
	}
}, se = (e) => x.from(e);
//#endregion
//#region src/domain/curve/curve.ts
function S(e, t) {
	switch (me(t), e.type) {
		case "linear": return x.from(e.base).add(x.from(e.step).multiply(t));
		case "polynomial": return ce(e.coefficients, t);
		case "geometric":
			if (!(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric ratio must be finite and positive.");
			return x.from(e.base).multiply(x.from(e.ratio).pow(t));
		case "table": {
			let n = e.values[t];
			if (n === void 0) throw RangeError(`Curve table has no value at index ${t}.`);
			return x.from(n);
		}
		case "piecewise": {
			let n = de(e, t);
			return S(n.curve, t - n.startIndex);
		}
	}
}
function C(e, t, n) {
	if (me(t), he(n), ge(t, n), n === 0) return x.zero();
	if (e.type === "linear") {
		let r = S(e, t), i = S(e, t + n - 1);
		return r.add(i).multiply(n).divide(2);
	}
	if (e.type === "polynomial") return le(e.coefficients, t + n).subtract(le(e.coefficients, t));
	if (e.type === "geometric") {
		if (!(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric ratio must be finite and positive.");
		return e.ratio === 1 ? S(e, t).multiply(n) : S(e, t).multiply(x.from(e.ratio).pow(n).subtract(1)).divide(e.ratio - 1);
	}
	if (e.type === "piecewise") {
		pe(e.segments);
		let r = x.zero(), i = t, a = n;
		for (; a > 0;) {
			let t = fe(e.segments, i), n = e.segments[t], o = e.segments[t + 1]?.startIndex, s = o === void 0 ? a : Math.min(a, o - i);
			r = r.add(C(n.curve, i - n.startIndex, s)), i += s, a -= s;
		}
		return r;
	}
	let r = x.zero();
	for (let i = t; i < t + n; i += 1) r = r.add(S(e, i));
	return r;
}
function ce(e, t) {
	if (e.length === 0) throw RangeError("Polynomial curve must contain at least one coefficient.");
	let n = x.zero();
	for (let r = e.length - 1; r >= 0; --r) n = n.multiply(t).add(e[r]);
	return n;
}
function le(e, t) {
	if (me(t), e.length === 0) throw RangeError("Polynomial curve must contain at least one coefficient.");
	let n = [x.zero()], r = x.zero();
	for (let t = 0; t <= e.length - 1; t += 1) r = r.add(ce(e, t)), n.push(r);
	let i = n, a = x.zero();
	for (let e = 0; e < n.length; e += 1) a = a.add(i[0].multiply(ue(t, e))), i = i.slice(1).map((e, t) => e.subtract(i[t]));
	return a;
}
function ue(e, t) {
	if (t < 0 || t > e) return x.zero();
	let n = x.one();
	for (let r = 1; r <= t; r += 1) n = n.multiply(e - r + 1).divide(r);
	return n;
}
function de(e, t) {
	return pe(e.segments), e.segments[fe(e.segments, t)];
}
function fe(e, t) {
	let n = 0, r = e.length - 1;
	for (; n < r;) {
		let i = Math.ceil((n + r) / 2);
		e[i].startIndex <= t ? n = i : r = i - 1;
	}
	return n;
}
function pe(e) {
	if (e.length === 0 || e[0]?.startIndex !== 0) throw RangeError("Piecewise curve must start with segment index 0.");
	let t = -1;
	for (let n of e) {
		if (!Number.isSafeInteger(n.startIndex) || n.startIndex <= t) throw RangeError("Piecewise curve segment startIndex must be strictly increasing safe integers.");
		t = n.startIndex;
	}
}
function me(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Curve index must be a non-negative safe integer.");
}
function he(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Curve count must be a non-negative safe integer.");
}
function ge(e, t) {
	if (t > 2 ** 53 - 1 - e) throw RangeError("Curve interval end must remain a safe integer.");
}
//#endregion
//#region src/application/curve-purchase.ts
function _e(e) {
	ye(e.startIndex), ve(e.curve);
	let t = x.from(e.balance);
	if (t.isNegative()) throw RangeError("Purchase balance must be non-negative.");
	let n = e.curve.type === "table" ? Math.max(0, e.curve.values.length - e.startIndex) : 2 ** 53 - 1 - e.startIndex, r = e.maxCount === void 0 ? n : Math.min(be(e.maxCount), n);
	if (r === 0) return s(0);
	let i = (n) => C(e.curve, e.startIndex, n).compare(t) <= 0;
	if (!i(1)) return s(0);
	let a = 1, o = 1;
	for (; o < r;) {
		let e = Math.min(r, o * 2);
		if (!i(e)) {
			o = e;
			break;
		}
		a = e, o = e;
	}
	if (a < o) {
		let e = a + 1, t = o - 1;
		for (; e <= t;) {
			let n = e + Math.floor((t - e) / 2);
			i(n) ? (a = n, e = n + 1) : t = n - 1;
		}
	}
	return s(a);
	function s(n) {
		let i = C(e.curve, e.startIndex, n), a = n === r;
		return {
			count: n,
			totalCost: i,
			remainingBalance: t.subtract(i),
			nextUnitCost: a ? null : S(e.curve, e.startIndex + n),
			reachedLimit: a
		};
	}
}
function ve(e) {
	switch (e.type) {
		case "linear":
			w(e.base, "Linear purchase curve base"), w(e.step, "Linear purchase curve step");
			return;
		case "polynomial":
			if (e.coefficients.length === 0) throw RangeError("Polynomial purchase curve must contain coefficients.");
			e.coefficients.forEach((e, t) => w(e, `Polynomial purchase curve coefficient ${t}`));
			return;
		case "geometric":
			if (w(e.base, "Geometric purchase curve base"), !(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric purchase curve ratio must be positive and finite.");
			return;
		case "table":
			e.values.forEach((e, t) => w(e, `Table purchase curve value ${t}`));
			return;
		case "piecewise": {
			if (e.segments.length === 0 || e.segments[0]?.startIndex !== 0) throw RangeError("Piecewise purchase curve must start at index 0.");
			let t = -1;
			for (let n of e.segments) {
				if (!Number.isSafeInteger(n.startIndex) || n.startIndex <= t) throw RangeError("Piecewise purchase curve startIndex must be strictly increasing safe integers.");
				t = n.startIndex, ve(n.curve);
			}
		}
	}
}
function w(e, t) {
	if (x.from(e).isNegative()) throw RangeError(`${t} must be non-negative.`);
}
function ye(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Purchase startIndex must be a non-negative safe integer.");
}
function be(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Purchase maxCount must be a non-negative safe integer.");
	return e;
}
//#endregion
//#region src/application/engagement-cues.ts
function xe(e, t) {
	De(t);
	let n = /* @__PURE__ */ new Set(), r = e.filter((e) => {
		if (Te(e), n.has(e.id)) throw RangeError(`Duplicate attention candidate ID: ${e.id}`);
		return n.add(e.id), e.available && (e.expiresAtSimTimeSec === void 0 || e.expiresAtSimTimeSec > t);
	}).toSorted(Ce);
	return {
		items: r,
		primary: r[0] ?? null,
		count: r.length,
		actionableCount: r.filter((e) => e.urgency !== "notice").length,
		urgentCount: r.filter((e) => e.urgency === "urgent").length
	};
}
function Se(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		if (Ee(e), t.has(e.id)) throw RangeError(`Duplicate meaningful target ID: ${e.id}`);
		return t.add(e.id), e.available && e.progress < 1;
	}).toSorted((e, t) => t.priority - e.priority || t.progress - e.progress || e.id.localeCompare(t.id))[0] ?? null;
}
function Ce(e, t) {
	let n = we(t.urgency) - we(e.urgency);
	return n === 0 ? t.priority === e.priority ? (e.expiresAtSimTimeSec ?? Infinity) - (t.expiresAtSimTimeSec ?? Infinity) || e.id.localeCompare(t.id) : t.priority - e.priority : n;
}
function we(e) {
	switch (e) {
		case "notice": return 0;
		case "action": return 1;
		case "urgent": return 2;
	}
}
function Te(e) {
	if (e.id.length === 0) throw RangeError("Attention candidate ID must not be empty.");
	if (e.kind.length === 0) throw RangeError("Attention candidate kind must not be empty.");
	if (!Number.isFinite(e.priority)) throw RangeError(`Attention priority must be finite: ${e.id}`);
	if (e.expiresAtSimTimeSec !== void 0 && (!Number.isSafeInteger(e.expiresAtSimTimeSec) || e.expiresAtSimTimeSec < 0)) throw RangeError(`Attention expiry must be a non-negative safe integer: ${e.id}`);
}
function Ee(e) {
	if (e.id.length === 0) throw RangeError("Meaningful target ID must not be empty.");
	if (e.kind.length === 0) throw RangeError("Meaningful target kind must not be empty.");
	if (!Number.isFinite(e.priority)) throw RangeError(`Meaningful target priority must be finite: ${e.id}`);
	if (!Number.isFinite(e.progress) || e.progress < 0 || e.progress > 1) throw RangeError(`Meaningful target progress must be finite and in [0, 1]: ${e.id}`);
}
function De(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("simTimeSec must be a non-negative safe integer.");
}
//#endregion
//#region src/application/format-game-number.ts
var Oe = [
	"",
	"K",
	"M",
	"B",
	"T",
	"Qa",
	"Qi",
	"Sx",
	"Sp",
	"Oc",
	"No",
	"Dc"
];
function ke(e, t = 1) {
	if (e.isZero()) return "0";
	let n = e.serialize(), r = n.exponent;
	if (r < 3 && r > -4) return e.toNumber().toLocaleString("ja-JP", { maximumFractionDigits: t });
	let i = Math.floor(r / 3);
	return i > 0 && i < Oe.length ? `${(n.mantissa * 10 ** (r - i * 3)).toFixed(t).replace(/\.0+$/, "")}${Oe[i]}` : `${n.mantissa.toFixed(t)}e${n.exponent}`;
}
//#endregion
//#region src/application/offline-time.ts
function Ae(e, t, n = {}) {
	if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError("Offline wall clocks must be finite.");
	if (n.maxOfflineSec !== void 0 && (!Number.isSafeInteger(n.maxOfflineSec) || n.maxOfflineSec < 0)) throw RangeError("maxOfflineSec must be a non-negative safe integer.");
	let r = Math.max(0, t - e), i = Math.floor(r / 1e3), a = n.maxOfflineSec === void 0 ? i : Math.min(i, n.maxOfflineSec);
	return {
		observedElapsedSec: i,
		appliedElapsedSec: a,
		discardedByCapSec: i - a,
		nextWallClockMs: e + i * 1e3
	};
}
//#endregion
//#region src/application/offline-return-summary.ts
function je(e) {
	let t = e.minimumObservedElapsedSec ?? 0;
	if (!Number.isSafeInteger(t) || t < 0) throw RangeError("minimumObservedElapsedSec must be a non-negative safe integer.");
	return Me(e.elapsed), !e.meaningfulChange || e.elapsed.observedElapsedSec < t || e.elapsed.appliedElapsedSec === 0 ? null : {
		elapsed: e.elapsed,
		gains: e.gains ?? [],
		progressionChanges: e.progressionChanges ?? [],
		rewardSignals: e.rewardSignals ?? [],
		nextTarget: e.nextTarget ?? null
	};
}
function Me(e) {
	for (let [t, n] of [
		["observedElapsedSec", e.observedElapsedSec],
		["appliedElapsedSec", e.appliedElapsedSec],
		["discardedByCapSec", e.discardedByCapSec]
	]) if (!Number.isSafeInteger(n) || n < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
	if (!Number.isFinite(e.nextWallClockMs)) throw RangeError("nextWallClockMs must be finite.");
	if (e.appliedElapsedSec > e.observedElapsedSec) throw RangeError("appliedElapsedSec must not exceed observedElapsedSec.");
	if (e.discardedByCapSec !== e.observedElapsedSec - e.appliedElapsedSec) throw RangeError("discardedByCapSec must match observed minus applied elapsed time.");
}
//#endregion
//#region src/application/reward-signals.ts
function Ne(e, t) {
	let n = [];
	for (let r of e) {
		let e = t(r);
		e != null && (Pe(e) ? n.push(...e) : n.push(e));
	}
	let r = /* @__PURE__ */ new Set();
	for (let e of n) {
		if (Fe(e), r.has(e.id)) throw RangeError(`Duplicate reward signal ID: ${e.id}`);
		r.add(e.id);
	}
	return n.toSorted((e, t) => e.simTimeSec - t.simTimeSec || e.id.localeCompare(t.id));
}
function Pe(e) {
	return Array.isArray(e);
}
function Fe(e) {
	if (e.id.length === 0) throw RangeError("Reward signal ID must not be empty.");
	if (!Number.isSafeInteger(e.simTimeSec) || e.simTimeSec < 0) throw RangeError(`Reward signal simTimeSec must be a non-negative safe integer: ${e.id}`);
	if (![
		"micro",
		"meaningful",
		"major"
	].includes(e.tier)) throw RangeError(`Unknown reward signal tier: ${e.id}`);
	if (typeof e.surprise != "boolean" || typeof e.nextExpectationCreated != "boolean") throw RangeError(`Reward signal flags must be boolean: ${e.id}`);
	if (e.anticipationKey !== void 0 && e.anticipationKey.length === 0) throw RangeError(`Reward signal anticipationKey must not be empty: ${e.id}`);
}
//#endregion
//#region src/application/rewarded-ad-flow.ts
async function Ie(e) {
	let t;
	try {
		t = await e.adapter.showRewarded(e.offerId);
	} catch {
		return "error";
	}
	if (t.status !== "reward-granted") return t.status;
	try {
		return await e.grantReward(t.externalGrantId) ? "granted" : "rejected";
	} catch {
		return "error";
	}
}
//#endregion
//#region src/application/state-migration.ts
function Le(e) {
	if (Re(e.currentSchemaVersion), ze(e.migrations ?? []), !Be(e.candidate)) return {
		accepted: !1,
		reason: "not-object"
	};
	if (e.candidate.gameId !== e.expectedGameId) return {
		accepted: !1,
		reason: "wrong-game"
	};
	if (!T(e.candidate.schemaVersion)) return {
		accepted: !1,
		reason: "invalid-schema-version"
	};
	let t = e.candidate.schemaVersion;
	if (t > e.currentSchemaVersion) return {
		accepted: !1,
		reason: "newer-schema",
		schemaVersion: t
	};
	let n = new Map((e.migrations ?? []).map((e) => [e.fromSchemaVersion, e])), r = e.candidate, i = t, a = 0;
	for (; i < e.currentSchemaVersion;) {
		let t = n.get(i);
		if (t === void 0) return {
			accepted: !1,
			reason: "missing-migration",
			schemaVersion: i
		};
		let o;
		try {
			o = t.migrate(r);
		} catch {
			return {
				accepted: !1,
				reason: "migration-failed",
				schemaVersion: i,
				failedFromSchemaVersion: i
			};
		}
		if (!Be(o) || o.gameId !== e.expectedGameId || o.schemaVersion !== t.toSchemaVersion) return {
			accepted: !1,
			reason: "migration-failed",
			schemaVersion: i,
			failedFromSchemaVersion: i
		};
		r = o, i = t.toSchemaVersion, a += 1;
	}
	let o = !1;
	if (e.normalize !== void 0) try {
		let t = e.normalize(r);
		o = t !== r, r = t;
	} catch {
		return {
			accepted: !1,
			reason: "normalization-failed",
			schemaVersion: i
		};
	}
	return !Be(r) || r.gameId !== e.expectedGameId || r.schemaVersion !== e.currentSchemaVersion || !e.validate(r) ? {
		accepted: !1,
		reason: "invalid-state",
		schemaVersion: i
	} : {
		accepted: !0,
		state: r,
		initialSchemaVersion: t,
		finalSchemaVersion: e.currentSchemaVersion,
		migrationCount: a,
		normalized: o
	};
}
function Re(e) {
	if (!T(e)) throw RangeError("currentSchemaVersion must be a non-negative safe integer.");
}
function ze(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		if (!T(n.fromSchemaVersion) || !T(n.toSchemaVersion)) throw RangeError("State migration versions must be non-negative safe integers.");
		if (n.toSchemaVersion <= n.fromSchemaVersion) throw RangeError("State migration must advance schemaVersion.");
		if (t.has(n.fromSchemaVersion)) throw RangeError(`Duplicate state migration from schemaVersion ${n.fromSchemaVersion}.`);
		t.add(n.fromSchemaVersion);
	}
}
function T(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function Be(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/application/save-transfer.ts
var Ve = "idle-game-kit-save-v1";
function He(e, t) {
	let n = {
		formatId: Ve,
		gameId: e.gameId,
		exportedAtMs: t,
		state: e
	};
	return JSON.stringify(n, null, 2);
}
function Ue(e, t) {
	let n;
	try {
		n = JSON.parse(e);
	} catch {
		return {
			accepted: !1,
			reason: "invalid-json"
		};
	}
	return !Ke(n) || n.formatId !== "idle-game-kit-save-v1" || typeof n.gameId != "string" || typeof n.exportedAtMs != "number" || !Number.isFinite(n.exportedAtMs) || !("state" in n) ? {
		accepted: !1,
		reason: "invalid-envelope"
	} : n.gameId === t ? {
		accepted: !0,
		envelope: {
			formatId: Ve,
			gameId: n.gameId,
			exportedAtMs: n.exportedAtMs,
			state: n.state
		}
	} : {
		accepted: !1,
		reason: "wrong-game"
	};
}
function We(e, t, n) {
	let r = Ue(e, t);
	return r.accepted ? n(r.envelope.state) ? {
		accepted: !0,
		envelope: {
			...r.envelope,
			state: r.envelope.state
		}
	} : {
		accepted: !1,
		reason: "invalid-state"
	} : r;
}
function Ge(e) {
	let t = Ue(e.text, e.expectedGameId);
	if (!t.accepted) return t;
	let n = Le({
		candidate: t.envelope.state,
		expectedGameId: e.expectedGameId,
		currentSchemaVersion: e.currentSchemaVersion,
		...e.migrations === void 0 ? {} : { migrations: e.migrations },
		...e.normalize === void 0 ? {} : { normalize: e.normalize },
		validate: e.validate
	});
	return n.accepted ? {
		accepted: !0,
		envelope: {
			...t.envelope,
			state: n.state
		},
		stateLoad: n
	} : {
		accepted: !1,
		reason: "invalid-state",
		stateLoad: n
	};
}
function Ke(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/application/store.ts
var qe = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	getSnapshot = () => this.#e;
	subscribe = (e) => (this.#t.add(e), () => this.#t.delete(e));
	replaceState(e) {
		if (!Object.is(e, this.#e)) {
			this.#e = e;
			for (let e of this.#t) e();
		}
	}
	update(e) {
		this.replaceState(e(this.#e));
	}
};
//#endregion
//#region src/application/timeline-boundary.ts
function Je(e) {
	if (Ye("currentSimTimeSec", e.currentSimTimeSec), Ye("targetSimTimeSec", e.targetSimTimeSec), e.targetSimTimeSec < e.currentSimTimeSec) throw RangeError("targetSimTimeSec must be at or after currentSimTimeSec.");
	if (e.targetSimTimeSec === e.currentSimTimeSec) return {
		targetSimTimeSec: e.targetSimTimeSec,
		boundaries: []
	};
	let t = /* @__PURE__ */ new Set(), n = [];
	if (e.candidates.forEach((r, i) => {
		if (r != null) {
			if (r.id.length === 0) throw RangeError("Timeline boundary id must not be empty.");
			if (t.has(r.id)) throw RangeError(`Duplicate timeline boundary id: ${r.id}`);
			if (t.add(r.id), Ye(`timeline boundary ${r.id}`, r.atSimTimeSec), r.order !== void 0 && !Number.isSafeInteger(r.order)) throw RangeError(`Timeline boundary ${r.id} order must be a safe integer.`);
			if (r.atSimTimeSec <= e.currentSimTimeSec) throw RangeError(`Timeline boundary ${r.id} must be after currentSimTimeSec to guarantee progress.`);
			r.atSimTimeSec <= e.targetSimTimeSec && n.push({
				candidate: r,
				inputOrder: i
			});
		}
	}), n.length === 0) return {
		targetSimTimeSec: e.targetSimTimeSec,
		boundaries: []
	};
	let r = Math.min(...n.map(({ candidate: e }) => e.atSimTimeSec));
	return {
		targetSimTimeSec: r,
		boundaries: n.filter(({ candidate: e }) => e.atSimTimeSec === r).sort((e, t) => (e.candidate.order ?? 0) - (t.candidate.order ?? 0) || e.inputOrder - t.inputOrder).map(({ candidate: e }) => e)
	};
}
function Ye(e, t) {
	if (!Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite non-negative number.`);
}
//#endregion
//#region src/domain/condition/condition.ts
function E(e, t) {
	switch (e.type) {
		case "and": return e.conditions.every((e) => E(e, t));
		case "or": return e.conditions.some((e) => E(e, t));
		case "not": return !E(e.condition, t);
		case "currency-balance-at-least": return t.currencyBalance(e.currencyId).greaterThanOrEqual(e.amount);
		case "lifetime-currency-earned-at-least": return t.lifetimeCurrencyEarned(e.currencyId).greaterThanOrEqual(e.amount);
		case "producer-count-at-least": return t.producerCount(e.producerId) >= e.count;
		case "producer-level-at-least": return D(t.producerLevel, "producerLevel")(e.producerId) >= e.level;
		case "character-owned": return t.characterOwned(e.characterDefinitionId);
		case "character-level-at-least": return D(t.characterLevel, "characterLevel")(e.characterDefinitionId) >= e.level;
		case "activity-progress-at-least": return t.activityProgress(e.activityId) >= e.progress;
		case "activity-milestone-reached": return D(t.activityMilestoneReached, "activityMilestoneReached")(e.activityId, e.milestoneId);
		case "achievement-completed": return t.achievementCompleted(e.achievementId);
		case "prestige-count-at-least": return D(t.prestigeCount, "prestigeCount")(e.prestigeId) >= e.count;
		case "gacha-draw-count-at-least": return D(t.gachaDrawCount, "gachaDrawCount")(e.gachaId) >= e.count;
		case "calendar-streak-at-least": return D(t.calendarStreak, "calendarStreak")(e.calendarRewardId) >= e.count;
		case "unlock-flag": return t.unlockFlag(e.flagId);
	}
}
function D(e, t) {
	if (e === void 0) throw Error(`ConditionContext.${t} is required for this predicate.`);
	return e;
}
//#endregion
//#region src/domain/achievement/achievement.ts
function Xe(e, t, n) {
	let r = e.achievements[t.id] === !0;
	return {
		id: t.id,
		completed: r,
		visible: t.hidden !== !0 || r,
		progress: t.progressMetric === void 0 ? null : r ? 1 : Ze(t.progressMetric, n)
	};
}
function Ze(e, t) {
	switch (e.type) {
		case "currency-balance": return $e(t.currencyBalance(e.currencyId), e.target);
		case "lifetime-currency-earned": return $e(t.lifetimeCurrencyEarned(e.currencyId), e.target);
		case "producer-count": return O(t.producerCount(e.producerId), e.target);
		case "producer-level": return O(k(t.producerLevel, "producerLevel")(e.producerId), e.target);
		case "character-level": return O(k(t.characterLevel, "characterLevel")(e.characterDefinitionId), e.target);
		case "activity-progress": return O(t.activityProgress(e.activityId), e.target);
		case "gacha-draw-count": return O(k(t.gachaDrawCount, "gachaDrawCount")(e.gachaId), e.target);
		case "prestige-count": return O(k(t.prestigeCount, "prestigeCount")(e.prestigeId), e.target);
		case "calendar-streak": return O(k(t.calendarStreak, "calendarStreak")(e.calendarRewardId), e.target);
	}
}
function Qe(e) {
	let t = e.state, n = [];
	for (let r of e.definitions) t.achievements[r.id] !== !0 && E(r.condition, e.createConditionContext(t)) && (t = {
		...t,
		achievements: {
			...t.achievements,
			[r.id]: !0
		}
	}, t = e.grantRewards(t, r.rewards), n.push({
		id: `achievement:${r.id}:${t.simTimeSec}`,
		type: "achievementCompleted",
		simTimeSec: t.simTimeSec,
		payload: { achievementId: r.id }
	}));
	return {
		state: t,
		events: n
	};
}
function $e(e, t) {
	let n = x.from(t);
	return n.compare(0) <= 0 || e.greaterThanOrEqual(n) ? 1 : e.compare(0) <= 0 ? 0 : et(e.divide(n).toNumber());
}
function O(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError("Achievement progress values must be finite.");
	return t <= 0 ? 1 : et(e / t);
}
function et(e) {
	return Math.min(1, Math.max(0, e));
}
function k(e, t) {
	if (e === void 0) throw Error(`ConditionContext.${t} is required for this achievement progress metric.`);
	return e;
}
//#endregion
//#region src/domain/currency/currency.ts
var A = (e, t) => x.deserialize(e[t] ?? x.zero().serialize());
function tt(e, t, n) {
	n !== void 0 && rt(n, t.currencyId);
	let r = x.from(t.amount);
	if (r.isNegative()) return {
		accepted: !1,
		balances: e,
		reason: "invalid-amount"
	};
	let i = nt(r, n), a = A(e, t.currencyId);
	if (t.kind === "spend") return n?.allowNegativeBalance !== !0 && a.compare(i) < 0 ? {
		accepted: !1,
		balances: e,
		reason: "insufficient-balance"
	} : c(a.subtract(i), i);
	let o = a.add(i), s = i;
	if (n?.cap !== void 0) {
		let e = x.from(n.cap);
		a.compare(e) < 0 && o.compare(e) > 0 ? (o = e, s = e.subtract(a)) : a.compare(e) >= 0 && (o = a, s = x.zero());
	}
	return c(o, s);
	function c(n, r) {
		return {
			accepted: !0,
			balances: {
				...e,
				[t.currencyId]: n.serialize()
			},
			appliedAmount: r
		};
	}
}
function nt(e, t) {
	if (t?.precision === void 0 || t.roundingMode === void 0) return e;
	let n = x.from(10).pow(t.precision), r = e.multiply(n);
	return (t.roundingMode === "floor" ? r.floor() : t.roundingMode === "ceil" ? r.ceil() : r.round()).divide(n);
}
function rt(e, t) {
	if (e.id !== t) throw RangeError(`CurrencyDefinition ID mismatch: expected ${t}, got ${e.id}`);
	if (e.precision !== void 0 != (e.roundingMode !== void 0)) throw RangeError("Currency precision and roundingMode must be specified together.");
	if (e.precision !== void 0 && (!Number.isSafeInteger(e.precision) || e.precision < 0)) throw RangeError("Currency precision must be a non-negative safe integer.");
	if (e.cap !== void 0 && x.from(e.cap).isNegative()) throw RangeError("Currency cap must be non-negative.");
}
//#endregion
//#region src/domain/modifier/modifier.ts
function it(e) {
	return {
		id: e.id,
		operation: e.operation,
		value: e.value,
		...e.overridePriority === void 0 ? {} : { overridePriority: e.overridePriority }
	};
}
function at(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = [];
	for (let a of e) {
		if (r.has(a)) continue;
		r.add(a);
		let e = t[a];
		if (e === void 0) throw Error(`Unknown active Modifier definition ID: ${a}`);
		e.target === n && i.push(it(e));
	}
	return i;
}
function ot(e, t) {
	let n = t.filter((e) => e.operation === "flatAdd").reduce((e, t) => e.add(t.value), x.zero()), r = t.filter((e) => e.operation === "percentAdd").reduce((e, t) => e.add(t.value), x.zero()), i = t.filter((e) => e.operation === "multiply").reduce((e, t) => e.multiply(t.value), x.one()), a = x.from(e).add(n).multiply(x.one().add(r)).multiply(i), o = t.filter((e) => e.operation === "override").toSorted((e, t) => {
		let n = (t.overridePriority ?? 0) - (e.overridePriority ?? 0);
		return n === 0 ? e.id.localeCompare(t.id) : n;
	})[0];
	return o === void 0 ? a : x.from(o.value);
}
//#endregion
//#region src/domain/producer/producer.ts
function st(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 0) throw RangeError("Producer ownedCount must be a non-negative safe integer.");
	let r = e[t] ?? {
		definitionId: t,
		ownedCount: 0,
		level: 1
	};
	return {
		...e,
		[t]: {
			...r,
			ownedCount: n
		}
	};
}
function ct(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 1) return {
		accepted: !1,
		producers: e,
		reason: "invalid-level"
	};
	let r = e[t];
	return r === void 0 ? {
		accepted: !1,
		producers: e,
		reason: "unknown-producer"
	} : {
		accepted: !0,
		producers: {
			...e,
			[t]: {
				...r,
				level: n
			}
		}
	};
}
//#endregion
//#region src/domain/token/token.ts
function lt(e, t) {
	return e[t] ?? 0;
}
function ut(e, t, n) {
	return ft(n), {
		...e,
		[t]: lt(e, t) + n
	};
}
function dt(e, t, n) {
	ft(n);
	let r = lt(e, t);
	return r < n ? {
		accepted: !1,
		tokens: e,
		reason: "insufficient-token"
	} : {
		accepted: !0,
		tokens: {
			...e,
			[t]: r - n
		}
	};
}
function ft(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Token count must be a non-negative safe integer.");
}
//#endregion
//#region src/domain/reward/reward.ts
function pt(e, t, n = {}) {
	let r = e;
	for (let e of t) switch (e.type) {
		case "currency": {
			let t = tt(r.currencies, {
				currencyId: e.currencyId,
				amount: e.amount,
				kind: "earn",
				source: e.source
			}, n.resolveCurrencyDefinition?.(e.currencyId));
			if (!t.accepted) throw Error(`Invalid currency reward: ${e.currencyId}`);
			let i = x.deserialize(r.statistics.lifetimeCurrencyEarned[e.currencyId] ?? x.zero().serialize());
			r = {
				...r,
				currencies: t.balances,
				statistics: {
					...r.statistics,
					lifetimeCurrencyEarned: {
						...r.statistics.lifetimeCurrencyEarned,
						[e.currencyId]: i.add(t.appliedAmount).serialize()
					}
				}
			};
			break;
		}
		case "producer": {
			let t = r.producers[e.producerId]?.ownedCount ?? 0;
			r = {
				...r,
				producers: st(r.producers, e.producerId, t + e.count)
			};
			break;
		}
		case "character":
			r = gt(n.grantCharacter, "character")(r, e.characterDefinitionId);
			break;
		case "token":
			r = {
				...r,
				tokens: ut(r.tokens, e.tokenId, e.count)
			};
			break;
		case "boost":
			r = gt(n.activateBoost, "boost")(r, e.boostId);
			break;
		case "permanent-modifier":
			r = gt(n.grantPermanentModifier, "permanent-modifier")(r, e.modifierId);
			break;
		case "activity-advance": {
			if (!Number.isSafeInteger(e.seconds) || e.seconds <= 0) throw RangeError("Activity advance reward seconds must be a positive safe integer.");
			let t = n.advanceActivity;
			if (t === void 0) throw Error("Reward type activity-advance requires a RewardApplicationHooks handler.");
			r = t(r, e.activityId, e.seconds);
			break;
		}
		case "title":
			r = {
				...r,
				titles: {
					...r.titles,
					[e.titleId]: !0
				}
			};
			break;
		case "unlock":
			r = {
				...r,
				progressionFlags: {
					...r.progressionFlags,
					[e.flagId]: !0
				}
			};
			break;
		case "composite": r = pt(r, e.rewards, n);
	}
	return r;
}
function mt(e, t, n) {
	let r = x.deserialize(e.statistics.lifetimeCurrencySpent[t] ?? x.zero().serialize());
	return {
		...e,
		statistics: {
			...e.statistics,
			lifetimeCurrencySpent: {
				...e.statistics.lifetimeCurrencySpent,
				[t]: r.add(n).serialize()
			}
		}
	};
}
var ht = (e, t) => A(e.currencies, t);
function gt(e, t) {
	if (e === void 0) throw Error(`Reward type ${t} requires a RewardApplicationHooks handler.`);
	return e;
}
//#endregion
//#region src/domain/active-gain/active-gain.ts
function _t(e) {
	let t = x.from(e.definition.baseAmount);
	if (t.isNegative()) throw RangeError("Active gain baseAmount must be non-negative.");
	if (e.definition.eligibility !== void 0) {
		if (e.createConditionContext === void 0) throw Error("Active gain eligibility requires createConditionContext.");
		if (!E(e.definition.eligibility, e.createConditionContext(e.state))) return {
			accepted: !1,
			state: e.state,
			events: [],
			reason: "ineligible"
		};
	}
	let n = ot(t, e.modifiers ?? []);
	if (n.isNegative()) throw RangeError("Active gain modifiers must not produce a negative reward.");
	let r = A(e.state.currencies, e.definition.currencyId), i = e.resolveCurrencyDefinition === void 0 ? {} : { resolveCurrencyDefinition: e.resolveCurrencyDefinition }, a = pt(e.state, [{
		type: "currency",
		currencyId: e.definition.currencyId,
		amount: n,
		source: `active-gain.${e.definition.id}`
	}], i), o = A(a.currencies, e.definition.currencyId).subtract(r);
	if (o.isZero()) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "no-effective-gain"
	};
	let s = a.statistics.lifetimeCurrencyEarned[e.definition.currencyId];
	if (s === void 0) throw Error("Active gain lifetime currency statistic was not recorded.");
	return {
		accepted: !0,
		state: a,
		events: [{
			id: `active-gain:${e.definition.id}:${e.state.simTimeSec}:${s.mantissa}e${s.exponent}`,
			type: "activeGainPerformed",
			simTimeSec: e.state.simTimeSec,
			payload: {
				activeGainId: e.definition.id,
				currencyId: e.definition.currencyId,
				amount: o.serialize()
			}
		}]
	};
}
//#endregion
//#region src/domain/activity/activity-common.ts
function vt(e) {
	if (j(e.definition), !(e.definition.eligibility === void 0 || E(e.definition.eligibility, wt(e.createConditionContext)(e.state)))) return {
		eligible: !1,
		affordable: !0,
		canStart: !1,
		blockingCost: null
	};
	let t = yt({
		state: e.state,
		costs: e.definition.startCosts ?? [],
		...e.resolveCurrencyDefinition === void 0 ? {} : { resolveCurrencyDefinition: e.resolveCurrencyDefinition }
	});
	return t.accepted ? {
		eligible: !0,
		affordable: !0,
		canStart: !0,
		blockingCost: null
	} : {
		eligible: !0,
		affordable: !1,
		canStart: !1,
		blockingCost: t.blockingCost
	};
}
function yt(e) {
	let t = e.state;
	for (let n of e.costs) {
		if (Ct(n), n.type === "currency") {
			let r = tt(t.currencies, {
				currencyId: n.currencyId,
				amount: n.amount,
				kind: "spend",
				source: "activity.start"
			}, e.resolveCurrencyDefinition?.(n.currencyId));
			if (!r.accepted) return {
				accepted: !1,
				state: e.state,
				blockingCost: n,
				reason: "insufficient-currency"
			};
			t = mt({
				...t,
				currencies: r.balances
			}, n.currencyId, r.appliedAmount);
			continue;
		}
		let r = dt(t.tokens, n.tokenId, n.count);
		if (!r.accepted) return {
			accepted: !1,
			state: e.state,
			blockingCost: n,
			reason: "insufficient-token"
		};
		t = {
			...t,
			tokens: r.tokens
		};
	}
	return {
		accepted: !0,
		state: t
	};
}
function bt(e) {
	return e.offlinePolicy !== "pause";
}
function xt(e, t, n) {
	if (j(e), !Number.isSafeInteger(t.maxSlots) || t.maxSlots <= 0) throw RangeError("Activity concurrency maxSlots must be a positive safe integer.");
	if (!Number.isSafeInteger(n) || n < 0) throw RangeError("Activity usedSlots must be a non-negative safe integer.");
	if (e.concurrencyGroupId !== t.id) throw RangeError(`Activity concurrency group mismatch: expected ${e.concurrencyGroupId ?? "none"}, got ${t.id}`);
	let r = e.slotCost ?? 1, i = Math.max(0, t.maxSlots - n);
	return {
		allowed: n + r <= t.maxSlots,
		requiredSlots: r,
		usedSlots: n,
		maxSlots: t.maxSlots,
		remainingSlots: i
	};
}
function St(e, t) {
	return (e.startCosts ?? []).filter((e) => e.type === "currency" && e.currencyId === t).reduce((e, t) => e.add(t.amount), x.zero());
}
function j(e, t) {
	if (e.id.length === 0) throw RangeError("Activity id must not be empty.");
	if (t !== void 0 && e.mode !== t) throw RangeError(`Activity mode mismatch: expected ${t}, got ${e.mode}`);
	if (e.concurrencyGroupId !== void 0 && e.concurrencyGroupId.length === 0) throw RangeError("Activity concurrencyGroupId must not be empty when specified.");
	if (e.slotCost !== void 0 && (!Number.isSafeInteger(e.slotCost) || e.slotCost <= 0)) throw RangeError("Activity slotCost must be a positive safe integer.");
	for (let t of e.startCosts ?? []) Ct(t);
}
function Ct(e) {
	if (e.type === "currency") {
		if (e.currencyId.length === 0) throw RangeError("Activity currency cost requires currencyId.");
		let t = x.from(e.amount);
		if (t.isNegative() || t.isZero()) throw RangeError("Activity currency cost must be positive.");
		return;
	}
	if (e.tokenId.length === 0) throw RangeError("Activity token cost requires tokenId.");
	if (!Number.isSafeInteger(e.count) || e.count <= 0) throw RangeError("Activity token cost must be a positive safe integer.");
}
function wt(e) {
	if (e === void 0) throw Error("Activity eligibility requires createConditionContext.");
	return e;
}
//#endregion
//#region src/domain/activity/continuous-activity.ts
function Tt(e) {
	if (j(e.definition, "continuous"), !Number.isSafeInteger(e.elapsedSec) || e.elapsedSec < 0) throw RangeError("elapsedSec must be a non-negative safe integer.");
	if (!e.activity.running || e.elapsedSec === 0 || e.isOffline === !0 && e.definition.offlinePolicy === "pause") return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	let t = e.state, n = e.activity, r = e.elapsedSec, i = 0, a = [];
	for (; r > 0;) {
		let o = e.hooks.resolveRates(t);
		if (!Number.isFinite(o.progressPerSec) || o.progressPerSec < 0) throw RangeError("progressPerSec must be finite and non-negative.");
		let s = e.definition.milestones.filter((e) => !n.reachedMilestoneIds.includes(e.id)).toSorted((e, t) => e.threshold - t.threshold).find((e) => e.threshold > n.progress), c = s === void 0 || o.progressPerSec === 0 ? r : Math.max(1, Math.ceil((s.threshold - n.progress) / o.progressPerSec)), l = Math.min(r, c);
		for (let [n, r] of Object.entries(o.production)) t = e.hooks.grantProduction(t, n, x.from(r).multiply(l));
		n = {
			...n,
			progress: Math.min(1, n.progress + o.progressPerSec * l)
		}, r -= l, i += l;
		let u = e.definition.milestones.filter((e) => !n.reachedMilestoneIds.includes(e.id)).filter((e) => n.progress >= e.threshold).toSorted((e, t) => e.threshold - t.threshold);
		for (let r of u) t = e.hooks.grantRewards(t, r.rewards), n = {
			...n,
			reachedMilestoneIds: [...n.reachedMilestoneIds, r.id]
		}, a.push({
			id: `${e.definition.id}:${r.id}:${e.startSimTimeSec + i}`,
			type: "activityMilestoneReached",
			simTimeSec: e.startSimTimeSec + i,
			payload: {
				activityId: e.definition.id,
				milestoneId: r.id
			}
		});
	}
	return {
		state: t,
		activity: n,
		events: a
	};
}
function Et(e, t, n) {
	if (j(t, "continuous"), !Number.isSafeInteger(n) || n < 0) throw RangeError("simTimeSec must be a non-negative safe integer.");
	return e.running ? t.cancellationPolicy === "forbid" ? {
		accepted: !1,
		activity: e,
		events: [],
		reason: "cancellation-forbidden"
	} : {
		accepted: !0,
		activity: {
			...e,
			running: !1
		},
		events: [{
			id: `${t.id}:stopped:${n}`,
			type: "continuousActivityStopped",
			simTimeSec: n,
			payload: { activityId: t.id }
		}]
	} : {
		accepted: !1,
		activity: e,
		events: [],
		reason: "not-running"
	};
}
//#endregion
//#region src/domain/activity/timed-activity.ts
function Dt(e) {
	return {
		activityId: e,
		status: "available",
		startedAtSimTimeSec: null,
		completesAtSimTimeSec: null,
		completionCount: 0
	};
}
function Ot(e) {
	if (Nt(e.definition), M(e.startSimTimeSec, "startSimTimeSec"), e.activity.status !== "available") return Ft(e.state, e.activity, "not-available");
	let t = {
		...e.activity,
		status: "running",
		startedAtSimTimeSec: e.startSimTimeSec,
		completesAtSimTimeSec: e.startSimTimeSec + e.definition.durationSec
	};
	return Pt(e.state, t, [N(e.definition.id, "timedActivityStarted", e.startSimTimeSec, e.activity.completionCount + 1)]);
}
function kt(e) {
	if (Nt(e.definition), M(e.targetSimTimeSec, "targetSimTimeSec"), e.offlineElapsedSec !== void 0 && M(e.offlineElapsedSec, "offlineElapsedSec"), e.activity.status !== "running") return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	let t = e.activity.completesAtSimTimeSec;
	if (t === null) throw Error("Running Timed Activity is missing completesAtSimTimeSec.");
	let n = e.offlineElapsedSec ?? 0;
	if (n > 0 && e.definition.offlinePolicy === "pause") {
		let r = e.activity.startedAtSimTimeSec;
		if (r === null) throw Error("Running Timed Activity is missing startedAtSimTimeSec.");
		return {
			state: e.state,
			activity: {
				...e.activity,
				startedAtSimTimeSec: r + n,
				completesAtSimTimeSec: t + n
			},
			events: []
		};
	}
	if (e.targetSimTimeSec < t) return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	if (e.definition.claimPolicy === "manual") return {
		state: e.state,
		activity: {
			...e.activity,
			status: "completed-unclaimed"
		},
		events: [N(e.definition.id, "timedActivityCompleted", t, e.activity.completionCount + 1)]
	};
	let r = e.hooks.grantRewards(e.state, e.definition.completionRewards), i = e.activity.completionCount + 1;
	return {
		state: r,
		activity: Mt(e.activity, e.definition, i),
		events: [N(e.definition.id, "timedActivityAutoResolved", t, i)]
	};
}
function At(e, t, n) {
	return Nt(t), M(n, "simTimeSec"), e.status === "running" ? t.cancellationPolicy === "forbid" ? {
		accepted: !1,
		activity: e,
		events: [],
		reason: "cancellation-forbidden"
	} : {
		accepted: !0,
		activity: {
			...e,
			status: "available",
			startedAtSimTimeSec: null,
			completesAtSimTimeSec: null
		},
		events: [N(t.id, "timedActivityCancelled", n, e.completionCount + 1)]
	} : {
		accepted: !1,
		activity: e,
		events: [],
		reason: "not-running"
	};
}
function jt(e) {
	if (Nt(e.definition), M(e.claimSimTimeSec, "claimSimTimeSec"), e.activity.status !== "completed-unclaimed") return Ft(e.state, e.activity, "not-claimable");
	let t = e.hooks.grantRewards(e.state, e.definition.completionRewards), n = e.activity.completionCount + 1;
	return Pt(t, Mt(e.activity, e.definition, n), [N(e.definition.id, "timedActivityClaimed", e.claimSimTimeSec, n)]);
}
function Mt(e, t, n) {
	return {
		...e,
		status: t.repeatPolicy === "repeatable" ? "available" : "exhausted",
		startedAtSimTimeSec: null,
		completesAtSimTimeSec: null,
		completionCount: n
	};
}
function Nt(e) {
	if (j(e, "timed"), !Number.isSafeInteger(e.durationSec) || e.durationSec <= 0) throw RangeError("Timed Activity durationSec must be a positive safe integer.");
}
function M(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function N(e, t, n, r) {
	return {
		id: `${e}:${t}:${r}:${n}`,
		type: t,
		simTimeSec: n,
		payload: {
			activityId: e,
			runNumber: r
		}
	};
}
function Pt(e, t, n) {
	return {
		accepted: !0,
		state: e,
		activity: t,
		events: n
	};
}
function Ft(e, t, n) {
	return {
		accepted: !1,
		state: e,
		activity: t,
		events: [],
		reason: n
	};
}
//#endregion
//#region src/domain/boost/boost.ts
function It(e, t, n) {
	Bt(t);
	let r = Object.values(e).find((e) => e.stackingKey === t.stackingKey && e.expiresAtSimTimeSec > n);
	if (r !== void 0 && t.stackingPolicy === "non-stackable") return e;
	if (r !== void 0 && t.stackingPolicy === "replace-weaker") {
		if (r.stackingStrength === void 0) throw Error(`Active Boost ${r.boostId} is missing stackingStrength for replace-weaker group ${t.stackingKey}.`);
		if (t.stackingStrength <= r.stackingStrength) return e;
	}
	let i = {
		boostId: t.id,
		stackingKey: t.stackingKey,
		activatedAtSimTimeSec: n,
		expiresAtSimTimeSec: n + t.durationSec,
		...t.stackingPolicy === "replace-weaker" ? { stackingStrength: t.stackingStrength } : {}
	};
	return r !== void 0 && (t.stackingPolicy === "refresh-duration" || t.stackingPolicy === "replace-weaker") ? {
		...Object.fromEntries(Object.entries(e).filter(([, e]) => e.stackingKey !== t.stackingKey)),
		[t.id]: i
	} : {
		...e,
		[t.id]: i
	};
}
function Lt(e, t, n, r) {
	return Object.values(e).flatMap((e) => {
		if (e.expiresAtSimTimeSec <= r) return [];
		let i = t[e.boostId];
		return i === void 0 || i.target !== n ? [] : [i.modifier];
	});
}
function Rt(e, t, n) {
	let r = null;
	for (let i of Object.values(e)) i.expiresAtSimTimeSec <= t || i.expiresAtSimTimeSec >= n || (r === null || i.expiresAtSimTimeSec < r) && (r = i.expiresAtSimTimeSec);
	return r;
}
function zt(e, t) {
	return Object.fromEntries(Object.entries(e).filter(([, e]) => e.expiresAtSimTimeSec > t));
}
function Bt(e) {
	if (!Number.isSafeInteger(e.durationSec) || e.durationSec <= 0) throw RangeError("Boost durationSec must be a positive safe integer.");
	if (e.stackingPolicy === "replace-weaker" && (!Number.isFinite(e.stackingStrength) || e.stackingStrength <= 0)) throw RangeError("replace-weaker Boost stackingStrength must be positive and finite.");
}
//#endregion
//#region src/domain/calendar/calendar-reward.ts
function Vt(e, t, n) {
	if (!Number.isFinite(e) || !Number.isSafeInteger(t)) throw RangeError("Calendar clock inputs must be finite integers.");
	let r = e + t * 6e4, i = new Date(r), a = i.getUTCFullYear(), o = i.getUTCMonth(), s = Date.UTC(a, o, i.getUTCDate()), c = Math.floor(s / 864e5);
	switch (n) {
		case "daily": return c;
		case "weekly": return Math.floor((c + 3) / 7);
		case "monthly": return a * 12 + o;
	}
}
function Ht(e, t, n, r) {
	if (t.rewardsByClaim.length === 0) throw RangeError(`Calendar reward sequence is empty: ${t.id}`);
	let i = Vt(n, r, t.period), a = e.calendarRewardStates[t.id] ?? {
		lastClaimedPeriodIndex: null,
		claimCount: 0,
		streakCount: 0
	}, o = a.lastClaimedPeriodIndex === null ? null : i - a.lastClaimedPeriodIndex, s = o !== null && o > 1 && t.missPolicy === "reset-sequence", c = (s ? 0 : a.claimCount) % t.rewardsByClaim.length, l = a.lastClaimedPeriodIndex === null ? 1 : o === 0 ? a.streakCount : o === 1 ? a.streakCount + 1 : 1;
	return {
		claimable: a.lastClaimedPeriodIndex === null || i > a.lastClaimedPeriodIndex,
		claimPolicy: t.claimPolicy ?? "manual",
		periodIndex: i,
		sequenceIndex: c,
		rewards: t.rewardsByClaim[c],
		streakCountAfterClaim: l,
		sequenceReset: s
	};
}
function Ut(e, t, n, r, i) {
	return (t.claimPolicy ?? "manual") === "auto" ? {
		accepted: !1,
		state: e,
		reason: "manual-claim-disabled"
	} : Gt(e, t, n, r, i);
}
function Wt(e, t, n, r, i) {
	let a = e, o = [];
	for (let e of t) {
		if ((e.claimPolicy ?? "manual") !== "auto") continue;
		let t = Gt(a, e, n, r, i);
		t.accepted && (a = t.state, o.push({
			calendarRewardId: e.id,
			rewards: t.rewards
		}));
	}
	return {
		state: a,
		claimed: o
	};
}
function Gt(e, t, n, r, i) {
	let a = Ht(e, t, n, r), o = e.calendarRewardStates[t.id] ?? {
		lastClaimedPeriodIndex: null,
		claimCount: 0,
		streakCount: 0
	};
	if (!a.claimable) return {
		accepted: !1,
		state: e,
		reason: o.lastClaimedPeriodIndex !== null && a.periodIndex < o.lastClaimedPeriodIndex ? "clock-rollback" : "already-claimed"
	};
	let s = i(e, a.rewards);
	return s = {
		...s,
		calendarRewardStates: {
			...s.calendarRewardStates,
			[t.id]: {
				lastClaimedPeriodIndex: a.periodIndex,
				claimCount: a.sequenceReset ? 1 : o.claimCount + 1,
				streakCount: a.streakCountAfterClaim
			}
		}
	}, {
		accepted: !0,
		state: s,
		rewards: a.rewards
	};
}
//#endregion
//#region src/domain/character/character.ts
var Kt = (e, t) => Object.values(e).some((e) => e.definitionId === t);
function qt(e, t) {
	return e[t.instanceId] === void 0 ? {
		accepted: !0,
		characters: {
			...e,
			[t.instanceId]: t
		}
	} : {
		accepted: !1,
		characters: e
	};
}
function Jt(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 1) return {
		accepted: !1,
		characters: e,
		reason: "invalid-level"
	};
	let r = e[t];
	return r === void 0 ? {
		accepted: !1,
		characters: e,
		reason: "unknown-character"
	} : {
		accepted: !0,
		characters: {
			...e,
			[t]: {
				...r,
				level: n
			}
		}
	};
}
function Yt(e, t, n = 1, r = {}) {
	if (!Number.isSafeInteger(n) || n <= 0) return {
		accepted: !1,
		characters: e,
		reason: "invalid-count"
	};
	let i = e[t];
	if (i === void 0) return {
		accepted: !1,
		characters: e,
		reason: "unknown-character"
	};
	if (r.maxCount !== void 0) {
		if (!Number.isSafeInteger(r.maxCount) || r.maxCount <= 0) throw RangeError("Character limitBreak maxCount must be a positive safe integer.");
		if ((i.limitBreakCount ?? 0) + n > r.maxCount) return {
			accepted: !1,
			characters: e,
			reason: "limit-reached"
		};
	}
	let a = (i.limitBreakCount ?? 0) + n;
	return {
		accepted: !0,
		characters: {
			...e,
			[t]: {
				...i,
				limitBreakCount: a
			}
		},
		limitBreakCount: a
	};
}
//#endregion
//#region src/domain/cooldown/cooldown.ts
function Xt() {
	return {
		readyAtSimTimeSec: 0,
		useCount: 0
	};
}
function Zt(e, t, n) {
	en(e), rn(n, "simTimeSec");
	let r = t ?? Xt();
	tn(r);
	let i = Math.max(0, r.readyAtSimTimeSec - n);
	return {
		ready: i === 0,
		remainingSec: i,
		readyAtSimTimeSec: r.readyAtSimTimeSec,
		useCount: r.useCount
	};
}
function Qt(e) {
	let t = e.cooldown ?? Xt(), n = Zt(e.definition, t, e.simTimeSec);
	if (!n.ready) return {
		accepted: !1,
		cooldown: t,
		reason: "cooldown-active",
		remainingSec: n.remainingSec
	};
	let r = e.durationSecOverride ?? e.definition.durationSec;
	nn(r, "durationSecOverride");
	let i = e.simTimeSec + r;
	if (!Number.isSafeInteger(i)) throw RangeError("Cooldown readyAtSimTimeSec exceeds safe integer range.");
	return {
		accepted: !0,
		cooldown: {
			readyAtSimTimeSec: i,
			useCount: t.useCount + 1
		},
		previous: t
	};
}
function $t(e) {
	tn(e.cooldown), rn(e.simTimeSec, "simTimeSec"), nn(e.reductionSec, "reductionSec");
	let t = Math.max(e.simTimeSec, e.cooldown.readyAtSimTimeSec - e.reductionSec);
	return t === e.cooldown.readyAtSimTimeSec ? e.cooldown : {
		...e.cooldown,
		readyAtSimTimeSec: t
	};
}
function en(e) {
	if (e.id.length === 0) throw RangeError("Cooldown id must not be empty.");
	nn(e.durationSec, "Cooldown durationSec");
}
function tn(e) {
	if (rn(e.readyAtSimTimeSec, "Cooldown readyAtSimTimeSec"), !Number.isSafeInteger(e.useCount) || e.useCount < 0) throw RangeError("Cooldown useCount must be a non-negative safe integer.");
}
function nn(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function rn(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
//#endregion
//#region src/domain/definition/definition-validation.ts
function an(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = e.continuousActivities ?? [], i = e.timedActivities ?? [], a = e.achievements ?? [], o = e.missions ?? [], s = e.missionSets ?? [], c = e.gachas ?? [];
	for (let [r, i] of Object.entries(e.ids)) sn(i, `ids.${r}`, t, n);
	P(e.activeGains ?? [], "activeGains", t, n), P(e.curves ?? [], "curves", t, n), P(e.levelDefinitions ?? [], "levelDefinitions", t, n), P(e.activityConcurrencyGroups ?? [], "activityConcurrencyGroups", t, n), P(r, "continuousActivities", t, n), P(i, "timedActivities", t, n), P(e.boosts ?? [], "boosts", t, n), P(c, "gachas", t, n), P(e.calendarRewards ?? [], "calendarRewards", t, n), P(e.rewardedOffers ?? [], "rewardedOffers", t, n), P(a, "achievements", t, n), P(s, "missionSets", t, n), P(o, "missions", t, n), P(e.opportunities ?? [], "opportunities", t, n), P(e.prestiges ?? [], "prestiges", t, n);
	let l = {
		currencies: new Set(e.ids.currencies),
		producers: new Set(e.ids.producers),
		tokens: new Set(e.ids.tokens),
		characters: new Set(e.ids.characters),
		boosts: new Set((e.boosts ?? []).map((e) => e.id)),
		permanentModifiers: new Set(e.ids.permanentModifiers),
		titles: new Set(e.ids.titles),
		unlockFlags: new Set(e.ids.unlockFlags),
		rngStreams: new Set(e.ids.rngStreams),
		activities: new Set([...r, ...i].map((e) => e.id)),
		activityConcurrencyGroups: new Set((e.activityConcurrencyGroups ?? []).map((e) => e.id)),
		activityMilestones: new Map(r.map((e) => [e.id, new Set(e.milestones.map((e) => e.id))])),
		achievements: new Set(a.map((e) => e.id)),
		missions: new Set(o.map((e) => e.id)),
		missionSets: new Set(s.map((e) => e.id)),
		gachas: new Set(c.map((e) => e.id)),
		calendarRewards: new Set((e.calendarRewards ?? []).map((e) => e.id)),
		prestiges: new Set((e.prestiges ?? []).map((e) => e.id)),
		levels: new Set((e.levelDefinitions ?? []).map((e) => e.id))
	}, u = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.titleDefinitions ?? []).entries()) {
		let e = `titleDefinitions[${n}]`;
		u.has(r.id) && U(t, "duplicate-id", `${e}.id`, `Duplicate TitleDefinition ID: ${r.id}`), u.add(r.id), H(l.titles, r.id, `${e}.id`, "title", t), r.displayName.length === 0 && U(t, "invalid-value", `${e}.displayName`, "Title displayName must not be empty."), r.description !== void 0 && r.description.length === 0 && U(t, "invalid-value", `${e}.description`, "Title description must not be empty when specified.");
	}
	let d = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.modifierDefinitions ?? []).entries()) {
		let e = `modifierDefinitions[${n}]`;
		d.has(r.id) && U(t, "duplicate-id", `${e}.id`, `Duplicate ModifierDefinition ID: ${r.id}`), d.add(r.id), H(l.permanentModifiers, r.id, `${e}.id`, "permanent modifier", t), gn(r, e, t);
	}
	let f = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.currencyDefinitions ?? []).entries()) {
		let e = `currencyDefinitions[${n}]`;
		f.has(r.id) && U(t, "duplicate-id", `${e}.id`, `Duplicate CurrencyDefinition ID: ${r.id}`), f.add(r.id), H(l.currencies, r.id, `${e}.id`, "currency", t), cn(r, e, t);
	}
	let p = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.producerDefinitions ?? []).entries()) {
		let e = `producerDefinitions[${n}]`;
		p.has(r.id) && U(t, "duplicate-id", `${e}.id`, `Duplicate ProducerDefinition ID: ${r.id}`), p.add(r.id), H(l.producers, r.id, `${e}.id`, "producer", t), r.displayName !== void 0 && r.displayName.length === 0 && U(t, "invalid-value", `${e}.displayName`, "Producer displayName must not be empty when specified."), r.hireCostCurve !== void 0 && F(r.hireCostCurve, `${e}.hireCostCurve`, t), r.levelDefinitionId !== void 0 && H(l.levels, r.levelDefinitionId, `${e}.levelDefinitionId`, "level definition", t), r.unlockCondition !== void 0 && L(r.unlockCondition, `${e}.unlockCondition`, l, t);
		for (let [n, i] of Object.entries(r.baseProduction ?? {})) H(l.currencies, n, `${e}.baseProduction.${n}`, "currency", t), B(i, `${e}.baseProduction.${n}`, t, !0);
		r.tags?.forEach((n, r) => {
			n.length === 0 && U(t, "invalid-value", `${e}.tags[${r}]`, "Producer tag must not be empty.");
		});
	}
	let ee = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.characterDefinitions ?? []).entries()) {
		let e = `characterDefinitions[${n}]`;
		ee.has(r.id) && U(t, "duplicate-id", `${e}.id`, `Duplicate CharacterDefinition ID: ${r.id}`), ee.add(r.id), H(l.characters, r.id, `${e}.id`, "character", t), r.displayName !== void 0 && r.displayName.length === 0 && U(t, "invalid-value", `${e}.displayName`, "Character displayName must not be empty when specified."), r.rarity !== void 0 && r.rarity.length === 0 && U(t, "invalid-value", `${e}.rarity`, "Character rarity must not be empty when specified."), r.levelDefinitionId !== void 0 && H(l.levels, r.levelDefinitionId, `${e}.levelDefinitionId`, "level definition", t), r.unlockCondition !== void 0 && L(r.unlockCondition, `${e}.unlockCondition`, l, t), r.limitBreak?.maxCount !== void 0 && (!Number.isSafeInteger(r.limitBreak.maxCount) || r.limitBreak.maxCount <= 0) && U(t, "invalid-value", `${e}.limitBreak.maxCount`, "Character limitBreak maxCount must be a positive safe integer.");
		for (let [n, i] of Object.entries(r.baseStats ?? {})) n.length === 0 && U(t, "invalid-value", `${e}.baseStats`, "Character stat ID must not be empty."), B(i, `${e}.baseStats.${n}`, t, !1);
		r.traits?.forEach((n, r) => {
			n.length === 0 && U(t, "invalid-value", `${e}.traits[${r}]`, "Character trait must not be empty.");
		});
	}
	for (let [n, r] of (e.activeGains ?? []).entries()) {
		let e = `activeGains[${n}]`;
		H(l.currencies, r.currencyId, `${e}.currencyId`, "currency", t), vn(r.baseAmount, `${e}.baseAmount`, t), r.eligibility !== void 0 && L(r.eligibility, `${e}.eligibility`, l, t);
	}
	for (let [n, r] of (e.curves ?? []).entries()) F(r.definition, `curves[${n}].definition`, t);
	for (let [n, r] of (e.levelDefinitions ?? []).entries()) {
		let e = `levelDefinitions[${n}]`;
		F(r.costCurve, `${e}.costCurve`, t), r.statCurve !== void 0 && F(r.statCurve, `${e}.statCurve`, t), r.maxLevel !== void 0 && V(r.maxLevel, `${e}.maxLevel`, "Level maxLevel", t), r.eligibility !== void 0 && L(r.eligibility, `${e}.eligibility`, l, t);
		let i = /* @__PURE__ */ new Set(), a = 0;
		for (let [n, o] of (r.milestones ?? []).entries()) {
			let s = `${e}.milestones[${n}]`;
			i.has(o.id) && U(t, "duplicate-id", `${s}.id`, `Duplicate level milestone ID: ${o.id}`), i.add(o.id), V(o.level, `${s}.level`, "Level milestone level", t), o.level < a && U(t, "invalid-value", `${s}.level`, "Level milestones must be authored in non-decreasing level order."), a = o.level, r.maxLevel !== void 0 && o.level > r.maxLevel && U(t, "invalid-value", `${s}.level`, "Level milestone cannot exceed maxLevel."), I(o.rewards, `${s}.rewards`, l, t);
		}
	}
	for (let [n, r] of (e.activityConcurrencyGroups ?? []).entries()) {
		let e = `activityConcurrencyGroups[${n}]`;
		(!Number.isSafeInteger(r.maxSlots) || r.maxSlots <= 0) && U(t, "invalid-value", `${e}.maxSlots`, "Activity concurrency group maxSlots must be a positive safe integer.");
	}
	for (let [e, n] of r.entries()) {
		let r = `continuousActivities[${e}]`;
		ln(n, "continuous", r, l, t);
		let i = /* @__PURE__ */ new Set();
		for (let [e, a] of n.milestones.entries()) {
			let n = `${r}.milestones[${e}]`;
			i.has(a.id) && U(t, "duplicate-id", `${n}.id`, `Duplicate milestone ID: ${a.id}`), i.add(a.id), (!Number.isFinite(a.threshold) || a.threshold < 0 || a.threshold > 1) && U(t, "invalid-value", `${n}.threshold`, "Continuous milestone threshold must be finite and in [0, 1]."), I(a.rewards, `${n}.rewards`, l, t);
		}
	}
	for (let [e, n] of i.entries()) {
		let r = `timedActivities[${e}]`;
		ln(n, "timed", r, l, t), (!Number.isSafeInteger(n.durationSec) || n.durationSec <= 0) && U(t, "invalid-value", `${r}.durationSec`, "Timed Activity durationSec must be a positive safe integer."), I(n.completionRewards, `${r}.completionRewards`, l, t);
	}
	let m = /* @__PURE__ */ new Map();
	for (let [n, r] of (e.boosts ?? []).entries()) {
		let e = `boosts[${n}]`;
		(!Number.isSafeInteger(r.durationSec) || r.durationSec <= 0) && U(t, "invalid-value", `${e}.durationSec`, "Boost durationSec must be a positive safe integer."), _n(r.modifier, `${e}.modifier`, t), r.target.length === 0 && U(t, "invalid-value", `${e}.target`, "Boost target must not be empty."), r.stackingKey.length === 0 && U(t, "invalid-value", `${e}.stackingKey`, "Boost stackingKey must not be empty."), r.stackingPolicy === "replace-weaker" && (!Number.isFinite(r.stackingStrength) || r.stackingStrength <= 0) && U(t, "invalid-value", `${e}.stackingStrength`, "replace-weaker Boost stackingStrength must be positive and finite.");
		let i = m.get(r.stackingKey);
		i !== void 0 && i.policy !== r.stackingPolicy ? U(t, "invalid-value", `${e}.stackingPolicy`, `Boosts sharing stackingKey ${r.stackingKey} must use one stacking policy; ${i.path} uses ${i.policy}.`) : i === void 0 && m.set(r.stackingKey, {
			policy: r.stackingPolicy,
			path: e
		});
	}
	for (let [n, r] of c.entries()) {
		let i = `gachas[${n}]`;
		H(l.currencies, r.cost.currencyId, `${i}.cost.currencyId`, "currency", t), H(l.rngStreams, r.rngStreamName, `${i}.rngStreamName`, "RNG stream", t), B(r.cost.amountPerDraw, `${i}.cost.amountPerDraw`, t, !0), r.allowedDrawCounts.length === 0 && U(t, "invalid-value", `${i}.allowedDrawCounts`, "Gacha requires at least one allowed draw count.");
		let a = /* @__PURE__ */ new Set();
		for (let [e, n] of r.allowedDrawCounts.entries()) (!Number.isSafeInteger(n) || n <= 0) && U(t, "invalid-value", `${i}.allowedDrawCounts[${e}]`, "Gacha draw count must be a positive safe integer."), a.has(n) && U(t, "duplicate-id", `${i}.allowedDrawCounts[${e}]`, `Duplicate Gacha draw count: ${n}`), a.add(n);
		r.pool.length === 0 && U(t, "invalid-value", `${i}.pool`, "Gacha pool must not be empty.");
		let o = /* @__PURE__ */ new Set();
		for (let [n, a] of r.pool.entries()) {
			let r = `${i}.pool[${n}]`;
			o.has(a.id) && U(t, "duplicate-id", `${r}.id`, `Duplicate Gacha pool entry ID: ${a.id}`), o.add(a.id), (!(a.weight > 0) || !Number.isFinite(a.weight)) && U(t, "invalid-value", `${r}.weight`, "Gacha weight must be positive and finite."), a.rarity !== void 0 && a.rarity.length === 0 && U(t, "invalid-value", `${r}.rarity`, "Gacha rarity metadata must not be empty."), t.push(...e.validateGachaReward?.(a.reward, `${r}.reward`) ?? []);
		}
		let s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set();
		for (let [e, n] of (r.guaranteedSlots ?? []).entries()) {
			let a = `${i}.guaranteedSlots[${e}]`;
			dn(n.id, a, s, t), r.allowedDrawCounts.includes(n.drawCount) || U(t, "invalid-value", `${a}.drawCount`, `Guaranteed slot drawCount is not allowed: ${n.drawCount}`), (!Number.isSafeInteger(n.drawIndex) || n.drawIndex < 0 || n.drawIndex >= n.drawCount) && U(t, "invalid-value", `${a}.drawIndex`, "Guaranteed slot drawIndex must be within its drawCount.");
			let l = `${n.drawCount}:${n.drawIndex}`;
			c.has(l) && U(t, "duplicate-id", a, `Duplicate guaranteed Gacha slot: ${l}`), c.add(l), fn(n.poolEntryIds, o, `${a}.poolEntryIds`, t);
		}
		let u = /* @__PURE__ */ new Set();
		for (let [e, n] of (r.batchGuarantees ?? []).entries()) {
			let a = `${i}.batchGuarantees[${e}]`;
			dn(n.id, a, s, t), r.allowedDrawCounts.includes(n.drawCount) || U(t, "invalid-value", `${a}.drawCount`, `Batch guarantee drawCount is not allowed: ${n.drawCount}`), !Number.isSafeInteger(n.batchSize) || n.batchSize <= 0 || n.batchSize > n.drawCount ? U(t, "invalid-value", `${a}.batchSize`, "Batch guarantee batchSize must be a positive safe integer <= drawCount.") : n.drawCount % n.batchSize !== 0 && U(t, "invalid-value", `${a}.batchSize`, "Batch guarantee batchSize must evenly divide drawCount."), u.has(n.drawCount) && U(t, "duplicate-id", a, `Only one batch guarantee may target drawCount ${n.drawCount}.`), u.add(n.drawCount), fn(n.poolEntryIds, o, `${a}.poolEntryIds`, t);
		}
		if (r.pity !== void 0) {
			let e = `${i}.pity`;
			dn(r.pity.id, e, s, t), (!Number.isSafeInteger(r.pity.threshold) || r.pity.threshold <= 0) && U(t, "invalid-value", `${e}.threshold`, "Gacha pity threshold must be a positive safe integer."), fn(r.pity.poolEntryIds, o, `${e}.poolEntryIds`, t);
			let n = new Set(r.pity.poolEntryIds);
			for (let [e, a] of (r.batchGuarantees ?? []).entries()) a.poolEntryIds.some((e) => n.has(e)) || U(t, "invalid-value", `${i}.batchGuarantees[${e}].poolEntryIds`, "Batch guarantee and pity pools must overlap.");
		}
	}
	for (let [n, r] of (e.opportunities ?? []).entries()) {
		let e = `opportunities[${n}]`;
		(!Number.isSafeInteger(r.lifetimeSec) || r.lifetimeSec <= 0) && U(t, "invalid-value", `${e}.lifetimeSec`, "Opportunity lifetimeSec must be a positive safe integer."), r.offlinePolicy !== void 0 && r.offlinePolicy !== "elapse" && r.offlinePolicy !== "pause" && U(t, "invalid-value", `${e}.offlinePolicy`, "Opportunity offlinePolicy must be elapse or pause."), r.dismissalPolicy !== void 0 && r.dismissalPolicy !== "allow" && r.dismissalPolicy !== "forbid" && U(t, "invalid-value", `${e}.dismissalPolicy`, "Opportunity dismissalPolicy must be allow or forbid.");
	}
	for (let [n, r] of (e.rewardedOffers ?? []).entries()) {
		let e = `rewardedOffers[${n}]`;
		r.placementId.length === 0 && U(t, "invalid-value", `${e}.placementId`, "Rewarded Offer placementId must not be empty."), r.rewards.length === 0 && U(t, "invalid-value", `${e}.rewards`, "Rewarded Offer rewards must not be empty."), r.cooldownSec !== void 0 && (!Number.isSafeInteger(r.cooldownSec) || r.cooldownSec < 0) && U(t, "invalid-value", `${e}.cooldownSec`, "Rewarded Offer cooldownSec must be a non-negative safe integer."), r.dailyCap !== void 0 && (!Number.isSafeInteger(r.dailyCap) || r.dailyCap <= 0) && U(t, "invalid-value", `${e}.dailyCap`, "Rewarded Offer dailyCap must be a positive safe integer."), r.eligibility !== void 0 && L(r.eligibility, `${e}.eligibility`, l, t), I(r.rewards, `${e}.rewards`, l, t);
	}
	for (let [n, r] of (e.calendarRewards ?? []).entries()) {
		let e = `calendarRewards[${n}]`;
		r.rewardsByClaim.length === 0 && U(t, "invalid-value", `${e}.rewardsByClaim`, "Calendar reward sequence must not be empty.");
		for (let [n, i] of r.rewardsByClaim.entries()) i.length === 0 && U(t, "invalid-value", `${e}.rewardsByClaim[${n}]`, "Calendar claim reward must not be empty."), I(i, `${e}.rewardsByClaim[${n}]`, l, t);
	}
	for (let [e, n] of a.entries()) {
		let r = `achievements[${e}]`;
		L(n.condition, `${r}.condition`, l, t), I(n.rewards, `${r}.rewards`, l, t), n.displayName !== void 0 && n.displayName.length === 0 && U(t, "invalid-value", `${r}.displayName`, "Achievement displayName must not be empty when specified."), n.description !== void 0 && n.description.length === 0 && U(t, "invalid-value", `${r}.description`, "Achievement description must not be empty when specified."), n.progressMetric !== void 0 && un(n.progressMetric, `${r}.progressMetric`, l, t);
	}
	mn(a, t);
	let h = new Map(o.map((e) => [e.id, e]));
	for (let [e, n] of s.entries()) {
		let r = `missionSets[${e}]`;
		n.missionIds.length === 0 && U(t, "invalid-value", `${r}.missionIds`, "Mission set must contain at least one Mission ID.");
		let i = /* @__PURE__ */ new Set();
		for (let [e, a] of n.missionIds.entries()) {
			let o = `${r}.missionIds[${e}]`;
			i.has(a) && U(t, "duplicate-id", o, `Duplicate Mission ID in set: ${a}`), i.add(a), H(l.missions, a, o, "mission", t);
			let s = h.get(a);
			s !== void 0 && s.setId !== n.id && U(t, "invalid-value", o, `Mission ${a} belongs to ${s.setId}, not ${n.id}.`);
		}
		let a = /* @__PURE__ */ new Set(), o = 0;
		for (let [e, i] of (n.pointMilestones ?? []).entries()) {
			let n = `${r}.pointMilestones[${e}]`;
			a.has(i.id) && U(t, "duplicate-id", `${n}.id`, `Duplicate Mission point milestone ID: ${i.id}`), a.add(i.id), !Number.isSafeInteger(i.pointsRequired) || i.pointsRequired <= 0 ? U(t, "invalid-value", `${n}.pointsRequired`, "Mission point milestone pointsRequired must be a positive safe integer.") : i.pointsRequired <= o && U(t, "invalid-value", `${n}.pointsRequired`, "Mission point milestones must be authored in strictly increasing point order."), o = Math.max(o, i.pointsRequired), i.rewards.length === 0 && U(t, "invalid-value", `${n}.rewards`, "Mission point milestone rewards must not be empty."), I(i.rewards, `${n}.rewards`, l, t);
		}
	}
	let g = new Map(s.map((e) => [e.id, new Set(e.missionIds)]));
	for (let [e, n] of o.entries()) {
		let r = `missions[${e}]`;
		H(l.missionSets, n.setId, `${r}.setId`, "mission set", t);
		let i = g.get(n.setId);
		i !== void 0 && !i.has(n.id) && U(t, "invalid-value", `${r}.setId`, `Mission ${n.id} is not listed by Mission set ${n.setId}.`), n.objective.type === "condition" ? (L(n.objective.condition, `${r}.objective.condition`, l, t), n.objective.progressMetric !== void 0 && un(n.objective.progressMetric, `${r}.objective.progressMetric`, l, t)) : (n.objective.metricId.length === 0 && U(t, "invalid-value", `${r}.objective.metricId`, "Mission counter metricId must not be empty."), vn(n.objective.target, `${r}.objective.target`, t)), n.rewards.length === 0 && U(t, "invalid-value", `${r}.rewards`, "Mission rewards must not be empty."), I(n.rewards, `${r}.rewards`, l, t), n.points !== void 0 && (!Number.isSafeInteger(n.points) || n.points < 0) && U(t, "invalid-value", `${r}.points`, "Mission points must be a non-negative safe integer."), n.displayName !== void 0 && n.displayName.length === 0 && U(t, "invalid-value", `${r}.displayName`, "Mission displayName must not be empty when specified."), n.description !== void 0 && n.description.length === 0 && U(t, "invalid-value", `${r}.description`, "Mission description must not be empty when specified.");
	}
	for (let [n, r] of (e.prestiges ?? []).entries()) {
		let e = `prestiges[${n}]`;
		L(r.eligibility, `${e}.eligibility`, l, t), pn(r.resetPolicy, `${e}.resetPolicy`, l, t);
	}
	for (let n of e.additionalConditions ?? []) L(n.condition, n.path, l, t);
	for (let n of e.additionalRewardSets ?? []) I(n.rewards, n.path, l, t);
	return t;
}
function on(e) {
	let t = an(e);
	if (t.length !== 0) throw Error(`Invalid definition bundle:\n${t.map((e) => `- [${e.code}] ${e.path}: ${e.message}`).join("\n")}`);
}
function P(e, t, n, r) {
	sn(e.map((e) => e.id), t, n, r);
}
function sn(e, t, n, r) {
	let i = /* @__PURE__ */ new Set();
	for (let [a, o] of e.entries()) {
		let e = `${t}[${a}]`;
		o.length === 0 && U(n, "invalid-value", e, "Definition ID must not be empty."), i.has(o) && U(n, "duplicate-id", e, `Duplicate ID in ${t}: ${o}`), i.add(o);
		let s = r.get(o);
		s !== void 0 && s !== t ? U(n, "duplicate-id", e, `ID ${o} is also declared in ${s}.`) : s === void 0 && r.set(o, t);
	}
}
function cn(e, t, n) {
	e.precision !== void 0 != (e.roundingMode !== void 0) && U(n, "invalid-value", t, "Currency precision and roundingMode must be specified together."), e.precision !== void 0 && (!Number.isSafeInteger(e.precision) || e.precision < 0) && U(n, "invalid-value", `${t}.precision`, "Currency precision must be a non-negative safe integer."), e.cap !== void 0 && B(e.cap, `${t}.cap`, n, !0), e.displayName !== void 0 && e.displayName.length === 0 && U(n, "invalid-value", `${t}.displayName`, "Currency displayName must not be empty when specified."), e.symbol !== void 0 && e.symbol.length === 0 && U(n, "invalid-value", `${t}.symbol`, "Currency symbol must not be empty when specified.");
}
function ln(e, t, n, r, i) {
	e.mode !== t && U(i, "invalid-value", `${n}.mode`, `Activity mode must be ${t}.`), e.eligibility !== void 0 && L(e.eligibility, `${n}.eligibility`, r, i), e.concurrencyGroupId !== void 0 && (e.concurrencyGroupId.length === 0 ? U(i, "invalid-value", `${n}.concurrencyGroupId`, "Activity concurrencyGroupId must not be empty.") : H(r.activityConcurrencyGroups, e.concurrencyGroupId, `${n}.concurrencyGroupId`, "activity concurrency group", i)), e.slotCost !== void 0 && (!Number.isSafeInteger(e.slotCost) || e.slotCost <= 0) && U(i, "invalid-value", `${n}.slotCost`, "Activity slotCost must be a positive safe integer.");
	for (let [t, a] of (e.startCosts ?? []).entries()) {
		let e = `${n}.startCosts[${t}]`;
		if (a.type === "currency") {
			H(r.currencies, a.currencyId, `${e}.currencyId`, "currency", i), B(a.amount, `${e}.amount`, i, !0);
			try {
				x.from(a.amount).isZero() && U(i, "invalid-value", `${e}.amount`, "Activity currency start cost must be positive.");
			} catch {}
			continue;
		}
		H(r.tokens, a.tokenId, `${e}.tokenId`, "token", i), yn(a.count, `${e}.count`, "Activity token start cost", i);
	}
}
function F(e, t, n) {
	switch (e.type) {
		case "linear":
			B(e.base, `${t}.base`, n, !1), B(e.step, `${t}.step`, n, !1);
			return;
		case "polynomial":
			e.coefficients.length === 0 && U(n, "invalid-value", `${t}.coefficients`, "Polynomial curve must contain at least one coefficient."), e.coefficients.forEach((e, r) => B(e, `${t}.coefficients[${r}]`, n, !1));
			return;
		case "geometric":
			B(e.base, `${t}.base`, n, !1), (!(e.ratio > 0) || !Number.isFinite(e.ratio)) && U(n, "invalid-value", `${t}.ratio`, "Geometric curve ratio must be positive and finite.");
			return;
		case "table":
			e.values.length === 0 && U(n, "invalid-value", `${t}.values`, "Curve table must not be empty."), e.values.forEach((e, r) => B(e, `${t}.values[${r}]`, n, !1));
			return;
		case "piecewise": {
			(e.segments.length === 0 || e.segments[0]?.startIndex !== 0) && U(n, "invalid-value", `${t}.segments`, "Piecewise curve must start with segment index 0.");
			let r = -1;
			for (let [i, a] of e.segments.entries()) {
				let e = `${t}.segments[${i}]`;
				(!Number.isSafeInteger(a.startIndex) || a.startIndex <= r) && U(n, "invalid-value", `${e}.startIndex`, "Piecewise segment startIndex must be strictly increasing safe integers."), r = a.startIndex, F(a.curve, `${e}.curve`, n);
			}
		}
	}
}
function I(e, t, n, r) {
	for (let [i, a] of e.entries()) {
		let e = `${t}[${i}]`;
		switch (a.type) {
			case "currency":
				H(n.currencies, a.currencyId, `${e}.currencyId`, "currency", r), B(a.amount, `${e}.amount`, r, !0);
				break;
			case "producer":
				H(n.producers, a.producerId, `${e}.producerId`, "producer", r), yn(a.count, `${e}.count`, "Producer reward count", r);
				break;
			case "character":
				H(n.characters, a.characterDefinitionId, `${e}.characterDefinitionId`, "character", r);
				break;
			case "token":
				H(n.tokens, a.tokenId, `${e}.tokenId`, "token", r), yn(a.count, `${e}.count`, "Token reward count", r);
				break;
			case "boost":
				H(n.boosts, a.boostId, `${e}.boostId`, "boost", r);
				break;
			case "permanent-modifier":
				H(n.permanentModifiers, a.modifierId, `${e}.modifierId`, "permanent modifier", r);
				break;
			case "activity-advance":
				H(n.activities, a.activityId, `${e}.activityId`, "activity", r), (!Number.isSafeInteger(a.seconds) || a.seconds <= 0) && U(r, "invalid-value", `${e}.seconds`, "Activity advance reward seconds must be a positive safe integer.");
				break;
			case "title":
				H(n.titles, a.titleId, `${e}.titleId`, "title", r);
				break;
			case "unlock":
				H(n.unlockFlags, a.flagId, `${e}.flagId`, "unlock flag", r);
				break;
			case "composite": I(a.rewards, `${e}.rewards`, n, r);
		}
	}
}
function L(e, t, n, r) {
	switch (e.type) {
		case "and":
		case "or":
			e.conditions.forEach((e, i) => L(e, `${t}.conditions[${i}]`, n, r));
			return;
		case "not":
			L(e.condition, `${t}.condition`, n, r);
			return;
		case "currency-balance-at-least":
		case "lifetime-currency-earned-at-least":
			H(n.currencies, e.currencyId, `${t}.currencyId`, "currency", r), B(e.amount, `${t}.amount`, r, !0);
			return;
		case "producer-count-at-least":
			H(n.producers, e.producerId, `${t}.producerId`, "producer", r), (!Number.isSafeInteger(e.count) || e.count < 0) && U(r, "invalid-value", `${t}.count`, "Producer condition count must be a non-negative safe integer.");
			return;
		case "producer-level-at-least":
			H(n.producers, e.producerId, `${t}.producerId`, "producer", r), V(e.level, `${t}.level`, "Producer level", r);
			return;
		case "character-owned":
			H(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r);
			return;
		case "character-level-at-least":
			H(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r), V(e.level, `${t}.level`, "Character level", r);
			return;
		case "activity-progress-at-least":
			H(n.activities, e.activityId, `${t}.activityId`, "activity", r), (!Number.isFinite(e.progress) || e.progress < 0) && U(r, "invalid-value", `${t}.progress`, "Activity progress condition must be finite and non-negative.");
			return;
		case "activity-milestone-reached": {
			H(n.activities, e.activityId, `${t}.activityId`, "activity", r);
			let i = n.activityMilestones.get(e.activityId);
			i !== void 0 && !i.has(e.milestoneId) && U(r, "missing-reference", `${t}.milestoneId`, `Unknown activity milestone ID: ${e.milestoneId}`);
			return;
		}
		case "achievement-completed":
			H(n.achievements, e.achievementId, `${t}.achievementId`, "achievement", r);
			return;
		case "prestige-count-at-least":
			H(n.prestiges, e.prestigeId, `${t}.prestigeId`, "prestige", r), (!Number.isSafeInteger(e.count) || e.count < 0) && U(r, "invalid-value", `${t}.count`, "Prestige count must be a non-negative safe integer.");
			return;
		case "gacha-draw-count-at-least":
			H(n.gachas, e.gachaId, `${t}.gachaId`, "gacha", r), (!Number.isSafeInteger(e.count) || e.count < 0) && U(r, "invalid-value", `${t}.count`, "Gacha draw count must be a non-negative safe integer.");
			return;
		case "calendar-streak-at-least":
			H(n.calendarRewards, e.calendarRewardId, `${t}.calendarRewardId`, "calendar reward", r), (!Number.isSafeInteger(e.count) || e.count < 0) && U(r, "invalid-value", `${t}.count`, "Calendar streak count must be a non-negative safe integer.");
			return;
		case "unlock-flag": H(n.unlockFlags, e.flagId, `${t}.flagId`, "unlock flag", r);
	}
}
function un(e, t, n, r) {
	switch (e.type) {
		case "currency-balance":
		case "lifetime-currency-earned":
			H(n.currencies, e.currencyId, `${t}.currencyId`, "currency", r), vn(e.target, `${t}.target`, r);
			return;
		case "producer-count":
		case "producer-level":
			H(n.producers, e.producerId, `${t}.producerId`, "producer", r), R(e.target, `${t}.target`, r);
			return;
		case "character-level":
			H(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r), R(e.target, `${t}.target`, r);
			return;
		case "activity-progress":
			H(n.activities, e.activityId, `${t}.activityId`, "activity", r), (!Number.isFinite(e.target) || e.target <= 0 || e.target > 1) && U(r, "invalid-value", `${t}.target`, "Activity progress target must be > 0 and <= 1.");
			return;
		case "gacha-draw-count":
			H(n.gachas, e.gachaId, `${t}.gachaId`, "gacha", r), R(e.target, `${t}.target`, r);
			return;
		case "prestige-count":
			H(n.prestiges, e.prestigeId, `${t}.prestigeId`, "prestige", r), R(e.target, `${t}.target`, r);
			return;
		case "calendar-streak": H(n.calendarRewards, e.calendarRewardId, `${t}.calendarRewardId`, "calendar reward", r), R(e.target, `${t}.target`, r);
	}
}
function R(e, t, n) {
	(!Number.isFinite(e) || e <= 0) && U(n, "invalid-value", t, "Achievement progress target must be a positive finite number.");
}
function dn(e, t, n, r) {
	e.length === 0 && U(r, "invalid-value", `${t}.id`, "Gacha rule ID must not be empty."), n.has(e) && U(r, "duplicate-id", `${t}.id`, `Duplicate Gacha rule ID: ${e}`), n.add(e);
}
function fn(e, t, n, r) {
	e.length === 0 && U(r, "invalid-value", n, "Gacha rule pool must not be empty.");
	let i = /* @__PURE__ */ new Set();
	for (let [a, o] of e.entries()) i.has(o) && U(r, "duplicate-id", `${n}[${a}]`, `Duplicate Gacha rule pool entry ID: ${o}`), i.add(o), t.has(o) || U(r, "missing-reference", `${n}[${a}]`, `Unknown Gacha pool entry ID: ${o}`);
}
function pn(e, t, n, r) {
	z(e.currencies, n.currencies, `${t}.currencies`, "currency", r), z(e.tokens, n.tokens, `${t}.tokens`, "token", r), z(e.producers, n.producers, `${t}.producers`, "producer", r), z(e.characters, n.characters, `${t}.characters`, "character", r), z(e.achievements, n.achievements, `${t}.achievements`, "achievement", r), z(e.titles, n.titles, `${t}.titles`, "title", r), z(e.progressionFlags, n.unlockFlags, `${t}.progressionFlags`, "unlock flag", r), z(e.gachaStates, n.gachas, `${t}.gachaStates`, "gacha", r), z(e.activeBoosts, n.boosts, `${t}.activeBoosts`, "boost", r);
}
function z(e, t, n, r, i) {
	if (e === void 0 || e === "retain" || e === "reset") return;
	let a = /* @__PURE__ */ new Set();
	for (let [o, s] of e.resetIds.entries()) a.has(s) && U(i, "duplicate-id", `${n}.resetIds[${o}]`, `Duplicate reset ${r} ID: ${s}`), a.add(s), H(t, s, `${n}.resetIds[${o}]`, r, i);
}
function mn(e, t) {
	let n = new Map(e.map((e) => [e.id, hn(e.condition)])), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = (e, o) => {
		if (!i.has(e)) {
			if (r.has(e)) {
				let n = o.indexOf(e);
				U(t, "cyclic-dependency", "achievements", `Achievement dependency cycle: ${[...o.slice(Math.max(0, n)), e].join(" -> ")}`);
				return;
			}
			r.add(e);
			for (let t of n.get(e) ?? []) n.has(t) && a(t, [...o, e]);
			r.delete(e), i.add(e);
		}
	};
	for (let e of n.keys()) a(e, []);
}
function hn(e) {
	switch (e.type) {
		case "achievement-completed": return [e.achievementId];
		case "and":
		case "or": return e.conditions.flatMap(hn);
		case "not": return hn(e.condition);
		default: return [];
	}
}
function gn(e, t, n) {
	e.target.length === 0 && U(n, "invalid-value", `${t}.target`, "Modifier target must not be empty."), e.source.length === 0 && U(n, "invalid-value", `${t}.source`, "Modifier source must not be empty."), _n(e, t, n);
}
function _n(e, t, n) {
	B(e.value, `${t}.value`, n, !1), e.operation === "override" ? e.overridePriority !== void 0 && !Number.isSafeInteger(e.overridePriority) && U(n, "invalid-value", `${t}.overridePriority`, "Override priority must be a safe integer when specified.") : e.overridePriority !== void 0 && U(n, "invalid-value", `${t}.overridePriority`, "overridePriority is only valid for override modifiers.");
}
function vn(e, t, n) {
	try {
		x.from(e).compare(0) <= 0 && U(n, "invalid-value", t, "Value must be positive.");
	} catch {
		U(n, "invalid-value", t, "Value must be a finite GameNumber.");
	}
}
function B(e, t, n, r) {
	try {
		let i = x.from(e);
		r && i.isNegative() && U(n, "invalid-value", t, "Value must be non-negative.");
	} catch {
		U(n, "invalid-value", t, "Value must be a finite GameNumber.");
	}
}
function V(e, t, n, r) {
	(!Number.isSafeInteger(e) || e < 1) && U(r, "invalid-value", t, `${n} must be a positive safe integer.`);
}
function yn(e, t, n, r) {
	(!Number.isSafeInteger(e) || e <= 0) && U(r, "invalid-value", t, `${n} must be a positive safe integer.`);
}
function H(e, t, n, r, i) {
	e.has(t) || U(i, "missing-reference", n, `Unknown ${r} ID: ${t}`);
}
function U(e, t, n, r) {
	e.push({
		code: t,
		path: n,
		message: r
	});
}
//#endregion
//#region src/domain/rng/rng.ts
var bn = 4294967296;
function xn(e) {
	let t = e.state + 1831565813 >>> 0, n = t;
	return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), {
		value: ((n ^ n >>> 14) >>> 0) / bn,
		stream: {
			algorithmId: "mulberry32-v1",
			state: t
		}
	};
}
function Sn(e, t) {
	if (!(t >= 0 && t < 1)) throw RangeError("randomValue must be in [0, 1).");
	if (e.length === 0) throw RangeError("Weighted candidate list must not be empty.");
	let n = 0;
	for (let t of e) {
		if (!(t.weight > 0) || !Number.isFinite(t.weight)) throw RangeError("Weighted candidate weights must be positive and finite.");
		n += t.weight;
	}
	if (!Number.isFinite(n)) throw RangeError("Weighted candidate total weight must be finite.");
	let r = t * n, i = 0;
	for (let t of e) if (i += t.weight, r < i) return t;
	return e[e.length - 1];
}
function Cn(e, t) {
	let n = e >>> 0;
	return Object.fromEntries(t.map((e, t) => [e, {
		algorithmId: "mulberry32-v1",
		state: wn(n, t + 1, e)
	}]));
}
function wn(e, t, n) {
	let r = (e ^ Math.imul(t, 2654435769)) >>> 0;
	for (let e of n) r = Math.imul(r ^ e.codePointAt(0), 2246822507) >>> 0;
	return r || 1831565813;
}
//#endregion
//#region src/domain/gacha/gacha.ts
function Tn(e) {
	if (On(e.definition), !e.definition.allowedDrawCounts.includes(e.drawCount)) return Mn(e.state, "invalid-draw-count");
	let t = e.state.rngStreams[e.definition.rngStreamName];
	if (t === void 0) return Mn(e.state, "missing-rng-stream");
	let n = x.from(e.definition.cost.amountPerDraw).multiply(e.drawCount), r = tt(e.state.currencies, {
		currencyId: e.definition.cost.currencyId,
		amount: n,
		kind: "spend",
		source: `gacha.${e.definition.id}`
	}, e.resolveCurrencyDefinition?.(e.definition.cost.currencyId));
	if (!r.accepted) return Mn(e.state, "insufficient-currency");
	let i = {
		...e.state,
		currencies: r.balances
	};
	i = mt(i, e.definition.cost.currencyId, r.appliedAmount);
	let a = e.state.gachaStates[e.definition.id], o = a?.totalDrawCount ?? 0, s = a?.pityMissCount ?? 0, c = t, l = [], u = e.definition.batchGuarantees?.find((t) => t.drawCount === e.drawCount);
	for (let t = 0; t < e.drawCount; t += 1) {
		let n = En({
			definition: e.definition,
			drawCount: e.drawCount,
			drawIndex: t,
			stream: c,
			pityMissCount: s
		});
		if (c = n.stream, s = n.pityMissCount, l.push(n.draw), u === void 0 || (t + 1) % u.batchSize !== 0) continue;
		let r = t + 1 - u.batchSize, i = l.slice(r, t + 1), a = new Set(u.poolEntryIds);
		if (i.some((e) => a.has(e.entry.id))) continue;
		s = l[t].pityMissCountBefore;
		let o = Math.floor(t / u.batchSize), d = En({
			definition: e.definition,
			drawCount: e.drawCount,
			drawIndex: t,
			stream: c,
			pityMissCount: s,
			forcedPoolEntryIds: u.poolEntryIds,
			forcedSelectionRule: {
				kind: "batch-guarantee",
				ruleId: u.id,
				batchIndex: o
			}
		});
		c = d.stream, s = d.pityMissCount, l[t] = d.draw;
	}
	let d = [], f = e.definition.duplicatePolicy ?? "resolve-with-hook";
	for (let [t, n] of l.entries()) {
		let r = o + t + 1, a = {
			gachaId: e.definition.id,
			entryId: n.entry.id,
			drawIndex: t,
			globalDrawNumber: r,
			selectionRule: n.selectionRule
		}, s = e.hooks.isDuplicate(i, n.entry.reward);
		s ? f === "resolve-with-hook" ? i = e.hooks.grantDuplicate(i, n.entry.reward, a) : f === "grant-again" && (i = e.hooks.grantReward(i, n.entry.reward, a)) : i = e.hooks.grantReward(i, n.entry.reward, a);
		let c = {
			...a,
			duplicate: s,
			duplicatePolicy: f
		};
		d.push({
			id: `${e.definition.id}:draw:${r}:${e.state.simTimeSec}`,
			type: "gachaDrawn",
			simTimeSec: e.state.simTimeSec,
			payload: c
		});
	}
	let p = e.definition.pity === void 0 ? { totalDrawCount: o + e.drawCount } : {
		totalDrawCount: o + e.drawCount,
		pityMissCount: s
	};
	return i = {
		...i,
		rngStreams: {
			...i.rngStreams,
			[e.definition.rngStreamName]: c
		},
		gachaStates: {
			...i.gachaStates,
			[e.definition.id]: p
		}
	}, {
		accepted: !0,
		state: i,
		events: d
	};
}
function En(e) {
	let t = xn(e.stream), n = e.definition.pity, r = n !== void 0 && e.pityMissCount + 1 >= n.threshold, i = e.definition.guaranteedSlots?.find((t) => t.drawCount === e.drawCount && t.drawIndex === e.drawIndex), a, o;
	e.forcedPoolEntryIds === void 0 ? r && n !== void 0 ? (a = {
		kind: "pity",
		ruleId: n.id
	}, o = n.poolEntryIds) : i === void 0 ? (a = null, o = void 0) : (a = {
		kind: "guaranteed-slot",
		ruleId: i.id
	}, o = i.poolEntryIds) : (a = e.forcedSelectionRule ?? null, o = r && n !== void 0 ? jn(e.forcedPoolEntryIds, n.poolEntryIds) : e.forcedPoolEntryIds);
	let s = Dn(o === void 0 ? e.definition.pool : e.definition.pool.filter((e) => o.includes(e.id)), t.value), c = n === void 0 ? e.pityMissCount : n.poolEntryIds.includes(s.id) ? 0 : e.pityMissCount + 1;
	return {
		draw: {
			entry: s,
			selectionRule: a,
			pityMissCountBefore: e.pityMissCount
		},
		stream: t.stream,
		pityMissCount: c
	};
}
function Dn(e, t) {
	return Sn(e, t);
}
function On(e) {
	if (e.pool.length === 0) throw RangeError("Gacha pool must not be empty.");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.pool) {
		if (t.has(n.id)) throw RangeError(`Duplicate Gacha pool entry ID: ${n.id}`);
		if (t.add(n.id), !(n.weight > 0) || !Number.isFinite(n.weight)) throw RangeError(`Gacha weight must be positive and finite: ${n.id}`);
		if (n.rarity !== void 0 && n.rarity.length === 0) throw RangeError(`Gacha rarity must not be empty: ${n.id}`);
	}
	if (x.from(e.cost.amountPerDraw).isNegative()) throw RangeError("Gacha cost must be non-negative.");
	if (e.allowedDrawCounts.length === 0) throw RangeError("Gacha must allow at least one draw count.");
	let n = /* @__PURE__ */ new Set();
	for (let t of e.allowedDrawCounts) {
		if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("Allowed Gacha draw counts must be positive safe integers.");
		if (n.has(t)) throw RangeError(`Duplicate allowed Gacha draw count: ${t}`);
		n.add(t);
	}
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
	for (let a of e.guaranteedSlots ?? []) {
		if (kn(a.id, r), !n.has(a.drawCount)) throw RangeError(`Guaranteed slot drawCount is not allowed: ${a.drawCount}`);
		if (!Number.isSafeInteger(a.drawIndex) || a.drawIndex < 0 || a.drawIndex >= a.drawCount) throw RangeError(`Guaranteed slot drawIndex is outside its drawCount: ${a.drawIndex}`);
		let e = `${a.drawCount}:${a.drawIndex}`;
		if (i.has(e)) throw RangeError(`Duplicate guaranteed Gacha slot: ${e}`);
		i.add(e), An(a.poolEntryIds, t, `Guaranteed slot ${a.id}`);
	}
	let a = /* @__PURE__ */ new Set();
	for (let i of e.batchGuarantees ?? []) {
		if (kn(i.id, r), !n.has(i.drawCount)) throw RangeError(`Batch guarantee drawCount is not allowed: ${i.drawCount}`);
		if (!Number.isSafeInteger(i.batchSize) || i.batchSize <= 0 || i.batchSize > i.drawCount) throw RangeError(`Batch guarantee batchSize must be a positive safe integer <= drawCount: ${i.id}`);
		if (i.drawCount % i.batchSize !== 0) throw RangeError(`Batch guarantee batchSize must evenly divide drawCount: ${i.id}`);
		if (a.has(i.drawCount)) throw RangeError(`Only one batch guarantee may target a drawCount: ${i.drawCount}`);
		a.add(i.drawCount), An(i.poolEntryIds, t, `Batch guarantee ${i.id}`);
	}
	if (e.pity !== void 0) {
		if (kn(e.pity.id, r), !Number.isSafeInteger(e.pity.threshold) || e.pity.threshold <= 0) throw RangeError("Gacha pity threshold must be a positive safe integer.");
		An(e.pity.poolEntryIds, t, `Pity ${e.pity.id}`);
		for (let t of e.batchGuarantees ?? []) if (jn(t.poolEntryIds, e.pity.poolEntryIds).length === 0) throw RangeError(`Batch guarantee and pity pools must overlap: ${t.id}`);
	}
}
function kn(e, t) {
	if (e.length === 0) throw RangeError("Gacha rule ID must not be empty.");
	if (t.has(e)) throw RangeError(`Duplicate Gacha rule ID: ${e}`);
	t.add(e);
}
function An(e, t, n) {
	if (e.length === 0) throw RangeError(`${n} pool must not be empty.`);
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		if (r.has(i)) throw RangeError(`${n} contains duplicate pool entry ID: ${i}`);
		if (r.add(i), !t.has(i)) throw RangeError(`${n} references unknown pool entry ID: ${i}`);
	}
}
function jn(e, t) {
	let n = new Set(t);
	return e.filter((e) => n.has(e));
}
function Mn(e, t) {
	return {
		accepted: !1,
		state: e,
		events: [],
		reason: t
	};
}
//#endregion
//#region src/domain/inventory/inventory.ts
function Nn(e, t) {
	return Vn(t) ? e[t.instanceId] === void 0 ? {
		accepted: !0,
		inventory: {
			...e,
			[t.instanceId]: t
		}
	} : {
		accepted: !1,
		inventory: e,
		reason: "duplicate-instance"
	} : {
		accepted: !1,
		inventory: e,
		reason: "invalid-item"
	};
}
function Pn(e, t) {
	let n = e[t];
	if (n === void 0) return {
		accepted: !1,
		inventory: e,
		reason: "unknown-instance"
	};
	let r = { ...e };
	return delete r[t], {
		accepted: !0,
		inventory: r,
		removed: n
	};
}
function Fn(e) {
	G(e);
	let t = e.slots.filter((e) => e.initiallyLocked === !0).map((e) => e.id);
	return {
		definitionId: e.id,
		equipped: Object.fromEntries(e.slots.map((e) => [e.id, null])),
		...t.length > 0 ? { lockedSlotIds: t } : {}
	};
}
function W(e, t) {
	return !(e.lockedSlotIds ?? []).includes(t);
}
function In(e, t, n) {
	if (G(e), t.definitionId !== e.id) return {
		accepted: !1,
		loadout: t,
		reason: "definition-mismatch"
	};
	if (!e.slots.some((e) => e.id === n)) return {
		accepted: !1,
		loadout: t,
		reason: "unknown-slot"
	};
	if (W(t, n)) return {
		accepted: !0,
		loadout: t,
		changed: !1
	};
	let r = (t.lockedSlotIds ?? []).filter((e) => e !== n), i = {
		definitionId: t.definitionId,
		equipped: t.equipped
	};
	return {
		accepted: !0,
		loadout: r.length > 0 ? {
			...i,
			lockedSlotIds: r
		} : i,
		changed: !0
	};
}
function Ln(e) {
	if (G(e.loadoutDefinition), e.loadout.definitionId !== e.loadoutDefinition.id) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "definition-mismatch"
	};
	let t = e.loadoutDefinition.slots.find((t) => t.id === e.slotId);
	if (t === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-slot"
	};
	if (!W(e.loadout, e.slotId)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-locked"
	};
	let n = e.inventory[e.itemInstanceId];
	if (n === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item"
	};
	let r = e.itemDefinitions[n.definitionId];
	if (r === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item-definition"
	};
	if (!Bn(t, r)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-restriction"
	};
	if (Object.entries(e.loadout.equipped).find(([t, n]) => t !== e.slotId && n === e.itemInstanceId) !== void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "already-equipped"
	};
	let i = e.loadout.equipped[e.slotId] ?? null;
	return i === e.itemInstanceId ? {
		accepted: !0,
		loadout: e.loadout,
		replacedItemInstanceId: i
	} : {
		accepted: !0,
		loadout: {
			...e.loadout,
			equipped: {
				...e.loadout.equipped,
				[e.slotId]: e.itemInstanceId
			}
		},
		replacedItemInstanceId: i
	};
}
function Rn(e, t, n) {
	if (G(e), t.definitionId !== e.id) return {
		accepted: !1,
		loadout: t,
		reason: "definition-mismatch"
	};
	if (!e.slots.some((e) => e.id === n)) return {
		accepted: !1,
		loadout: t,
		reason: "unknown-slot"
	};
	let r = t.equipped[n] ?? null;
	return r === null ? {
		accepted: !0,
		loadout: t,
		removedItemInstanceId: r
	} : {
		accepted: !0,
		loadout: {
			...t,
			equipped: {
				...t.equipped,
				[n]: null
			}
		},
		removedItemInstanceId: r
	};
}
function zn(e) {
	if (G(e.loadoutDefinition), e.loadout.definitionId !== e.loadoutDefinition.id) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "definition-mismatch"
	};
	let t = e.loadoutDefinition.slots.find((t) => t.id === e.fromSlotId), n = e.loadoutDefinition.slots.find((t) => t.id === e.toSlotId);
	if (t === void 0 || n === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-slot"
	};
	let r = e.loadout.equipped[e.fromSlotId] ?? null;
	if (r === null) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "source-empty"
	};
	if (e.fromSlotId === e.toSlotId) return {
		accepted: !0,
		loadout: e.loadout,
		movedItemInstanceId: r,
		swappedItemInstanceId: null
	};
	if (!W(e.loadout, e.toSlotId)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-locked"
	};
	let i = e.inventory[r];
	if (i === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item"
	};
	let a = e.itemDefinitions[i.definitionId];
	if (a === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item-definition"
	};
	if (!Bn(n, a)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-restriction"
	};
	let o = e.loadout.equipped[e.toSlotId] ?? null;
	if (o !== null) {
		if (e.allowSwap !== !0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "target-occupied"
		};
		let n = e.inventory[o];
		if (n === void 0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "unknown-item"
		};
		let r = e.itemDefinitions[n.definitionId];
		if (r === void 0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "unknown-item-definition"
		};
		if (!Bn(t, r)) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "slot-restriction"
		};
	}
	return {
		accepted: !0,
		loadout: {
			...e.loadout,
			equipped: {
				...e.loadout.equipped,
				[e.fromSlotId]: o,
				[e.toSlotId]: r
			}
		},
		movedItemInstanceId: r,
		swappedItemInstanceId: o
	};
}
function Bn(e, t) {
	if (e.acceptsTags === void 0 || e.acceptsTags.length === 0) return !0;
	let n = new Set(t.tags ?? []);
	return e.acceptsTags.some((e) => n.has(e));
}
function Vn(e) {
	return e.instanceId.length > 0 && e.definitionId.length > 0 && Number.isSafeInteger(e.quantity) && e.quantity > 0;
}
function G(e) {
	if (e.id.length === 0) throw RangeError("Loadout id must not be empty.");
	if (e.slots.length === 0) throw RangeError("Loadout must contain at least one slot.");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.slots) {
		if (n.id.length === 0) throw RangeError("Loadout slot id must not be empty.");
		if (t.has(n.id)) throw RangeError(`Duplicate loadout slot id: ${n.id}`);
		if (t.add(n.id), n.acceptsTags?.some((e) => e.length === 0)) throw RangeError(`Loadout slot ${n.id} contains an empty accepted tag.`);
	}
}
//#endregion
//#region src/domain/level/level.ts
function Hn(e) {
	Gn(e.currentLevel, "currentLevel");
	let t = e.count ?? 1;
	if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("Level-up count must be a positive safe integer.");
	Wn(e.definition);
	let n = Un(e.definition);
	if (n !== null && e.currentLevel >= n) return {
		available: !1,
		currentLevel: e.currentLevel,
		requestedCount: t,
		reason: "max-level"
	};
	if (t > 2 ** 53 - 1 - e.currentLevel) throw RangeError("Target level must remain a safe integer.");
	let r = e.currentLevel + t;
	if (n !== null && r > n) return {
		available: !1,
		currentLevel: e.currentLevel,
		requestedCount: t,
		reason: "exceeds-max-level"
	};
	if (e.definition.eligibility !== void 0) {
		if (e.conditionContext === void 0) throw Error("Level eligibility requires conditionContext.");
		if (!E(e.definition.eligibility, e.conditionContext)) return {
			available: !1,
			currentLevel: e.currentLevel,
			requestedCount: t,
			reason: "ineligible"
		};
	}
	let i = C(e.definition.costCurve, e.currentLevel - 1, t);
	if (i.isNegative()) throw RangeError("Level-up cost curve must not produce a negative interval cost.");
	let a = [...e.definition.milestones ?? []].filter((t) => e.currentLevel < t.level && t.level <= r).toSorted((e, t) => e.level - t.level || e.id.localeCompare(t.id));
	return {
		available: !0,
		currentLevel: e.currentLevel,
		targetLevel: r,
		count: t,
		totalCost: i,
		currentStat: e.definition.statCurve === void 0 ? null : S(e.definition.statCurve, e.currentLevel - 1),
		targetStat: e.definition.statCurve === void 0 ? null : S(e.definition.statCurve, r - 1),
		crossedMilestones: a
	};
}
function Un(e) {
	let t = [
		e.maxLevel ?? null,
		e.costCurve.type === "table" ? e.costCurve.values.length + 1 : null,
		e.statCurve?.type === "table" ? e.statCurve.values.length : null
	].filter((e) => e !== null);
	return t.length === 0 ? null : Math.min(...t);
}
function Wn(e) {
	e.maxLevel !== void 0 && Gn(e.maxLevel, "maxLevel");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.milestones ?? []) {
		if (t.has(n.id)) throw RangeError(`Duplicate level milestone ID: ${n.id}`);
		t.add(n.id), Gn(n.level, `milestone ${n.id} level`);
	}
}
function Gn(e, t) {
	if (!Number.isSafeInteger(e) || e < 1) throw RangeError(`${t} must be a positive safe integer.`);
}
//#endregion
//#region src/domain/mission/mission.ts
function Kn(e, t, n, r) {
	q(n);
	let i = K(e, t.id, n), a = i?.completed === !0, o = i?.claimed === !0;
	return {
		id: t.id,
		completed: a,
		claimed: o,
		claimable: a && !o && (t.claimPolicy ?? "manual") === "manual",
		progress: a ? 1 : er(i, t, r),
		points: ur(t.points)
	};
}
function qn(e, t, n, r) {
	q(r);
	let i = nr(e, t, n, r), a = ar(e, t.id, r), o = new Set(a?.claimedMilestoneIds ?? []);
	return {
		id: t.id,
		periodIndex: r,
		points: i,
		milestones: (t.pointMilestones ?? []).map((e) => ({
			id: e.id,
			pointsRequired: e.pointsRequired,
			claimed: o.has(e.id),
			claimable: i >= e.pointsRequired && !o.has(e.id) && (e.claimPolicy ?? "manual") === "manual"
		}))
	};
}
function Jn(e) {
	if (q(e.periodIndex), ir(e.state, e.setDefinition, e.missionDefinitions, e.periodIndex)) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "clock-rollback"
	};
	let t = rr(e.setDefinition, e.missionDefinitions), n = e.state, r = [];
	for (let i of e.setDefinition.missionIds) {
		let a = t.get(i);
		if (a === void 0 || a.objective.type !== "condition" || K(n, a.id, e.periodIndex)?.completed === !0 || !E(a.objective.condition, e.createConditionContext(n))) continue;
		let o = Qn(n, a, e.periodIndex, e.grantRewards);
		n = o.state, r.push(...o.events);
	}
	let i = $n(n, e.setDefinition, e.missionDefinitions, e.periodIndex, e.grantRewards);
	return {
		accepted: !0,
		state: i.state,
		events: [...r, ...i.events]
	};
}
function Yn(e) {
	if (q(e.periodIndex), ir(e.state, e.setDefinition, e.missionDefinitions, e.periodIndex)) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "clock-rollback"
	};
	let t = tr(e.updates), n = rr(e.setDefinition, e.missionDefinitions), r = e.state, i = [];
	for (let a of e.setDefinition.missionIds) {
		let o = n.get(a);
		if (o === void 0 || o.objective.type !== "counter") continue;
		let s = t.get(o.objective.metricId);
		if (s === void 0 || s.compare(0) <= 0) continue;
		let c = K(r, o.id, e.periodIndex);
		if (c?.completed === !0) continue;
		let l = c?.progress === void 0 ? x.zero() : x.from(c.progress), u = x.from(o.objective.target), d = l.add(s);
		if (r = or(r, o.id, {
			periodIndex: e.periodIndex,
			completed: !1,
			claimed: !1,
			progress: d.serialize()
		}), d.greaterThanOrEqual(u)) {
			let t = Qn(r, o, e.periodIndex, e.grantRewards, d.serialize());
			r = t.state, i.push(...t.events);
		}
	}
	let a = $n(r, e.setDefinition, e.missionDefinitions, e.periodIndex, e.grantRewards);
	return {
		accepted: !0,
		state: a.state,
		events: [...i, ...a.events]
	};
}
function Xn(e, t, n, r) {
	q(n);
	let i = e.missionStates?.[t.id];
	if (i !== void 0 && i.periodIndex > n) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "clock-rollback"
	};
	if ((t.claimPolicy ?? "manual") === "auto") return {
		accepted: !1,
		state: e,
		events: [],
		reason: "auto-claim"
	};
	let a = K(e, t.id, n);
	if (a?.completed !== !0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "not-completed"
	};
	if (a.claimed) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "already-claimed"
	};
	let o = r(e, t.rewards);
	return o = or(o, t.id, {
		...a,
		claimed: !0
	}), {
		accepted: !0,
		state: o,
		rewards: t.rewards,
		events: [cr(o, "missionClaimed", t.id, n)]
	};
}
function Zn(e, t, n, r, i, a) {
	q(i);
	let o = e.missionSetStates?.[t.id];
	if (o !== void 0 && o.periodIndex > i) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "clock-rollback"
	};
	let s = t.pointMilestones?.find((e) => e.id === r);
	if (s === void 0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "unknown-milestone"
	};
	if ((s.claimPolicy ?? "manual") === "auto") return {
		accepted: !1,
		state: e,
		events: [],
		reason: "auto-claim"
	};
	let c = ar(e, t.id, i);
	if (c?.claimedMilestoneIds.includes(s.id) === !0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "already-claimed"
	};
	if (nr(e, t, n, i) < s.pointsRequired) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "not-reached"
	};
	let l = a(e, s.rewards);
	return l = sr(l, t.id, {
		periodIndex: i,
		claimedMilestoneIds: [...c?.claimedMilestoneIds ?? [], s.id]
	}), {
		accepted: !0,
		state: l,
		rewards: s.rewards,
		events: [lr(l, t.id, s.id, i)]
	};
}
function Qn(e, t, n, r, i) {
	let a = (t.claimPolicy ?? "manual") === "auto", o = or(e, t.id, {
		periodIndex: n,
		completed: !0,
		claimed: a,
		...i === void 0 ? {} : { progress: i }
	}), s = [cr(o, "missionCompleted", t.id, n)];
	return a && (o = r(o, t.rewards), s.push(cr(o, "missionClaimed", t.id, n))), {
		state: o,
		events: s
	};
}
function $n(e, t, n, r, i) {
	let a = nr(e, t, n, r), o = ar(e, t.id, r), s = new Set(o?.claimedMilestoneIds ?? []), c = e, l = [];
	for (let e of t.pointMilestones ?? []) (e.claimPolicy ?? "manual") === "auto" && (s.has(e.id) || a < e.pointsRequired || (c = i(c, e.rewards), s.add(e.id), c = sr(c, t.id, {
		periodIndex: r,
		claimedMilestoneIds: [...s]
	}), l.push(lr(c, t.id, e.id, r))));
	return {
		state: c,
		events: l
	};
}
function er(e, t, n) {
	if (t.objective.type === "condition") return t.objective.progressMetric === void 0 ? null : Ze(t.objective.progressMetric, n);
	let r = x.from(t.objective.target);
	if (r.compare(0) <= 0) return 1;
	let i = e?.progress === void 0 ? x.zero() : x.from(e.progress);
	return i.greaterThanOrEqual(r) ? 1 : i.compare(0) <= 0 ? 0 : Math.min(1, Math.max(0, i.divide(r).toNumber()));
}
function tr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (n.metricId.length === 0) throw RangeError("Mission progress metricId must not be empty.");
		let e = x.from(n.amount);
		if (e.compare(0) < 0) throw RangeError("Mission progress amount must be non-negative.");
		t.set(n.metricId, (t.get(n.metricId) ?? x.zero()).add(e));
	}
	return t;
}
function nr(e, t, n, r) {
	let i = rr(t, n);
	return t.missionIds.reduce((t, n) => {
		let a = i.get(n);
		return a === void 0 ? t : K(e, n, r)?.completed === !0 ? t + ur(a.points) : t;
	}, 0);
}
function rr(e, t) {
	return new Map(t.filter((t) => t.setId === e.id).map((e) => [e.id, e]));
}
function ir(e, t, n, r) {
	let i = e.missionSetStates?.[t.id];
	if (i !== void 0 && i.periodIndex > r) return !0;
	let a = new Set(t.missionIds);
	return n.some((n) => {
		if (n.setId !== t.id || !a.has(n.id)) return !1;
		let i = e.missionStates?.[n.id];
		return i !== void 0 && i.periodIndex > r;
	});
}
function K(e, t, n) {
	let r = e.missionStates?.[t];
	return r?.periodIndex === n ? r : void 0;
}
function ar(e, t, n) {
	let r = e.missionSetStates?.[t];
	return r?.periodIndex === n ? r : void 0;
}
function or(e, t, n) {
	return {
		...e,
		missionStates: {
			...e.missionStates ?? {},
			[t]: n
		}
	};
}
function sr(e, t, n) {
	return {
		...e,
		missionSetStates: {
			...e.missionSetStates ?? {},
			[t]: n
		}
	};
}
function cr(e, t, n, r) {
	return {
		id: `${t}:${n}:${r}:${e.simTimeSec}`,
		type: t,
		simTimeSec: e.simTimeSec,
		payload: {
			missionId: n,
			periodIndex: r
		}
	};
}
function lr(e, t, n, r) {
	return {
		id: `missionPointMilestoneClaimed:${t}:${n}:${r}:${e.simTimeSec}`,
		type: "missionPointMilestoneClaimed",
		simTimeSec: e.simTimeSec,
		payload: {
			missionSetId: t,
			milestoneId: n,
			periodIndex: r
		}
	};
}
function ur(e) {
	if (e === void 0) return 0;
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Mission points must be a non-negative safe integer.");
	return e;
}
function q(e) {
	if (!Number.isSafeInteger(e)) throw RangeError("Mission periodIndex must be a safe integer.");
}
//#endregion
//#region src/domain/opportunity/opportunity.ts
function dr(e) {
	if (J(e.definition), Y(e.offeredAtSimTimeSec, "offeredAtSimTimeSec"), e.instanceId.length === 0) throw RangeError("Opportunity instanceId must not be empty.");
	let t = {
		instanceId: e.instanceId,
		opportunityId: e.definition.id,
		status: "open",
		offeredAtSimTimeSec: e.offeredAtSimTimeSec,
		expiresAtSimTimeSec: e.offeredAtSimTimeSec + e.definition.lifetimeSec,
		resolvedAtSimTimeSec: null,
		snapshot: e.snapshot
	};
	return {
		opportunity: t,
		events: [_r(t, "opportunityOffered", e.offeredAtSimTimeSec)]
	};
}
function fr(e) {
	J(e.definition), gr(e.opportunity, e.definition), Y(e.targetSimTimeSec, "targetSimTimeSec");
	let t = e.offlineElapsedSec ?? 0;
	if (Y(t, "offlineElapsedSec"), e.opportunity.status !== "open") return {
		opportunity: e.opportunity,
		events: []
	};
	let n = e.definition.offlinePolicy === "pause" && t > 0 ? e.opportunity.expiresAtSimTimeSec + t : e.opportunity.expiresAtSimTimeSec, r = n === e.opportunity.expiresAtSimTimeSec ? e.opportunity : {
		...e.opportunity,
		expiresAtSimTimeSec: n
	};
	if (e.targetSimTimeSec < n) return {
		opportunity: r,
		events: []
	};
	let i = {
		...r,
		status: "expired",
		resolvedAtSimTimeSec: n
	};
	return {
		opportunity: i,
		events: [_r(i, "opportunityExpired", n)]
	};
}
function pr(e) {
	if (J(e.definition), gr(e.opportunity, e.definition), Y(e.acceptedAtSimTimeSec, "acceptedAtSimTimeSec"), e.opportunity.status !== "open") return X(e.opportunity, "not-open");
	if (e.acceptedAtSimTimeSec >= e.opportunity.expiresAtSimTimeSec) return X(e.opportunity, "expired");
	let t = {
		...e.opportunity,
		status: "accepted",
		resolvedAtSimTimeSec: e.acceptedAtSimTimeSec
	};
	return vr(t, _r(t, "opportunityAccepted", e.acceptedAtSimTimeSec));
}
function mr(e) {
	if (J(e.definition), gr(e.opportunity, e.definition), Y(e.dismissedAtSimTimeSec, "dismissedAtSimTimeSec"), e.opportunity.status !== "open") return X(e.opportunity, "not-open");
	if (e.dismissedAtSimTimeSec >= e.opportunity.expiresAtSimTimeSec) return X(e.opportunity, "expired");
	if (e.definition.dismissalPolicy === "forbid") return X(e.opportunity, "dismissal-forbidden");
	let t = {
		...e.opportunity,
		status: "dismissed",
		resolvedAtSimTimeSec: e.dismissedAtSimTimeSec
	};
	return vr(t, _r(t, "opportunityDismissed", e.dismissedAtSimTimeSec));
}
function hr(e, t) {
	return Y(t, "simTimeSec"), e.status === "open" ? Math.max(0, e.expiresAtSimTimeSec - t) : 0;
}
function J(e) {
	if (e.id.length === 0) throw RangeError("Opportunity id must not be empty.");
	if (!Number.isSafeInteger(e.lifetimeSec) || e.lifetimeSec <= 0) throw RangeError("Opportunity lifetimeSec must be a positive safe integer.");
}
function gr(e, t) {
	if (e.opportunityId !== t.id) throw RangeError(`Opportunity definition mismatch: expected ${e.opportunityId}, got ${t.id}`);
}
function Y(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function _r(e, t, n) {
	return {
		id: `${e.instanceId}:${t}:${n}`,
		type: t,
		simTimeSec: n,
		payload: {
			opportunityId: e.opportunityId,
			instanceId: e.instanceId
		}
	};
}
function vr(e, t) {
	return {
		accepted: !0,
		opportunity: e,
		events: [t]
	};
}
function X(e, t) {
	return {
		accepted: !1,
		opportunity: e,
		events: [],
		reason: t
	};
}
//#endregion
//#region src/domain/prestige/prestige.ts
function yr(e, t) {
	return {
		records: [
			Z("currencies", e.currencies, t.currencies),
			Z("tokens", e.tokens, t.tokens),
			Z("producers", e.producers, t.producers),
			Z("characters", e.characters, t.characters),
			Z("achievements", e.achievements, t.achievements),
			Z("titles", e.titles, t.titles),
			Z("progressionFlags", e.progressionFlags, t.progressionFlags),
			Z("gachaStates", e.gachaStates, t.gachaStates),
			Z("activeBoosts", e.activeBoosts, t.activeBoosts)
		],
		statistics: t.statistics === "reset" ? "reset" : "retain"
	};
}
function br(e, t, n) {
	return {
		eligible: E(t.eligibility, n(e)),
		nextCount: (e.prestigeStates[t.id]?.count ?? 0) + 1,
		rewards: t.rewards(e),
		resetImpact: yr(e, t.resetPolicy)
	};
}
function xr(e, t, n) {
	let r = br(e, t, n.createConditionContext);
	if (!r.eligible) return {
		accepted: !1,
		state: e,
		reason: "not-eligible"
	};
	let i = Sr(e, t.resetPolicy);
	return n.transformAfterReset !== void 0 && (i = n.transformAfterReset(i)), i = n.grantRewards(i, r.rewards), i = {
		...i,
		prestigeStates: {
			...i.prestigeStates,
			[t.id]: { count: r.nextCount }
		}
	}, {
		accepted: !0,
		state: i,
		rewards: r.rewards,
		prestigeCount: r.nextCount
	};
}
function Sr(e, t) {
	return {
		...e,
		currencies: Q(e.currencies, t.currencies),
		tokens: Q(e.tokens, t.tokens),
		producers: Q(e.producers, t.producers),
		characters: Q(e.characters, t.characters),
		achievements: Q(e.achievements, t.achievements),
		titles: Q(e.titles, t.titles),
		progressionFlags: Q(e.progressionFlags, t.progressionFlags),
		gachaStates: Q(e.gachaStates, t.gachaStates),
		activeBoosts: Q(e.activeBoosts, t.activeBoosts),
		statistics: t.statistics === "reset" ? {
			lifetimeCurrencyEarned: {},
			lifetimeCurrencySpent: {}
		} : e.statistics
	};
}
function Z(e, t, n) {
	let r = Object.keys(t).toSorted();
	if (n === void 0 || n === "retain") return {
		category: e,
		mode: "retain",
		resetIds: [],
		retainedIds: r,
		configuredResetIds: []
	};
	if (n === "reset") return {
		category: e,
		mode: "reset",
		resetIds: r,
		retainedIds: [],
		configuredResetIds: []
	};
	let i = [...n.resetIds], a = new Set(i);
	return {
		category: e,
		mode: "reset-selected",
		resetIds: r.filter((e) => a.has(e)),
		retainedIds: r.filter((e) => !a.has(e)),
		configuredResetIds: i
	};
}
function Q(e, t) {
	if (t === void 0 || t === "retain") return e;
	if (t === "reset") return {};
	let n = new Set(t.resetIds);
	return Object.fromEntries(Object.entries(e).filter(([e]) => !n.has(e)));
}
//#endregion
//#region src/domain/rewarded-offer/rewarded-offer.ts
function Cr(e) {
	if (Or(e.definition), kr(e.simTimeSec, "simTimeSec"), !Number.isSafeInteger(e.dailyPeriodIndex)) throw RangeError("dailyPeriodIndex must be a safe integer.");
	let t = e.offerState ?? Tr();
	if (e.definition.eligibility !== void 0) {
		if (e.createConditionContext === void 0) throw Error("Rewarded Offer eligibility requires createConditionContext.");
		if (!E(e.definition.eligibility, e.createConditionContext(e.state))) return Er(!1, "ineligible", t, e);
	}
	if (Dr(t, e.definition, e.simTimeSec) > 0) return Er(!1, "cooldown", t, e);
	let n = t.dailyPeriodIndex === e.dailyPeriodIndex ? t.dailyGrantCount : 0;
	return e.definition.dailyCap !== void 0 && n >= e.definition.dailyCap ? Er(!1, "daily-cap", t, e) : Er(!0, null, t, e);
}
function wr(e) {
	let t = e.offerStates[e.definition.id] ?? Tr(), n = Cr({
		state: e.state,
		offerState: t,
		definition: e.definition,
		simTimeSec: e.simTimeSec,
		dailyPeriodIndex: e.dailyPeriodIndex,
		...e.createConditionContext === void 0 ? {} : { createConditionContext: e.createConditionContext }
	});
	if (!n.available) return {
		accepted: !1,
		state: e.state,
		offerStates: e.offerStates,
		events: [],
		reason: n.reason
	};
	let r = e.grantRewards(e.state, e.definition.rewards), i = t.dailyPeriodIndex === e.dailyPeriodIndex ? t.dailyGrantCount + 1 : 1, a = {
		grantCount: t.grantCount + 1,
		lastGrantedAtSimTimeSec: e.simTimeSec,
		dailyPeriodIndex: e.dailyPeriodIndex,
		dailyGrantCount: i
	};
	return {
		accepted: !0,
		state: r,
		offerStates: {
			...e.offerStates,
			[e.definition.id]: a
		},
		events: [{
			id: `rewarded-offer:${e.definition.id}:${a.grantCount}:${e.simTimeSec}`,
			type: "rewardedOfferGranted",
			simTimeSec: e.simTimeSec,
			payload: {
				offerId: e.definition.id,
				placementId: e.definition.placementId,
				grantCount: a.grantCount,
				dailyGrantCount: i
			}
		}]
	};
}
function Tr() {
	return {
		grantCount: 0,
		lastGrantedAtSimTimeSec: null,
		dailyPeriodIndex: null,
		dailyGrantCount: 0
	};
}
function Er(e, t, n, r) {
	let i = n.dailyPeriodIndex === r.dailyPeriodIndex ? n.dailyGrantCount : 0;
	return {
		available: e,
		reason: t,
		rewards: r.definition.rewards,
		grantCount: n.grantCount,
		cooldownRemainingSec: Dr(n, r.definition, r.simTimeSec),
		dailyRemaining: r.definition.dailyCap === void 0 ? null : Math.max(0, r.definition.dailyCap - i)
	};
}
function Dr(e, t, n) {
	return t.cooldownSec === void 0 || e.lastGrantedAtSimTimeSec === null ? 0 : Math.max(0, e.lastGrantedAtSimTimeSec + t.cooldownSec - n);
}
function Or(e) {
	if (e.id.length === 0) throw RangeError("Rewarded Offer id must not be empty.");
	if (e.placementId.length === 0) throw RangeError("Rewarded Offer placementId must not be empty.");
	if (e.rewards.length === 0) throw RangeError("Rewarded Offer rewards must not be empty.");
	if (e.cooldownSec !== void 0 && (!Number.isSafeInteger(e.cooldownSec) || e.cooldownSec < 0)) throw RangeError("Rewarded Offer cooldownSec must be a non-negative safe integer.");
	if (e.dailyCap !== void 0 && (!Number.isSafeInteger(e.dailyCap) || e.dailyCap <= 0)) throw RangeError("Rewarded Offer dailyCap must be a positive safe integer.");
}
function kr(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
//#endregion
//#region src/domain/title/title.ts
function Ar(e, t) {
	let n = e[t.id] === !0;
	return {
		id: t.id,
		displayName: t.displayName,
		description: t.description ?? null,
		acquired: n,
		visible: t.hidden !== !0 || n
	};
}
function jr(e, t) {
	return t.map((t) => Ar(e, t)).filter((e) => e.visible);
}
//#endregion
//#region src/domain/title/progressive-title.ts
function Mr() {
	return {
		copies: {},
		equipped: []
	};
}
function $(e, t) {
	Ur(e, "copies"), Vr(t);
	let n = 0;
	for (let r of t) {
		if (e < r) break;
		n += 1;
	}
	return n;
}
function Nr(e, t, n) {
	Br(n), Wr(t, "titleId");
	let r = e.copies[t] ?? 0;
	Ur(r, `copies[${t}]`);
	let i = n.copyThresholds.at(-1), a = Math.min(i, r + 1);
	return a === r ? {
		collection: e,
		added: !1,
		previousCopies: r,
		copies: a,
		previousLevel: $(r, n.copyThresholds),
		level: $(a, n.copyThresholds)
	} : {
		collection: {
			...e,
			copies: {
				...e.copies,
				[t]: a
			}
		},
		added: !0,
		previousCopies: r,
		copies: a,
		previousLevel: $(r, n.copyThresholds),
		level: $(a, n.copyThresholds)
	};
}
function Pr(e, t) {
	let n = new Map(t.map((e) => [e.id, e])), r = 0;
	for (let t of e.equipped) {
		let e = n.get(t.titleId);
		e !== void 0 && (r += e.cost);
	}
	return r;
}
function Fr(e) {
	let { collection: t, definitions: n, rules: r, titleId: i, level: a, costLimit: o } = e;
	Br(r), Ur(o, "costLimit");
	let s = n.find((e) => e.id === i);
	if (s === void 0) return {
		accepted: !1,
		collection: t,
		reason: "unknown-title"
	};
	Hr(s);
	let c = $(t.copies[i] ?? 0, r.copyThresholds);
	return c === 0 ? {
		accepted: !1,
		collection: t,
		reason: "not-owned"
	} : !Number.isSafeInteger(a) || a < 1 || a > c ? {
		accepted: !1,
		collection: t,
		reason: "invalid-level"
	} : t.equipped.some((e) => e.titleId === i) ? {
		accepted: !1,
		collection: t,
		reason: "already-equipped"
	} : t.equipped.length >= r.maxSlots ? {
		accepted: !1,
		collection: t,
		reason: "slot-limit"
	} : Pr(t, n) + s.cost > o ? {
		accepted: !1,
		collection: t,
		reason: "cost-limit"
	} : {
		accepted: !0,
		collection: {
			...t,
			equipped: [...t.equipped, {
				titleId: i,
				level: a
			}]
		}
	};
}
function Ir(e) {
	let { collection: t, rules: n, titleId: r, level: i } = e;
	Br(n);
	let a = t.equipped.findIndex((e) => e.titleId === r);
	if (a < 0) return {
		accepted: !1,
		collection: t,
		reason: "not-equipped"
	};
	let o = $(t.copies[r] ?? 0, n.copyThresholds);
	if (!Number.isSafeInteger(i) || i < 1 || i > o) return {
		accepted: !1,
		collection: t,
		reason: "invalid-level"
	};
	let s = t.equipped[a];
	if (s.level === i) return {
		accepted: !0,
		collection: t
	};
	let c = [...t.equipped];
	return c[a] = {
		...s,
		level: i
	}, {
		accepted: !0,
		collection: {
			...t,
			equipped: c
		}
	};
}
function Lr(e, t, n) {
	Ur(n, "targetIndex");
	let r = e.equipped.findIndex((e) => e.titleId === t);
	if (r < 0 || n >= e.equipped.length || r === n) return e;
	let i = [...e.equipped], [a] = i.splice(r, 1);
	return a === void 0 ? e : (i.splice(n, 0, a), {
		...e,
		equipped: i
	});
}
function Rr(e, t) {
	let n = e.equipped.filter((e) => e.titleId !== t);
	return n.length === e.equipped.length ? e : {
		...e,
		equipped: n
	};
}
function zr(e) {
	return e.equipped.length === 0 ? e : {
		...e,
		equipped: []
	};
}
function Br(e) {
	if (Vr(e.copyThresholds), !Number.isSafeInteger(e.maxSlots) || e.maxSlots <= 0) throw RangeError("maxSlots must be a positive safe integer.");
}
function Vr(e) {
	if (e.length === 0) throw RangeError("copyThresholds must not be empty.");
	let t = 0;
	for (let n of e) {
		if (!Number.isSafeInteger(n) || n <= t) throw RangeError("copyThresholds must contain strictly increasing positive safe integers.");
		t = n;
	}
}
function Hr(e) {
	if (Wr(e.id, "definition.id"), !Number.isSafeInteger(e.cost) || e.cost <= 0) throw RangeError("title cost must be a positive safe integer.");
}
function Ur(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function Wr(e, t) {
	if (e.trim().length === 0) throw RangeError(`${t} must not be empty.`);
}
//#endregion
export { qe as ApplicationStore, x as GameNumber, Ve as SAVE_FORMAT_ID, pr as acceptOpportunity, Ze as achievementProgressRatio, It as activateTemporaryBoost, Lt as activeBoostModifiers, bt as activityAdvancesOffline, St as activityStartCurrencyCost, qt as addCharacter, Nn as addItemInstance, Nr as addProgressiveTitleCopy, Tt as advanceContinuousActivity, fr as advanceOpportunity, kt as advanceTimedActivity, yt as applyActivityStartCosts, tt as applyCurrencyTransaction, ot as applyModifiers, o as applyNonConsumableEntitlementTransaction, pt as applyRewards, on as assertValidDefinitionBundle, Vt as calendarPeriodIndex, At as cancelTimedActivity, Ut as claimCalendarReward, Xn as claimMission, Zn as claimMissionPointMilestone, jt as claimTimedActivity, Ne as classifyRewardSignals, zr as clearEquippedProgressiveTitles, Qt as consumeCooldown, Xt as createCooldownState, n as createEmptyNonConsumableEntitlementState, Fn as createLoadoutState, je as createOfflineReturnSummary, dr as createOpportunityState, Mr as createProgressiveTitleCollection, Cn as createRngStreams, Dt as createTimedActivityState, ht as currencyBalance, C as curveIntervalSum, S as curveValueAt, r as dismissCurrentPresentation, mr as dismissOpportunity, Tn as drawGacha, Tr as emptyRewardedOfferState, a as enqueuePresentationItems, Ln as equipItem, Fr as equipProgressiveTitle, Qe as evaluateAchievements, E as evaluateCondition, Jn as evaluateMissions, _t as executeActiveGain, xr as executePrestige, ke as formatGameNumber, se as gameNumber, wr as grantRewardedOffer, ut as grantToken, i as hasNonConsumableEntitlement, Yt as incrementCharacterLimitBreak, W as isLoadoutSlotUnlocked, _e as maxAffordableCurvePurchase, Le as migrateNormalizeAndValidateState, it as modifierFromDefinition, zn as moveEquippedItem, Rt as nextBoostExpiry, xn as nextRandom, hr as opportunityRemainingSec, Kt as ownsCharacterDefinition, Ge as parseMigratedSaveImport, Ue as parseSaveEnvelope, We as parseSaveImport, Dn as pickWeightedEntry, xt as previewActivityConcurrency, vt as previewActivityStart, Ht as previewCalendarReward, Zt as previewCooldown, Hn as previewLevelUp, br as previewPrestige, yr as previewPrestigeResetImpact, Cr as previewRewardedOffer, $ as progressiveTitleLevelFromCopies, Pr as progressiveTitleTotalCost, zt as pruneExpiredBoosts, A as readCurrency, lt as readToken, mt as recordCurrencySpend, Yn as recordMissionProgress, $t as reduceCooldown, Pn as removeItemInstance, Lr as reorderProgressiveTitle, Wt as resolveAutomaticCalendarRewards, at as resolveModifierDefinitions, Ae as resolveOfflineElapsed, t as restoreNonConsumablePurchases, e as runNonConsumablePurchaseFlow, Ie as runRewardedAdFlow, Xe as selectAchievementStatus, xe as selectAttentionSummary, qn as selectMissionSetStatus, Kn as selectMissionStatus, Se as selectNextMeaningfulTarget, Je as selectTimelineSegment, Ar as selectTitleStatus, jr as selectVisibleTitles, Sn as selectWeightedCandidate, He as serializeSave, Jt as setCharacterLevel, ct as setProducerLevel, st as setProducerOwnedCount, dt as spendToken, Ot as startTimedActivity, Et as stopContinuousActivity, Rn as unequipItem, Rr as unequipProgressiveTitle, In as unlockLoadoutSlot, Ir as updateProgressiveTitleLevel, j as validateCommonActivityDefinition, an as validateDefinitionBundle, J as validateOpportunityDefinition, Fe as validateRewardSignal };
