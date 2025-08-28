define(['exports'], (function (exports) { 'use strict';

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2025  Andrew Rogers
   *
   *
   * The JavaScript code in this page is free software: you can
   * redistribute it and/or modify it under the terms of the GNU
   * General Public License (GNU GPL) as published by the Free Software
   * Foundation, either version 3 of the License, or (at your option)
   * any later version.  The code is distributed WITHOUT ANY WARRANTY;
   * without even the implied warranty of MERCHANTABILITY or FITNESS
   * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
   *
   * As additional permission under GNU GPL version 3 section 7, you
   * may distribute non-source (e.g., minimized or compacted) forms of
   * that code without the copy of the GNU GPL normally required by
   * section 4, provided you include this license notice and a URL
   * through which recipients can access the Corresponding Source.
   *
   * @licend  The above is the entire license notice
   * for the JavaScript code in this page.
   *
   */

  function agm(a,b,c) {
    let arr_a = [];
    let arr_b = [];
    let arr_c = [];
    for (let n = 0; n < 20; n++) {
      arr_a.push(a);
      arr_b.push(b);
      arr_c.push(c);
      if (Math.abs(c/a) < Number.EPSILON) break;

      let ta = a;
      let tb = b;
      a = (ta + tb) * 0.5;
      b = Math.sqrt(ta * tb);
      c = (ta - tb) * 0.5;
    }
    return [arr_a, arr_b, arr_c];
  }

  class Ellip {

    constructor(m) {
      this.m = m;
      this.m1 = 1-m;

      let a = 1.0;
      let b = Math.sqrt(1.0 - m); // DLMF uses k, k' whereas the tables use m and 1-m. m=k^2
      let c = Math.sqrt(m);
      this.agm = this.#agm(a, b, c);
      this.agm1 = this.#agm(a, c, b); // AGM sequence for complementary paramater.
    }

    am(u) {
      return this.#am(u, this.agm);
    }

    am1(u) {
      // Amplitude function of u for complementary parameter.
      return this.#am(u, this.agm1);
    }

    cd_c([u, v]) {
      // Derived from Equations 58 & 59 in https://mathworld.wolfram.com/JacobiEllipticFunctions.html
      let scd1 = this.scdp(u);
      let scd2 = this.scdp1(v);
      let nr = scd1.cn * scd2.cn;
      let ni = -scd1.sn * scd1.dn * scd2.sn * scd2.dn;
      let dr = scd1.dn * scd2.cn * scd2.dn;
      let di = -m * scd1.sn * scd1.cn * scd2.sn;
      return this.#div_c([nr,ni],[dr,di]);
    }

    scdp(u) {
      let phi = this.am(u);
      let s = Math.sin(phi);
      let c = Math.cos(phi);
      let d = Math.sqrt(1 - this.m * s * s); // DLMF 22.20.5
      return {sn: s, cn: c, dn: d, phi: phi};
    }

    scdp1(u) {
      let phi = this.am1(u);
      let s = Math.sin(phi);
      let c = Math.cos(phi);
      let d = Math.sqrt(1 - this.m1 * s * s);
      return {sn: s, cn: c, dn: d, phi: phi};
    }

    #agm(a,b,c) {
      let arr_a = [];
      let arr_b = [];
      let arr_c = [];
      for (let n = 0; n < 20; n++) {
        arr_a.push(a);
        arr_b.push(b);
        arr_c.push(c);
        if (Math.abs(c/a) < Number.EPSILON) break;

        let ta = a;
        let tb = b;
        a = (ta + tb) * 0.5;
        b = Math.sqrt(ta * tb);
        c = (ta - tb) * 0.5;
      }
      return [arr_a, arr_b, arr_c];
    }

    #am(u,agm) {
      let [a, b, c] = agm;

      let N = a.length - 1;
      let phi = (2.0 ** N) * a[N] * u;
      for (let n = N; n > 0; n--) {
        let x = c[n] * Math.sin(phi) / a[n];
        phi = (Math.asin(x) + phi) * 0.5;
      }
      return phi;
    }

    #div_c(a, b) {
      let den = b[0] * b[0] + b[1] * b[1];
      return [(a[0] * b[0] + a[1] * b[1]) / den, (a[1] * b[0] - a[0] * b[1]) / den];
    }

  }
  function am(u,m) {
    let a = 1.0;
    let b = Math.sqrt(1.0 - m); // DLMF uses k, k' whereas the tables use m and 1-m. m=k^2
    let c = Math.sqrt(m);
    [a, b, c] = agm(a, b, c);

    let arr_u = [u];
    if (u.constructor === Array) arr_u = u;

    let arr_phi = [];
    for (let k = 0; k < arr_u.length; k++) {
      let N = a.length - 1;
      let phi = (2.0 ** N) * a[N] * arr_u[k];
      for (let n = N; n > 0; n--) {
        let x = c[n] * Math.sin(phi) / a[n];
        phi = (Math.asin(x) + phi) * 0.5;
      }
      arr_phi.push(phi);
    }

    let phi = arr_phi[0];
    if (u.constructor === Array) phi = arr_phi;
    return phi;
  }

  function scdp(u, m) {
    let arr_u = [u];
    if (u.constructor === Array) arr_u = u;
    let arr_am = am(arr_u, m);
    let arr_ret = [];
    for (let n = 0; n < arr_u.length; n++) {
      let phi = arr_am[n];
      let s = Math.sin(phi);
      let c = Math.cos(phi);
      let d = Math.sqrt(1 - m * s * s); // DLMF 22.20.5
      arr_ret.push({sn: s, cn: c, dn: d, phi: phi});
    }
    let ret = arr_ret[0];
    if (u.constructor === Array) ret = arr_ret;
    return ret;
  }

  // ------ Carlson Symmetric Form ------

  // https://en.wikipedia.org/wiki/Carlson_symmetric_form

  function Rf(x,y,z) {
    for (let n = 0; n < 100; n++) {

      // Stop if converged
      let s = 3 / (x + y + z); // Reciprocal of mean.
      let error = Math.abs(x*s-1) + Math.abs(y*s-1) + Math.abs(z*s-1);
      if (error < Number.EPSILON) break;

      let lambda = Math.sqrt(x * y) + Math.sqrt(y * z) + Math.sqrt(z * x);
      x = (x + lambda) * 0.25;
      y = (y + lambda) * 0.25;
      z = (z + lambda) * 0.25;
    }

    return 1/Math.sqrt(x);
  }

  function F(phi, m) {
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    return s * Rf(c * c, 1 - m * s * s, 1);
  }

  function K(m) {
    return Rf(0, 1-m, 1);
  }

  // ------ Elliptic rational function ------

  function R(N, xi, x) {
    let arr_x = [x];
    if (x.constructor === Array) arr_x = x;

    // Poles and zeros
    let u = [];
    let m = 1 / (xi * xi);
    let Km = K(m);
    let odd = N%2;
    for (let n = 1; n <= N; n++) {
      let d = 2 * n - 1;
      if (d != N) u.push(Km * d / N);
    }
    let scdp_vals = scdp(u, m);
    let cd = scdp_vals.map((o) => o.cn / o.dn);
    let z = [...cd];
    if (odd) z.push(0);
    let p = cd.map((v) => xi / v);

    function eval_poly(roots, x) {
      let prod = 1;
      for (let n = 0; n < roots.length; n++) prod *= x - roots[n];
      return prod;
    }

    let r0 = eval_poly(p, 1) / eval_poly(z, 1);
    let L = r0 * eval_poly(z, xi) / eval_poly(p, xi);

    let arr_ret = [];
    for (let n = 0; n < arr_x.length; n++) {
      let x = arr_x[n];
      arr_ret.push(r0 * eval_poly(z, x) / eval_poly(p, x));
    }
    arr_ret[0];
    if (u.constructor === Array) ;
    return {R: arr_ret, z, p, L};
  }

  exports.Ellip = Ellip;
  exports.F = F;
  exports.K = K;
  exports.R = R;
  exports.am = am;
  exports.scdp = scdp;

}));
