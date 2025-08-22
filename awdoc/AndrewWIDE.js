/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2022  Andrew Rogers
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

window.AndrewWIDE = window.AndrewWIDE || {};

AndrewWIDE.loadScripts = function(urls, callback) {
  let cnt = 0;
  for (var i=0; i<urls.length; i++) {
    var script = document.createElement('script');
    script.setAttribute('src', urls[i]);
    script.setAttribute('type', 'text/javascript');
    script.onload = function() {
      cnt = cnt + 1;
      if (cnt == urls.length) {
        if (callback) callback();
      }
    };
    document.head.appendChild(script);
  }

  // Do additional check in case urls is empty array.
  if (cnt == urls.length) {
    if (callback) callback();
  }
};

class AwDocViewer {
  constructor() {
    this.#disableDrop();
    let that = this;
    this.#loadScripts(() => {
      that.#render();
    });
  }

  #disableDrop() {
    // Prevent dropped files being openned in new browser tabs.
    window.addEventListener("dragover",function(e){
        e.preventDefault();
    },false);
    window.addEventListener("drop",function(e){
        e.preventDefault();
    },false);
  }

  #loadScripts(callback) {
    let scripts = [];

    // Pyodide has to be loaded before require.js https://github.com/pyodide/pyodide/issues/4863
    if (typeof loadPyodide === 'undefined') scripts.push("https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js");
    if (typeof window['@hpcc-js/wasm'] === 'undefined') scripts.push("https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js");

    let that = this;
    AndrewWIDE.loadScripts(scripts, () => {
      that.#requireModules(callback);
    });
  }

  #render() {
    let fn = window.location.search;
    if (fn.startsWith("?idbs=")) {
      fn = decodeURIComponent(fn.slice(6));
      AndrewWIDE.loadDoc(fn);
    }
    else {
      let obj = {};
      const tas = document.getElementsByClassName('awjson');
      for (let i=0; i<tas.length; i++) {
        const ta = tas[i];
        obj[ta.id] = ta.value;
      }
      AndrewWIDE.createDoc(obj);
    }
  }

  #requireModules(callback) {
    let script = document.createElement('script');
    script.setAttribute('src', 'require.js');
    script.setAttribute('type', 'text/javascript');
    let that = this;
    script.onload = function() {
      require.config({
        paths: {
          mathjs:  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/14.0.1/math',
          wasmdsp: './WasmDSP'
        }
      });
      require(["./modules"], function() {
        if (callback) callback();
      });
    };
    document.head.appendChild(script);
  }
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

var Transform = function(a,b,c,d,dx,dy)
{
    this.a=a;
    this.b=b;
    this.c=c;
    this.d=d;
    this.dx=dx;
    this.dy=dy;
};

Transform.prototype.rotate = function(p1,p2)
{
    var angle = p1;
    if( typeof p2 !== 'undefined') angle=Math.atan2(p2.y-p1.y,p2.x-p1.x);
    var C = Math.cos(angle);
    var S = Math.sin(angle);
    var a = this.a*C+this.c*S;
    var b = this.b*C+this.d*S;
    this.c = -this.a*S+this.c*C;
    this.d = -this.b*S+this.d*C;
    this.a=a;
    this.b=b;
};

Transform.prototype.transform = function(points)
{
    for( var i=0; i<points.length; i++)
    {
        var p=points[i];
        var x = this.a *p.x + this.c * p.y + this.dx;
        p.y = this.b *p.x + this.d * p.y + this.dy;
        p.x = x;
        points[i]=p;
    }
};

var Triangle = function(pA,pB,pC)
{
    this.pA = pA;
    this.pB = pB;
    this.pC = pC;
}

// Given point A, length c, length a and point C 
Triangle.prototype.fromPLLP = function (pA,lc,la,pC)
{
    this.pA = pA;
    this.pC = pC;

    // lb is distance between pA and pC
    var lb=pA.distance(pC);

    // Cosine rule to find angle A
    var A=-Math.acos((lb*lb+lc*lc-la*la)/(2*lb*lc));

    // Get point B
    this.pB = pA.addPolar(lc,A+pA.angle(pC));
}

var Point = function(x, y)
{
    this.x=x;
    this.y=y;
};

Point.prototype.addPolar = function(radius, angle)
{
    var x=this.x+radius*Math.cos(angle);
    var y=this.y+radius*Math.sin(angle);
    return new Point(x,y);
}

Point.prototype.angle = function (p)
{
    var dx=p.x-this.x;
    var dy=p.y-this.y;
    return Math.atan2(dy,dx);
}

Point.prototype.distance = function (p)
{
    var dx=p.x-this.x;
    var dy=p.y-this.y;
    return Math.sqrt(dx*dx+dy*dy);
}

