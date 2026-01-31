// server/routes/projectRoutes.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 注意：我们需要向上跳两级目录才能找到 data (routes -> server -> data)
const dataPath = path.join(__dirname, '../data/projects.json');

// GET /api/projects?page=1&limit=6
// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    let projects = JSON.parse(data);

    // 1. 处理筛选 (如果 URL 有 category 参数)
    // 放在分页之前，确保是针对筛选后的结果进行分页
    const category = req.query.category;
    if (category && category !== 'All') {
      projects = projects.filter(p => p.category === category);
    }

    // 2. 处理分页核心逻辑
    const page = parseInt(req.query.page) || 1;  // 默认为第 1 页
    const limit = parseInt(req.query.limit) || 6; // 默认每页 6 个 (符合网格布局)
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedResults = projects.slice(startIndex, endIndex);

    // ============================================================
    // 核心修改：数据清洗 (Data Cleaning)
    // 只提取列表页真正需要的字段，大幅减少网络传输体积
    // ============================================================
    const simplifiedData = paginatedResults.map(p => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,     // 副标题通常在卡片显示
      location: p.location,     // 地点
      year: p.year,             // 年份
      category: p.category,     // 分类
      coverImage: p.coverImage || p.image, // 只需要封面图
      // tags: p.tags,          // (可选) 如果你的网格显示标签，可以保留
    }));

    // 3. 返回更丰富的数据结构（包含分页元数据）
    res.json({
      data: simplifiedData,
      meta: {
        total: projects.length,
        currentPage: page,
        totalPages: Math.ceil(projects.length / limit),
        hasMore: endIndex < projects.length
      }
    });

  } catch (error) {
    console.error('读取项目数据失败:', error);
    res.status(500).json({ message: '无法获取项目列表' });
  }
});

// GET /api/projects/:id - 获取单个项目详情（含下一个项目信息）
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    const projects = JSON.parse(data);
    const id = parseInt(req.params.id);
    
    const currentIndex = projects.findIndex(p => p.id === id);
    
    if (currentIndex === -1) {
      return res.status(404).json({ message: '项目未找到' });
    }
    
    const currentProject = projects[currentIndex];
    const total = projects.length;

    // === 核心逻辑 1：计算“下一篇” (Next) ===
    // (currentIndex + 1) % total 实现从最后跳回开头
    const nextIndex = (currentIndex + 1) % total;
    const nextProject = {
      id: projects[nextIndex].id,
      title: projects[nextIndex].title,
      slug: projects[nextIndex].slug // 可选：带上图片以便前端做更丰富的预览
    };

    // === 核心逻辑 2：计算“上一篇” (Prev) ===
    // (currentIndex - 1 + total) % total 实现从开头跳回最后
    const prevIndex = (currentIndex - 1 + total) % total;
    const prevProject = {
      id: projects[prevIndex].id,
      title: projects[prevIndex].title,
      slug: projects[prevIndex].slug
    };

    // 返回当前项目，并附带 nextProject 信息
    res.json({ ...currentProject, nextProject, prevProject });
    
  } catch (error) {
    console.error('获取详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;