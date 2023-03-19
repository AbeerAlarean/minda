var l = this;
function m(n) {
  function h(a, c, b) {
    for (var d = [], e = 0; e < a; e++)
      d.push(
        this.b({
          u: c,
          s: b,
          Q: 0.5 / Math.sin((Math.PI / (2 * a)) * (e + 0.5)),
        })
      );
    this.a = [];
    for (a = 0; a < d.length; a++)
      this.a[a] = {
        A: d[a].c[0],
        B: d[a].c[1],
        C: d[a].c[2],
        v: d[a].i[0],
        w: d[a].i[1],
        k: d[a].k,
        z: [0, 0],
      };
  }
  function k(a, c, b) {
    b = (2 * Math.PI * b) / c;
    c = 0;
    this.a = [];
    for (var d = 0; d <= a; d++)
      0 === d - a / 2
        ? (this.a[d] = b)
        : ((this.a[d] = Math.sin(b * (d - a / 2)) / (d - a / 2)),
          (this.a[d] *= 0.54 - 0.46 * Math.cos((2 * Math.PI * d) / a))),
        (c += this.a[d]);
    for (b = 0; b <= a; b++) this.a[b] /= c;
    this.z = this.b();
  }
  function g(a, c, b) {
    this.G = a;
    this.b = (a - 1) / c;
    this.h = this.D;
    "point" === b.method
      ? (this.h = this.I)
      : "linear" === b.method
      ? (this.h = this.H)
      : "sinc" === b.method && (this.h = this.J);
    this.K = 1 - Math.max(0, Math.min(1, b.tension || 0));
    this.l = b.sincFilterSize || 1;
    this.F = t(b.sincWindow || u);
  }
  function u(a) {
    return Math.exp(((-a / 2) * a) / 2);
  }
  function t(a) {
    return function (c) {
      return (0 === c ? 1 : Math.sin(Math.PI * c) / (Math.PI * c)) * a(c);
    };
  }
  function p(a, c, b) {
    for (var d = 0, e = c.length; d < e; d++) c[d] = b.h(d, a);
  }
  g.prototype.I = function (a, c) {
    return this.a(Math.round(this.b * a), c);
  };
  g.prototype.H = function (a, c) {
    a *= this.b;
    var b = Math.floor(a);
    a -= b;
    return (1 - a) * this.a(b, c) + a * this.a(b + 1, c);
  };
  g.prototype.D = function (a, c) {
    a *= this.b;
    var b = Math.floor(a),
      d = [this.j(b, c), this.j(b + 1, c)],
      e = [this.a(b, c), this.a(b + 1, c)];
    a -= b;
    b = a * a;
    var f = a * b;
    return (
      (2 * f - 3 * b + 1) * e[0] +
      (f - 2 * b + a) * d[0] +
      (-2 * f + 3 * b) * e[1] +
      (f - b) * d[1]
    );
  };
  g.prototype.J = function (a, c) {
    a *= this.b;
    var b = Math.floor(a),
      d = b + this.l,
      e = 0;
    for (b = b - this.l + 1; b <= d; b++) e += this.F(a - b) * this.a(b, c);
    return e;
  };
  g.prototype.j = function (a, c) {
    return (this.K * (this.a(a + 1, c) - this.a(a - 1, c))) / 2;
  };
  g.prototype.a = function (a, c) {
    return 0 <= a && a < this.G ? c[a] : 0;
  };
  k.prototype.filter = function (a) {
    this.z.g[this.z.m] = a;
    for (var c = (a = 0), b = this.z.g.length; c < b; c++)
      a += this.a[c] * this.z.g[(this.z.m + c) % this.z.g.length];
    this.z.m = (this.z.m + 1) % this.z.g.length;
    return a;
  };
  k.prototype.reset = function () {
    this.z = this.b();
  };
  k.prototype.b = function () {
    for (var a = [], c = 0; c < this.a.length - 1; c++) a.push(0);
    return { g: a, m: 0 };
  };
  h.prototype.filter = function (a) {
    for (var c = 0, b = this.a.length; c < b; c++) a = this.l(c, a);
    return a;
  };
  h.prototype.b = function (a) {
    var c = { z: [0, 0], i: [], c: [] };
    a = this.j(a, c);
    c.k = 1;
    c.c.push((1 - a.o) / (2 * a.f));
    c.c.push(2 * c.c[0]);
    c.c.push(c.c[0]);
    return c;
  };
  h.prototype.j = function (a, c) {
    var b = {},
      d = (2 * Math.PI * a.s) / a.u;
    b.alpha = Math.sin(d) / (2 * a.Q);
    b.o = Math.cos(d);
    b.f = 1 + b.alpha;
    c.f = b.f;
    c.i.push((-2 * b.o) / b.f);
    c.k = 1;
    c.i.push((1 - b.alpha) / b.f);
    return b;
  };
  h.prototype.l = function (a, c) {
    var b =
        c * this.a[a].k -
        this.a[a].v * this.a[a].z[0] -
        this.a[a].w * this.a[a].z[1],
      d =
        this.a[a].A * b +
        this.a[a].B * this.a[a].z[0] +
        this.a[a].C * this.a[a].z[1];
    this.a[a].z[1] = this.a[a].z[0];
    this.a[a].z[0] = b;
    return d;
  };
  h.prototype.reset = function () {
    for (var a = 0; a < this.a.length; a++) this.a[a].z = [0, 0];
  };
  var v = { point: !1, linear: !1, cubic: !0, sinc: !0 },
    q = { IIR: 16, FIR: 71 },
    w = { IIR: h, FIR: k };
  n.resample = function (a, c, b, d) {
    d = void 0 === d ? {} : d;
    var e = new Float64Array(a.length * ((b - c) / c + 1));
    d.method = d.method || "cubic";
    var f = new g(a.length, e.length, {
      method: d.method,
      tension: d.tension || 0,
      sincFilterSize: d.sincFilterSize || 6,
      sincWindow: d.sincWindow || void 0,
    });
    void 0 === d.LPF && (d.LPF = v[d.method]);
    if (d.LPF) {
      d.LPFType = d.LPFType || "IIR";
      var r = w[d.LPFType];
      if (b > c) {
        c = new r(d.LPFOrder || q[d.LPFType], b, c / 2);
        b = 0;
        for (d = e.length; b < d; b++) e[b] = c.filter(f.h(b, a));
        c.reset();
        for (a = e.length - 1; 0 <= a; a--) e[a] = c.filter(e[a]);
      } else {
        c = new r(d.LPFOrder || q[d.LPFType], c, b / 2);
        b = 0;
        for (d = a.length; b < d; b++) a[b] = c.filter(a[b]);
        c.reset();
        for (b = a.length - 1; 0 <= b; b--) a[b] = c.filter(a[b]);
        p(a, e, f);
      }
    } else p(a, e, f);
    return e;
  };
  Object.defineProperty(n, "__esModule", { value: !0 });
}
"object" === typeof exports && "undefined" !== typeof module
  ? m(exports)
  : "function" === typeof define && define.L
  ? define(["exports"], m)
  : ((l = l || self), m((l.waveResampler = {})));
