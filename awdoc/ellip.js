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

  exports.F = F;
  exports.K = K;
  exports.am = am;
  exports.scdp = scdp;

}));
