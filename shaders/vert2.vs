precision highp float;

uniform float particle_radius;
uniform mat3 projection;
attribute vec4 vPos;
attribute vec3 vCol;
varying vec2 fragment_pos;
varying vec3 rand;

void main() {
  gl_Position = vec4(projection * vec3(vPos.xy,1),1);
  gl_PointSize = particle_radius;
  fragment_pos = gl_Position.xy;
  rand = vCol;
}