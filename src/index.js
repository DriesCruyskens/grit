import Grit from './Grit'
import * as dat from 'dat-gui';

// Only executed our code once the DOM is ready.
window.onload = function() {
    const d = new Grit('paper-canvas');

    let gui = new dat.GUI();

    gui.add(d, 'gen_points').name('generate 4 me');

    let grit = gui.addFolder('grit')

    /* grit.add(d.params, 'grit').onFinishChange((value) => {
        d.params.grit = value;
        d.draw();
    }); */

    grit.add(d.params, 'extra_grit').onFinishChange((value) => {
        d.params.extra_grit = value;
        d.reset();
    });

    /* grit.add(d.params, 'grit_amt', 0, 5).step(1).onFinishChange((value) => {
        d.params.grit_amt = value;
        d.reset();
    }); */

    grit.add(d.params, 'factor', 0.3, 0.5).onFinishChange((value) => {
        d.params.factor = value;
        d.reset();
    });

    let shape = gui.addFolder('shape')

    grit.add(d.params, 'n_vertices', 3, 6).step(1).onFinishChange((value) => {
        d.params.n_vertices = value;
        d.reset();
    });

    shape.add(d.params, 'dot_size', 0, 2).onFinishChange((value) => {
        d.params.dot_size = value;
        d.reset();
    });

    shape.add(d.params, 'n_dots', 100, 50000).step(1).onFinishChange((value) => {
        d.params.n_dots = value;
        d.reset();
    });

    shape.addColor(d.params, 'dot_color').onChange((value) => {
        d.params.dot_color = value;
        d.reset();
    });

    shape.addColor(d.params, 'background_color').onChange((value) => {
        d.params.background = value;
        d.reset();
    });

    shape.add(d.params, 'show_vertices').onFinishChange((value) => {
        d.params.show_vertices = value;
        d.reset();
    });

    shape.add(d.params, 'allow_dot_overlap').onFinishChange((value) => {
        d.params.allow_dot_overlap = value;
        d.reset();
    });

    shape.add(d.params, 'overlap_dist', 0, 4).onFinishChange((value) => {
        d.params.overlap_dist = value;
        d.reset();
    });

    

    gui.add(d, 'undo').name('Undo last vertex');
    gui.add(d, 'clear').name('Clear');
    gui.add(d, 'export_svg').name('Export SVG');
    gui.add(d, 'export_png').name('Export PNG');
}