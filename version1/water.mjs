export default class fluidSim{
    constructor(width, height, spacing=1){
        this.w = width;
        this.h = height;
        this.d = spacing;
        this.diffuse_rate = .2;

        this.data = new Array(height);
        for(let i=0; i<height; i++){
            this.data[i] = new Array(width).fill(0);
        }
    }

    diffuse(){
        const previous = new Array(this.h);
        this.data.forEach((column, index)=>{
            previous[index] = [...column];
        });

        for(let y=1; y<this.h-1; y++){
            for(let x=1; x<this.w-1; x++){
                this.data[y][x] -= previous[y][x] * this.diffuse_rate * 4;
                [[0,1],[1,0],[0,-1],[-1,0]].forEach(([dx,dy])=>{
                    this.data[y][x] += previous[y+dy][x+dx] * this.diffuse_rate;
                });
            }
        }
    }

    render(canvas, cx){
        const dx = canvas.width / this.w;
        const dy = canvas.width / this.h;
        this.data.forEach((column, y)=>{
            column.forEach((cell, x)=>{
                cx.fillStyle = `rgb(${cell+10},10,10)`;
                cx.fillRect(x*dx, y*dy, dx, dy);
            })
        });
    }

    poke(canvas, canvas_x, canvas_y){
        const [cell_x,cell_y] = this.canvas_to_sim(canvas, canvas_x, canvas_y);
        for(let y=1; y<this.h-1; y++){
            for(let x=1; x<this.w-1; x++){
                if(Math.hypot(x-cell_x, y-cell_y) <= 2){
                    this.data[y][x] = 1000;
                }
            }
        }
    }

    canvas_to_sim(canvas, x, y){
        return [
            Math.floor(this.w * (x / canvas.width)),
            Math.floor(this.h * (y / canvas.height))
        ];
    }
}