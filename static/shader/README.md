# WebGL GLSL 学习项目

这是一个用于学习 WebGL 和 GLSL 着色器编程的基础项目。

## 项目结构

```
gltest/
├── index.html              # 主 HTML 文件
├── style.css               # 样式文件
├── main.js                 # WebGL 初始化和渲染逻辑（已配置 RenderDoc 支持）
├── shaders/
│   ├── vertex.glsl         # 顶点着色器
│   └── fragment.glsl       # 片段着色器
├── README.md               # 项目说明
└── RENDERDOC_GUIDE.md      # RenderDoc 调试指南
```

## 快速开始

1. 使用本地服务器运行项目（WebGL 需要 HTTP 协议，不能直接打开文件）

   **使用 Python:**
   ```bash
   python -m http.server 8000
   ```

   **使用 Node.js:**
   ```bash
   npx http-server -p 8000
   ```

   **使用 VS Code:**
   安装 "Live Server" 扩展，右键点击 `index.html` 选择 "Open with Live Server"

2. 在浏览器中打开 `http://localhost:8000`

## 学习内容

### 顶点着色器 (vertex.glsl)
- 处理每个顶点的位置和属性
- 将顶点坐标转换到裁剪空间
- 可以传递数据到片段着色器

### 片段着色器 (fragment.glsl)
- 处理每个像素的颜色
- 接收从顶点着色器插值的数据
- 可以实现各种视觉效果

## 修改示例

### 修改颜色
在 `fragment.glsl` 中尝试：
```glsl
gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 纯红色
```

### 添加时间动画
在 `main.js` 中添加 uniform 变量，在着色器中使用时间创建动画效果。

### 修改几何形状
在 `main.js` 的 `createGeometry()` 函数中修改顶点数据，创建不同的形状。

## 参考资料

- [WebGL 基础教程](https://webglfundamentals.org/)
- [GLSL 参考手册](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [MDN WebGL 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API)

## RenderDoc 调试支持

本项目已配置支持 RenderDoc 图形调试器，可以捕获和分析 WebGL 调用。

### 快速开始
1. 安装 [RenderDoc](https://renderdoc.org/)
2. 查看 `RENDERDOC_GUIDE.md` 了解详细使用方法
3. 在 RenderDoc 中启动浏览器并捕获帧

### 主要特性
- ✅ 启用 `preserveDrawingBuffer` 确保内容可被捕获
- ✅ 添加调试标签和对象命名
- ✅ 输出 WebGL 调试信息到控制台
- ✅ 导出 `window.webglDebug` 对象方便调试

### 调试工具
在浏览器控制台中使用：
```javascript
window.webglDebug.render();  // 手动触发渲染
window.webglDebug.gl;         // 访问 WebGL 上下文
window.webglDebug.program;    // 查看着色器程序
```

## 注意事项

- 必须通过 HTTP 服务器运行，不能直接打开 HTML 文件
- 着色器代码中的注释和格式很重要
- WebGL 上下文可能在某些浏览器中需要特殊处理
- 使用 RenderDoc 时建议使用 Chrome 或 Edge 浏览器

