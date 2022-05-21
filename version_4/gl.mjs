export async function glSetup(canvas, vertex_source, fragment_source){
    const gl = canvas.getContext('webgl');

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, await (await fetch(vertex_source)).text());
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, await (await fetch(fragment_source)).text());
    gl.compileShader(fragShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader); 
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    return [gl, shaderProgram];
}