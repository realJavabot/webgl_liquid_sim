// Math formulas proofs found in:
// Lengyel, Eric, and Emi Smith. “15.1 Fluid Simulation.” Mathematics for 3D Game Programming and Computer Graphics, Third Edition, Cengage Learning, Boston, 2011, pp. 443–452. 

export default class fluidSim{
    constructor(width, height, spacing=1, speed=1, viscosity=1, time_interval=1){
        this.w = width;
        this.h = height;
        this.d = spacing;
        this._c = speed;
        this._v = viscosity;
        this._t = time_interval;

        const max_t = (viscosity + Math.sqrt(viscosity*viscosity + 32*speed*speed/(spacing*spacing))) / (8*speed*speed/(spacing*spacing));
        if(time_interval > max_t || time_interval < 0){
            console.log(`time_interval (${time_interval}) is greater than maximum interval ${max_t}. Setting to ${max_t/2}`);
            this.t = max_t/2;
        }

        this.calc_constants();

        this.buffers = [new Array(height), new Array(height)];
        for(let i=0; i<height; i++){
            this.buffers[0][i] = new Array(width).fill(0);
            this.buffers[1][i] = new Array(width).fill(0);
        }

        this.current_buffer = 0;
    }

    get c(){return this._c;}
    set c(new_speed){
        this._c = new_speed;
        this.t = this.t;
    }

    get v(){return this._v;}
    set v(new_visc){
        this._v = new_visc;
        this.t = this.t;
    }

    get t(){return this._t}
    set t(new_t){
        const max_t = (this.v + Math.sqrt(this.v*this.v + 32*this.c*this.c/(this.d*this.d))) / (8*this.c*this.c/(this.d*this.d));
        if(new_t > max_t || new_t < 0){
            console.log(`time_interval (${new_t}) is greater than maximum interval ${max_t}. Setting to ${max_t/2}`);
            this._t = max_t/2;
        }else{
            this._t = new_t;
        }
        this.calc_constants();
    }

    calc_constants(){
        this.c1 = (4 - 8*this.c*this.c*this.t*this.t/(this.d*this.d)) / (this.v*this.t + 2);
        this.c2 = (this.v*this.t - 2) / (this.v*this.t + 2);
        this.c3 = (2*this.c*this.c*this.t*this.t/(this.d*this.d)) / (this.v*this.t + 2);
    }

    step_physics(){
        const [current_buffer, previous_buffer] = [this.buffers[this.current_buffer], this.buffers[1-this.current_buffer]];
        for(let y=1; y<this.h-1; y++){
            for(let x=1; x<this.w-1; x++){
                previous_buffer[y][x] = 
                    this.c1*current_buffer[y][x] 
                  + this.c2*previous_buffer[y][x] 
                  + this.c3*(current_buffer[y+1][x] + current_buffer[y-1][x] + current_buffer[y][x+1] + current_buffer[y][x-1]);
            }
        }

        this.current_buffer = 1 - this.current_buffer;
    }

    render(canvas, cx){
        const dx = canvas.width / this.w;
        const dy = canvas.width / this.h;
        this.buffers[this.current_buffer].forEach((column, y)=>{
            column.forEach((cell, x)=>{
                cx.fillStyle = `rgb(${cell+10},10,10)`;
                cx.fillRect(x*dx, y*dy, dx, dy);
            })
        });
    }

    poke(canvas, canvas_x, canvas_y){
        const [cell_x,cell_y] = this.canvas_to_unit(canvas, canvas_x, canvas_y);
        for(let y=1; y<this.h-1; y++){
            for(let x=1; x<this.w-1; x++){
                if(Math.hypot(x-cell_x, y-cell_y) <= 2){
                    this.buffers[this.current_buffer][y][x] = 1000;
                }
            }
        }
    }

    canvas_to_unit(canvas, x, y){
        return [
            Math.floor(this.w * (x / canvas.width)),
            Math.floor(this.h * (y / canvas.height))
        ];
    }
}