// WebGL 上下文和着色器程序
let gl;
let shaderProgram;
let geometry;
let defaultVertexShader = '';
let defaultFragmentShader = '';
let autoApplyEnabled = true;  // 默认启用自动应用
let applyDebounceTimer = null;

// CodeMirror 实例
let vertexEditor, fragmentEditor;

// 动画和交互参数
let startTime = Date.now();
let mousePos = { x: 0, y: 0 };
let isAnimationActive = true; 

// 初始化 WebGL
function initWebGL() {
    const canvas = document.getElementById('glCanvas');
    if (!canvas) {
        console.error('找不到 canvas 元素');
        return false;
    }

    // 监听鼠标移动
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        // 将鼠标坐标转换到 0.0 到 1.0 的范围
        mousePos.x = (e.clientX - rect.left) / rect.width;
        mousePos.y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL 坐标系 Y 轴向上
    });

    // 获取 WebGL 上下文，启用调试选项以便 RenderDoc 捕获
    const contextAttributes = {
        alpha: true,      // 启用画布透明通道
        depth: true,      // 启用深度缓冲区（如果需要）
        stencil: false,
        antialias: true,  // 启用抗锯齿
        preserveDrawingBuffer: true,  // 保留绘制缓冲区，方便 RenderDoc 捕获
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
    };
    
    gl = canvas.getContext('webgl', contextAttributes) || 
         canvas.getContext('experimental-webgl', contextAttributes);
    
    if (!gl) {
        alert('您的浏览器不支持 WebGL');
        return false;
    }

    // 输出 WebGL 调试信息（用于 RenderDoc）
    console.log('WebGL 上下文已创建');
    console.log('渲染器:', gl.getParameter(gl.RENDERER));
    console.log('供应商:', gl.getParameter(gl.VENDOR));
    console.log('WebGL 版本:', gl.getParameter(gl.VERSION));
    console.log('着色器语言版本:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

    // 检查调试扩展
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
        console.log('未屏蔽的渲染器:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        console.log('未屏蔽的供应商:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
    }

    // 设置视口
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // 设置清除颜色为黑色（透明度为 1.0）
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // 启用 Alpha 混合（实现透明效果的关键）
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    return true;
}