var Line = function(p1, p2)
{
    // Copy points
    this.p1={...p1};
    this.p2={...p2};
};

Line.prototype.extend = function(ex)
{
    var dx=this.p2.x-this.p1.x;
    var dy=this.p2.y-this.p1.y;
    var l=Math.sqrt(dx*dx+dy*dy);
    var scale=(l+ex)/l;
    dx=dx*scale;
    dy=dy*scale;
    this.p2.x=this.p1.x+dx;
    this.p2.y=this.p1.y+dy;
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

var Plot = function()
{
    this.series=[];
    this.legends=[];
    this.gx=50;
    this.gy=10;
    this.gw=540;
    this.gh=340;
    this.colours=["red", "green", "blue"];
};

Plot.prototype.addSeries = function()
{
    var series={}
    var points=[];

    if (arguments.length == 1) {
        var arr = arguments[0];
        for (var x=0; x<arr.length; x++) points[x]={x: x, y: arr[x]};
    }

    if (arguments.length == 2) {
        var arr_x = arguments[0];
        var arr_y = arguments[1];
        for (var n=0; n<arr_x.length; n++) points[n]={x: arr_x[n], y: arr_y[n]};
    }

    series.points=points;
    this.series.push(series);
};

Plot.prototype.axisLabels = function(xlabel, ylabel)
{
    this.xlabel=xlabel;
    this.ylabel=ylabel;
};

Plot.prototype.setLegends = function(legends)
{
    this.legends = legends;
}

Plot.prototype.draw = function(fig)
{
    var range = this._getRange();

    var xsteps = this._calcAxisSteps(range.xmin, range.xmax, 6);
    var xmin = xsteps[0];
    var xmax = xsteps[xsteps.length-1];
    var ysteps = this._calcAxisSteps(range.ymin, range.ymax, 4);
    var ymin = ysteps[0];
    var ymax = ysteps[ysteps.length-1];

    // Calculate scaling and offset
    var xscale = this.gw/(xmax-xmin);
    var xoffset = this.gx-xscale*xmin;
    var yscale = this.gh/(ymin-ymax);
    var yoffset = this.gy+this.gh-yscale*ymin;

    // Draw axis
    var x1 = xmin * xscale + xoffset;
    var x2 = xmax * xscale + xoffset;
    var y1 = ymin * yscale + yoffset;
    var y2 = ymax * yscale + yoffset;
    fig.drawRect(x1, y2, x2 - x1, y1 - y2);
    var y1 = this.gy;
    var y2 = this.gy+this.gh;
    for (var i=1; i<xsteps.length-1; i++) {
        var x = xsteps[i] * xscale + xoffset;
        fig.drawLine({p1:{x: x, y: y1},p2:{x: x, y: y1+3}});
        fig.drawLine({p1:{x: x, y: y2},p2:{x: x, y: y2-3}});
    }
    var xstrings = this._numbersToStrings(xsteps,3);
    for (var i=0; i<xsteps.length; i++) {
        var step = xsteps[i];
        fig.drawText(step * xscale + xoffset, y2+5, 'tc' , 10, xstrings[i]);
    }
    var x1 = this.gx;
    var x2 = this.gx+this.gw;
    for (var i=1; i<ysteps.length-1; i++) {
        var y = ysteps[i] * yscale + yoffset;
        fig.drawLine({p1:{x: x1, y: y},p2:{x: x1+3, y: y}});
        fig.drawLine({p1:{x: x2, y: y},p2:{x: x2-3, y: y}});
    }
    var ystrings = this._numbersToStrings(ysteps,3);
    for (var i=0; i<ysteps.length; i++) {
        var step = ysteps[i];
        fig.drawText(x1-5, step * yscale + yoffset, 'cr' , 10, ystrings[i]);
    }
    if(this.xlabel) fig.drawText(this.gx+this.gw/2, this.gy+this.gh+20, 'tc', 10, this.xlabel);
    if(this.ylabel) fig.drawText(this.gx-30, this.gy+this.gh/2, this.ylabel, {rotation: -90, fs: 10, anchor: 'bc'});

    // Draw series
    var y = this.gy + 10;
    for (var i=0; i<this.series.length; i++) {
        var points = this.series[i].points;
        points = this._scalePoints(points, xscale, xoffset, yscale, yoffset);
        var line_opts = {stroke: this.colours[i%this.colours.length]};
        fig.drawPolyLine(points, line_opts);

        if (this.legends[i]) {
            var x = this.gx + this.gw;
            fig.drawLine({p1: {x: x-50, y: y}, p2: {x: x-40, y: y}}, line_opts);
            fig.drawText(x-38, y, this.legends[i], {anchor: 'cl', fs: 10});
            y+=15;
        }
    }
};

Plot.prototype._getRange = function()
{
    var xmin = Number.POSITIVE_INFINITY;
    var xmax = Number.NEGATIVE_INFINITY;
    var ymin = Number.POSITIVE_INFINITY;
    var ymax = Number.NEGATIVE_INFINITY;
    for (var i=0; i<this.series.length; i++) {
        var points = this.series[i].points;
        for (var p=0; p<points.length; p++) {
            if(points[p].x < xmin) xmin=points[p].x;
            if(points[p].x > xmax) xmax=points[p].x;
            if(points[p].y < ymin) ymin=points[p].y;
            if(points[p].y > ymax) ymax=points[p].y;
        }
    }
    return {xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax};
};

Plot.prototype._scalePoints = function(points, xscale, xoffset, yscale, yoffset)
{
    var ret=[];
    for (var p=0; p<points.length; p++) {
        var x=xscale * points[p].x + xoffset;
        var y=yscale * points[p].y + yoffset;
        ret.push({x: x, y: y});
    }
    return ret;
};

Plot.prototype._calcAxisSteps = function(min, max, min_divs)
{
    // Axis steps 1,2,5,10,20,50,100,....
    var sa = [10,5,2,1];
    var max_step = (max - min) / min_divs;
    var decade = Math.floor(Math.log10(max_step));

    var si=0;
    var step_size = sa[si]*Math.pow(10,decade);
    var num_divs = (max-min)/step_size;
    
    while (num_divs < min_divs) {
        si++;
        step_size = sa[si]*Math.pow(10,decade);
        num_divs = (max-min)/step_size;
    }

    var steps=[]
    for (var step = Math.floor(min/step_size)*step_size; step < (max+step_size); step+=step_size) steps.push(step);   
    return steps;
};

Plot.prototype._numbersToStrings = function(nums, precision)
{
    var largest = nums[0];
    for (var i=0; i<nums.length; i++) {
        if (nums[i] > largest) largest = nums[i];
        if (-nums[i] > largest) largest = -nums[i];
    }

    var ret=[];
    var smallest = largest/Math.pow(10,precision);
    for (var i=0; i<nums.length; i++) {
        var num = nums[i];
        if (Math.abs(num) < smallest) ret.push("0");
        else {
            var str=num.toPrecision(precision);
            if (str.includes('.')) {
                // Trim trailing zeros and decimal point
                while (str.slice(-1) == '0') str=str.slice(0,-1);
                if (str.slice(-1) == '.') str=str.slice(0,-1);
            }
            ret.push(str);
        }
    }

    return ret;
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

var Adder = function(cp, radius)
{
    this.cp={...cp};
    this.radius=radius;
};

Adder.prototype.draw = function(fig)
{
    fig.drawCircle(this.cp, this.radius);
    var r=this.radius/2;

    // Draw the +
    var p1=new Point(this.cp.x-r,this.cp.y);
    var p2=new Point(this.cp.x+r,this.cp.y);
    var p3=new Point(this.cp.x,this.cp.y-r);
    var p4=new Point(this.cp.x,this.cp.y+r);
    fig.drawLine(new Line(p1,p2),'-2-');
    fig.drawLine(new Line(p3,p4),'-2-');
};

Adder.prototype.getConnection = function(point)
{
    var l=new Line(point, this.cp);
    l.extend(-this.radius);
    return new Point(l.p2.x,l.p2.y);
};

var Delay = function(cp, w, h, text)
{
    this.cp=cp;
    this.x=cp.x-w/2;
    this.y=cp.y-h/2;
    this.w=w;
    this.h=h;
    this.text=text;
};

Delay.prototype.getConnection = function(point)
{
    var x=point.x;
    if(x>this.cp.x+this.w/2) x=this.cp.x+this.w/2;
    if(x<this.cp.x-this.w/2) x=this.cp.x-this.w/2;
    var y=point.y;
    if(y>this.cp.y+this.h/2) y=this.cp.y+this.h/2;
    if(y<this.cp.y-this.h/2) y=this.cp.y-this.h/2;
    return new Point(x,y);
};

Delay.prototype.draw = function(fig)
{
    fig.drawRect(this.x, this.y, this.w, this.h);
    var font_size=12;
    fig.drawText(this.x+this.w/2, this.y+this.h/2, 'cc', font_size, this.text);
};

var Node = function(cp, radius)
{
    this.cp={...cp};
    this.radius=radius;
};

Node.prototype.draw = function(fig)
{
    fig.drawDot(this.cp, this.radius);
};

Node.prototype.getConnection = function()
{
    return new Point(this.cp.x,this.cp.y);
};

var Amplifier = function(g, text)
{
    this.points=this._calcPoints(g);
    this.text=text;
};

Amplifier.prototype._calcPoints = function(g)
{
    var p1=new Point(-0.5,-0.6);
    var p2=new Point(0.5,0); // Output connection
    var p3=new Point(-0.5,0.6);
    var p4=new Point(-0.5,0); // Input connection
    var p5=new Point(0,-0.5); // Text location
    var points=[p1,p2,p3,p4,p5];
    g.transform(points);
    return points;
};

Amplifier.prototype.getConnections = function()
{
    return {in: this.points[3], out: this.points[1]};
};

Amplifier.prototype.draw = function(fig)
{
    fig.drawPolygon([this.points[0],this.points[1],this.points[2]]);
    var font_size=12;
    var p_out=this.points[1];
    var p_in=this.points[3];
    var angle = 20*Math.atan2(p_out.y-p_in.y,p_out.x-p_in.x)/Math.PI;
    var pos = 'tc';
    if(angle>-1 && angle<1) pos='bc';
    else if(angle>=1 && angle<=9) pos='bl';
    else if(angle>9 && angle <11) pos='cl';
    else if(angle>=11 && angle<=19) pos='tl';
    else if(angle>=-19 && angle<=-11) pos='tr';
    else if(angle>-11 && angle <-9) pos='cr';
    else if(angle>=-9 && angle<=-1) pos='br';
    fig.drawText(this.points[4].x, this.points[4].y, pos, font_size, this.text);
};

var AmplifierConnector = function(points,text,params,sec,pos)
{
    this.points=this._calcPoints(points);
    this.params='-->';
    if(params)this.params = params;
    if(typeof sec === 'undefined')sec=Math.floor(this.points.length/2)-1;
    this.sec = sec;
    if(typeof pos === 'undefined')pos=0.5;
    var p0=this.points[this.sec];
    var p1=this.points[this.sec+1];
    var x=pos*p1.x+(1-pos)*p0.x;
    var y=pos*p1.y+(1-pos)*p0.y;
    var g=new Transform(7,0,0,7,x,y);
    g.rotate(p0,p1);
    this.amp = new Amplifier(g,text);
};

AmplifierConnector.prototype._calcPoints = function(points)
{
    var last=points.length-1;
    var p1=points[1];
    if(p1.cp) p1=p1.cp;    // Get centre point of shape
    var pl1=points[last-1];
    if(pl1.cp) pl1=pl1.cp; // Get centre point of shape
    if(points[0].getConnection)points[0]=points[0].getConnection(p1);
    if(points[last].getConnection)points[last]=points[last].getConnection(pl1);
    return points;
};

AmplifierConnector.prototype.draw = function(fig)
{
    this.amp.draw(fig);

    // Draw lines to connect amplifier to shapes.
    var connections = this.amp.getConnections();
    var points_in = this.points.slice(0,this.sec+1);
    points_in.push(connections.in);
    fig.drawPolyLine(points_in,'---');
    var points_out = this.points.slice(this.sec+1);
    points_out.unshift(connections.out);
    fig.drawPolyLine(points_out,this.params);
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

var SvgFigure = function(svg_el)
{
    this.svg=svg_el;
    this.ns='http://www.w3.org/2000/svg';
};

SvgFigure.prototype.drawLine = function(line, options)
{
    var params = '---';
    var stroke = '#000';

    if (typeof options == 'string') {
        params = options;
    } else if (typeof options == 'object') {
        if (options.hasOwnProperty('params')) params = options.params;
        if (options.hasOwnProperty('stroke')) stroke = options.stroke;
    }

    params=this._splitLineParams(params);

    var stroke_width=1;
    if( params.mid.match('2') ) stroke_width=2;

    var element = document.createElementNS(this.ns, 'line');
    element.setAttributeNS(null, 'x1', line.p1.x);
    element.setAttributeNS(null, 'y1', line.p1.y);
    element.setAttributeNS(null, 'x2', line.p2.x);
    element.setAttributeNS(null, 'y2', line.p2.y);
    element.setAttributeNS(null, 'stroke-width', stroke_width);
    element.setAttributeNS(null, 'stroke', stroke);
    if(params.end.slice(-1)=='>') element.setAttributeNS(null, 'marker-end', 'url(#arrow)');
    this.svg.appendChild(element);

};

SvgFigure.prototype.drawVGuide = function(x)
{
    var vb=this.svg.viewBox.baseVal;

    var element = this._createElement('line');
    element.setAttributeNS(null, 'x1', x);
    element.setAttributeNS(null, 'y1', vb.y);
    element.setAttributeNS(null, 'x2', x);
    element.setAttributeNS(null, 'y2', vb.y + vb.height);
    element.setStyle('stroke: #f77; stroke-opacity: 0.25; stroke-width: 5');
    this.svg.appendChild(element);

    return element;
};

SvgFigure.prototype.drawHGuide = function(y)
{
    var vb=this.svg.viewBox.baseVal;

    var element = this._createElement('line');
    element.setAttributeNS(null, 'x1', vb.x);
    element.setAttributeNS(null, 'y1', y);
    element.setAttributeNS(null, 'x2', vb.x + vb.width);
    element.setAttributeNS(null, 'y2', y);
    element.setStyle('stroke: #77f; stroke-opacity: 0.25; stroke-width: 5');
    this.svg.appendChild(element);

    return element;
};

SvgFigure.prototype.drawRect = function(x, y, w, h)
{
    var element = document.createElementNS(this.ns, 'rect');
    element.setAttributeNS(null, 'x', x);
    element.setAttributeNS(null, 'y', y);
    element.setAttributeNS(null, 'width', w);
    element.setAttributeNS(null, 'height', h);
    element.setAttributeNS(null, 'stroke-width', 1);
    element.setAttributeNS(null, 'stroke', '#000');
    element.setAttributeNS(null, 'fill', 'none');
    this.svg.appendChild(element);
};

SvgFigure.prototype.drawCircle = function(cp,r)
{
    var element = document.createElementNS(this.ns, 'circle');
    element.setAttributeNS(null, 'r', r);
    element.setAttributeNS(null, 'cx', cp.x);
    element.setAttributeNS(null, 'cy', cp.y);
    element.setAttributeNS(null, 'stroke-width', 1);
    element.setAttributeNS(null, 'stroke', '#000');
    element.setAttributeNS(null, 'fill', 'none');
    this.svg.appendChild(element);
};

SvgFigure.prototype.drawDot = function(cp,r)
{
    var element = document.createElementNS(this.ns, 'circle');
    element.setAttributeNS(null, 'r', r);
    element.setAttributeNS(null, 'cx', cp.x);
    element.setAttributeNS(null, 'cy', cp.y);
    this.svg.appendChild(element);
};

SvgFigure.prototype.drawPolygon = function(points)
{
    var points_str='';
    for (var i=0; i<points.length; i++)
    {
        points_str+=points[i].x+',';
        points_str+=points[i].y+',';
    }
    points_str=points_str.slice(0,-1);

    var element = document.createElementNS(this.ns, 'polygon');
    element.setAttributeNS(null, 'points', points_str);
    element.setAttributeNS(null, 'stroke-width', 1);
    element.setAttributeNS(null, 'stroke', '#000');
    element.setAttributeNS(null, 'fill', 'none');
    this.svg.appendChild(element);
};

SvgFigure.prototype.drawPolyLine = function(points, options)
{

    var params = '---';
    var stroke = '#000';

    if (typeof options == 'string') {
        params = options;
    } else if (typeof options == 'object') {
        if (options.hasOwnProperty('params')) params = options.params;
        if (options.hasOwnProperty('stroke')) stroke = options.stroke;
    }

    var points_str='';
    for (var i=0; i<points.length; i++)
    {
        points_str+=points[i].x+',';
        points_str+=points[i].y+',';
    }
    points_str=points_str.slice(0,-1);

    params=this._splitLineParams(params);

    var element = this._createElement('polyline');
    element.setAttributeNS(null, 'points', points_str);
    element.setAttributeNS(null, 'stroke-width', 1);
    element.setAttributeNS(null, 'stroke', stroke);
    element.setAttributeNS(null, 'fill', 'none');
    if(params.end.slice(-1)=='>') element.setAttributeNS(null, 'marker-end', 'url(#arrow)');
    this.svg.appendChild(element);

    return element;
};

SvgFigure.prototype.drawText = function()
{
    if (arguments.length == 5) {
        this._drawText(arguments[0],arguments[1],arguments[4],{fs: arguments[3], anchor: arguments[2]});
    } else {
        this._drawText(arguments[0],arguments[1],arguments[2],arguments[3]);
    }
};

SvgFigure.prototype._drawText = function(x,y,text,options)
{
    var anchor = null;
    if (options.hasOwnProperty('anchor')) anchor = options.anchor;

    var fs = null;
    if (options.hasOwnProperty('fs')) fs = options.fs;

    var rotation = null;
    if (options.hasOwnProperty('rotation')) rotation = options.rotation;

    var element = document.createElementNS(this.ns, 'text');
    element.setAttributeNS(null, 'x', x);
    element.setAttributeNS(null, 'y', y);
    if (fs) element.setAttributeNS(null, 'font-size', fs);
    element.setAttributeNS(null, 'text-anchor', 'start');
    element.textContent=text;

    this.svg.appendChild(element);

    if (anchor) {
        var bb=element.getBBox();

        if(anchor[0]=='t')element.setAttributeNS(null, 'y', 2*y-bb.y);
        else if(anchor[0]=='b')element.setAttributeNS(null, 'y', 2*y-(bb.y+bb.height));
        else element.setAttributeNS(null, 'y', 2*y-(bb.y+bb.height/2));

        if(anchor[1]=='l')element.setAttributeNS(null, 'x', x);
        else if(anchor[1]=='r')element.setAttributeNS(null, 'x', x-bb.width);
        else element.setAttributeNS(null, 'x', x-bb.width/2);
    }

    if (rotation) element.setAttributeNS(null, 'transform', 'rotate('+rotation+' '+x+','+y+')');
};

SvgFigure.prototype.draw = function(shape)
{
    shape.draw(this);
};

SvgFigure.prototype._splitLineParams = function(params)
{
    // Slice parameters string, both end params strings are same length and not larger than middle params string.
    if(!params) params='---';
    var len_e = Math.floor(params.length/3.0);
    var len_m = params.length-2*len_e;
    var param_obj={};
    param_obj.begin = params.slice(0,len_e);
    param_obj.mid = params.slice(len_e,len_e+len_m);
    param_obj.end = params.slice(len_e+len_m,len_e+len_m+len_e);
    return param_obj;
};

SvgFigure.prototype._createElement = function(type)
{
    var element = document.createElementNS(this.ns, type);

    element.setStyle = function(style) {
        this.setAttributeNS(null, 'style', style);
        return this;
    };

    return element;
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

// Dependencies:


var DiagramRenderer = function() {

    

};

DiagramRenderer.prototype.render = function(diag_script, div, callback) {

    var fig = this._createSvgFigureInDiv( div );
    eval(diag_script);
    if( callback ) callback();
};

DiagramRenderer.prototype._createSvgFigureInDiv = function(div) {
    div.style.width = "600px";
    var svg_str ='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">\n';
    svg_str    +='    <defs>\n';
    svg_str    +='        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">\n';
    svg_str    +='            <path d="M9,3 L0,6 L0,0 z" fill="#000" />\n';
    svg_str    +='        </marker>\n';
    svg_str    +='    </defs>\n';
    svg_str    +='</svg>';
    div.innerHTML=svg_str;
    var that = this;
    div.onclick=function(e) {
        that._clicked(div);
    };
    var svg_diagram = div.childNodes[0];
    var fig=new SvgFigure(svg_diagram);
    return fig;
};

DiagramRenderer.prototype._clicked = function(div) {
    if (div.childNodes.length < 2) {
        var svg_str=XML.stringify(div.childNodes[0]);
        var blob=new Blob([svg_str]);
        var url = URL.createObjectURL(blob);
        var fn = "diagram.svg";
        var a_download = '<a href="' + url + '" download="' + fn + '">Download "' + fn + '"</a>';

        var div_download = document.createElement("div");
        var ta=document.createElement("textarea");
        ta.value = JSON.stringify(div.src_json);
        ta.style.width = "100%";
        div.appendChild(ta);
        ta.style.height = (ta.scrollHeight+8)+"px";
        div_download.innerHTML += a_download
        div.appendChild(div_download);
    }
};

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

var FileSystem = function() {
};

FileSystem.readFile = function(fn, callback) {
    var obj = {"cmd": "load","fn":fn}
    JsonQuery.query("/cgi-bin/filesystem.cgi", obj, function(response) {
        if (callback) callback(response.err, response.content); 
    });
};

FileSystem.writeFile = function(fn, content, callback) {
    var obj = {"cmd":"save", "fn":fn, "content":content}
    JsonQuery.query("/cgi-bin/filesystem.cgi", obj, function(response) {
        if (callback) callback(response.err); 
    });
};

FileSystem.list = function(dir, callback) {
    var obj = {"cmd":"list", "dir":dir}
    JsonQuery.query("/cgi-bin/filesystem.cgi", obj, function(response) {
        if (callback) callback(response); 
    });
}
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

var JsonQuery = function() {
};

JsonQuery.query = function(url, obj, callback) {
    var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.onload = function (event) {
		var response_obj=JSON.parse(xhr.response);
		if( callback ) callback(response_obj);
	};
	xhr.send(JSON.stringify(obj));
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
 
function NavBar() {
	this.elem = document.createElement("ul");
	this.elem.style.margin = "0px";
	this.elem.style.padding = "0px";
	this.elem.style.listStyleType = "none";
	this.elem.style.overflow = "hidden";
}

NavBar.prototype.addLeft = function(elem) {
    elem.style.float = "left";
    this.elem.appendChild(elem);
};

NavBar.prototype.addRight = function(elem) {
    elem.style.float = "right";
    this.elem.appendChild(elem);
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

var XML = function()
{
    
};

XML.stringify = function(xml, indent)
{
    indent = (typeof indent !== 'undefined') ? indent : '  ';
    return XML._stringify(xml, indent);
};

XML._stringify = function(xml, indent)
{
    var str=indent;

    str+='<'+xml.nodeName;

    var atts=xml.attributes;
    if (atts) {
        for( var i=0; i<atts.length; i++)
        {
            var name=atts[i].name;
            str+=' '+name+'="'+atts[i].value+'"';
        }
    }
    str+='>';

    var closing_indent=''; // The closing tag is only indented if there are child nodes
    var c=xml.childNodes;
    if (c) {
        var first = true;
        
        // If element has one text node then output it.
        if (c.length==1 && c[0].nodeName == '#text') {
            str+=c[0].data;
        } else {
            for( var i=0; i<c.length; i++)
            {
                var child = c[i];
                if (child.nodeName != '#text') { // Text nodes between sibling nodes is just white-space so ignore.
                    if( first ) {
                        str+='\n';
                        closing_indent=indent; // The parent closing tag will be on new line so indent.
                        first = false;
                    }
                    str+=XML._stringify(child,indent+'  ');
                }
            }
        }
    }
    str+=closing_indent+'</'+xml.nodeName+'>\n';

    return str;
};

/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018  Andrew Rogers
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

var JsonArrayBuffers = function() {
};

JsonArrayBuffers.stringify = function( obj ) {
    var buffers=[];
    var ret_obj = {};
    var total_length = JsonArrayBuffers.processObject( obj, 0, ret_obj, buffers );
    var json=JSON.stringify( ret_obj );
    
    // Create new array for concatenation of all ArrayBuffers
    var arr = new Uint8Array( total_length );
    
    // Insert all ArrayBuffers into new array.
    var offset=0;
    for( var i=0; i<buffers.length; i++ )
    {
        arr.set(new Uint8Array(buffers[i]),offset);
        offset = offset + buffers[i].byteLength;
    }
    
    var ret = new Blob([json, "\n", arr.buffer])
    return ret;
};

JsonArrayBuffers.processObject = function( obj, offset, ret_obj, buffers ) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            if(obj[key].constructor === ArrayBuffer)
            {
                // Replace value with offset and length into binary section
                var length=obj[key].byteLength;
                ret_obj["AB#_"+key]={offset: offset, length: length};
                offset=offset+length;

                 // Copy ArrayBuffer into buffers array
                buffers.push(obj[key]);
            }
            else if(obj[key].constructor === Object)
            {
                // Recursively process objects
                ret_obj[key]={}; // Create new object in return object.
                offset=JsonArrayBuffers.processObject( obj[key], offset, ret_obj[key], buffers );
            }
            else ret_obj[key]=obj[key];
        }
    }
    return offset;
};

JsonArrayBuffers.parseBlob = function( blob, callback ) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
        var obj = JsonArrayBuffers.parse( this.result );
        if( callback ) callback( obj );
    };
    fileReader.readAsArrayBuffer(blob);
};

JsonArrayBuffers.parse = function( buffer ) {
    var arr = new Uint8Array(buffer);

    // Search array for end of JSON object
    var json_end=0;
    for( var i=0; i<arr.length && json_end==0; i++)
    {
        if(arr[i]==10) // Find LF
        {
            json_end=i;
        }
    }
    var obj = JSON.parse(JsonArrayBuffers.textDecode(buffer,0,json_end));

    return JsonArrayBuffers.parseObject( obj, arr, json_end+1);
};

JsonArrayBuffers.parseObject = function( obj, arr, arr_offset ) {
    var ret_obj={};
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            if(key.startsWith("AB#_"))
            {
                // Set the element back to it's original name and set it value as the indexed ArrayBuffer
                var hdr=obj[key];
                var start=hdr["offset"]+arr_offset;
                ret_obj[key.substring(4)]=arr.slice(start,start+hdr["length"]);
            }
            else if(obj[key].constructor === Object)
            {
                // Recursively parse objects
                ret_obj[key]=JsonArrayBuffers.parseObject(obj[key], arr, arr_offset);
            }
            else ret_obj[key]=obj[key];
        }
    }
    return ret_obj;
};

