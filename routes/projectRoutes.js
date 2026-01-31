// server/routes/projectRoutes.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 注意：我们需要向上跳两级目录才能找到 data (routes -> server -> data)
const dataPath = path.join(__dirname, '../data/projects.json');

// GET /api/projects - 获取所有项目
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    const projects = JSON.parse(data);
    
    // 支持简单的筛选（可选功能）
    const category = req.query.category;
    if (category && category !== 'All') {
      const filtered = projects.filter(p => p.category === category);
      return res.json(filtered);
    }
    
    res.json(projects);
  } catch (error) {
    console.error('读取项目数据失败:', error);
    res.status(500).json({ message: '无法获取项目列表' });
  }
});

// GET /api/projects/:id - 获取单个项目详情
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    const projects = JSON.parse(data);
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: '项目未找到' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;