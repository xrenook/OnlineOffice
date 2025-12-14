# Next

# Online Office - Multiplayer Pixel Game

一个基于 React、PixiJS 和 Firebase 的实时多人像素风格办公室模拟游戏。

[English](#english) | [中文](#中文)

---

## 中文

### 📋 功能特性

- 🔐 **Google 账号登录** - 使用 Firebase Authentication
- 👥 **实时多人在线** - 最多 15 人同时在线
- 🎮 **自动行走系统** - NPC 自动在办公室中移动
- 💬 **智能对话系统** - NPC 之间会自动对话
- 🎨 **状态系统** - Available/Busy/Away 三种状态
- 🖱️ **拖放功能** - 可以拖动自己的角色
- 🤖 **AI 机器人填充** - 空位自动由机器人填充

### 🚀 快速开始

#### 前置要求

- Node.js 18+
- Firebase 项目（需要启用 Authentication 和 Realtime Database）

#### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/your-username/online-office.git
cd online-office
```

2. **安装依赖**

```bash
npm install
```

3. **配置 Firebase**

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑`.env`文件，填入你的 Firebase 配置：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

4. **设置 Firebase**

在 Firebase Console 中：

- 启用 Google Authentication
- 创建 Realtime Database
- 部署安全规则：

```bash
firebase deploy --only database
```

5. **运行开发服务器**

```bash
npm run dev
```

6. **构建生产版本**

```bash
npm run build
```

### 📁 项目结构

```
seats2/
├── public/              # 静态资源（地图、角色图片）
├── src/
│   ├── components/      # React组件
│   │   ├── OfficeGame.tsx      # 主游戏组件
│   │   ├── OfficeGame.css      # 游戏样式
│   │   ├── LoginScreen.tsx     # 登录界面
│   │   └── LoginScreen.css     # 登录样式
│   ├── game/           # 游戏逻辑
│   │   ├── NPC.ts             # NPC创建和行为
│   │   ├── constants.ts       # 游戏常量
│   │   └── MapLogic.ts        # 地图逻辑
│   ├── hooks/          # React Hooks
│   │   └── useGameSync.ts     # Firebase同步Hook
│   ├── firebase.ts     # Firebase配置
│   ├── App.tsx         # 根组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── .env.example        # 环境变量示例
├── database.rules.json # Firebase安全规则
└── README.md          # 项目文档
```

### 🎮 游戏玩法

1. **登录** - 使用 Google 账号登录
2. **设置角色** - 选择名字（最多 8 个字符）、性别和状态
3. **进入办公室** - 你的角色会出现在地图上
4. **自动移动** - 角色会自动在办公室中行走
5. **拖放** - 点击并拖动你的角色到指定位置
6. **观察对话** - NPC 之间会自动对话
7. **多人互动** - 看到其他在线用户的角色

### 🔒 安全性

- ✅ Firebase 安全规则已配置
- ✅ 用户只能修改自己的数据
- ✅ API 密钥通过环境变量管理
- ✅ 敏感文件已添加到.gitignore

### 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **游戏引擎**: PixiJS 8
- **后端服务**: Firebase (Auth + Realtime Database)
- **构建工具**: Vite
- **动画**: Framer Motion
- **图标**: Lucide React

### 📝 开发说明

#### 对话系统

- 检查间隔：5 秒
- 每个 NPC 冷却时间：30 秒
- 最多同时 2 组对话

#### 位置同步

- 只同步当前用户的位置
- 其他用户的 NPC 本地自动移动
- 减少网络流量和延迟

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

MIT License

---

## English

### 📋 Features

- 🔐 **Google Sign-In** - Using Firebase Authentication
- 👥 **Real-time Multiplayer** - Up to 15 players online simultaneously
- 🎮 **Auto-walk System** - NPCs automatically move around the office
- 💬 **Smart Chat System** - NPCs chat with each other automatically
- 🎨 **Status System** - Available/Busy/Away states
- 🖱️ **Drag & Drop** - Drag your own character
- 🤖 **AI Bot Filling** - Empty slots filled by bots

### 🚀 Quick Start

#### Prerequisites

- Node.js 18+
- Firebase project (with Authentication and Realtime Database enabled)

#### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/online-office.git
cd online-office
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

4. **Setup Firebase**

In Firebase Console:

- Enable Google Authentication
- Create Realtime Database
- Deploy security rules:

```bash
firebase deploy --only database
```

5. **Run development server**

```bash
npm run dev
```

6. **Build for production**

```bash
npm run build
```

### 🎮 How to Play

1. **Login** - Sign in with your Google account
2. **Setup Profile** - Choose name (max 8 chars), gender, and status
3. **Enter Office** - Your character appears on the map
4. **Auto Movement** - Character walks around automatically
5. **Drag & Drop** - Click and drag your character to a position
6. **Watch Chats** - NPCs chat with each other
7. **Multiplayer** - See other online users' characters

### 🔒 Security

- ✅ Firebase security rules configured
- ✅ Users can only modify their own data
- ✅ API keys managed via environment variables
- ✅ Sensitive files added to .gitignore

### 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Game Engine**: PixiJS 8
- **Backend**: Firebase (Auth + Realtime Database)
- **Build Tool**: Vite
- **Animation**: Framer Motion
- **Icons**: Lucide React

### 📝 Development Notes

#### Chat System

- Check interval: 5 seconds
- Per-NPC cooldown: 30 seconds
- Max 2 conversations simultaneously

#### Position Sync

- Only sync current user's position
- Other users' NPCs move locally
- Reduces network traffic and latency

### 🤝 Contributing

Issues and Pull Requests are welcome!

### 📄 License

MIT License
