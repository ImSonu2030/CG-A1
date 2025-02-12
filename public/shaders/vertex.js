const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform mat3 u_transform;
  void main() {
    vec3 transformed = u_transform * vec3(a_position, 1.0);
    gl_Position = vec4(transformed.xy, 0.0, 1.0);
  }
`;
