const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth * 0.85;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
gl.clear(gl.COLOR_BUFFER_BIT);

const programInfo = initShaderProgram(gl, vertexShaderSrc, fragmentShaderSrc);
if (!programInfo) {
    console.error('Failed to initialize shaders');
    throw new Error('Shader initialization failed');
}
gl.useProgram(programInfo.program);

const positionBuffer = gl.createBuffer();
gl.enableVertexAttribArray(programInfo.attributes.position);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(
    programInfo.attributes.position,
    2, gl.FLOAT, false, 0, 0
);

let points = [];
let shapes = [];
let currentShapeId = 0;
let cursorHidden = false;
let cursorDisabled = false;

const calculateCentroid = (points) => {
    let sumX = 0, sumY = 0, count = points.length / 2;
    for (let i = 0; i < points.length; i += 2) {
        sumX += points[i];
        sumY += points[i + 1];
    }
    return [sumX / count, sumY / count];
};

const drawShapes = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shapes.forEach((shape) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);

        const cosR = Math.cos((shape.rotation * Math.PI) / 180);
        const sinR = Math.sin((shape.rotation * Math.PI) / 180);
        const [tx, ty] = shape.translation;
        const [cx, cy] = shape.centroid;
        const scale = shape.scale;

        const transformMatrix = new Float32Array([
            scale * cosR, -scale * sinR, 0,
            scale * sinR, scale * cosR, 0,
            cx * (1 - scale * cosR) - cy * scale * sinR + tx,
            cy * (1 - scale * cosR) + cx * scale * sinR + ty,
            1,
        ]);

        gl.uniformMatrix3fv(programInfo.uniforms.transform, false, transformMatrix);
        gl.uniform4fv(programInfo.uniforms.color, shape.color);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, shape.points.length / 2);
    });
};

const updateUI = () => {
    const shapeSelect = document.getElementById("shapeId");
    shapeSelect.innerHTML = "";
    shapes.forEach((shape) => {
        const option = document.createElement("option");
        option.value = shape.id;
        option.textContent = `Shape ${shape.id}`;
        shapeSelect.appendChild(option);
    });
};


const bringShapeToFront = (shapeId) => {
    const index = shapes.findIndex((shape) => shape.id == shapeId);
    if (index !== -1) {
        const shape = shapes.splice(index, 1)[0];
        shapes.push(shape);
        drawShapes();
    }
};

const bringShapeToBack = (shapeId) => {
    const index = shapes.findIndex((shape) => shape.id == shapeId);
    if (index !== -1) {
        const shape = shapes.splice(index, 1)[0];
        shapes.unshift(shape);
        drawShapes();
    }
};

const clearCanvas = () => {
    shapes = [];
    points = [];
    currentShapeId = 0;
    gl.clear(gl.COLOR_BUFFER_BIT);
    updateUI();
};

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    if (event.button === 0) {
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        points.push(x, y);
    } else if (event.button === 2 && points.length >= 6) {
        const centroid = calculateCentroid(points);
        shapes.push({
            id: currentShapeId++,
            points: [...points],
            color: [1, 0, 0, 1],
            translation: [0, 0],
            rotation: 0,
            scale: 1,
            centroid,
        });
        points = [];
        updateUI();
        drawShapes();
    }
});

const shapeIdSelect = document.getElementById("shapeId");
const translateXSlider = document.getElementById("translateXSlider");
const translateYSlider = document.getElementById("translateYSlider");
const rotateSlider = document.getElementById("rotateSlider");
const scaleSlider = document.getElementById("scaleSlider");
const shapeColorPicker = document.getElementById("shapeColor");
const toggleCursorBtn = document.getElementById("toggleCursorBtn");
const disableCursorBtn = document.getElementById("disableCursorBtn");
const bringToFrontBtn = document.getElementById("bringToFrontBtn");
const bringToBackBtn = document.getElementById("bringToBackBtn");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");

document.addEventListener("contextmenu", (event) => event.preventDefault());

translateXSlider.addEventListener("input", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) {
        shape.translation[0] = parseFloat(translateXSlider.value);
        drawShapes();
    }
});

translateYSlider.addEventListener("input", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) {
        shape.translation[1] = parseFloat(translateYSlider.value);
        drawShapes();
    }
});

rotateSlider.addEventListener("input", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) {
        shape.rotation = parseFloat(rotateSlider.value);
        drawShapes();
    }
});

scaleSlider.addEventListener("input", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) {
        shape.scale = parseFloat(scaleSlider.value);
        drawShapes();
    }
});

shapeColorPicker.addEventListener("input", (event) => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) {
        const hex = event.target.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        shape.color = [r, g, b, 1];
        drawShapes();
    }
});

bringToFrontBtn.addEventListener("click", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) bringShapeToFront(shape.id);
});

bringToBackBtn.addEventListener("click", () => {
    const shape = shapes.find((s) => s.id == shapeIdSelect.value);
    if (shape) bringShapeToBack(shape.id);
});

clearCanvasBtn.addEventListener("click", clearCanvas);

toggleCursorBtn.addEventListener("click", () => {
    cursorHidden = !cursorHidden;
    canvas.style.cursor = cursorHidden ? "none" : "default";
    toggleCursorBtn.textContent = cursorHidden ? "Show Cursor" : "Hide Cursor";
});

disableCursorBtn.addEventListener("click", () => {
    cursorDisabled = !cursorDisabled;
    if (cursorDisabled) {
        canvas.style.pointerEvents = "none";
        disableCursorBtn.textContent = "Enable Cursor";
    } else {
        canvas.style.pointerEvents = "auto";
        disableCursorBtn.textContent = "Disable Cursor";
    }
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.85;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawShapes();
});