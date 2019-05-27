/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2016  Andrew Rogers
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



window.onload=function(e){
  var processing=false;
  var mjmd = new MathJaxMarkdownEditor();

  // Get elements
  var ta_edit=document.getElementById("ta_edit");
};

var MathJaxMarkdownEditor = function() {
    this.svgarray = new SVGArray();
    this.renderer = new MathJaxMarkdownRenderer();

    // Get elements
    this.ta_edit=document.getElementById("ta_edit");
    this.div_html=document.getElementById("div_html");
    this.btn_mdhtml = document.getElementById('btn_md_html');
    this.div_downloadhtml = document.getElementById("div_downloadhtml");

    this.displayEditTab();
    var that = this;
    //this.renderer.render(function(){that.renderedHandler();});

    MathJax.Hub.Config({
        tex2jax: {
            inlineMath: [["$","$"],["\\(","\\)"]],
            processEscapes: true
        },
        jax: ["input/TeX","output/SVG"]
    });

    // Handle MD / HTML button click
    var that=this;
    this.btn_mdhtml.addEventListener('click', function() {
        if(that.ta_edit.style.display=='block'){
          that.renderer.render(function(){that.renderedHandler();});
        }
        else{
            that.ta_edit.style.display='block';
            that.div_html.style.display='none';
            that.btn_mdhtml.innerHTML='View';
            that.div_downloadhtml.innerHTML="";
        }
    }, false);
};

MathJaxMarkdownEditor.prototype.displayEditTab = function() {
    this.ta_edit.style.display='block';
    this.div_html.style.display='none';
    this.btn_mdhtml.innerHTML='View';
    this.div_downloadhtml.innerHTML="";
};

MathJaxMarkdownEditor.prototype.renderedHandler = function() {

    // Create HTML with no dependencies for downloading
    var html = this.createHTML();
    var blob=new Blob([html],{type: "text/html"});
    var url = URL.createObjectURL(blob);
    var fn="MJMD_out.html";
    var a_download = '<a href="' + url + '" download="' + fn + '">Download "' + fn + '"</a>';
    this.div_downloadhtml.innerHTML=a_download;

    // Switch view to rendered output
    this.ta_edit.style.display='none';
    this.div_html.style.display='block';
    this.btn_mdhtml.innerHTML='Edit';
};

MathJaxMarkdownEditor.prototype.createHTML = function(){
    var html="<!DOCTYPE html>\n<html>\n<body>";

    // Get the SVG path definitions
    var defs=document.getElementById("MathJax_SVG_Hidden");
    if(defs)html+=defs.parentNode.outerHTML;

    // The main HTML and equation SVGs
    html+=this.div_html.outerHTML;

    html+="</body>\n</html>";  
    return html;
};