JsonArrayBuffers.textDecode = function( buffer, start, count ) {
    var arr = new Uint8Array(buffer);
    var str = "";

    var end=start+count;
    if( end > arr.length ) end=arr.length;
    for( var i=start; i<end; i++)
    {
        // Get code point
        var leading=arr[i];
        var code_point=leading;
        var num_extra=0;
        while(leading & 0x80)
        {
            leading = leading<<1;
            num_extra++;
        }
        if(num_extra>0)
        {
            code_point = leading>>num_extra; // Clear MSBs 110xxxxx becomes 000xxxxx
            num_extra--;
            for( var j=0; j<num_extra; j++ ) code_point=(code_point<<6) | (arr[++i] & 0x3f)
        }

        // Append code point to string
        str = str + String.fromCharCode(code_point); ///@todo deal with code_point>0xffff
    }
    return str;
};

JsonArrayBuffers.queryBlob = function(url, blob, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function (event) {
		var response_obj=JsonArrayBuffers.parse(xhr.response);
		if( callback ) callback(response_obj);
	};

	xhr.send(blob);
};

JsonArrayBuffers.query = function(url, obj, callback) {
    var blob=JsonArrayBuffers.stringify(obj);
    this.queryBlob(url, blob, callback);
};

JsonArrayBuffers.querySh = function(sh, obj, callback) {
    var url="/cgi-bin/exec_bin.sh"
    var json_blob=JsonArrayBuffers.stringify(obj)
    var blob=new Blob([sh, "\nBINARY\n", json_blob]);
    this.queryBlob(url, blob, callback);
};

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

