# Time to Play! - 宝宝AI游戏伙伴

一个专为0-3岁宝宝家长设计的移动端H5应用，通过AI识别玩具并生成个性化游戏方案。

## 功能特点

- 🎯 **年龄定制**: 根据0-36个月不同发展阶段推荐游戏
- 📸 **智能识别**: 集成Gemini Vision API自动识别玩具
- 🎮 **游戏生成**: AI生成适龄的互动游戏方案
- 📱 **移动优化**: 专为手机设计的响应式界面
- ❤️ **收藏分享**: 支持收藏喜爱的游戏方案
- 🔒 **安全第一**: 每个游戏都包含详细安全提示

## 技术架构

- **前端框架**: React 18 + TypeScript
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React
- **AI服务**: Google Gemini Vision API
- **构建工具**: Vite

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

在 `.env.local` 中添加您的 Gemini API Key:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 获取 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账户
3. 创建新的 API Key
4. 将 API Key 添加到 `.env.local` 文件

### 4. 启动开发服务器

```bash
npm run dev
```

## API 集成说明

### Gemini Vision API 集成

应用使用 Google Gemini Vision API 进行图像识别和内容生成:

```typescript
// 基本API调用示例
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{
      parts: [
        { text: prompt },
        { 
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64
          }
        }
      ]
    }]
  })
});
```

### 生产环境部署注意事项

1. **API Key 安全**: 
   - 在生产环境中，建议将 API 调用放在后端服务中
   - 使用环境变量管理敏感信息
   - 实现 API 调用频率限制

2. **图像处理优化**:
   - 压缩图像以减少传输时间
   - 实现图像缓存机制
   - 添加图像格式验证

3. **用户体验优化**:
   - 添加离线功能支持
   - 实现错误重试机制
   - 优化加载状态展示

## 项目结构

```
src/
├── components/         # React 组件
│   ├── AgeSelector.tsx    # 年龄选择器
│   ├── ImageUpload.tsx    # 图片上传
│   ├── LoadingScreen.tsx  # 加载页面
│   └── ActivityResult.tsx # 结果展示
├── services/          # API 服务
│   └── geminiService.ts   # Gemini API 集成
├── hooks/             # 自定义 Hooks
│   └── useLocalStorage.ts # 本地存储
├── utils/             # 工具函数
│   └── imageUtils.ts      # 图像处理
├── config/            # 配置文件
│   └── env.ts            # 环境变量
└── App.tsx            # 主应用组件
```

## 浏览器支持

- iOS Safari 12+
- Android Chrome 70+
- 支持 ES2020+ 的现代浏览器

## 许可证

MIT License