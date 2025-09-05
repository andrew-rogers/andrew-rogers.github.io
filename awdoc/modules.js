(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS-MML_SVG'), require('https://cdn.jsdelivr.net/gh/markedjs/marked/marked.min.js'), require('https://cdn.plot.ly/plotly-2.12.1.min.js')) :
  typeof define === 'function' && define.amd ? define(['https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS-MML_SVG', 'https://cdn.jsdelivr.net/gh/markedjs/marked/marked.min.js', 'https://cdn.plot.ly/plotly-2.12.1.min.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MathJax, global.marked, global.plotly));
})(this, (function (mathjax, marked, plotly) { 'use strict';

  function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n.default = e;
    return Object.freeze(n);
  }

  var plotly__namespace = /*#__PURE__*/_interopNamespaceDefault(plotly);

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2023  Andrew Rogers
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

  let aw$9 = null;
  let hpcc = null;

  function init$9(a) {
    aw$9 = a;
    aw$9.addRenderer("dot", draw);
    hpcc = window["@hpcc-js/wasm"] || null;
  }

  function draw(section) {
    var dot = section.obj.content;
    hpcc.graphviz.dot(dot).then((svg)=>{
      section.div.style['text-align'] = 'center';
      section.div.innerHTML = svg;
    });
  }

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

  let aw$8 = null;

  function init$8(a) {
    aw$8 = a;
    aw$8.addRenderer("javascript", render$4);
    aw$8.plot = function(x, y){
      return PlotGenerator.current().addTrace(x, y);
    };
    aw$8.unitCircle = function(){
      PlotGenerator.current().unitCircle();
    };
  }

  let ces = {}; // Variables for currently executing section.

  // Define the functions available to user code.
  let funcs = {};

  funcs.addFunction = function(name, f) {
    funcs[name] = f;
    hdr_src = "";
  };

  funcs.executeSection = function(id) {
      ces.section.doc.executeSection(id);
  };

  funcs.getInput = function(name) {
      return ces.inputs[name];
  };

  funcs.getNamedValues = function(input_name) {
    const str =  ces.inputs[input_name];
    const lines = str.split(/\r?\n/);
    let out = {};
    for (let i in lines) {
      const line = lines[i];
      const pos = line.indexOf(':');
      if (pos > 0) {
        const name = line.substr(0,pos).trim();
        out[name] = JSON.parse('[' + line.substr(pos+1) + ']');
      }
    }
    return out;
  };

  funcs.heatmap = function(data, transpose) {
    return PlotGenerator.current().addHeatmap(data, transpose);
  };

  funcs.plot = function(x, y){
    return PlotGenerator.current().addTrace(x, y);
  };

  funcs.print = function(str){
    return PrintGenerator.current().print(str);
  };

  funcs.xlabel = function(str){
    return PlotGenerator.current().xlabel(str);
  };

  funcs.ylabel = function(str){
    return PlotGenerator.current().ylabel(str);
  };

  let hdr_src = null; // This is prepended to user code to make library functions available.

  function createHdrSrc() {
      hdr_src = "";
      let keys = Object.keys(funcs);
      for (let i=0; i<keys.length; i++) {
          hdr_src += "let " + keys[i] + " = funcs." + keys[i] + ";\n";
      }
      hdr_src += "\n";
  }

  function generateResponses() {
      for (let i=0; i<ces.generators.length; i++) ces.generators[i]();
  }

  function render$4(section) {

      if(!hdr_src) createHdrSrc();

      let func = Function("funcs", hdr_src + section.obj.content);

      let ed = section.showEditor(false, function() {
        // Update source from textarea;
        func = Function("funcs", hdr_src + ed.ta.value);

        // Queue the run.
        section.enqueue();
      });

      // Create a div for the execution result
      let div_result = document.createElement("div");
      section.div.appendChild(div_result);

      function wrapper(section){
          div_result.innerHTML="";
          ces.section = section;
          ces.inputs = section.inputs;
          ces.div = div_result;
          ces.generators = [];
          ces.outputs = [];

          func(funcs);

          generateResponses();
          aw$8.render(ces.outputs);
      }
      section.setFunc(wrapper);
      section.enqueue();
  }

  let PlotGenerator = function() {
      this.obj = {data: []};
      this.traces = this.obj.data;
  };

  PlotGenerator.m_current = null;

  PlotGenerator.current = function() {
      if(!PlotGenerator.m_current) {
          PlotGenerator.m_current = new PlotGenerator();
          ces.generators.push(function(){
              PlotGenerator.m_current.generate();
          });
      }
      return PlotGenerator.m_current;
  };

  PlotGenerator.prototype.addHeatmap = function(z, transpose) {
    let data = {z: z, type: 'heatmap'};
    data.transpose = transpose || false;
    this.traces.push(data);
    return this;
  };

  PlotGenerator.prototype.addTrace = function(x, y) {
    return new PlotTrace(this, x, y);
  };

  PlotGenerator.prototype.generate = function() {
    let s = {"div": ces.div};
    s.obj = this.obj;
    s.obj.type = "plot";
    ces.outputs.push(s);
    PlotGenerator.m_current = null;
  };

  PlotGenerator.prototype.shape = function(obj) {
    this.obj.layout = this.obj.layout || {};
    let layout = this.obj.layout;
    layout.shapes = layout.shapes || [];
    layout.shapes.push(obj);
    return this;
  };

  PlotGenerator.prototype.unitCircle = function() {
    let circle = {};
    circle["type"] = "circle";
    circle["xref"] = "x";
    circle["yref"] = "y";
    circle["x0"] = -1;
    circle["y0"] = -1;
    circle["x1"] = 1;
    circle["y1"] = 1;
    circle["opacity"] = 0.2;
    let layout = {shapes: [], xaxis: {}, yaxis: {}};
    layout["shapes"].push(circle);
    layout["xaxis"]["constrain"] = "domain";
    layout["yaxis"]["scaleanchor"] = "x";
    this.obj.layout = layout;
    return this;
  };

  PlotGenerator.prototype.xlabel = function(str) {
    this.obj.xlabel = str;
    return this;
  };

  PlotGenerator.prototype.xticks = function(vals, labels) {
    this.obj.layout = this.obj.layout || {};
    let layout = this.obj.layout;
    layout.xaxis = layout.xaxis || {};
    layout.xaxis.tickvals = vals;
    layout.xaxis.ticktext = labels;
    layout.xaxis.ticklen = 8;
    layout.xaxis.tickwidth = 3;
    return this;
  };

  PlotGenerator.prototype.ylabel = function(str) {
    this.obj.ylabel = str;
    return this;
  };

  PlotGenerator.prototype.yticks = function(vals, labels) {
    this.obj.layout = this.obj.layout || {};
    let layout = this.obj.layout;
    layout.yaxis = layout.yaxis || {};
    layout.yaxis.tickvals = vals;
    layout.yaxis.ticktext = labels;
    layout.yaxis.ticklen = 8;
    layout.yaxis.tickwidth = 3;
    return this;
  };


  let PlotTrace = function(gen, x, y) {
    this.gen = gen;
    this.graph = gen.obj;
    this.trace = {};
    this.graph.data = this.graph.data || [];
    this.graph.data.push(this.trace);

    if (typeof y === 'undefined') {
      this.trace.y = x;
    } else {
      this.trace.x = x;
      this.trace.y = y;
    }
  };

  PlotTrace.prototype.marker = function(sym) {
    if (sym == 'o') sym = 'circle-open';
    this.trace.marker = {symbol: sym};
    this.trace.mode = 'markers';
    return this;
  };

  PlotTrace.prototype.name = function(n) {
    this.trace.name = n;
    return this;
  };

  PlotTrace.prototype.plot = function(x, y) {
    return new PlotTrace(this.gen, x ,y);
  };

  PlotTrace.prototype.shape = function(obj) {
    return this.gen.shape(obj);
  };

  PlotTrace.prototype.style = function(obj) {
    for (let k in obj) {
      if (k == 'mode') {
        this.trace.mode = obj.mode;
      }
      else if (k == 'fill') {
        this.trace.fill = obj.fill;
      }
      else {
        this.trace.line = this.trace.line || {};
        this.trace.line[k] = obj[k];
      }
    }
    return this;
  };

  PlotTrace.prototype.xticks = function(vals, labels) {
    return this.gen.xticks(vals, labels);
  };

  PlotTrace.prototype.yticks = function(vals, labels) {
    return this.gen.yticks(vals, labels);
  };

  let PrintGenerator = function() {
      this.str = '';
  };

  PrintGenerator.m_current = null;

  PrintGenerator.current = function() {
      if(!PrintGenerator.m_current) {
          PrintGenerator.m_current = new PrintGenerator();
          ces.generators.push(function(){
              PrintGenerator.m_current.generate();
          });
      }
      return PrintGenerator.m_current;
  };

  PrintGenerator.prototype.print = function(str) {
    this.str += str;
  };

  PrintGenerator.prototype.generate = function() {
      let ta = document.createElement('textarea');
      ta.value = this.str;
      ta.style.width = '100%';
      ta.readOnly = true;
      ces.div.appendChild(ta);
      ta.style.height = ta.scrollHeight + 3 + "px";
      PrintGenerator.m_current = null;
  };

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2020  Andrew Rogers
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


  let aw$7 = null;

  function init$7(a) {
      aw$7 = a;
      aw$7.addRenderer("mjmd", render$3);
  }

  MathJax.Hub.Config({
      tex2jax: {
          inlineMath: [["$","$"],["\\(","\\)"]],
          processEscapes: true
      },
      jax: ["input/TeX","output/SVG"]
  });

  function render$3(section)
  {
      _mjmd( section );
  }

  function _mathjaxDoneHandler(div) {

      // --- Handle code sections without '>' displaying as '&gt;' ---
      // https://github.com/chjj/marked/issues/160#issuecomment-18611040

      // Let marked do its normal token generation.
      var tokens = marked.marked.lexer( div.innerHTML );

      // Mark all code blocks as already being escaped.
      // This prevents the parser from encoding anything inside code blocks
      tokens.forEach(function( token ) {
          if ( token.type === "code" ) {
              token.escaped = true;
          }
      });

      // Let marked do its normal parsing, but without encoding the code blocks
      div.innerHTML = marked.marked.parser( tokens );
      // -------------------------------------------------------------

      _processMathJaxOutput(div);
  }
  function _mjmd(section_in) {
      var div_mjmd = document.createElement("div");
      section_in.div.appendChild(div_mjmd);
      div_mjmd.innerHTML = section_in.obj.content; // MathJax processes in-place so copy the input markdown into the div.
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, div_mjmd]);
      MathJax.Hub.Queue(function() {
          _mathjaxDoneHandler(div_mjmd);
      });
  }
  function _processMathJaxOutput(div) {

      // Remove MathML stuff
      var mjs=div.getElementsByClassName("MathJax_SVG");
      for(var i=0; i<mjs.length; i++){
          _addClickHandler(div, mjs, i);
          var span = mjs[i].getElementsByTagName("math")[0].parentNode;
          span.parentNode.removeChild(span);
      }
  }
  function _addClickHandler(div, elems, index){
      elems[index].addEventListener("click", function(e) {
          for(var i=0; i<elems.length; i++) elems[i].style.backgroundColor="";
          elems[index].style.backgroundColor="#ccccff";

          var svg_str = _createSVG(elems[index]);
          var blob = new Blob([svg_str]);
          var url = URL.createObjectURL(blob);
          var fn = "equation.svg";
          var a_download = '<a href="' + url + '" download="' + fn + '">Download "' + fn + '"</a>';

          if (!div.div_download) {
              // Create a child div and add its javascript object ref to the parent object as an element
              div.div_download = document.createElement("div");
              div.appendChild(div.div_download);
          }
          div.div_download.innerHTML = a_download;
      });
  }
  function _createSVG( mjs ) {

      // Get the SVG path definitions
      var defs=document.getElementById("MathJax_SVG_glyphs");
      var svgarray = new SVGArray();
      if(defs)svgarray.addDefs(defs);

      // Get the equation SVG
      var svg = mjs.getElementsByTagName("svg")[0];
      svgarray.addImage(svg);

      return svgarray.getImageIncDefs(0)
  }

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

  let aw$6 = null;

  function init$6(a) {
    aw$6 = a;
    aw$6.addRenderer("mono", render$2);
  }

  function handleDroppedFile(obj, ta, file) {
    let reader = new FileReader();
    reader.onload = function(event) {
      obj.filename = file.name;
      obj.content = event.target.result;
      obj.buffer = event.target.result;
      if (obj.buffer.length <= 65536) ta.value = obj.content;
      else ta.value = 'File too large to display.';
    };
    if (file.name.endsWith('.bin')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function render$2(section) {

    let obj = section.obj;
    let div = section.div;

    // Clear the div
    div.innerHTML="";

    // Create controls
    let controls = new NavBar();
    let butt_run = document.createElement("button");
    butt_run.innerHTML="Run";
    controls.addRight(butt_run);
    let butt_drop = document.createElement("button");
    butt_drop.innerHTML="Drop file here";
    butt_drop.className="drop";
    controls.addRight(butt_drop);
    div.appendChild(controls.elem);

    // Put the content into the textarea
    let ta = section.showSource(false);
    section.setData(obj.content);
    butt_drop.ondrop = function(e) {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleDroppedFile(obj, ta, file);
      return false;
    };
    ta.ondrop = function(e) {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleDroppedFile(obj, ta, file);
      return false;
    };

    // Run handler
    butt_run.onclick = function(e) {
      if (obj.buffer) {
        obj.content = obj.buffer;
      } else {
        obj.content = ta.value;
      }
      section.setData(obj.content);
      section.enqueue(true);
    };
  }

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2020  Andrew Rogers
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


  let aw$5 = null;

  function init$5(a) {
    aw$5 = a;
    aw$5.addRenderer("plot", render$1);
  }

  function render$1( section ) {
    var obj = section.obj;
    var layout = obj["layout"] || {};
    if (obj["xlabel"]) layout["xaxis"] = {"title": obj.xlabel};
    if (obj["ylabel"]) layout["yaxis"] = {"title": obj.ylabel};
    plotly__namespace.newPlot(section.div, obj.data, layout);
  }

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2023  Andrew Rogers
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

  let aw$4 = null;
  let pyodide = null;

  // NOTE: The pyodide script must be loaded externally and before require.js is loaded.
  //       See https://github.com/pyodide/pyodide/issues/4863

  function init$4(a) {
      aw$4 = a;
      aw$4.addRenderer("python", render);
      aw$4.startPython = loadPy;
  }

  function loadPy(callback) {
    let suspend_id = null;

    async function load() {
      console.log("Got pyodide.js.");
      pyodide = await loadPyodide();
      console.log("Pyodide loaded.");
      await pyodide.loadPackage("scipy");
      console.log("Package scipy loaded");
      aw$4.resume(suspend_id);
      aw$4.pyodide = pyodide;
      if (callback) callback(pyodide);
    }

    if (!pyodide) {
      suspend_id = aw$4.suspend('Loading Pyodide.');
      load();
    }
    else {
      if (callback) callback(pyodide);
    }
  }
  function render(section) {

    // Put the content into an editor.
    let ed = section.showEditor(false, function() {
      section.obj.content = ed.ta.value;
      section.enqueue();
    });

    // Create a div for the execution result
    var div_result = document.createElement("div");
    section.div.appendChild(div_result);

    function wrapper(section) {
      run(section);
    }

    section.setFunc(wrapper);
    section.enqueue();
  }

  function run(section) {
    loadPy((py) => {
      py.runPython(section.obj.content);
    });
  }

  /**
   *
   * @licstart  The following is the entire license notice for the 
   *  JavaScript code in this page.
   *
   * Copyright (C) 2020  Andrew Rogers
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

  let aw$3 = null;

  function init$3(a) {
    aw$3 = a;
    let renderer = new Renderer();
    let seq = new Sequencer();

    aw$3.addRenderer = function(type, func) {
      renderer.renderers[type] = func;
    };

    aw$3.createDoc = function(obj) {
      let div=document.createElement("div");
      document.body.appendChild(div);
      let doc = new AwDoc(div, renderer, obj);
      doc.render();
      return doc;
    };

    aw$3.loadDoc = function(fn) {
      let div=document.createElement("div");
      document.body.appendChild(div);
      let doc = new AwDoc(div, renderer, {});
      doc.load(fn);
    };

    aw$3.queueRun = function(section) {
      seq.queueRun(section);
    };

    aw$3.render = function(sections) {
      renderer.renderSections(sections);
    };

    aw$3.resume = function(id){
      seq.resume(id);
    };

    aw$3.suspend = function(reason) {
      return seq.suspend(reason);
    };
  }

  function parseAwDoc( awdoc ) {

      let ret = [];

      var lines = awdoc.split('\n');
      var src = "";
      var obj={};
      var cnt = 0;
      for (var i = 0; i<lines.length; i++) {
          var line = lines[i];

          // Check if line is AW tag
          if (line.startsWith("AW{") && line.trim().endsWith("}")) {

              // Push the previous section
              if (cnt>0) {
                  obj.content = src;
                  ret.push(obj);
              }

              // Get attributes of this new section
              obj = JSON.parse(line.slice(2));

              src = "";
              cnt++;
          } else {
              src=src+line+"\n";
          }
      }

      // Push remaining content
      if (cnt>0) {
          obj.content = src;
          ret.push(obj);
      }
      else {
          // If no AW{...} tags then assume the doc is a JSON array.
          ret = JSON.parse(src);
      }

      return ret;
  }

  function Queue(callback) {
      this.queueA = [];
      this.queueB = [];
      this.in = this.queueA;
      this.dispatch = this.queueB;
      this.toggle = 0;
      this.callback = callback;
      this.dispatch_enabled = true;
      this.dispatch_pending = false;
  }

  Queue.prototype.post = function ( obj ) {
      if (obj.constructor.name == "Array") {
          for (var i=0; i<obj.length; i++) {
              this.in.push(obj[i]);
          }
      }
      else {
          this.in.push(obj);
      }

      this._schedule();
  };

  Queue.prototype.disableDispatch = function () {
    this.dispatch_enabled = false;
    this.dispatch_pending = false;
  };

  Queue.prototype.enableDispatch = function () {
    this.dispatch_enabled = true;
    this._schedule();
  };

  Queue.prototype._dispatch = function () {

    // If queue is empty then swap queues.
    if (this.dispatch.length == 0) {
      // Swap queues
      if (this.toggle == 0) {
        this.in = this.queueB;
        this.dispatch = this.queueA;
        this.toggle = 1;
      }
      else {
        this.in = this.queueA;
        this.dispatch = this.queueB;
        this.toggle = 0;
      }

      // If the new queue is not empty, schdeule a dispatch.
      if (this.dispatch.length > 0) {
        this._schedule();
      }
    } else {
      while( (this.dispatch.length > 0) && (this.dispatch_enabled) ) {
        var obj = this.dispatch.shift();
        this.callback( obj );
      }
      this._schedule();
    }
  };

  Queue.prototype._schedule = function () {
    if (this.dispatch_enabled && (this.dispatch_pending == false)) {
      // Dispatch on the next event cycle.
      var that = this;
      setTimeout( function(){
        that.dispatch_pending = false;
        that._dispatch();
      });
      this.dispatch_pending = true;
    }
  };

  class AwDoc {
    constructor(div, renderer, obj) {
      this.div = div;
      this.renderer = renderer;
      this.obj = obj || {};
      this.cnt = 1;
      this.sectionMap = {};

      // Layout
      this.#layout();
    }

    createDiv() {
      let div = document.createElement("div");
      this.div_sections.appendChild(div);
      return div;
    }

    createSection(obj) {

      // Get id from supplied string or object. Otherwise create a default id.
      let id = null;
      if(typeof obj === 'string') {
        id = obj;
      }
      else {
        id = obj.id;
        if (obj.hasOwnProperty("id") == false) {
          // Create a default ID if one is not given
          id = obj.type + "_" + this.cnt;
        }
        this.cnt++;
      }

      // If the id is not in map then create a new section.
      if (this.sectionMap.hasOwnProperty(id) == false) {
        this.sectionMap[id] = new AndrewWIDE.classes.Section(id);
      }

      // Assign object to section.
      this.sectionMap[id].setObj(this, obj);

      return this.sectionMap[id];
    }

    executeSection(id) {
      this.sectionMap[id].execute();
    }

    load(fn) {
      let that = this;
      aw$3.storage.readFile(fn, (err,data) => {
        that.obj = JSON.parse(data);
        that.render();
      });
    }

    render() {
      // Disable running all runnable sections until all sections dispatched. This is to allow asynchronous compilation of code to
      // complete before potential dependencies are run.
      let id = aw$3.suspend( "AwDoc render" );

      let sections = [];
      for (let key in this.obj) {
        let awdoc = this.obj[key];
        if (typeof awdoc === "string") {
           awdoc = parseAwDoc( awdoc );
           this.obj[key] = awdoc;
        }
        for (var i=0; i<awdoc.length; i++) {
          let section = this.createSection(awdoc[i]);
          sections.push(section);
        }
      }
      aw$3.render(sections);
      AndrewWIDE.resume( id );
    };

    save(path, callback) {
      aw$3.storage.writeFile(path, JSON.stringify(this.obj), (err) => {
        if (callback) callback(err);
      });
    }

    #layout() {
      // Header
      this.div_header = document.createElement('div');
      this.div.appendChild(this.div_header);

      // Textarea for displaying log.
      this.ta_log = document.createElement("textarea");
      this.ta_log.style.width = "100%";
      this.ta_log.hidden = true;
      this.div_header.appendChild(this.ta_log);

      // Filename for saving page.
      this.ip_fn = document.createElement("input");
      this.ip_fn.type = 'text';
      this.bt_save = document.createElement("button");
      this.bt_save.innerHTML = 'Save';
      this.div_header.appendChild(this.ip_fn);
      this.div_header.appendChild(this.bt_save);

      // Save button click handler.
      let that = this;
      this.bt_save.onclick = () => {
        that.save(that.ip_fn.value);
      };

      // Sections
      this.div_sections = document.createElement('div');
      this.div.appendChild(this.div_sections);

      // Footer - add section button.
      this.div_footer = document.createElement('div');
      this.div.appendChild(this.div_footer);
      for (let key in this.renderer.renderers) {
        let bt = document.createElement("button");
        bt.innerHTML = '+' + key;
        this.div_footer.appendChild(bt);
      }
    }
  }

  class Renderer {
    constructor() {
      this.renderers = {};
    }

    registerRenderer(name, renderer) {
      this.renderers[name]=renderer;
    }

    renderSections(sections) {
      if (sections.constructor.name == "Array") {
        for (var i=0; i<sections.length; i++) {
          this.#dispatch(sections[i]);
        }
      }
      else {
        this.#dispatch(sections);
      }
    }

    #dispatch(section) {
      const renderer_name = section.obj.type;
      if (this.renderers.hasOwnProperty(renderer_name)) {
        const renderer = this.renderers[renderer_name];
        renderer(section);
      }
      else {
        const ta = document.createElement("textarea");
        ta.value = "Error: No renderer for '" + renderer_name + "'\n";
        ta.value += JSON.stringify(section.obj);
        ta.style.width = "100%";
        section.div.appendChild(ta);
      }
    }
  }

  class Sequencer {
    constructor() {
      this.suspend_cnt = 0;
      this.disables={}; // If any items in this object are true, running is disabled and queued for later.
      this.queue = new Queue(function(section) {
        section.execute();
      });
    }

    queueRun(section) {
      if (section.func) this.queue.post(section);
    }

    resume(id) {
      let name = "suspend_" + id;
      delete this.disables[name];
      if (Object.keys(this.disables).length == 0) this.queue.enableDispatch();
    }

    suspend(reason) {
      let id = this.suspend_cnt;
      let name = "suspend_" + id;
      this.suspend_cnt++;
      this.disables[name] = true;
      this.queue.disableDispatch();
      return id;
    }
  }

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

  let aw$2 = null;

  function init$2(a) {
    aw$2 = a;
    aw$2.classes.Section = Section;
  }

  class Section {
    constructor(id) {
      this.id = id;
      this.observers = [];
      this.inputSections = [];
    }

    addDep(dep) {
      this.observers.push(dep);
    }

    addInputSection(input) {
      this.inputSections.push(input);
    }

    enqueue(enqueue_observers) {
      if (!this.obj.id || (this.inputSections.length > 0)) {
        if (this.func) aw$2.queueRun(this);
      }
      if (enqueue_observers) {
        for (let i=0; i<this.observers.length; i++) this.observers[i].enqueue(true);
      }
    }

    execute() {
      this.inputs = {};
      for (let i=0; i<this.inputSections.length; i++) {
          let key = this.inputSections[i].id;
          this.inputs[key] = this.inputSections[i].getData();
      }
      if (this.func) this.func(this);
    }

    getData() {
      return this.data;
    }

    setData(data) {
      this.data = data;
    }

    setFunc(f) {
      this.func = f;
      this.#linkInputSections();
    }

    setObj(doc, obj) {
      if (typeof obj === 'object') {
        this.doc = doc;
        this.obj = obj;
        this.#createDiv();
      }
    }

    showEditor(hidden, callback) {

      // Create controls
      let controls = new NavBar();
      let butt_run = document.createElement("button");
      butt_run.innerHTML="Run";
      controls.addRight(butt_run);
      controls.elem.hidden = true;
      this.div.appendChild(controls.elem);

      // Create text area
      let ta = {};
      if (this.obj.hasOwnProperty("hidden")) hidden = this.obj.hidden;
      if (!hidden) ta = this.#textarea();

      // Define event handler functions.
      butt_run.onclick = function() {
        if (callback) callback();
      };
      ta.oninput = function() {controls.elem.hidden = false;};

      return {controls,ta};
    }

    showSource(hidden) {
      let ta = {};
      if (this.obj.hasOwnProperty("hidden")) hidden = this.obj.hidden;
      if (!hidden) ta = this.#textarea();
      return ta;
    }

    #createDiv() {
      // Create a div for the section.
      if (this.div == undefined) {
        this.div = this.doc.createDiv();
      }
    }

    #linkInputSections() {
      if (this.obj.inputs) {
        let input_ids = this.obj.inputs;
        for (let i=0; i<input_ids.length; i++) {
          let input = this.doc.createSection(input_ids[i]);
          this.inputSections.push(input);
          input.addDep(this);
        }
      }
    }

    #textarea() {
      let ta = document.createElement("textarea");
      ta.style.width = "100%";
      ta.value = this.obj.content;
      this.div.appendChild(ta);
      ta.style.height = (ta.scrollHeight+8)+"px";
      return ta;
    }
  }

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

  let aw$1 = null;

  function init$1(a) {
    aw$1 = a;
    aw$1.storage = new Storage('AndrewWIDE Storage');
  }

  class Storage {
    constructor(db_name) {
      this.db_name = db_name;
      this.db = null;
    }

    lsDB() {
      return indexedDB.databases();
    }

    // https://nodejs.org/api/fs.html#fsreaddirpath-options-callback
    readdir(path, options, callback) {
      if (typeof callback === 'undefined') callback = options;
      let suspend_id = aw$1.suspend('Reading directory: ' + path);
      if(path && !path.endsWith('/')) path = path + '/';
      let files = [];
      let that = this;
      that.#openDB(function() {
        if (that.db) {
          const os = that.db.transaction('files','readonly').objectStore('files');
          const req = os.openCursor();

          req.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
              callback(null, files);
              aw$1.resume(suspend_id);
            }
            else {
              let cpath = cursor.value.path;
              if (cpath.startsWith(path)) {
                let fn = cpath.slice(path.length);
                // TODO: Don't include files in subdirectories.
                files.push(fn);
              }

              cursor.continue();
            }
          };

          req.onerror = (event) => {
            callback('error',files);
            aw$1.resume(suspend_id);
          };
        }
        else {
          callback('error', null);
          aw$1.resume(suspend_id);
        }
      });
    }

    // https://nodejs.org/api/fs.html#fsreadfilepath-options-callback
    readFile(path, options, callback) {
      if (typeof callback === 'undefined') callback = options;
      let suspend_id = aw$1.suspend('Reading file: ' + path);
      let that = this;
      that.#openDB(function() {
        if (that.db) {
          that.#getFileObj(path, (obj) => {
            if (typeof obj === 'string') {
              callback('obj', null);
              aw$1.resume(suspend_id);
            }
            else {
              callback(null, obj.content);
              aw$1.resume(suspend_id);
            }
          });
        }
        else {
          callback('error', null);
          aw$1.resume(suspend_id);
        }  
      });
    }

    // https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback
    writeFile(file, data, options, callback) {
      if (typeof callback === 'undefined') callback = options;
      let suspend_id = aw$1.suspend('Writing file: ' + file);
      let that = this;
      that.#openDB(function() {
        if (that.db) {
          const os = that.db.transaction('files','readwrite').objectStore('files');
          let obj = {};
          obj.content = data;
          obj.path = file;

          const key = obj.path;
          const req = os.put(obj, key);

          req.onsuccess = (event) => {
            callback('success');
            aw$1.resume(suspend_id);
          };

          req.onerror = (event) => {
            callback('error');
            aw$1.resume(suspend_id);
          };
        }
        else {
          callback('error');
          aw$1.resume(suspend_id);
        }
      });
    }

    #getFileObj(path, callback) {
      const os = this.db.transaction('files','readwrite').objectStore('files');
      const req = os.openCursor();

      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) {
          callback('File not found: ' + path);
        }
        else {
          if (cursor.value.path == path) {
            callback(cursor.value);
          }
          else {
            cursor.continue();
          }
        }
      };

      req.onerror = (event) => {
        callback('error');
      };
    }

    #openDB(callback) {
      if (this.db) {
        if (callback) callback();
      }
      else {
        var request = indexedDB.open(this.db_name);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          db.createObjectStore('cache');
          db.createObjectStore('files');
          db.createObjectStore('settings');
          db.createObjectStore('scripts');
        };

        request.onerror = (event) => {
          console.log("Error openning DB: " + this.db_name);
          if (callback) callback();
        };

        request.onsuccess = (event) => {
          this.db = request.result;
          if (callback) callback();
        };
      }
    }
  }

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

  let aw = {};
  let initialised = false;
  let module = null; // WasmDSP module for AwDoc functions.
  let prefix = "";
  let wasmdsp = null;

  function init(a) {
      aw = a;
      aw.addRenderer("wasmcpp_module", renderModule);
      aw.addRenderer("wasmcpp", cpp);
      aw.callWasmFunc = callWasmFunc;
      aw.getWasmArray = getArray;
      aw.loadWasmDSPModules = loadWasmDSPModules;
  }

  function callWasmFunc(func_name) {
      if (!initialised) {
          const id = aw.suspend("Initialising wasm.");
          initialised = true;
          wasmdsp.initialise([module], function() {
              aw.wasm_mod = module.wasm;
              module.wasm.exports[func_name]();
              aw.resume(id);
          });
      }
      else {
          module.wasm.exports[func_name]();
      }
  }

  function cpp(section) {
      section.showSource(false);

      let func_name = section.id;

      if (func_name != 'globals') {

          // Remove wasmcpp_ prefix if it exists.
          if (func_name.substr(0,8) == "wasmcpp_") func_name = func_name.substr(8);

          function wrapper(s) {
              let fn = prefix + "_" + func_name;
              callWasmFunc(fn);
          }

          section.setFunc(wrapper);
          section.enqueue();
      }
  }

  function getArray(name) {
      let arrs = module.arrays;
      arrs[name] = arrs[name] || [];
      return arrs[name];
  }

  function loadWasmDSP(callback) {
    if (wasmdsp == null) {
      const id = aw.suspend("Loading WasmDSP.");
      requirejs(["WasmDSP"], function(w){
        wasmdsp = w;
        wasmdsp.modules = {};  // WasmDSP library modules.
        aw.WasmDSP = w;
        if (callback) callback();
        aw.resume(id);
      });
    }
    else {
      if (callback) callback();
    }
  }

  function loadWasmDSPModules(mods, callback) {
    loadWasmDSP(function(){
      let cnt = 0;
      const id = aw.suspend("Loading WasmDSP modules.");
      for (let i in mods) {
        require([mods[i]], function(m){
          wasmdsp.modules[mods[i]] = m;
          cnt++;
          if (cnt == mods.length) {
            wasmdsp.initialise(wasmdsp.modules, function() {
              if (callback) callback();
              aw.resume(id);
            });
          }
        });
      }
    });
  }

  function renderModule(section) {
      const id = aw.suspend("Loading WasmDSP module.");
      loadWasmDSP(function() {
          const module_name = section.obj.module;
          prefix = section.obj.prefix;
          requirejs([module_name], function(m){
              module = m;
              module.arrays = module.arrays || {};
              aw.resume(id);
          });
      });
  }

  window.AndrewWIDE = window.AndrewWIDE || {};
  AndrewWIDE.classes = AndrewWIDE.classes || {};

  init$3(AndrewWIDE);
  init$9(AndrewWIDE);
  init$8(AndrewWIDE);
  init$7(AndrewWIDE);
  init$6(AndrewWIDE);
  init$5(AndrewWIDE);
  init$4(AndrewWIDE);
  init$2(AndrewWIDE);
  init$1(AndrewWIDE);
  init(AndrewWIDE);

}));