var Menu = function(div) {
  this.div=div;
  this.onselect=null;
  this.numitems=0;
};

Menu.prototype.clear = function() {
  this.numitems=0;
  this.div.innerHTML='';
};

Menu.prototype.add = function(item) {
  var that=this;
  var ni=this.numitems;
  item.addEventListener('click', function() {
    if(that.onselect) that.onselect(ni,this.innerHTML);
    that.div.style.display="none";
  }, false);

  this.numitems+=1;
  this.div.appendChild(item);
};

Menu.prototype.show = function(onselect){
  this.onselect=onselect;
  this.div.style.display="block";
};
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

var SVGArray = function () {
    this.jszip=null;
    if(typeof JSZip !== 'undefined') {
      this.jszip=new JSZip;
    }
    this.map_refs={};
    this.images=[];
};

SVGArray.prototype.addDefs = function(defs) {
    defs = defs.childNodes;
    for( var i=0; i<defs.length; i++ ) {
	this.map_refs[defs[i].getAttribute("id")]=defs[i];
    }
};

SVGArray.prototype.addImage = function(svg) {
    var uses=svg.getElementsByTagName("use");
    var refs=[];
    for( var i=0; i<uses.length; i++) {
        var href = uses[i].getAttribute("href");
	if(href==null) href = uses[i].getAttribute("xlink:href");
	refs.push(href)
    }
    str=this.xml2str(svg,'');
    this.images.push({svg: str, uses: refs});
};

