
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const lerp = (a, b, amount) => a*(1-amount) + b*amount;
const lerp2D = (a, b, amount) => [lerp(a[0],b[0],amount), lerp(a[1],b[1],amount)];
const vLerp = (a, b, cutoff) => new Vertex(...lerp2D(a.pos, b.pos,  clamp((cutoff-a.s)/(b.s - a.s), 0, 1)));
// const vLerp = (a, b) => new Vertex(...lerp2D(a.pos, b.pos, .5));
const sub = ([x1,y1], [x2,y2]) => [x1-x2, y1-y2];

class Vertex{
    constructor(x, y, value){
        this.pos = [x,y];
        this.s = value;
    }
}


const table = [
    [],
    [0,4,7],
    [1,5,4],
    [0,5,7, 0,1,5],
    [5,2,6],
    [0,4,5, 7,2,6, 0,2,7, 0,5,2],
    [1,2,4, 2,4,6],
    [0,6,7, 0,1,6, 6,2,1],
    [3,7,6],
    [0,4,6, 0,6,3],
    [3,7,4, 4,1,3, 1,3,5, 3,6,5],
    [3,6,5, 3,5,1, 1,3,0],
    [3,5,7, 3,5,2],
    [0,2,3, 0,4,5, 0,2,5],
    [3,1,2, 1,7,4, 1,3,7],
    [0,1,2, 0,2,3]
];

export default function calc_mesh(field, cutoff){
    let final_array = [];

    for(let i = 0; i < field.length-1; i++){
        for(let j = 0; j < field[0].length-1; j++){
            const offsets = [[0,0], [1,0], [1,1], [0,1]];
            const vertices = offsets.map(([dx,dy]) => 
                new Vertex((j+dx) / field.length*2, (i+dy) / field.length*2, clamp(field[i+dy][j+dx] - cutoff/2,0,1000))
            );
            
            const table_index = Number.parseInt(vertices.map(v => (v.s > cutoff/2)? 1 : 0).reverse().join(""), 2);
            if(table_index == 0){continue;}

            vertices.push(
                vLerp(vertices[0],vertices[1], cutoff),
                vLerp(vertices[1],vertices[2], cutoff),
                vLerp(vertices[2],vertices[3], cutoff),
                vLerp(vertices[3],vertices[0], cutoff)
            );

            table[table_index].forEach(vert_index => 
                final_array.push(...sub(vertices[vert_index].pos,[1,1]))
            );
        }
    }

    return final_array;
}