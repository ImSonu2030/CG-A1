const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
};

const initShaderProgram = (gl, vsSource, fsSource) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!shaderProgram) {
        return null;
    }

    return {
        program: shaderProgram,
        attributes: {
            position: gl.getAttribLocation(shaderProgram, 'a_position'),
        },
        uniforms: {
            transform: gl.getUniformLocation(shaderProgram, 'u_transform'),
            color: gl.getUniformLocation(shaderProgram, 'u_color'),
        }
    };
};