SVGArray.prototype.getImageIncDefs = function(index) {
    var image=this.images[index];

    // Construct the defs tag
    var uses=image.uses;
    var defstr="  <defs>\n"
    for( var i=0; i<uses.length; i++){
	var ref=uses[i];
	ref=ref.substring(1);
	var def=this.map_refs[ref];
        defstr+=this.xml2str(def,'    ');
    }
    defstr+="  </defs>\n";

    // Split SVG
    var i=image.svg.indexOf(">")+1; // End of opening svg tag
    var svgtag=image.svg.substring(0,i);
    var svg=image.svg.substring(i);

    svgtag=svgtag.replace(/<svg/,'<svg xmlns="http://www.w3.org/2000/svg"');

    // Insert defs just after SVG tag
    var svgstr=svgtag+"\n"+defstr+svg;

    return svgstr;
};

SVGArray.prototype.xml2str = function(xml, indent) {
    return XML.stringify(xml, indent);
};

SVGArray.prototype.xml2str_old = function(xml, indent)
{
  var str=indent;
  str+='<'+xml.nodeName;

  var atts=xml.attributes;
  for( var i=0; i<atts.length; i++)
  {
    var name=atts[i].name;
    if( name=='href') name='xlink:href';
    str+=' '+name+'="'+atts[i].value+'"';
  }
  str+='>';

  var closing_indent=''; // The closing tag is only indented if there are child nodes
  var c=xml.childNodes;
  for( var i=0; i<c.length; i++)
  {
    if( i==0 )str+='\n';
    str+=this.xml2str(c[i],indent+'  ');
    closing_indent=indent; // The parent closing tag will be on new line so indent.
  }
  str+=closing_indent+'</'+xml.nodeName+'>\n';

  return str;
}


SVGArray.prototype.clear = function ()
{
    this.map_defs={};
    this.images=[];
}

