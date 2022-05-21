precision highp float;

uniform mat3 projection;
uniform float offset;
uniform sampler2D buffertex;
varying vec2 fragment_pos;

void main(){
    float val = (
          texture2D(buffertex, fragment_pos).a 
        + texture2D(buffertex, fragment_pos-vec2(offset,0)).a 
        + texture2D(buffertex, fragment_pos-vec2(-offset,0)).a 
        + texture2D(buffertex, fragment_pos-vec2(0,offset)).a 
        + texture2D(buffertex, fragment_pos-vec2(0,-offset)).a
    ) / 4.;

    gl_FragColor = vec4(0);

    if(val > .6){
        gl_FragColor = vec4(0, .447, .733, 255);
    }
}