// 加载着色器源码
async function loadShader(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`无法加载着色器: ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error('加载着色器失败:', error);
        throw error;
    }
}

// 编译着色器
function compileShader(source, type, name) {
    const shader = gl.createShader(type);
    
    // 为 RenderDoc 添加调试标签（如果支持）
    if (gl.getExtension('WEBGL_debug_shaders')) {
        // 某些浏览器可能支持对象标签
        if (shader.label === undefined) {
            try {
                Object.defineProperty(shader, 'label', {
                    value: name,
                    writable: false
                });
            } catch (e) {
                // 忽略标签设置失败
            }
        }
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        console.error(`着色器编译错误 (${name}):\n${error}`);
        return { shader: null, error: error };
    }

    console.log(`着色器编译成功: ${name}`);
    return { shader: shader, error: null };
}

// 创建着色器程序（从源码字符串）
function createShaderProgramFromSource(vertexSource, fragmentSource) {
    // 编译着色器（添加名称以便在 RenderDoc 中识别）
    const vertexResult = compileShader(vertexSource, gl.VERTEX_SHADER, 'VertexShader');
    const fragmentResult = compileShader(fragmentSource, gl.FRAGMENT_SHADER, 'FragmentShader');

    if (vertexResult.error) {
        showError('顶点着色器编译错误:\n' + vertexResult.error);
        return null;
    }

    if (fragmentResult.error) {
        showError('片段着色器编译错误:\n' + fragmentResult.error);
        return null;
    }

    // 删除旧的着色器程序（如果存在）
    if (shaderProgram) {
        gl.deleteProgram(shaderProgram);
    }

    // 创建着色器程序
    shaderProgram = gl.createProgram();
    
    // 为 RenderDoc 添加程序标签
    try {
        if (shaderProgram.label === undefined) {
            Object.defineProperty(shaderProgram, 'label', {
                value: 'MainShaderProgram',
                writable: false
            });
        }
    } catch (e) {
        // 忽略标签设置失败
    }
    
    gl.attachShader(shaderProgram, vertexResult.shader);
    gl.attachShader(shaderProgram, fragmentResult.shader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(shaderProgram);
        console.error(`着色器程序链接错误:\n${error}`);
        showError('着色器程序链接错误:\n' + error);
        gl.deleteProgram(shaderProgram);
        shaderProgram = null;
        return null;
    }

    showError('着色器编译成功！', true);
    return shaderProgram;
}

// 创建着色器程序（从文件加载）
async function createShaderProgram() {
    try {
        // 加载着色器源码
        const vertexShaderSource = await loadShader('shaders/vertex.glsl');
        const fragmentShaderSource = await loadShader('shaders/fragment.glsl');
        
        // 保存默认着色器代码
        defaultVertexShader = vertexShaderSource;
        defaultFragmentShader = fragmentShaderSource;

        return createShaderProgramFromSource(vertexShaderSource, fragmentShaderSource);
    } catch (error) {
        console.error('创建着色器程序失败:', error);
        showError('加载着色器文件失败: ' + error.message);
        return null;
    }
}

// 创建几何体数据
function createGeometry() {
    // 创建一个覆盖全屏的方形（由两个三角形组成）
    // 数据布局: x, y, r, g, b, u, v
    const vertices = new Float32Array([
        // 位置 (x, y)      颜色 (r, g, b)      UV (u, v)
        -1.0, -1.0,         1.0, 0.0, 0.0,      0.0, 0.0,  // 左下
         1.0, -1.0,         0.0, 1.0, 0.0,      1.0, 0.0,  // 右下
        -1.0,  1.0,         0.0, 0.0, 1.0,      0.0, 1.0,  // 左上

        -1.0,  1.0,         0.0, 0.0, 1.0,      0.0, 1.0,  // 左上
         1.0, -1.0,         0.0, 1.0, 0.0,      1.0, 0.0,  // 右下
         1.0,  1.0,         1.0, 1.0, 1.0,      1.0, 1.0,  // 右上
    ]);

    // 创建缓冲区
    const vertexBuffer = gl.createBuffer();
    
    // 为 RenderDoc 添加缓冲区标签
    try {
        if (vertexBuffer.label === undefined) {
            Object.defineProperty(vertexBuffer, 'label', {
                value: 'FullScreenQuadBuffer',
                writable: false
            });
        }
    } catch (e) {
        // 忽略标签设置失败
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    return {
        buffer: vertexBuffer,
        vertexCount: 6,
        stride: 7 * Float32Array.BYTES_PER_ELEMENT, // 7个浮点数
        positionOffset: 0,
        colorOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
        uvOffset: 5 * Float32Array.BYTES_PER_ELEMENT
    };
}

// 设置属性
function setupAttributes(geometry) {
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const colorLocation = gl.getAttribLocation(shaderProgram, 'a_color');
    const uvLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);

    // 设置位置属性
    if (positionLocation !== -1) {
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, geometry.stride, geometry.positionOffset);
    }

    // 设置颜色属性
    if (colorLocation !== -1) {
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, geometry.stride, geometry.colorOffset);
    }

    // 设置 UV 属性
    if (uvLocation !== -1) {
        gl.enableVertexAttribArray(uvLocation);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, geometry.stride, geometry.uvOffset);
    }
}

// 渲染函数
function render(geometry) {
    if (!shaderProgram) return;

    // 清除画布
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用着色器程序
    gl.useProgram(shaderProgram);

    // 设置 Uniforms (时间与鼠标)
    const timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');
    const mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
    const resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');

    if (timeLocation) {
        const elapsedSeconds = (Date.now() - startTime) / 1000.0;
        gl.uniform1f(timeLocation, elapsedSeconds);
    }

    if (mouseLocation) {
        gl.uniform2f(mouseLocation, mousePos.x, mousePos.y);
    }

    if (resolutionLocation) {
        const canvas = gl.canvas;
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }

    // 设置属性
    setupAttributes(geometry);

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);
}

// 显示错误信息
function showError(message, isSuccess = false) {
    const errorDisplay = document.getElementById('errorDisplay');
    if (errorDisplay) {
        errorDisplay.textContent = message;
        errorDisplay.className = 'error-display show' + (isSuccess ? ' success' : '');
        
        // 3秒后自动隐藏成功消息
        if (isSuccess) {
            setTimeout(() => {
                errorDisplay.classList.remove('show');
            }, 2000);
        }
    }
}

// 应用着色器
function applyShaders() {
    if (!vertexEditor || !fragmentEditor) return;

    const vertexSource = vertexEditor.getValue();
    const fragmentSource = fragmentEditor.getValue();

    if (!vertexSource.trim() || !fragmentSource.trim()) {
        showError('着色器代码不能为空');
        return;
    }

    const program = createShaderProgramFromSource(vertexSource, fragmentSource);
    if (program) {
        if (geometry) {
            render(geometry);
        } else {
            showError('几何体未初始化');
        }
    }
}

// 防抖函数：延迟执行应用着色器
function debouncedApplyShaders() {
    // 清除之前的定时器
    if (applyDebounceTimer) {
        clearTimeout(applyDebounceTimer);
    }
    
    // 设置新的定时器，300ms 后执行
    applyDebounceTimer = setTimeout(() => {
        applyShaders();
        applyDebounceTimer = null;
    }, 300);
}

// 处理编辑器内容变化
function handleShaderEditorChange() {
    if (autoApplyEnabled) {
        debouncedApplyShaders();
    }
}

// 移除不再需要的行号和滚动同步函数
// updateLineNumbers, syncScroll 函数已不再需要

// 简单的 GLSL 格式化函数
function formatGLSL(code) {
    let formatted = '';
    let indent = 0;
    const lines = code.split('\n');
    
    for (let line of lines) {
        let trimmed = line.trim();
        if (trimmed.length === 0) {
            formatted += '\n';
            continue;
        }

        // 处理闭括号
        if (trimmed.startsWith('}') || trimmed.includes('}')) {
            indent = Math.max(0, indent - 1);
        }

        formatted += '    '.repeat(indent) + trimmed + '\n';

        // 处理开括号
        if (trimmed.endsWith('{') || trimmed.includes('{')) {
            indent++;
        }
    }
    return formatted.trim();
}

// GLSL 关键字和内置函数，用于代码补全
const glslKeywords = [
    "attribute", "bool", "break", "continue", "discard", "do", "else", "float", "for", "highp", "if", "in", "inout", "int", "invariant", "lowp", "mat2", "mat3", "mat4", "mediump", "out", "precision", "return", "struct", "uniform", "varying", "vec2", "vec3", "vec4", "void", "while",
    "gl_FragColor", "gl_Position", "gl_FragCoord", "gl_PointCoord", "gl_PointSize",
    "abs", "acos", "all", "any", "asin", "atan", "ceil", "clamp", "cos", "cross", "degrees", "distance", "dot", "exp", "exp2", "faceforward", "floor", "fract", "inversesqrt", "length", "log", "log2", "max", "min", "mix", "mod", "normalize", "not", "pow", "radians", "reflect", "refract", "sign", "sin", "sqrt", "step", "smoothstep", "tan", "texture2D", "textureCube"
];

// 注册 GLSL 提示辅助函数
CodeMirror.registerHelper("hint", "glsl", function(editor, options) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const start = cursor.ch;
    let end = start;
    
    // 找到当前输入的单词范围
    let wordStart = start;
    while (wordStart > 0 && /[\w_]/.test(line.charAt(wordStart - 1))) wordStart--;
    const curWord = line.slice(wordStart, end);
    
    if (curWord.length === 0) return null;

    // 过滤匹配的关键字
    const list = glslKeywords.filter(word => word.startsWith(curWord));
    
    if (list.length === 0) return null;

    return {
        list: list,
        from: CodeMirror.Pos(cursor.line, wordStart),
        to: CodeMirror.Pos(cursor.line, end)
    };
});

// 加载默认着色器到编辑器
function loadDefaultShaders() {
    if (vertexEditor && defaultVertexShader) {
        vertexEditor.setValue(defaultVertexShader);
    }
    
    if (fragmentEditor && defaultFragmentShader) {
        fragmentEditor.setValue(defaultFragmentShader);
    }
}

// 主函数
async function main() {
    // 初始化 WebGL
    if (!initWebGL()) {
        return;
    }

    // 创建着色器程序
    const program = await createShaderProgram();
    if (!program) {
        return;
    }

    // 初始化几何体
    geometry = createGeometry();

    // 初始化 CodeMirror
    const cmOptions = {
        mode: "x-shader/x-fragment",
        theme: "monokai",
        lineNumbers: true,
        tabSize: 4,
        indentUnit: 4,
        matchBrackets: true,
        lineWrapping: false,
        hintOptions: {
            hint: CodeMirror.helpers.hint.glsl,
            completeSingle: false // 不要自动完成唯一的选项，方便输入
        },
        extraKeys: {
            "Ctrl-Enter": applyShaders,
            "Cmd-Enter": applyShaders,
            "Ctrl-Space": "autocomplete", // 手动触发补全
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection("    ", "end");
                }
            }
        }
    };

    vertexEditor = CodeMirror.fromTextArea(document.getElementById('vertexShaderEditor'), {
        ...cmOptions,
        mode: "x-shader/x-vertex"
    });
    
    fragmentEditor = CodeMirror.fromTextArea(document.getElementById('fragmentShaderEditor'), cmOptions);

    // 自动补全逻辑：输入字符时触发
    const autocompleteOnInput = (cm, change) => {
        if (change.origin === "+input" && change.text[0].length > 0 && /[\w_]/.test(change.text[0])) {
            cm.showHint({ completeSingle: false });
        }
    };

    vertexEditor.on('inputRead', autocompleteOnInput);
    fragmentEditor.on('inputRead', autocompleteOnInput);

    // 监听变化
    vertexEditor.on('change', handleShaderEditorChange);
    fragmentEditor.on('change', handleShaderEditorChange);

    // 加载默认着色器到编辑器
    loadDefaultShaders();

    // 渲染
    render(geometry);

    // 应用按钮
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyShaders);
    }

    // 加载默认按钮
    const loadVertexBtn = document.getElementById('loadVertexBtn');
    if (loadVertexBtn) {
        loadVertexBtn.addEventListener('click', () => {
            if (vertexEditor && defaultVertexShader) {
                vertexEditor.setValue(defaultVertexShader);
            }
        });
    }

    const loadFragmentBtn = document.getElementById('loadFragmentBtn');
    if (loadFragmentBtn) {
        loadFragmentBtn.addEventListener('click', () => {
            if (fragmentEditor && defaultFragmentShader) {
                fragmentEditor.setValue(defaultFragmentShader);
            }
        });
    }

    // 重置按钮
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            console.log('重新渲染场景');
            loadDefaultShaders();
            if (applyDebounceTimer) {
                clearTimeout(applyDebounceTimer);
                applyDebounceTimer = null;
            }
            applyShaders();
        });
    }

    // 美化按钮
    const beautifyVertexBtn = document.getElementById('beautifyVertexBtn');
    if (beautifyVertexBtn && vertexEditor) {
        beautifyVertexBtn.addEventListener('click', () => {
            const cursor = vertexEditor.getCursor();
            vertexEditor.setValue(formatGLSL(vertexEditor.getValue()));
            vertexEditor.setCursor(cursor);
        });
    }

    const beautifyFragmentBtn = document.getElementById('beautifyFragmentBtn');
    if (beautifyFragmentBtn && fragmentEditor) {
        beautifyFragmentBtn.addEventListener('click', () => {
            const cursor = fragmentEditor.getCursor();
            fragmentEditor.setValue(formatGLSL(fragmentEditor.getValue()));
            fragmentEditor.setCursor(cursor);
        });
    }

    // 标签页切换功能
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // 移除所有活动状态
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // 激活当前标签
            btn.classList.add('active');
            const targetPane = document.getElementById(targetTab + '-tab');
            if (targetPane) {
                targetPane.classList.add('active');
                // 切换标签后需要刷新 CodeMirror 实例，否则可能显示不全
                if (targetTab === 'vertex') vertexEditor.refresh();
                else fragmentEditor.refresh();
            }
        });
    });

    // 自动应用开关
    const autoApplyCheckbox = document.getElementById('autoApplyCheckbox');
    if (autoApplyCheckbox) {
        autoApplyCheckbox.checked = autoApplyEnabled;
        autoApplyCheckbox.addEventListener('change', (e) => {
            autoApplyEnabled = e.target.checked;
            if (autoApplyEnabled) {
                // 如果重新启用自动应用，立即应用当前代码
                applyShaders();
            }
        });
    }

    // 启动动画循环
    function animate() {
        if (isAnimationActive && geometry) {
            render(geometry);
        }
        requestAnimationFrame(animate);
    }
    animate();
    
    // 导出全局变量，方便在控制台调试
    window.webglDebug = {
        gl: gl,
        program: shaderProgram,
        geometry: geometry,
        render: () => render(geometry),
        applyShaders: applyShaders,
        setAutoApply: (enabled) => {
            autoApplyEnabled = enabled;
            if (autoApplyCheckbox) {
                autoApplyCheckbox.checked = enabled;
            }
        },
        getAutoApply: () => autoApplyEnabled,
        setAnimation: (active) => isAnimationActive = active,
        mousePos: mousePos
    };
    
    console.log('WebGL 调试工具已加载到 window.webglDebug');
    console.log('使用 window.webglDebug.applyShaders() 来应用着色器');
    console.log('使用 window.webglDebug.setAutoApply(true/false) 来切换自动应用');
}

// 页面加载完成后启动
window.addEventListener('load', main);

