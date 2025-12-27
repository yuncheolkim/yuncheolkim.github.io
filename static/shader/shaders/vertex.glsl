// 顶点着色器
// 接收顶点位置、颜色和 UV 属性

// 输入属性
attribute vec2 a_position;  // 顶点位置 (x, y)
attribute vec3 a_color;     // 顶点颜色 (r, g, b)
attribute vec2 a_texCoord;  // 纹理坐标 (u, v)

// 输出到片段着色器
varying vec3 v_color;       // 传递颜色
varying vec2 uv;    // 传递 UV

void main() {
    // 传递数据
    v_color = a_color;
    uv = a_texCoord;
    
    // 设置顶点位置
    gl_Position = vec4(a_position, 0.0, 1.0);
}
