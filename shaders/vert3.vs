precision highp float;

attribute vec4 vPos;
varying vec2 fragment_pos;

void main() {
  // since vertex positions are from -1 to 1, and uv coords are from 0 to 1,
  // need to translate and scale accordingly
  gl_Position = vec4(vPos.xy*2. - vec2(1.,1.), 0, 1);
  fragment_pos = vPos.xy;
}