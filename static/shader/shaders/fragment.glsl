// 片段着色器（像素着色器）
// 决定每个像素的颜色

// 精度限定符
precision mediump float;

// 从顶点着色器接收的数据
varying vec3 v_color;
varying vec2 uv;

// 外部传入的 Uniform 变量
uniform float u_time;       // 运行时间（秒）
uniform vec2 u_mouse;      // 鼠标位置 (0.0 到 1.0)
uniform vec2 u_resolution; // 画布分辨率

void main() {
    // 示例 1: 使用时间改变颜色
    float red = abs(sin(u_time));
    
    // 示例 2: 使用鼠标位置改变背景
    float dist = distance(uv, u_mouse);
    float glow = smoothstep(0.2, 0.0, dist);
    
    // 混合效果
    vec3 finalColor = mix(vec3(uv, red), vec3(1.0, 1.0, 0.5), glow);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
