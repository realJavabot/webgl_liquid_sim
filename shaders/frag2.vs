precision highp float;

uniform sampler2D point_sprite;
varying vec3 rand;
varying vec2 fragment_pos;

void main(){
    float col = texture2D(point_sprite, gl_PointCoord).a;
    gl_FragColor = vec4(vec3(col * rand), col*.8);
}