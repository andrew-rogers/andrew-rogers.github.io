/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2021  Andrew Rogers
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

// Dependencies:
//   https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js

var Calculator = function(div) {
    this.div = div;
    this._hideSource();
    this._getSections();
    this._createDivs();
    this.div.style.width="100%";
    this.div.style.display="block";

};

Calculator.prototype._hideSource = function() {
    this.src = this.div.innerHTML;
    this.div.innerHTML="";
};

Calculator.prototype._getSections = function() {
    var src = this.src;
    var arr = src.split("\n%%");
    
    var sections={};
    for (var i=0; i<arr.length; i++) {
        // Get section name
        var i0 = arr[i].indexOf("\n");
        var name = arr[i].substring(0,i0).toLowerCase();
        
        // Get section content
        var content = arr[i].substring(i0).trim();
        
        sections[name]=content;
    }
    this.sections = sections;
};

Calculator.prototype._createDivs = function() {

    // Create div for header
    var div_hdr = document.createElement("div");
    div_hdr.innerHTML=this.sections["header"];
    this.div.appendChild(div_hdr);
    
    // Create div for equation
    var div_eqn = document.createElement("div");
    div_eqn.style.cssFloat = "left";
    div_eqn.style.width = "40%";
    div_eqn.innerHTML=this.sections["eqn"];
    this.div.appendChild(div_eqn);
    
    // Create div for inputs
    this.div_inputs = document.createElement("div");
    this.input_objs=[];
    this._ui(this.sections["inputs"]);
    this.div_inputs.style.cssFloat = "left";
    this.div_inputs.style.width = "30%";
    var btn_calc = document.createElement("button");
    btn_calc.innerHTML="Calculate";
    var that = this;
    btn_calc.onclick = function(){that._calc()};
    this.div_inputs.appendChild(btn_calc);
    this.div.appendChild(this.div_inputs);
    
    // Create div for outputs
    this.div_outputs = document.createElement("div");
    this.div_outputs.style.cssFloat = "left";
    this.div_outputs.style.width = "30%";
    this.output_objs=[];
    this._ui(this.sections["outputs"]);
    this.div.appendChild(this.div_outputs);
    
    // Clear the float
    var br_clear=document.createElement("br");
    br_clear.style.clear = "left";
    this.div.insertBefore(br_clear,div_footer);
    
    // Create div for footer
    var div_footer = document.createElement("div");
    div_footer.innerHTML=this.sections["footer"];
    this.div.appendChild(div_footer);
};

Calculator.prototype._ui = function(src) {
    
    // Create the function string
    var src_funcs = "var that=this;\n"
                  + "function engInput(vn, prompt, value, size){that._input('eng', vn, prompt, value, size);}\n"
                  + "function engOutput(vn, label, units, size){that._output('eng', vn, label, units, size);}\n";
    
    Function(src_funcs + src).call(this);
};

Calculator.prototype._input = function(type, vn, prompt, value, size) {
    var div = document.createElement("div");
    var input = document.createElement("input");
    input.setAttribute("value", value);
    input.setAttribute("maxlength", size);
    div.innerHTML=prompt+": ";
    div.appendChild(input);
    div.innerHTML+="<br>\n";
    this.div_inputs.appendChild(div);
    var obj={node: div.children[0], vn: vn, type: type};
    this.input_objs.push(obj);
};

Calculator.prototype._output = function(type, vn, label, units, size) {
    this.div_outputs.innerHTML+=label+" = ";
    var span=document.createElement("span");
    this.div_outputs.appendChild(span);
    var obj={node: span, vn: vn, type: type, units: units};
    this.output_objs.push(obj);
};

Calculator.prototype._calc = function() {

    // Function source to define the input variables
    var src="var pi = Math.PI;\n";
    for (var i=0; i<this.input_objs.length; i++) {
        var obj = this.input_objs[i];
        src+="var "+obj.vn+" = this._getInput("+i+");\n";
    }
    
    // Append the code for the calculation
    src+=this.sections["calc"]+"\n";
    
    // Generate code for outputs
    for (var i=0; i<this.output_objs.length; i++) {
        var obj = this.output_objs[i];
        src+="this._setOutput( "+i+", "+obj.vn+" )\n";
    }
    Function(src).call(this);
};

Calculator.prototype._getInput = function(index) {
    var obj = this.input_objs[index];
    return this._toFloat(obj.node.value);
};

Calculator.prototype._setOutput = function(index, value) {
    var obj = this.output_objs[index];
    obj.node.innerHTML = this._toEngStr(value) + obj.units;
};

Calculator.prototype._toFloat = function(str) {
    var mult = 1.0;
    var pos = -1;
    var ret = str;
    for (var i=0; i<str.length; i++) {
        var c=str[i];
        if (c == 'p') mult=1e-12;
        if (c == 'n') mult=1e-9;
        if (c == 'u') mult=1e-6;
        if (c == 'm') mult=1e-3;
        if (c == 'k') mult=1e3;
        if (c == 'M') mult=1e6;
        if (c == 'G') mult=1e9;
        if (mult!=1.0) {pos=i; break;}
    }
    if (pos>=0) ret=str.substring(0,i)+'.'+str.substring(i+1);
    return ret*mult;
};

Calculator.prototype._toEngStr = function(value) {
    var exp=0;
    var letter='';
    var val=0.0+value;
    while (exp<9   && (val>=1000 || val<=-1000)) {exp=exp+3; val=val/1000;}
    while (exp>-12 && (val< 1.0  && val> -1.0 )) {exp=exp-3; val=val*1000;}
    if (exp == -12) letter='p';
    if (exp == -9 ) letter='n';
    if (exp == -6 ) letter='u';
    if (exp == -3 ) letter='m';
    if (exp ==  3 ) letter='k';
    if (exp ==  6 ) letter='M';
    if (exp ==  9 ) letter='G';
    return val+" "+letter;
};
