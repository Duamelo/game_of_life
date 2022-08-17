(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.aya = {}));
})(this, (function (exports) { 'use strict';

	var store = {};

	class _Register
	{
	    static add(object) {
	        store[object.uuid] = object;
	    }

	    static find(uuid){
	        return store[uuid];
	    }

	    static clear(uuid){
	        delete store[uuid];
	    }
	    
	    static getAllLinksByComponent(component){
	        var result = [];
	        Object.keys(store).map((id) => {
	            var obj = _Register.find(id);
	            if(obj.type == "link"){
	                if(component.uuid == obj.source.ref || component.uuid == obj.destination.ref)
	                    result.push(obj);
	            }
	        });
	        return result;
	    }
	}

	class _uuid
	{

	    static generate()
	    {
	        return Math.random().toString(36).substring(2, 15) +
	        Math.random().toString(36).substring(2, 15);
	    }
	}

	var config =  {
	    svg : {
	        fill : "white",
	    },
	    form : {
	        stroke : "black",
	        fill : "white",
	        strokeOpacity : "1",
	        strokeWidth : "1.5pt",
	        fillOpacity : "1"
	    },
	  
	    box : {
	        stroke : "rgb(82, 170, 214)",
	        strokeWidth : "1px",
	        fill : "none",
	        strokeDasharray : "4"
	    },

	    point : {
	        fill  : "black",
	        strokeWidth : "1pt",
	        radius : 3,
	    },

	    line : {
	        fill : "black",
	        ends : {
	            left : { type : "losange", props : {x : 0 , y : 0 , width : 10, height : 10}},
	            right : { type : "triangle", props : {x1 : 0 , y1 : 0 , x2 : 10, y2 : 5, x3 : 0, y3 : 10}}
	        }
	    }
	};

	/**
	 *
	 * @class Point
	 * @param {number} x
	 * @param {number} y
	 *
	 */

	class Point {
	  constructor(uuid, x = 0, y = 0, r = 5) {

	    this.ref = uuid;
	    this.uuid = _uuid.generate();

	    this.x = x;
	    this.y = y;
	    this.r = r;

	    this.scale = 1;

	    this.events = {};

	    this.c_svg = "";

	    _Register.add(this);
	  }

	  addEvent(event, callback){
	    this.c_svg.addEventListener(event, callback);
	    this.events[event] = callback;
	  }

	  deleteEvent(event){
	    var callback = this.events[event];
	    this.c_svg.removeEventListener(event, callback);
	    delete this.events[event];
	  }
	 
	  setScale(sc){
	    this.scale = sc;
	  }

	  getScale(){
	    return this.scale;
	  }

	  draw(svg) {
	    var ns = "http://www.w3.org/2000/svg";

	    this.c_svg = document.createElementNS(ns, "circle");

	    this.c_svg.setAttribute("cx", this.x);

	    this.c_svg.setAttribute("cy", this.y);

	    this.c_svg.setAttribute("r", config.point.radius * this.scale);

	    this.c_svg.setAttribute("class", "vertex");

	    this.c_svg.setAttribute("id", this.uuid);

	    this.addEvent("mousedown", events.mouseDownCb);

	    svg.appendChild(this.c_svg);

	  }

	  shift(dx, dy) {
	    this.x += dx;
	    this.y += dy;
	  }

	  redraw() {

	    this.c_svg.setAttribute("cx", this.x);
	    this.c_svg.setAttribute("cy", this.y);
	    
	  }
	}

	/**
	 * @class Line
	 */

	class Line 
	{
	    /**
	     * 
	     * @param {string} uuid 
	     * @param {number} x 
	     * @param {number} y 
	     * @param {number} dest_x 
	     * @param {number} dest_y 
	     */
	    constructor(uuid, x=0, y=0, dest_x = x, dest_y = y){

	        this.uuid = uuid;

	        this.x = x;
	        this.y = y;
	        
	        this.dest_x = dest_x;
	        this.dest_y = dest_y;

	        this.pente = (this.dest_y - this.y) / (this.dest_x - this.x);

	        this.events = {};

	        this.c_svg = "";
	        this.type = "line";

	        this.offsetX = 0;
	        this.offsetY = 0;
	    
	        this.scaleX = 1;
	        this.scaleY = 1;
	    
	        this.angle = 0;

	        this.children = [];

	        this.vertex = [
	            new Point(this.uuid, 0, 0),
	            new Point(this.uuid, 0, 0),
	        ];
	        this.c_points = [
	            new Point(this.uuid, 0, 0),
	            new Point(this.uuid, 0, 0),
	        ];

	        if(config.line != undefined && Object.keys(config.line.ends.left).length > 0){
	            var child = FactoryForm.createForm(_uuid.generate(), config.line.ends.left.type, config.line.ends.left.props);
	            this.addChild(child, (p, c) => {
	                c.setOffsetX(p.x - config.line.ends.left.props.height/2);
	                c.setOffsetY(p.y - config.line.ends.left.props.height/2);
	            },  (p, c) => {
	                c.setRotateCenter(c.x, c.y);
	                c.setRotateAngle(p.calculateAngle() + ( Math.PI * 90)/180 );
	                
	            } );
	        }
	        
	        if(config.line != undefined && Object.keys(config.line.ends.right).length > 0){
	            var child = FactoryForm.createForm(_uuid.generate(), config.line.ends.right.type, config.line.ends.right.props);
	            this.addChild(child, (p, c) => {
	                c.setOffsetX(p.dest_x);
	                c.setOffsetY(p.dest_y - (config.line.ends.right.props.y3 - config.line.ends.right.props.y1)/2);
	            },  (p, c) => {
	                c.setRotateCenter((c.x1 +c.x3) /2, (c.y1 + c.y3)  / 2);
	                c.setRotateAngle(p.calculateAngle());
	            } );
	            
	        }
	    }

	    addEvent(event, callback){
	        this.c_svg.addEventListener(event, callback);
	        this.events[event] = callback;
	    }
	    
	    deleteEvent(event){
	        var callback = this.events[event];
	        this.c_svg.removeEventListener(event, callback);
	        delete this.events[event];
	    }

	    addChild(child, translate, rotate){
	        child.vertex = [];
	        child.c_points = [];
	        child.setOffsetX(this.x);
	        child.setOffsetY(this.y);
	        translate(this, child);
	        rotate(this, child);
	        child.draw(svg);
	        this.children.push({child, translate, rotate});
	    }
	    
	    drawVertex(){
	        if(this.vertex.length == 0)
	            return;
	        
	        this.vertex[0].x = this.x + this.offsetX;
	        this.vertex[0].y = this.y + this.offsetY;

	        this.vertex[1].x = (this.dest_x + this.offsetX) * this.scaleX;
	        this.vertex[1].y = (this.dest_y + this.offsetY) * this.scaleY;
	    }


	    draw(svg){
	        const ns = "http://www.w3.org/2000/svg";
	        this.c_svg = document.createElementNS(ns,'path');

	        var p = "M "+  (this.x + this.offsetX) + ","+ (this.y + this.offsetY) + " " + ((this.dest_x + this.offsetX ) * this.scaleX)  + "," + ((this.dest_y + this.offsetY) * this.scaleY);

	        this.c_svg.setAttribute("id", this.uuid);
	        this.c_svg.setAttribute("d", p);
	        this.c_svg.setAttribute("fill", config.form.fill);
	        this.c_svg.setAttribute("stroke", config.form.stroke);
	        this.c_svg.setAttributeNS(null, "stroke-width", config.form.strokeWidth);

	        svg.appendChild(this.c_svg);

	        this.drawVertex();

	        this.c_points.map((point) => {
	            point.draw(svg);
	        });

	        this.vertex.map( (vertex) => {
	            vertex.draw(svg);
	        });

	        this.addEvent("mousedown", events.mouseDownCb);
	    }

	    shift(dx,dy){
	        this.x += dx;
	        this.y += dy;
	        this.dest_x += dx;
	        this.dest_y += dy;
	    }

	    redraw(){
	        this.drawVertex();
	        this.vertex.map( (vertex) => {
	            vertex.redraw();
	        });

	        var p = "M "+  (this.x + this.offsetX) + ","+ (this.y + this.offsetY) + " " + ((this.dest_x + this.offsetX ) * this.scaleX)  + "," + ((this.dest_y + this.offsetY) * this.scaleY);
	        this.c_svg.setAttribute("d", p);

	        this.children.map ( ({child, translate, rotate}) => {
	            translate(this, child);
	            rotate(this, child);
	            child.redraw();
	        });
	    }

	    calculateAngle(){
	        var angle;
	        this.pente = (this.dest_y - this.y) / (this.dest_x - this.x);

	        if(this.pente == 0)
	            angle = 0;
	        if( this.pente >= 0 && (this.x < this.dest_x && this.y < this.dest_y))
	            angle = Math.asin( (Math.sqrt( Math.pow((this.x - this.x), 2) + Math.pow((this.y - this.dest_y), 2)) ) / ( Math.sqrt( Math.pow((this.x - this.dest_x), 2) + Math.pow((this.y - this.dest_y), 2))) );
	        else if(this.pente >= 0 && (this.x > this.dest_x && this.y > this.dest_y))
	            angle = Math.PI + Math.asin( (Math.sqrt( Math.pow((this.x - this.x), 2) + Math.pow((this.dest_y - this.y), 2)) ) / ( Math.sqrt( Math.pow((this.x - this.dest_x), 2) + Math.pow((this.y - this.dest_y), 2))) );
	        else if( this.pente <= 0 && (this.x < this.dest_x && this.y > this.dest_y))
	            angle =  2 * Math.PI -  Math.asin( (Math.sqrt( Math.pow((this.x - this.x), 2) + Math.pow((this.dest_y - this.y), 2)) ) / ( Math.sqrt( Math.pow((this.x - this.dest_x), 2) + Math.pow((this.y - this.dest_y), 2))) );
	        else if(this.pente <= 0 && (this.x > this.dest_x && this.y < this.dest_y))
	            angle =   Math.PI -  Math.asin( (Math.sqrt( Math.pow((this.x - this.x), 2) + Math.pow((this.dest_y - this.y), 2)) ) / ( Math.sqrt( Math.pow((this.x - this.dest_x), 2) + Math.pow((this.y - this.dest_y), 2))) );

	        return angle;
	    }

	    resize(pos, dx, dy){

	        if(pos == 0){
	            this.x += dx;
	            this.y += dy;
	        }
	        else {
	            this.dest_x += dx;
	            this.dest_y += dy;
	        }

	        this.children.map ( ({child, translate, rotate}) => {
	            translate(this, child);
	            child.setRotateAngle((this.calculateAngle() + ( Math.PI * 90)/180));
	            rotate(this, child);
	            child.redraw();
	        });
	    }

	    setRotateCenter(centerX, centerY){
	        this.centerX = centerX;
	        this.centerY = centerY;
	    }
	    
	    setRotateAngle(angle){
	        this.angle = angle;
	    }

	    setOffsetX(x){
	        this.offsetX = x;
	    }

	    setOffsetY(y){
	        this.offsetY = y;
	    }

	    setScaleX(x){
	        this.scaleX = x;
	    }

	    setScaleY(y){
	        this.scaleY = y;
	    }

	    getRotateAngle(){
	       return  this.angle;
	    }

	    getOffsetX(){
	        return this.offsetX;
	    }

	    getOffsetY(){
	        return this.offsetY;
	    }

	    getScaleX(){
	        return this.scaleX;
	    }

	    getScaleY(){
	        return this.scaleY;
	    }
	}

	/**
	 * @class Link
	 */

	class Link
	{
	    constructor(source, destination, line = undefined)
	    {
	       this.uuid = _uuid.generate();
	       
	       /* référence sur les points de connexions*/
	       this.source = source;
	       this.destination = destination;
	       this.line = line;
	       this.type = "link";
	       _Register.add(this);
	    }

	    redraw(){
	        var source = _Register.find(this.source.ref), destination = _Register.find(this.destination.ref);

	        var source_point = source.form.optimalPath(this.line);
	        var dest_point = destination.form.optimalPath(this.line);


	        if(source_point)
	            this.source = source_point;
	        if(dest_point)
	            this.destination = dest_point;

	        this.line.x = this.source.x;
	        this.line.y = this.source.y;

	        this.line.dest_x = this.destination.x;
	        this.line.dest_y = this.destination.y;

	        this.line.redraw();

	    }

	}

	function nativeEvents() {
	  var id;
	  var cp;
	  var dx, dy;
	  var state = "";
	  var deltaX, deltaY;
	  var line = "";
	  var source;
	  var lk;
	  var pos;

	  return {
	    mouseDownCb: function mousedowncb(e) {

	      dx = e.offsetX;
	      dy = e.offsetY;

	      id = e.srcElement.id;

	      cp = _Register.find(id);
	      // console.log(cp);

	      if (id != "svg")
	        source = cp != undefined && cp.ref != undefined ? _Register.find(cp.ref) : cp;

	      if(cp.form != undefined)
	        lk = _Register.getAllLinksByComponent(cp);


	      // une forme différente de Point n'a pas de propriété ref
	      if ((cp != undefined && cp.ref == undefined) )
	          state = "moving";
	      else {
	        if (  (source.form.vertex != undefined) && (pos = source.form.vertex.indexOf(cp)) >= 0) {
	          state = "resizing";
	          dx = e.offsetX;
	          dy = e.offsetY;

	          /* détermination du composant */
	          cp = _Register.find(cp.ref);
	          lk = _Register.getAllLinksByComponent(cp);
	        }
	        else {
	          state = "drawing_link";
	          id = _uuid.generate();
	          if (cp != source) {
	            line = new Line(id, cp.x, cp.y);
	            line.draw(svg);
	          }
	        }
	      }
	    },
	    mouseMoveCb: function movecb(e) {

	      if (state == "moving") {

	        deltaX = e.offsetX - dx;
	        deltaY = e.offsetY - dy;

	        dx = e.offsetX;
	        dy = e.offsetY;

	        /* test si cp est un compsant*/
	        var src;
	        if(cp.form != undefined){
	          lk.map((link) => {
	            cp.form.c_points.map( (point) => {
	              if(point == link.source)
	                src = point;
	              else if(point == link.destination)
	                ;
	            });
	            if(src){
	              link.line.x += deltaX;
	              link.line.y += deltaY;
	              link.line.redraw();
	            }
	            else {
	              link.line.dest_x += deltaX;
	              link.line.dest_y += deltaY;
	              link.line.redraw();
	            }
	          });

	          cp.form.shift(deltaX, deltaY);
	          cp.form.redraw();

	          lk.map( (link) => {
	            link.redraw();
	          });

	        }
	      }
	      else if (state == "drawing_link") {

	        source.form.vertex.map((v) => {
	          if (v.x == line.x && v.y == line.y) {
	            v.c_svg.classList.remove("vertex");
	            v.c_svg.classList.add("vertex_hover");
	          }
	        });

	        source.form.c_points.map((v) => {
	          if (v.x == line.x && v.y == line.y) {
	            v.c_svg.style.color = "gray";
	            v.c_svg.classList.remove("vertex");
	            v.c_svg.classList.add("vertex_hover");
	          }
	        });

	        line.dest_x = e.clientX;
	        line.dest_y = e.clientY;
	        line.redraw();
	      }
	      else if (state == "resizing") {
	          deltaX = e.offsetX - dx;
	          deltaY = e.offsetY - dy;

	          dx = e.offsetX;
	          dy = e.offsetY;

	          source.form.resize(pos, deltaX, deltaY);
	          source.form.redraw();

	          lk.map( (link ) => {
	            link.redraw();
	          });
	      }
	    },
	    mouseUpCb: function mouseupcb(e) {
	      if (state == "drawing_link") {
	        id = e.srcElement.id;
	        var pnt = _Register.find(id);


	        if (pnt != undefined && pnt.ref != undefined) {
	          line.dest_x = pnt.x;
	          line.dest_y = pnt.y;

	          /* faire le calcul automatique ici*/

	          // for automatic redrawing
	          // line.redraw();
	          new Link(cp, pnt, line).redraw();
	        }
	        else if (id == "svg" || pnt.ref == undefined) {
	          var ref = document.getElementById(line.uuid);
	          ref.remove();
	        }
	      }
	      state = "";
	    }
	  // mouseOverCb: function mouseovercb(e) {
	  //     id = e.srcElement.id;

	  //     cp = _Register.find(id);

	  //       cp.form.vertex.map((v) => {
	  //         v.c_svg.classList.remove("vertex");
	  //         v.c_svg.classList.add("vertex_hover");
	  //       });

	  //       cp.form.c_points.map((v) => {
	  //         v.c_svg.classList.remove("vertex");
	  //         v.c_svg.classList.add("vertex_hover");
	  //       });
	  // },
	  // mouseLeaveCb: function mouseleavecb(e) {
	  //   id = e.srcElement.id;
	  //   cp = _Register.find(id);
	  //   if (cp.ref == undefined) {
	  //     cp.form.vertex.map((v) => {
	  //       v.c_svg.classList.add("vertex");
	  //       v.c_svg.classList.remove("vertex_hover");
	  //     });
	  //     cp.form.c_points.map((v) => {
	  //       v.c_svg.classList.add("vertex");
	  //       v.c_svg.classList.remove("vertex_hover");
	  //     });
	  //   }
	  // }
	}
	}
	var events = nativeEvents();

	/**
	 * @class Circle
	 */
	class Circle
	{
	    /**
	     * 
	     * @param {string} uuid 
	     * @param {number} x 
	     * @param {number} y 
	     * @param {number} r 
	     */

	    constructor(uuid, x = 0, y = 0, r = 5){

	        this.uuid = uuid;

	        this.x = x;
	        this.y = y;
	        this.r = r;

	        this.events = {};

	        this.box = "";
	        this.c_svg = "";

	        this.type = "circle";

	        this.scale = 1;

	        this.offsetX = 0;
	        this.offsetY = 0;
	    
	        this.angle = 0;
	  
	        this.children = [];
	      
	        this.c_points = [
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 )
	        ];

	        this.vertex = [
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 ),
	            new Point(this.uuid,0, 0 )
	        ];
	    }

	    addEvent(event, callback){
	        this.c_svg.addEventListener(event, callback);
	        this.events[event] = callback;
	    }
	    
	    deleteEvent(event){
	        var callback = this.events[event];
	        this.c_svg.removeEventListener(event, callback);
	        delete this.events[event];
	    }

	    addChild(child, translate, rotate){
	        child.setOffsetX(this.x);
	        child.setOffsetY(this.y);
	        translate(this, child);
	        rotate(this, child);
	        child.draw(svg);
	        this.children.push({child, translate, rotate});
	    }
	  
	    drawVertex(){
	        if(this.vertex.length == 0)
	            return;
	        this.vertex[0].x = this.x + this.offsetX - this.r * this.scale;
	        this.vertex[0].y = this.y + this.offsetY - this.r * this.scale;
	    
	        this.vertex[1].x = this.x + this.offsetX + this.r * this.scale;
	        this.vertex[1].y = this.y + this.offsetY - this.r * this.scale;

	        this.vertex[2].x = this.x + this.offsetX + this.r * this.scale;
	        this.vertex[2].y = this.y + this.offsetY + this.r * this.scale;
	    
	        this.vertex[3].x = this.x + this.offsetX - this.r * this.scale;
	        this.vertex[3].y = this.y + this.offsetY + this.r * this.scale;
	    }
	    
	    drawConnector() {
	        if(this.c_points.length == 0)
	            return;
	        this.c_points[0].x = this.x + this.offsetX;
	        this.c_points[0].y = this.y + this.offsetY - this.r * this.scale;

	        this.c_points[1].x = this.x + this.offsetX + this.r * this.scale;
	        this.c_points[1].y = this.y + this.offsetY;

	        this.c_points[2].x = this.x + this.offsetX;
	        this.c_points[2].y = this.y + this.offsetY + this.r * this.scale;

	        this.c_points[3].x = this.x + this.offsetX - this.r * this.scale;
	        this.c_points[3].y = this.y + this.offsetY;
	    }

	    drawBox(){
	        var p = `M ${this.vertex[0].x} ${this.vertex[0].y}
                  L ${this.c_points[0].x} ${this.c_points[0].y} 
                  L ${this.vertex[1].x}   ${this.vertex[1].y} 
                  L ${this.c_points[1].x} ${this.c_points[1].y}
                  L ${this.vertex[2].x}   ${this.vertex[2].y}
                  L ${this.c_points[2].x} ${this.c_points[2].y} 
                  L ${this.vertex[3].x}   ${this.vertex[3].y} 
                  L ${this.c_points[3].x} ${this.c_points[3].y} Z`;
	    
	        this.box.setAttribute("d", p);
	    }
	    
	    /**
	     * 
	     * @param {DOMElement} svg 
	     */
	    
	    draw(svg){
	        var ns="http://www.w3.org/2000/svg";

	        this.box = document.createElementNS(ns, "path");
	        this.c_svg = document.createElementNS(ns,"circle");

	        this.c_svg.setAttribute("id", this.uuid);

	        this.c_svg.setAttribute("cx", this.x + this.offsetX);

	        this.c_svg.setAttribute("cy",this.y + this.offsetY);

	        this.c_svg.setAttribute("r", this.r * this.scale);
	        

	        this.c_svg.setAttribute("fill", "#0066b8");

	        this.c_svg.setAttribute("stroke",config.form.stroke);

	    
	        this.c_svg.setAttribute("stroke-width", config.form.strokeWidth);
	    
	      
	        // /** draw box */
	        // this.box.setAttributeNS(null, "stroke", config.box.stroke);
	        // this.box.setAttributeNS(null, "stroke-width", config.box.strokeWidth);
	        // this.box.setAttributeNS(null, "fill", "#0066b8");
	        // this.box.setAttribute("stroke-dasharray", config.box.strokeDasharray);

	        
	        svg.appendChild(this.c_svg);
	        svg.appendChild(this.box);

	        this.drawVertex();
	        this.drawConnector();
	        // this.drawBox();

	        this.c_points.map((point) => {
	            point.draw(svg);
	        });

	        this.vertex.map((point) => {
	            point.draw(svg);
	        });

	        this.children.map( ({child, translate, rotate}) => {
	            translate(this, child);
	            rotate(this, child);
	            child.redraw();
	        });

	        this.addEvent("mousedown", events.mouseDownCb);
	    }


	    remove(){
	        svg.removeChild(this.box);
	        svg.removeChild(this.c_svg);
	    }
	    
	    shift(dx, dy){
	        this.x += dx;
	        this.y += dy;
	    }

	    redraw(){
	        this.c_svg.setAttribute("cx", this.x + this.offsetX);
	        this.c_svg.setAttribute("cy",this.y + this.offsetY);
	        this.c_svg.setAttribute("r", this.r * this.scale);

	        this.drawConnector();
	        this.drawVertex();
	        this.drawBox();

	        this.vertex.map((vert) => {
	            vert.redraw();
	        });

	        this.c_points.map( (point) => {
	            point.redraw();
	        });

	        this.children.map( ({child, translate, rotate}) => {
	            translate(this, child);
	            rotate(this, child);
	            child.redraw();
	        });
	    }

	    resize(pos, dx, dy){
	        if(pos == 0)
	            this.r += -dx;
	        else if(pos == 1)
	            this.r += dx;
	        else if(pos == 2)
	            this.r += dx;
	        else
	            this.r -= dx;

	        this.children.map( ({child, translate, rotate}) => {
	            translate(this, child);
	            rotate(this, child);
	            child.redraw();
	        });
	    }

	    setRotateAngle(angle){
	        this.angle = angle;
	    }
	    
	    setOffsetX(x){
	       this.offsetX = x;
	    }

	    setOffsetY(y){
	        this.offsetY = y;
	    }

	    setScale(sc){
	        this.scale = sc;
	    }
	    getOffsetX(){
	        return this.offsetX;
	    }

	    getOffsetY(){
	        return this.offsetY;
	    }

	    getScale(){
	        return this.scale;
	    }

	    optimalPath(line){
	        var _x, _y;
	        var a = (line.dest_y - line.y)/(line.dest_x - line.x);
	        var b = line.y - a * line.x;
	    
	        for (var i = 0; i <= 3; i++){
	            if(i % 2 == 0){
	                _y = this.vertex[i].y;
	                _x = (_y - b)/a;
	            }
	            else {
	                _x = this.vertex[i].x;
	                _y = a * _x + b;
	            }
	    
	            if( (_x == line.x && _y == line.y) || (_x == line.dest_x && _y == line.dest_y))
	              continue;
	    
	              if(((i == 0 &&  _x > this.vertex[i].x && _x < this.vertex[i+1].x) &&
	                  (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	                  ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) ||
	               ((i == 1 &&  _y > this.vertex[i].y && _y < this.vertex[i+1].y) &&
	                  (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	                  ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) || 
	               ((i == 2 &&  _x > this.vertex[i+1].x && _x < this.vertex[i].x) &&
	                  (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  )|| 
	                  ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ))) ||
	               ((i == 3 &&  _y >= this.vertex[0].y && _y <= this.vertex[i].y) &&
	                  (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	                  ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) ) )) {
	                return this.c_points[i];
	               }
	          }
	        return null;
	      }
	}

	/**
	 * Rectangle class
	 */

	class Rectangle {

	  /**
	   * 
	   * @param {string} uuid 
	   * @param {number} x 
	   * @param {number} y 
	   * @param {number} width 
	   * @param {number} height 
	   */

	  constructor(uuid, x = 0, y = 0, width = 10, height = 10) {

	    this.uuid = uuid;

	    this.x = x;
	    this.y = y;

	    this.width = width;
	    this.height = height;

	    this.events = {};

	    this.c_svg = "";

	    this.type = "rectangle";

	    this.children = [];

	    this.offsetX = 0;
	    this.offsetY = 0;

	    this.scaleX = 1;
	    this.scaleY = 1;

	    this.angle = 0;
	    this.centerX = 0;
	    this.centerY = 0;


	    this.c_points = [
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	    ];

	    this.vertex = [
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	      new Point(this.uuid, 0, 0),
	    ];
	  }

	  addEvent(event, callback){
	    this.c_svg.addEventListener(event, callback);
	    this.events[event] = callback;
	  }

	  deleteEvent(event){
	    var callback = this.events[event];
	    this.c_svg.removeEventListener(event, callback);
	    delete this.events[event];
	  }

	  addChild(child, translate, rotate){
	    child.setOffsetX(this.x);
	    child.setOffsetY(this.y);
	    translate(this, child);
	    rotate(this, child);
	    child.draw(svg);
	    this.children.push({child, translate, rotate});
	  }

	  draw(svg) {
	    const sv = "http://www.w3.org/2000/svg";
	    this.c_svg = document.createElementNS(sv, "rect");

	    this.c_svg.setAttributeNS(null, "x", this.x +  this.offsetX);
	    this.c_svg.setAttributeNS(null, "y", this.y +  this.offsetY);
	    this.c_svg.setAttributeNS(null, "id", this.uuid);
	    this.c_svg.setAttributeNS(null, "height", this.height * this.scaleY);
	    this.c_svg.setAttributeNS(null, "width", this.width * this.scaleX);
	    this.c_svg.setAttributeNS(null, "stroke", config.form.stroke);
	    this.c_svg.setAttributeNS(null, "stroke-width", config.form.strokeWidth);
	    this.c_svg.setAttributeNS(null, "fill", config.form.fill);


	    svg.appendChild(this.c_svg);


	    this.drawConnector();
	    this.drawVertex();

	    this.c_points.map((point) => {
	      point.draw(svg);
	    });

	    this.vertex.map((point) => {
	      point.draw(svg);
	    });

	    this.addEvent("mousedown", events.mouseDownCb);
	    this.addEvent("mouseup", events.mouseUpCb);
	    this.addEvent("mouseover", events.mouseMoveCb);
	  }

	  setRotateCenter(centerX, centerY){
	    this.centerX = centerX;
	    this.centerY = centerY;
	  }

	  setRotateAngle(angle){
	    this.angle = angle;
	  }

	  setOffsetX(x){
	    this.offsetX = x;
	  }

	  setOffsetY(y){
	    this.offsetY = y;
	  }

	  setScaleX(x){
	    this.scaleX = x;
	  }

	  setScaleY(y){
	    this.scaleY = y;
	  }

	  getOffsetX(){
	    return this.offsetX;
	  }

	  getOffsetY(){
	    return this.offsetY;
	  }

	  getScaleX(){
	    return this.scaleX;
	  }

	  getScaleY(){
	    return this.scaleY;
	  }

	  getWidth(){
	    return this.width;
	  }

	  getHeight(){
	    return this.height;
	  }

	  drawVertex(){
	    if(this.vertex.length == 0)
	      return;
	    
	    this.vertex[0].x = this.x + this.offsetX;
	    this.vertex[0].y = this.y + this.offsetY;

	    this.vertex[1].x = this.x + this.offsetX + this.width * this.scaleX;
	    this.vertex[1].y = this.y + this.offsetY ;

	    this.vertex[2].x = this.x + this.offsetX + this.width  * this.scaleX;
	    this.vertex[2].y = this.y + this.offsetY + this.height * this.scaleY;

	    this.vertex[3].x = this.x + this.offsetX;
	    this.vertex[3].y = this.y + this.offsetY + this.height * this.scaleY;
	  }

	  drawConnector() {
	    if(this.c_points.length == 0)
	      return;
	    
	    this.c_points[0].x = this.x +  this.offsetX  + (this.width / 2) * this.scaleX;
	    this.c_points[0].y = this.y + this.offsetY ;

	    this.c_points[1].x = this.x +  this.offsetX + this.width * this.scaleX;
	    this.c_points[1].y = this.y + this.offsetY  + (this.height / 2) * this.scaleY;

	    this.c_points[2].x = this.x + this.offsetX  + (this.width / 2) * this.scaleX;
	    this.c_points[2].y = this.y + this.offsetY  + (this.height) * this.scaleY;

	    this.c_points[3].x = this.x + this.offsetX ;
	    this.c_points[3].y = this.y + this.offsetY + (this.height / 2) * this.scaleY;
	  }

	  shift(dx, dy) {
	    this.x += dx;
	    this.y += dy;

	    this.c_points.map((p) => {
	      p.shift(dx, dy);
	    });

	    this.vertex.map((p) => {
	      p.shift(dx, dy);
	    });
	  }

	  redraw() {
	    this.c_svg.setAttributeNS(null, "x", this.x + this.offsetX);
	    this.c_svg.setAttributeNS(null, "y", this.y + this.offsetY);
	    this.c_svg.setAttributeNS(null, "height", this.height * this.scaleY);
	    this.c_svg.setAttributeNS(null, "width", this.width * this.scaleX);

	    this.drawVertex();
	    this.drawConnector();

	    this.c_points.map((p) => {
	      p.redraw();
	    });

	    this.vertex.map((p) => {
	      p.redraw();
	    });

	    this.children.map ( ({child, translate, rotate}) => {
	        translate(this, child);
	        rotate(this, child);
	        child.redraw();
	    });
	  }

	  resize(pos, dx, dy) {

	      if (pos == 0) {

	        this.shift(dx, dy);
	  
	        this.width += -dx;
	        this.height += -dy;
	  
	      } 
	      else if (pos == 1) {
	  
	        this.y += dy;
	  
	        this.width += dx;
	        this.height += -dy;
	  
	      } 
	      else if (pos == 2) {
	  
	        this.width += dx;
	        this.height += dy;
	  
	      } 
	      else if (pos == 3) {
	  
	        this.x += dx;
	  
	        this.width += -dx;
	        this.height += dy;
	  
	      }

	      this.children.map( ({child, translate, rotate}) => {
	        translate(this, child);
	        rotate(this, child);
	        child.redraw();
	      });
	  }


	  optimalPath(line){
	    var _x, _y;
	    var a = (line.dest_y - line.y)/(line.dest_x - line.x);
	    var b = line.y - a * line.x;

	    for (var i = 0; i <= 3; i++){
	        if(i % 2 == 0){
	            _y = this.vertex[i].y;
	            _x = (_y - b)/a;
	        }
	        else {
	            _x = this.vertex[i].x;
	            _y = a * _x + b;
	        }

	        if( (_x == line.x && _y == line.y) || (_x == line.dest_x && _y == line.dest_y))
	          continue;

	          if(((i == 0 &&  _x > this.vertex[i].x && _x < this.vertex[i+1].x) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) ||
	           ((i == 1 &&  _y > this.vertex[i].y && _y < this.vertex[i+1].y) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) || 
	           ((i == 2 &&  _x > this.vertex[i+1].x && _x < this.vertex[i].x) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  )|| 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ))) ||
	           ((i == 3 &&  _y >= this.vertex[0].y && _y <= this.vertex[i].y) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) ) )) {
	            return this.c_points[i];
	           }
	      }
	    return null;
	  }

	}

	/**
	 * @class Triangle
	 */

	class Triangle {

	  constructor( uuid, x1 = 0, y1 = 0, x2 = 5, y2 = 5, x3 = 10, y3 = 10)
	  {

	    this.uuid = uuid;

	    this.x1 = x1;
	    this.y1 = y1;

	    this.x2 = x2;
	    this.y2 = y2;

	    this.x3 = x3;
	    this.y3 = y3;

	    this.events = {};

	    this.c_svg = "";
	    this.type = "triangle";

	    this.children = [];

	    this.offsetX = 0;
	    this.offsetY = 0;

	    this.scaleX = 0;
	    this.scaleY = 0;

	    this.angle = 0;
	    
	    this.centerX = 0;
	    this.centerY = 0;

	    this.c_points = [
	      new Point(this.uuid,0, 0 ),
	      new Point(this.uuid,0, 0 ),
	      new Point(this.uuid,0, 0 ),
	      new Point(this.uuid,0, 0 ),
	    ];

	    this.vertex = [
	        new Point(this.uuid,0, 0 ),
	        new Point(this.uuid,0, 0 ),
	        new Point(this.uuid,0, 0 ),
	        new Point(this.uuid,0, 0 ),
	    ];
	  }

	  addEvent(event, callback){
	    this.c_svg.addEventListener(event, callback);
	    this.events[event] = callback;
	  }

	  deleteEvent(event){
	    var callback = this.events[event];
	    this.c_svg.removeEventListener(event, callback);
	    delete this.events[event];
	  }


	  setOffsetX(x){
	    this.offsetX = x;
	  }

	  setOffsetY(y){
	    this.offsetY = y;
	  }

	  setScaleX(x){
	    this.scaleX = x;
	  }

	  setScaleY(y){
	    this.scaleY = y;
	  }

	  getOffsetX(){
	    return this.offsetX;
	  }

	  getOffsetY(){
	    return this.offsetY;
	  }

	  getScaleX(){
	    return this.scaleX;
	  }

	  getScaleY(){
	    return this.scaleY;
	  }

	  setRotateCenter(centerX, centerY){
	    this.centerX = centerX;
	    this.centerY = centerY;
	  }

	  setRotateAngle(angle){
	    this.angle = angle;
	  }

	  drawVertex(){
	    if(this.vertex.length == 0)
	      return;
	  }

	  drawConnector() {
	    if(this.c_points.length == 0)
	      return;
	  }

	  drawBox(){
	  }


	  draw(svg) {
	      
	    const ns = "http://www.w3.org/2000/svg";
	    this.c_svg = document.createElementNS(ns, "path");

	    this.redraw();

	    this.c_svg.setAttribute("id", this.uuid);
	    this.c_svg.setAttribute("d", this.p);
	    this.c_svg.setAttributeNS(null, "stroke", config.form.stroke);
	    this.c_svg.setAttributeNS(null, "stroke-width", config.form.strokeWidth);
	    this.c_svg.setAttribute("fill", config.form.fill);


	    svg.appendChild(this.c_svg);

	    this.addEvent("mousedown", events.mouseDownCb);
	    this.addEvent("mouseup", events.mouseUpCb);
	  }

	  shift(dx, dy) {
	    this.x1 += dx;
	    this.y1 += dy;

	    this.x2 += dx;
	    this.y2 += dy;

	    this.x3 += dx;
	    this.y3 += dy;

	    this.c_points.map((p) => {
	      p.shift(dx, dy);
	    });

	    this.vertex.map((v) => {
	      v.shift(dx, dy);
	    });
	  }



	  redraw() {
	    if(this.angle != 0){
	      var _x1, _x2, _x3, _y1, _y2, _y3, _x, _y, dx, dy;

	      _x1 = this.x1  * Math.cos(this.angle) - this.y1   * Math.sin(this.angle) ;
	      _y1 = this.x1  * Math.sin(this.angle) + this.y1   * Math.cos(this.angle) ;

	      _x2 = this.x2   * Math.cos(this.angle) - this.y2   * Math.sin(this.angle) ;
	      _y2 = this.x2   * Math.sin(this.angle) + this.y2   * Math.cos(this.angle) ;

	      _x3 = this.x3    * Math.cos(this.angle) - this.y3  * Math.sin(this.angle);
	      _y3 = this.x3    * Math.sin(this.angle) + this.y3  * Math.cos(this.angle);

	      _x = this.centerX  * Math.cos(this.angle) - this.centerY   * Math.sin(this.angle);
	      _y = this.centerX  * Math.sin(this.angle) + this.centerY   * Math.cos(this.angle);

	      dx = _x - this.centerX;
	      dy = _y - this.centerY;

	      this.p = "M " + (_x1 - dx + this.offsetX) +  "," + (_y1 - dy + this.offsetY) + " " + "L " + (_x2 - dx + this.offsetX) + "," + (_y2 - dy + this.offsetY) + " " + "L " + (_x3 - dx + this.offsetX) + "," + (_y3 - dy + this.offsetY) + " Z";
	    }
	    else
	      this.p = "M " + (this.x1 + this.offsetX) +  "," + (this.y1 + this.offsetY) + " " + "L " + (this.x2 + this.offsetX) + "," + (this.y2 + this.offsetY) + " " + "L " + (this.x3 + this.offsetX) + "," + (this.y3 + this.offsetY) + " Z";

	  this.c_svg.setAttribute("d", this.p);
	  }

	  resize(pos, dx, dy) {
	      if (pos == 0) {
	        this.x1 = dx;
	        this.y1 = dy;
	        this.vertex[0].x = dx;
	        this.vertex[0].y = dy;
	      }
	      else if (pos == 1) {
	        this.x2 = dx;
	        this.y2 = dy;
	        this.vertex[1].x = dx;
	        this.vertex[1].y = dy;
	      }
	      else if (pos == 2) {
	        this.x3 = dx;
	        this.y3 = dy;
	        this.vertex[2].x = dx;
	        this.vertex[2].y = dy;
	      }
	  }
	}

	/**
	 * @class Losange
	 */


	class Losange {

	/**
	 * 
	 * @param {string} uuid 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 */

	  constructor(uuid, x = 0, y = 0, width = 10, height = 30)
	  {
	      this.uuid = uuid;

	      this.x = x;
	      this.y = y;

	      this.width = width;
	      this.height =  height;

	      this.events = {};

	      this.c_svg = "";
	      this.box = "";

	      this.type = "losange";
	      this.p = "";

	      this.scaleX = 1;
	      this.scaleY = 1;

	      this.offsetX = 0;
	      this.offsetY = 0;
	  
	      this.angle = 0;

	      this.centerX = 0;
	      this.centerY = 0;

	      this.children = [];

	      this.c_points = [
	        new Point(this.uuid,0,0),
	        new Point(this.uuid,0,0),
	        new Point(this.uuid,0,0),
	        new Point(this.uuid,0,0),
	      ];

	      this.vertex = [
	        new Point(this.uuid, 0, 0),
	        new Point(this.uuid, 0, 0),
	        new Point(this.uuid, 0, 0),
	        new Point(this.uuid, 0, 0),
	      ];
	  }

	  addEvent(event, callback){
	    this.c_svg.addEventListener(event, callback);
	    this.events[event] = callback;
	  }

	  deleteEvent(event){
	    var callback = this.events[event];
	    this.c_svg.removeEventListener(event, callback);
	    delete this.events[event];
	  }


	  addChild(child, translate, rotate){
	    child.setOffsetX(this.x);
	    child.setOffsetY(this.y);
	    translate(this, child);
	    rotate(this, child);
	    child.draw(svg);
	    this.children.push({child, translate, rotate});
	  }


	  drawVertex(){
	    if(this.vertex.length == 0)
	      return;

	    this.vertex[0].x = this.x + this.offsetX - (this.width / 2 * this.scaleX) ;
	    this.vertex[0].y = this.y + this.offsetY;

	    this.vertex[1].x = this.x + this.offsetX +  (this.width / 2 * this.scaleX);
	    this.vertex[1].y = this.y + this.offsetY;

	    this.vertex[2].x = this.x + this.offsetX + (this.width/2 * this.scaleX);
	    this.vertex[2].y = this.y + this.offsetY + this.height * this.scaleY;

	    this.vertex[3].x = this.x + this.offsetX - (this.width/2  * this.scaleX);
	    this.vertex[3].y = this.y + this.offsetY + (this.height * this.scaleY);
	  }

	  drawConnector() {
	    if(this.c_points.length == 0)
	      return;
	    
	    this.c_points[0].x = this.x + this.offsetX;
	    this.c_points[0].y = this.y + this.offsetY;

	    this.c_points[1].x = this.x + this.offsetX + (this.width/2 * this.scaleX);
	    this.c_points[1].y = this.y + this.offsetY + (this.height/2 * this.scaleY);

	    this.c_points[2].x = this.x + this.offsetX;
	    this.c_points[2].y = this.y + this.offsetY + (this.height * this.scaleY);

	    this.c_points[3].x = this.x + this.offsetX - (this.width/2 * this.scaleX);
	    this.c_points[3].y = this.y + this.offsetY + (this.height/2 * this.scaleY);
	  }

	  draw(svg) {
	    const ns = "http://www.w3.org/2000/svg";

	    this.c_svg = document.createElementNS(ns, "path");
	    this.box = document.createElementNS(ns, "path");

	    this.redraw();

	    this.box.setAttribute("id", this.uuid);
	    this.box.setAttributeNS(null, "stroke", config.box.stroke);
	    this.box.setAttributeNS(null, "stroke-width", config.box.strokeWidth);
	    this.box.setAttributeNS(null, "fill", config.box.fill);
	    this.box.setAttribute("stroke-dasharray", config.box.strokeDasharray);

	    this.c_svg.setAttribute("id", this.uuid);
	    this.c_svg.setAttribute("d", this.p);
	    this.c_svg.setAttributeNS(null, "stroke", config.form.stroke);
	    this.c_svg.setAttributeNS(null, "stroke-width", config.form.strokeWidth);
	    this.c_svg.setAttribute("fill", config.form.fill);

	    svg.appendChild(this.c_svg);
	    svg.appendChild(this.box);
	    
	    this.addEvent("mousedown", events.mouseDownCb);
	    this.addEvent("mouseup", events.mouseUpCb);
	  }

	  redraw() {
	    if(this.angle != 0){
	      var __x, __y, _x, _y, dx, dy;

	      __x = this.x  * Math.cos(this.angle) - this.y   * Math.sin(this.angle) ;
	      __y = this.x  * Math.sin(this.angle) + this.y   * Math.cos(this.angle) ;


	      _x = this.centerX  * Math.cos(this.angle) - this.centerY   * Math.sin(this.angle);
	      _y = this.centerX  * Math.sin(this.angle) + this.centerY   * Math.cos(this.angle);

	      dx = _x - this.centerX;
	      dy = _y - this.centerY;

	      this.p = `M ${__x - dx + this.offsetX} ${__y - dy + this.offsetY}  L ${__x - dx  + this.offsetX + (this.width/2 * this.scaleX)} ${__y - dy + this.offsetY + (this.height/2 * this.scaleY)}  L ${__x - dx + this.offsetX} ${ __y - dy + this.offsetY + (this.height * this.scaleY)}  L ${ __x - dx + this.offsetX - (this.width/2 * this.scaleX)} ${ __y - dy + this.offsetY + (this.height/2 * this.scaleY)}Z`;
	    }
	    else
	      this.p = `M ${this.x + this.offsetX} ${this.y + this.offsetY}  L ${this.x + this.offsetX + (this.width/2 * this.scaleX)} ${this.y + this.offsetY + (this.height/2 * this.scaleY)}  L ${this.x + this.offsetX} ${this.y + this.offsetY + (this.height * this.scaleY)}  L ${this.x + this.offsetX - (this.width/2 * this.scaleX)} ${this.y + this.offsetY + (this.height/2 * this.scaleY)}Z`;

	    this.drawVertex();
	    this.drawConnector();
	    this.drawBox();

	    this.c_svg.setAttribute("d",this.p);

	    this.c_points.map((p) => {
	        p.redraw();
	      });

	      this.vertex.map((v) => {
	      v.redraw();
	    });

	    this.children.map( ({child, translate, rotate}) => {
	      translate(this, child);
	      rotate(this, child);
	      child.redraw();
	    });
	  }

	  resize(pos, dx, dy) {
	    if (pos == 0) {

	      this.shift(dx, dy);

	      this.width += -dx;
	      this.height += -dy;

	    } 
	    else if (pos == 1) {

	      this.y += dy;

	      this.width += dx;
	      this.height += -dy;

	    } 
	    else if (pos == 2) {

	      this.width += dx;
	      this.height += dy;

	    } 
	    else if (pos == 3) {

	      this.x += dx;

	      this.width += -dx;
	      this.height += dy;

	    }

	    this.children.map( ({child, translate, rotate}) => {
	      translate(this, child);
	      rotate(this, child);
	      child.redraw();
	    });
	  }

	  drawBox(){

	    /* dessin du contour de la forme sous forme de carré */
	    if(this.c_points.length == 0 || this.vertex.length == 0)
	      return;
	    
	    var p = `M ${this.vertex[0].x} ${this.vertex[0].y}
              L ${this.c_points[0].x } ${this.c_points[0].y} 
              L ${this.vertex[1].x }   ${this.vertex[1].y} 
              L ${this.c_points[1].x } ${this.c_points[1].y}
              L ${this.vertex[2].x }   ${this.vertex[2].y}
              L ${this.c_points[2].x } ${this.c_points[2].y} 
              L ${this.vertex[3].x }   ${this.vertex[3].y} 
              L ${this.c_points[3].x } ${this.c_points[3].y} Z`;

	    this.box.setAttribute("d", p);
	  }

	  shift(dx, dy) {
	    this.x += dx;
	    this.y += dy;

	    this.x2 += dx;
	    this.y2 += dy;

	    this.x3 += dx;
	    this.y3 += dy;

	    this.x4 += dx;
	    this.y4 += dy;

	    this.c_points.map((p) => {
	      p.shift(dx, dy);
	    });

	    this.vertex.map((v) => {
	      v.shift(dx, dy);
	    });
	  }

	  setRotateCenter(centerX, centerY){
	    this.centerX = centerX;
	    this.centerY = centerY;
	  }

	  setRotateAngle(angle){
	    this.angle = angle;
	  }

	  setOffsetX(x){
	    this.offsetX = x;
	  }

	  setOffsetY(y){
	    this.offsetY = y;
	  }

	  setScaleX(x){
	    this.scaleX = x;
	  }

	  setScaleY(y){
	    this.scaleY = y;
	  }

	  getOffsetX(){
	    return this.offsetX;
	  }

	  getOffsetY(){
	    return this.offsetY;
	  }

	  getScaleX(){
	    return this.scaleX;
	  }

	  getScaleY(){
	    return this.scaleY;
	  }

	  optimalPath(line){
	    var _x, _y;
	    var a = (line.dest_y - line.y)/(line.dest_x - line.x);
	    var b = line.y - a * line.x;

	    for (var i = 0; i <= 3; i++){
	        if(i % 2 == 0){
	            _y = this.vertex[i].y;
	            _x = (_y - b)/a;
	        }
	        else {
	            _x = this.vertex[i].x;
	            _y = a * _x + b;
	        }

	        if( (_x == line.x && _y == line.y) || (_x == line.dest_x && _y == line.dest_y))
	          continue;

	          if(((i == 0 &&  _x > this.vertex[i].x && _x < this.vertex[i+1].x) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) ||
	           ((i == 1 &&  _y > this.vertex[i].y && _y < this.vertex[i+1].y) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) )) || 
	           ((i == 2 &&  _x > this.vertex[i+1].x && _x < this.vertex[i].x) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  )|| 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ))) ||
	           ((i == 3 &&  _y >= this.vertex[0].y && _y <= this.vertex[i].y) &&
	              (( line.x <= line.dest_x  && _x <= line.dest_x && _x >= line.x &&  a < 0 ? _y >= line.dest_y && _y <= line.y :_y <= line.dest_y && _y >= line.y  ) || 
	              ( line.x >= line.dest_x  && _x >= line.dest_x &&  _x <= line.x  &&  a < 0 ? _y <= line.dest_y &&  _y >= line.y : _y >= line.dest_y &&  _y <= line.y ) ) )) {
	            return this.c_points[i];
	           }
	      }
	    return null;
	  }
	}

	/**
	 * @class FactoryForm
	 */


	class FactoryForm
	{
	    /**
	     * @param {string} uuid 
	     * @param {string} type 
	     * @param {object} props 
	     * @returns @form
	     */

	   static createForm(uuid, type, props = {})
	    {
	        if(type == "circle")
	            return new Circle(uuid, props.x, props.y, props.r);
	        else if(type == "rectangle")
	            return new Rectangle(uuid, props.x, props.y, props.width, props.height);
	        else if(type == "line")
	            return new Line(uuid, props.x, props.y, props.dest_x, props.dest_y);
	        else if(type == "triangle")
	            return new Triangle(uuid, props.x1, props.y1, props.x2, props.y2, props.x3, props.y3);
	        else if(type == "losange")
	            return new Losange(uuid, props.x, props.y, props.width, props.height);
	    }
	}

	class Component
	{
	    /**
	     * 
	     * @param {string} type 
	     * @param {array} events 
	     * @param {object} params 
	     */
	    constructor( type, props)
	    {
	        this.uuid = _uuid.generate();
	        this.type = type;
	        this.form = FactoryForm.createForm(this.uuid, type, props);
	        _Register.add(this);
	        this.form.draw(svg);
	    }
	}

	exports.Circle = Circle;
	exports.Component = Component;
	exports.FactoryForm = FactoryForm;
	exports.Line = Line;
	exports.Losange = Losange;
	exports.Point = Point;
	exports.Rectangle = Rectangle;
	exports.Triangle = Triangle;
	exports._Register = _Register;
	exports._uuid = _uuid;
	exports.config = config;
	exports.events = events;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
