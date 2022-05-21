const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const sub = ([x1,y1], [x2,y2]) => [x1-x2, y1-y2];
const add = ([x1,y1], [x2,y2]) => [x1+x2, y1+y2];
const mult = (arr, scal) => arr.map(v => v * scal);

let vox_dim = 0;
const getVox = (pos) => pos.map(p => Math.floor(p / vox_dim));

export default class fluidSim{
    constructor(width, height, canvas){
        this.width = width;
        this.height = height;
        this.viscosity = .1;
        this.canvas = canvas;
        this.particle_radius = 5;
        this.particles = [];

        this.voxels = [];
        vox_dim = this.particle_radius*4;

        for(let i=0; i*vox_dim < canvas.height; i++){
            this.voxels.push([[]]);
            for(let j=0; j*vox_dim<canvas.width; j++){
                // initialize each voxel with an empty list of paticles
                this.voxels[i][j] = [];
            }
        }

        for(let i=0; i<height; i++){
            for(let j=0; j<width; j++){
                const part = new particle(this.particle_radius*2*j + 100 + Math.random(), this.particle_radius*2*i + 100 + Math.random(), this);
                const [vx, vy] = getVox(part.pos);

                this.voxels[vy][vx].push(part);
                part.vox = [vx, vy];

                this.particles.push(part);
            }
        }

        this.last_t = new Date().getTime();
    }

    step_physics(){
        // All equations and constants found at https://matthias-research.github.io/pages/publications/sca03.pdf
        const dampening = .5,
            gravity = [0,.8],
            resting_density = 250,
            k = .01,
            mass = 3,
            h = vox_dim/2,
            DENS_CONST = 315 * mass / (64 * Math.PI * Math.pow(h,9)),
            VISC_CONST = 45/(Math.PI * Math.pow(h,6)),
            PRESSURE_CONST = -45 * mass/ (Math.PI * Math.pow(h,6)),
            MAX_SAMPLE_AMOUNT = 64;
            
        const new_t = new Date().getTime();
        const dt = new_t - this.last_t;
        this.last_t = new_t;

        const calculated_densities = [];
        const get_density = (part) => {
            if(calculated_densities[part.index]){
                return calculated_densities[part.index];
            }

            let density = 0;
            part.nearby_particles()
                .slice(0, MAX_SAMPLE_AMOUNT)
                .filter(v => Math.hypot(...sub(v.pos, part.pos)) < h)
                .forEach(other_particle => {
                    const diff = sub(part.pos, other_particle.pos);
                    const dist_squared = diff[0]*diff[0] + diff[1]*diff[1];
                    density += DENS_CONST * Math.pow(Math.pow(h,2) - dist_squared, 3);
                });

            calculated_densities[part.index] = density;
            return density;
        };

        this.particles.forEach(particle=>{

            const pressure = density => k*(density - resting_density);

            const density_1 = get_density(particle);
            const p1 = pressure(density_1);

            let pressure_grad = [0, 0];
            let viscosity_force = [0, 0];  
            particle.nearby_particles()
                .slice(0, MAX_SAMPLE_AMOUNT)
                .forEach(other_particle => {
                    const diff = sub(particle.pos, other_particle.pos);
                    const dist = Math.hypot(...diff);

                    if(dist >= h){ return; }

                    const density_2 = get_density(other_particle);
                    
                    const dv = mult(sub(other_particle.v, particle.v),  VISC_CONST * (h - dist) / density_2);

                    viscosity_force = add(viscosity_force, dv);

                    if(dist > 0){
                        const p2 = pressure(density_2);
                        const pressure_force = PRESSURE_CONST/dist * (p1/Math.pow(density_1,2) 
                            + p2/Math.pow(density_2,2)) * Math.pow(h - dist, 2);
                        const dp = mult(diff, pressure_force);

                        pressure_grad = add(pressure_grad, dp);
                    }
                });
            
            viscosity_force = mult(viscosity_force, this.viscosity * mass / get_density(particle));

            const newv = add(particle.v, add(gravity, mult(add(pressure_grad, viscosity_force), .1)));
            if(Math.hypot(...newv) < 80){
                particle.v = newv;
            }
        });
        
        this.particles.forEach(particle=>{
            particle.pos = add(particle.pos, mult(particle.v, dt/70));
            const r2 = this.particle_radius * 2;

            if( particle.pos[0] < r2 || particle.pos[0] > this.canvas.width - r2 ){
                particle.v[0] *= -dampening;
                particle.pos[0] = clamp(particle.pos[0], r2, this.canvas.width - r2);
            }

            if( particle.pos[1] < r2 || particle.pos[1] > this.canvas.height - r2 ){
                particle.v[1] *= -dampening;
                particle.pos[1] = clamp(particle.pos[1], r2, this.canvas.height - r2);
            }
        });
    }

    render(gl, vert_buffer){
        const vertices = this.particles.map(p=>p.pos).flat();

        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.drawArrays(gl.POINTS, 0,vertices.length / 2);
    }

    poke(pos, dir){ 
        this.particles.forEach(particle=>{
            const diff = sub(particle.pos, pos);
            const distance = Math.hypot(...diff);
            if(distance <= 120){
                particle.v = add(particle.v, dir);
            }
        });
    }
}

class particle{
    constructor(x, y, fluid_sim){
        this.index = Symbol("particle");
        this._pos = [x,y];
        this.v = [0,0];
        this.vox = getVox([x,y]);
        this.voxels = fluid_sim.voxels;
    }

    valid_vox(vx, vy) {
        return (vx>0 && vy>0) && this.voxels[vy] && this.voxels[vy][vx];
    }

    get pos(){return this._pos}
    set pos(new_pos){
        this._pos = new_pos;

        const [vx, vy] = getVox(new_pos);
        if(!this.valid_vox(vx, vy)){
            return;
        }
        
        const curr_vox = this.voxels[this.vox[1]][this.vox[0]];
        
        if(this.vox[0] != vx || this.vox[1] != vy){
            curr_vox.splice(curr_vox.findIndex(v => v.index == this.index), 1);
            this.vox = [vx,vy];
            this.voxels[vy][vx].push(this);
        }
    }

    nearby_particles(){
        // the result is shuffled because the particles must be sampled as randomly as possible
        return shuffle(
            [
                this.vox, 
                add(this.vox,[0,1]), 
                add(this.vox,[1,0]), 
                sub(this.vox,[0,1]), 
                sub(this.vox,[1,0])
            ]
            .filter(vox => this.valid_vox(...vox))
            .map(([vx,vy]) => this.voxels[vy][vx])
            .flat()
        );
    }
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}