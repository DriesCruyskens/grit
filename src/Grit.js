
import * as paper from 'paper';
import { saveAs } from 'file-saver';
import { parse } from 'svg-parser';
import * as toHtml from 'hast-util-to-html'
import {QuadTree, Box, Point} from 'js-quadtree'
import * as ch from 'convex-hull'


export default class Grit {

    constructor(canvas_id) {
        this.params = {
            n_vertices: 4,
            grit_amt: 5,
            grit: false,
            dot_size: .6,
            n_dots: 20000,
            overlap_dist: .6,
            factor: .4,
            show_vertices: false,
            extra_grit: false,
            allow_dot_overlap: false,
            overlap_dist: .6,
            dot_color: "#e7ebc5",
            background_color: "#202020",
        }

        Number.prototype.map = function (in_min, in_max, out_min, out_max) {
            return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        this.canvas = document.getElementById(canvas_id);
        paper.setup(this.canvas);
        this.tool = new paper.Tool();

        this.vertices = []
        this.dots = []

        this.background = new paper.Shape.Rectangle(new paper.Rectangle(0, 0, paper.view.size.width, paper.view.size.height))
        this.background.fillColor = this.params.background_color

        const boundingArea = new Box(0, 0, paper.view.bounds.width, paper.view.bounds.height)
        const config = {
        }
        this.qt = new QuadTree(boundingArea, config)

        this.init_tools();
        //this.reset();
        this.gen_points();
    }

    reset() {
        paper.project.currentStyle = {
            //strokeColor: 'black',
            fillColor: '#00000011'
        };
        
        paper.project.clear();
        this.draw();
    }

    lerp(start, end, amt) {
        return (1-amt)*start+amt*end
    }

    draw() {
        this.qt.clear()
        this.background.remove()
        this.background = new paper.Shape.Rectangle(new paper.Rectangle(0, 0, paper.view.size.width, paper.view.size.height))
        this.background.fillColor = this.params.background_color

        // add new point somewhere between 2 existing points, makes for interesting results
        if (this.vertices.length >= 3) { 
            let vertices_ext = [...this.vertices]

            if (this.params.grit) {
                this.gen_grit()
            }

            if (this.params.extra_grit) {
                const r = Math.random().map(0, 1, .1, .9)
                const vx = this.lerp(this.vertices[0].x, this.vertices[1].x, r)
                const vy = this.lerp(this.vertices[0].y, this.vertices[1].y, r)
                vertices_ext.push(new paper.Point(vx, vy))
                
            }


            // draw vertices
            if (this.params.show_vertices) {
                vertices_ext.forEach(v => {
                    paper.Shape.Circle(v, 1).fillColor = 'red'
                })
            }
            
            this.dots = []
            // random starting dot
            let x = Math.random() * paper.view.size.width;
            let y = Math.random() * paper.view.size.height;

            this.dots.push([x, y])

            // sierpinski algorithm
            for (let i = 0; i < this.params.n_dots; i++) {
                const vertex = Math.floor(Math.random() * vertices_ext.length)

                x = this.lerp(x, vertices_ext[vertex].x, this.params.factor)
                y = this.lerp(y, vertices_ext[vertex].y, this.params.factor)
                
                if (i > 10) {
                    const points = this.qt.query(new Box(x-5, y-5, 5, 5))
                    
                    let collision = this.params.allow_dot_overlap ? false : points.some((d) => {
                        return this.dist(d.x, d.y, x, y) < this.params.overlap_dist
                    });
                    
                    if (!collision) {
                        let c = paper.Shape.Circle([x, y], this.params.dot_size)
                        c.fillColor = this.params.dot_color
                        this.qt.insert(new Point(x, y))
                        
                    }
                }
                
                this.dots.push([x, y])
            }
        } else {
            // draw vertices
            if (this.params.show_vertices) {
                this.vertices.forEach(v => {
                    paper.Shape.Circle(v, 1).fillColor = 'red'
                })
            }
        }
        //console.log(paper.project.layers[0].children.length)
        paper.view.draw()
    }

    dist(x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;

        var c = Math.sqrt( a*a + b*b );
        return c
    }

    init_tools() {
        this.tool.onMouseDown = (event) => {
            this.vertices.push(event.point)
            this.reset()
        }
    }

    undo(){
        this.vertices.pop()
        this.reset()
    }

    clear() {
        this.vertices = []
        this.reset()
    }

    
    gen_grit() {
        const r = Math.floor(Math.random() * this.params.n_vertices)
        for (let i = 0; i < this.params.grit_amt; i++) {
            this.vertices.push(this.vertices[r].clone())
        }
    }


    gen_points() {
        this.vertices = []
        this.reset()
        let vertices = []
        let isConvex = false
        while(!isConvex) {
            vertices = []
            for (let i = 0; i<4; i++) {
                vertices.push([
                    paper.view.bounds.width/10 + Math.random() * paper.view.bounds.width*.9,
                    paper.view.bounds.height/10 + Math.random() * paper.view.bounds.height*.9
                ])
            }
            isConvex = ch(vertices).length == 4 ? true : false
            console.log(isConvex)
        }
        
        vertices.forEach(p => {
            this.vertices.push(new paper.Point(p[0], p[1]))
        })

        this.gen_grit()
        this.draw();
    }

    export_svg() {
        this.background.remove()
        let svg = paper.project.exportSVG({asString: true});

        const parsed = parse(svg);

        // only keep circles
        let circles = parsed.children[0].children[0].children.filter(e => {
            return e.tagName == "circle";
        })

        let p1, p2, dist
        circles = circles.sort((e1, e2) => {
            p1 = e1.properties.cx * e1.properties.cy
            p2 = e2.properties.cx * e2.properties.cy
            dist = this.dist(e1.properties.cx, 
                e1.properties.cy,
                e2.properties.cx,
                e2.properties.cy)
            if (p1 > p2) {
                return 1
            }
            if (p1 < p2) {
                return -1
            }
            return 0
        })

        let sorted = []
        let closest = {
            i: 0,
            dist: 100000,
        }

        sorted.push(...circles.splice(0, 1)) // take first and put in sorted

        const l = circles.length
        for (let i = 0; i < l; i++) {
            let closest = {
                i: 0,
                dist: 100000,
            }
            // search remaining circles for closest point and move it to sorted
            circles.forEach((c, j) => {
                dist = this.dist(sorted[i].properties.cx,
                    sorted[i].properties.cy,
                    c.properties.cx,
                    c.properties.cy)
                closest = dist < closest.dist ? {i: j, dist:dist} : closest;
            })
            sorted.push(...circles.splice(closest.i, 1))
        }

        parsed.children[0].children[0].children = sorted
        svg = toHtml(parsed)

        let blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'grit' + JSON.stringify(this.params) + '.svg');
    }

    export_png() {
        let image = this.canvas.toDataURL();
        console.log(image)
        var blob = new Blob([image], {type: "image/png"});
        saveAs(image, 'superformula.png');
    }
}