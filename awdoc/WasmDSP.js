(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WasmDSP = {}));
})(this, (function (exports) { 'use strict';

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2022,2023  Andrew Rogers
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

  var Scope = function(obj) {
    this.obj = obj || {};
    this.list = [];
  };

  Scope.prototype.byId = function (id) {
    return this.list[id];
  };

  Scope.prototype.getArray = function (name) {
    let arrs = this.obj;
    arrs[name] = arrs[name] || []; // Create array if it doesn't exist.
    return arrs[name];
  };

  Scope.prototype.open = function (name) {
    let arr = this.getArray(name);
    this.list.push(arr);
    return this.list.length - 1;
  };


  var WasmModule = function() {
      this.default_scope = new Scope();
      this.module = {};
      this._createImports();
      this.handlers = {};
  };

  WasmModule.prototype.addHandler = function(ptr, func) {
      const key = 's' + ptr;
      this.handlers[key] = func;
  };

  WasmModule.prototype.addImports = function(imports) {
      let env = this.module.imports.env;
      for (let i in imports) {
          env[i] = imports[i];
      }
  };

  WasmModule.prototype.callCFunc = function( func_name ) {
      console.log("Wasm not initialised."); // Re-defined in initialise().
  };

  WasmModule.prototype.cfunc = function( func_name ) {
      console.log("Wasm not initialised."); // Re-defined in initialise().
  };


  WasmModule.prototype.initialise = function (module, postInit) {

      module.arrays = module.arrays || {};
      this.default_scope = new Scope(module.arrays);
      this.scope = this.default_scope;

      let imports = module.imports;
      let env = this.module.imports.env;
      for (let i in imports) {
        env[i] = imports[i];
      }

      let binary = module.b64;
      if (typeof binary === 'string') {
          // Convert base64 into binary
          binary = Uint8Array.from(atob(binary), c => c.charCodeAt(0)).buffer;
      }

      // Re-assign the C function lookup function.
      var mod = this.module;
      this.cfunc = function (func_name) {
          return mod.exports[func_name];
      };
      this.callCFunc = function (func_name, scope) {
        this.scope = scope || this.default_scope;
        var func = mod.exports[func_name];
        func();
        this.scope = this.default_scope;
      };

      // Instantiate the wasm.
      var that = this;
      WebAssembly.instantiate(binary, mod.imports)
      .then((result) => {
          mod.exports = result.instance.exports;

          // Typed array representations for memory.
          that.setMemory(mod.exports.memory.buffer);

          // Initialise the wasm.
          mod.exports._initialize();
          that.exports = mod.exports;
          if (postInit) postInit();
      });
  };

  WasmModule.prototype.newScope = function(obj) {
    return new Scope(obj);
  };

  WasmModule.prototype.read = function( type, address, num ) {
      var mem = this.module.mem[type];
      var index = address >> mem.address_shift;
      return Array.from(mem.buf.slice(index, index + num));
  };

  WasmModule.prototype.readString = function( cstr ) {
      var heap = this.module.memUint8;
      var str = "";
      if (cstr==0) return "";
      var i = cstr;
      while (heap[i] > 0) str += String.fromCharCode(heap[i++]);
      return str
  };

  WasmModule.prototype.setMemory = function(buffer) {
      var mod = this.module;
      mod.memFloat32 = new Float32Array(buffer);
      mod.memFloat64 = new Float64Array(buffer);
      mod.memInt32   = new Int32Array  (buffer);
      mod.memUint8   = new Uint8Array  (buffer);
      mod.memUint32  = new Uint32Array (buffer);

      mod.mem = {
          F32: {buf: mod.memFloat32, address_shift: 2},
          F64: {buf: mod.memFloat64, address_shift: 3},
          S32: {buf: mod.memInt32,   address_shift: 2},
          U8:  {buf: mod.memUint8,   address_shift: 0},
          U32: {buf: mod.memUint32,  address_shift: 2}
      };
  };

  WasmModule.prototype.write = function( type, arr, address ) {
      var mem = this.module.mem[type];
      var index = address >> mem.address_shift;
      mem.buf.set( arr, index );
  };

  WasmModule.prototype.writeString = function( string, address ) {
      var index = address;
      var mem = this.module.memUint8;
      for (var i = 0; i < string.length; i++) {
          mem[index++] = string.charCodeAt(i);
      }
      mem[index] = 0; // C strings are null terminated.
  };

  WasmModule.prototype._createImports = function() {
      var env = {};
      var that = this;

      env.emjs_event = function( mediator, sender, id ) {
          that._handleEvent(mediator, sender, id);
      };

      env.jsArrayOpen = function( utf8_name ) {
          const name = that.readString(utf8_name);
          return that.scope.open(name);
      };

      env.jsArrayRead = function( id, type, ptr, index, cnt ) {
          const arr = that.scope.byId(id).slice(index, index+cnt);
          that.write( 'F32', arr, ptr );
          return arr.length;
      };

      env.jsArraySize = function( id ) {
          return that.scope.byId(id).length;
      };

      env.jsArrayWrite = function( id, type, ptr, cnt) {
          const vals = that.read('F32', ptr, cnt);
          that.scope.byId(id).push(...vals);
      };

      env.jsEval = function( utf8_src ) {
          const f = Function("wasm_module", that.readString(utf8_src));
          f(that);
      };

      var wsp = {};

      wsp.fd_close = function() {
          console.log("Not yet implemented");
      };

      wsp.fd_write = function() {
          console.log("Not yet implemented");
      };

      wsp.fd_seek = function() {
          console.log("Not yet implemented");
      };

      wsp.proc_exit = function() {
          console.log("Not yet implemented");
      };

      this.module.imports = {env: env, wasi_snapshot_preview1: wsp};
  };

  WasmModule.prototype._handleEvent = function(sender, id) {
  	let key = 's' + sender;
  	this.handlers[key](id);
  };

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2024  Andrew Rogers
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


  function initialise(modules, callback) {
  	let wasm_cnt = 0;
  	let wasm_done = 0;
  	for (let k in modules) {
  		let module = modules[k];
  		if (module.b64) {
  			wasm_cnt++;
  			module.wasm = new WasmModule();
  			module.wasm.initialise(module, function(){
  				wasm_done++;
  				if (module.onWasm) module.onWasm(module.wasm);
  		        if (wasm_done >= wasm_cnt) callback();
  			});
  		}
  	}
  }

  function importModules(urls) {
      return new Promise(function(resolve, reject){
          let cnt = 0;
          callback = function() {
              resolve();
          };
          for (var i=0; i<urls.length; i++) {
              var script = document.createElement('script');
              script.setAttribute('src', urls[i]);
              script.setAttribute('type', 'text/javascript');
              script.onload = function() {
                  cnt++;
                  if (cnt == urls.length) {
                      wasmCheck();
                  }
              };
              document.head.appendChild(script);
          }
      });
  }

  let callback = null;

  function wasmCheck() {
      {
          if (callback) callback();
      }
  }

  exports.WasmModule = WasmModule;
  exports.importModules = importModules;
  exports.initialise = initialise;

}));
