import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import projectRoutes from './routes/projectRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// === 读取环境变量 (Node 22 原生支持) ===
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// === 中间件配置 ===
// 更新 CORS，只允许我们的前端访问，更加安全
app.use(cors({
    origin: CLIENT_URL, 
    methods: ['GET', 'POST']
}));

app.use(express.json());

// === 静态资源托管 ===
// 允许前端直接访问 server/public/uploads 下的图片
// 例如：http://localhost:5000/uploads/my-garden.jpg
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// === 路由挂载 ===
// 1. 项目相关接口 -> /api/projects
app.use('/api/projects', projectRoutes);

// 2. 全局配置接口 (保持在 index.js 中或未来也移出)
app.get('/api/config', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data/siteConfig.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '无法读取配置信息' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    await fs.writeFile(
      path.join(__dirname, 'data/siteConfig.json'), 
      JSON.stringify(newConfig, null, 2)
    );
    res.json({ message: '配置已更新' });
  } catch (error) {
    res.status(500).json({ error: '保存失败' });
  }
});

// === 启动服务 ===
app.listen(PORT, () => {
  console.log(`
  🌿 GreenPoint 后端服务已启动
  - 环境: ${process.env.NODE_ENV}
  - 本地地址: http://localhost:${PORT}
  - 项目接口: http://localhost:${PORT}/api/projects
  - 静态资源: http://localhost:${PORT}/uploads
  `);
});