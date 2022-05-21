import MarchingSquares from './marching_squares.mjs';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const sub = ([x1,y1], [x2,y2]) => [x1-x2, y1-y2];
const add = ([x1,y1], [x2,y2]) => [x1+x2, y1+y2];

export default class fluidSim{
    constructor(width, height, numparticles, canvas, viscosity=1){
        this.width = width;
        this.height = height;
        this.viscosity = viscosity;
        this.canvas = canvas;
        this.particle_radius = 5;
        this.particles = [];
        this.scalar_field = [];
        this.lastx = 0;
        this.lasty = 0;
        for(let i=0; i<width; i++){
            this.scalar_field[i] = new Array(this.height).fill(.1);
        }
        for(let i=0; i<numparticles; i++){
            this.particles.push(new particle(Math.random() * (canvas.width-this.particle_radius), Math.random() * (canvas.height-4*this.particle_radius)+2*this.particle_radius));
        }
    }

    step_physics(){
        const dampening = .2;
        this.particles.forEach(particle=>{

            particle.v[1] += .1;
            particle.pos = add(particle.pos, particle.v);

            //collisions should reflect current trajectories with a bit of dampening
            this.particles.forEach(other_particle=>{

                if(other_particle == particle){return;}

                const diff = sub(particle.pos, other_particle.pos);
                const distance = Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1]);
                const direction_vec = [diff[0]/distance, diff[1]/distance];
                const diff_surfaces = clamp(2 * this.particle_radius - distance, 0, 2 * this.particle_radius);
                if(diff_surfaces > 0){
                    particle.pos = add(particle.pos, direction_vec.map(v=>v*diff_surfaces/2));
                    other_particle.pos = sub(other_particle.pos, direction_vec.map(v=>v*diff_surfaces/2));
                }
            });
            if( particle.pos[0] + particle.v[0] < this.particle_radius*2 || particle.pos[0] + particle.v[0] > this.canvas.width - this.particle_radius*2 ){
                particle.v[0] *= -dampening;
            }
            if( particle.pos[1] + particle.v[1] < this.particle_radius*2 || particle.pos[1] + particle.v[1] > this.canvas.height - this.particle_radius*2 ){
                particle.v[1] *= -dampening;
            }
            particle.pos = add(particle.pos, particle.v);
            particle.pos[0] = clamp(particle.pos[0], this.particle_radius*2, this.canvas.width - this.particle_radius*2);
            particle.pos[1] = clamp(particle.pos[1], this.particle_radius*2, this.canvas.height - this.particle_radius*2);
        });
    }

    render(gl, vert_buffer){
        const px2coord = ([x,y]) => [x/this.canvas.width * this.width, y/this.canvas.height * this.height];
        const coord2px = ([x,y]) => [x*this.canvas.width / this.width, y*this.canvas.height / this.height];
        for(let i=0; i<this.height; i++){
            for(let j=0; j<this.width; j++){
                this.scalar_field[i][j] = .1;
            }
        }
        const cutoff = 50;
        const range = this.particle_radius*2;
        this.particles.forEach(part=>{
            const [[ux1, uy1], [ux2, uy2]] = [ 
                px2coord(part.pos.map(v => v - range)),
                px2coord(part.pos.map(v => v + range))
            ];
            for(let y = Math.max(Math.floor(uy1),0); y <  Math.min(Math.ceil(uy2),this.height); y++){
                for(let x = Math.max(Math.floor(ux1),0); x <  Math.min(Math.ceil(ux2),this.width); x++){
                    const dist = Math.hypot(...sub(coord2px([x,y]), part.pos));
                    this.scalar_field[(this.height-1)-y][x] += Math.max(4*cutoff*(range-dist)/range, 0);
                }
            }
        });
        const vertices = MarchingSquares(this.scalar_field, cutoff);
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0,vertices.length / 2);
    }

    poke(x, y){
        const strength = .1;
        this.particles.forEach(particle=>{
            const diff = sub(particle.pos, [x,y]);
            const distance = Math.hypot(...diff);
            if(distance <= 120){
                particle.v = add(particle.v, [
                    (x - this.lastx) * strength, 
                    (y - this.lasty) * strength
                ]);
            }
        });
        [this.lastx, this.lasty] = [x, y];
    }
}

class particle{
    constructor(x, y){
        this.pos = [x,y];
        this.v = [0,0];
    }
}