precision highp float;

attribute vec4 vPos;
varying vec3 fragment_pos;

void main() {
  gl_Position = vPos;
  fragment_pos = gl_Position.xyz;
}