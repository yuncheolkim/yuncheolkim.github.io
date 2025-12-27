# RenderDoc 调试指南

本指南说明如何使用 RenderDoc 来调试和分析这个 WebGL 项目。

## RenderDoc 简介

RenderDoc 是一个独立的图形调试器，可以捕获和分析 OpenGL、Vulkan、DirectX 等图形 API 的调用。对于 WebGL 应用，RenderDoc 可以通过浏览器进行捕获。

## 安装 RenderDoc

1. 从 [RenderDoc 官网](https://renderdoc.org/) 下载并安装
2. 确保安装的是最新版本（支持 WebGL 捕获）

## 使用 RenderDoc 捕获 WebGL

### 方法 1：通过浏览器启动（推荐）

1. **启动 RenderDoc**
   - 打开 RenderDoc
   - 点击 "Launch Application" 标签

2. **配置启动设置**
   - **Executable Path**: 浏览到你的浏览器可执行文件
     - Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`
     - Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
     - Firefox: `C:\Program Files\Mozilla Firefox\firefox.exe`
   
   - **Command line arguments**: 添加以下参数
     ```
     --enable-webgl --enable-webgl2 --disable-gpu-sandbox --no-sandbox
     ```
   
   - **Working Directory**: 留空或设置为项目目录
   
   - **Capture Executable**: 留空（WebGL 不需要）

3. **启动并捕获**
   - 点击 "Launch" 按钮
   - 浏览器会启动，导航到 `http://localhost:8000`
   - 在 RenderDoc 中点击 "Capture Frame(s) Immediately" 或按 F12
   - 执行一些操作（点击重置按钮等）
   - 再次按 F12 停止捕获

### 方法 2：注入到已运行的浏览器

1. **启动本地服务器**
   ```bash
   python -m http.server 8000
   ```

2. **在浏览器中打开应用**
   - 访问 `http://localhost:8000`

3. **使用 RenderDoc 注入**
   - 打开 RenderDoc
   - 点击 "Inject into Process"
   - 选择你的浏览器进程
   - 按 F12 开始捕获

## 在 RenderDoc 中查看捕获

### 主要视图

1. **Event Browser（事件浏览器）**
   - 左侧显示所有 API 调用
   - 查找 `glClear`, `glUseProgram`, `glDrawArrays` 等调用
   - 点击事件查看详细信息

2. **Pipeline State（管线状态）**
   - 查看当前绑定的着色器程序
   - 查看顶点属性配置
   - 查看缓冲区绑定

3. **Texture Viewer（纹理查看器）**
   - 查看渲染目标
   - 查看纹理内容

4. **Mesh Viewer（网格查看器）**
   - 查看顶点数据
   - 查看索引数据
   - 可视化几何体

### 关键标记点

代码中已添加了注释标记，方便在 RenderDoc 中识别：

- `RenderDoc 标记：开始帧` - 帧开始
- `RenderDoc 标记：设置着色器程序` - 着色器程序绑定
- `RenderDoc 标记：设置顶点属性` - 顶点属性配置
- `RenderDoc 标记：绘制调用` - 绘制命令
- `RenderDoc 标记：帧结束` - 帧结束

### 查看着色器

1. 在 Event Browser 中找到 `glUseProgram` 调用
2. 在 Pipeline State 中查看：
   - **Vertex Shader**: 顶点着色器源码
   - **Fragment Shader**: 片段着色器源码
   - **Uniforms**: uniform 变量值
   - **Attributes**: 顶点属性配置

### 查看顶点数据

1. 找到 `glDrawArrays` 或 `glDrawElements` 调用
2. 在 Mesh Viewer 中：
   - 查看顶点位置
   - 查看顶点颜色
   - 可视化三角形

## 调试技巧

### 1. 检查着色器编译

- 在 RenderDoc 中查看着色器源码
- 确认着色器是否正确编译
- 检查 uniform 和 attribute 绑定

### 2. 检查顶点数据

- 在 Mesh Viewer 中查看顶点位置
- 确认颜色数据是否正确
- 检查顶点属性格式

### 3. 检查渲染状态

- 查看视口设置
- 检查清除颜色
- 确认深度测试、混合等状态

### 4. 使用控制台调试

代码中已导出 `window.webglDebug` 对象，可以在浏览器控制台中使用：

```javascript
// 手动触发渲染
window.webglDebug.render();

// 查看 WebGL 上下文
window.webglDebug.gl;

// 查看着色器程序
window.webglDebug.program;

// 查看几何体数据
window.webglDebug.geometry;
```

## 常见问题

### Q: RenderDoc 无法捕获 WebGL 调用
**A**: 
- 确保使用支持的浏览器（Chrome、Edge、Firefox）
- 检查浏览器启动参数是否正确
- 尝试使用 `--enable-webgl` 参数

### Q: 捕获的帧是空的
**A**:
- 确保在页面加载完成后进行捕获
- 点击重置按钮触发渲染
- 检查 `preserveDrawingBuffer` 是否启用（代码中已启用）

### Q: 看不到着色器源码
**A**:
- 某些浏览器可能不支持着色器源码提取
- 尝试使用不同的浏览器
- 检查 RenderDoc 版本是否最新

## 项目配置说明

代码中已进行以下配置以支持 RenderDoc：

1. **启用 preserveDrawingBuffer**
   ```javascript
   preserveDrawingBuffer: true
   ```
   保留绘制缓冲区，确保 RenderDoc 可以捕获到内容

2. **添加调试标签**
   - 着色器、程序、缓冲区都有命名标签
   - 方便在 RenderDoc 中识别

3. **输出调试信息**
   - 控制台输出 WebGL 版本信息
   - 输出渲染器信息

4. **添加注释标记**
   - 关键操作点都有注释
   - 方便在 RenderDoc 事件列表中定位

## 参考资料

- [RenderDoc 官方文档](https://renderdoc.org/docs/index.html)
- [WebGL 调试技巧](https://webglfundamentals.org/webgl/lessons/webgl-debugging.html)
- [Chrome WebGL 调试](https://developer.chrome.com/docs/devtools/)

