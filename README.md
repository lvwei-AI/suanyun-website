# 算云信息展示平台

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/zh-CN/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)

> 专业 · 高效 · 创新 —— 为您的数字化转型保驾护航

## 项目简介

算云信息展示平台是一个现代化的企业官网，展示**哈尔滨市松北区算云软件开发工作室**的企业信息、服务范围和技术能力。平台采用纯前端技术栈开发，集成了人工智能应用展示功能。

## 企业信息

| 项目 | 内容 |
|------|------|
| 企业名称 | 哈尔滨市松北区算云软件开发工作室 |
| 统一社会信用代码 | 92230109MAKCUYD46K |
| 类型 | 个体工商户 |
| 注册日期 | 2026年04月21日 |

## 核心功能

### 1. 企业展示
- 企业资质与基本信息展示
- 核心优势介绍
- 联系方式与备案信息

### 2. 服务范围
- **软件开发** - 定制化软件系统、企业管理系统、移动应用开发
- **人工智能应用** - AI技术应用、机器学习模型部署、智能算法
- **网络与信息安全** - 网络安全评估、安全加固、渗透测试

### 3. 智能顾问
基于大语言模型的AI智能顾问系统，提供智能化的咨询服务。

### 4. 实时表情识别系统
基于 TensorFlow.js 和 Face-API 的实时人脸表情识别应用：
- 实时人脸检测与表情分析
- 支持 7 种表情识别（开心、伤心、惊讶、生气、厌恶、恐惧、中性）
- 本地机器学习模型训练与预测
- 摄像头实时视频流处理

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **UI 设计**: 响应式设计，支持深色/浅色主题切换
- **动画效果**: Canvas 粒子背景、CSS 动画、滚动触发动画
- **AI/ML**: TensorFlow.js, Face-API.js
- **字体**: Google Fonts (Noto Sans SC)

## 项目结构

```
.
├── index.html          # 主页面 - 企业展示
├── style.css           # 全局样式
├── script.js           # 主页面交互逻辑
├── ai-advisor.html     # AI智能顾问页面
├── ai-advisor.js       # AI顾问逻辑
├── favicon.svg         # 网站图标
├── emotion/            # 表情识别系统
│   ├── index.html      # 表情识别主页面
│   ├── app.js          # 应用逻辑
│   ├── predict.js      # 模型预测
│   ├── train.html      # 模型训练页面
│   └── train.js        # 训练逻辑
└── README.md           # 项目说明
```

## 主要特性

### 视觉设计
- 现代化渐变色彩方案
- 流畅的页面过渡动画
- 粒子背景效果
- 响应式布局，适配移动端

### 交互体验
- 平滑滚动导航
- 日夜主题切换
- 滚动触发动画
- 悬停交互效果

### AI 功能
- 本地运行的机器学习模型
- 实时视频流处理
- 无需后端服务器的纯前端 AI 应用

## 本地运行

由于项目使用纯前端技术，无需服务器环境即可运行：

```bash
# 直接在浏览器中打开 index.html
# 或使用本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

**注意**: 表情识别功能需要摄像头权限，建议在本地或 HTTPS 环境下使用。

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 作者

**算云软件开发工作室**

专注于软件开发、人工智能应用、网络与信息安全领域，提供全方位的技术解决方案。

---

*本项目用于展示企业技术能力和项目经验*
