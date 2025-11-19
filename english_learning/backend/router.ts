import express from 'express';
import http from 'http';
import cors from 'cors';
import {
  insertWord,
  updateCollectByWord,
  deleteWord,
  getWord,
  updateReviewByWord,
  /* 进度相关 ↓ */
  getProgress,
  resetProgress,
  setLearningCount,
  updatePointer
} from './database';   // 这里是**服务端**数据库函数，只给 API 用


const router = express.Router();

router.get('/get_all_word',async  (req, res) => {
  console.log(1);
  try {
      const words = await getWord('SELECT * FROM word ORDER BY LOWER(word) ASC');
      res.json(words)
  }catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }

});
router.get('/get_all_tag',async  (req, res) => {
  console.log(1);
  try {
      const words = await getWord('SELECT DISTINCT tag FROM word ORDER BY tag');
      res.json(words)
  }catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }

});
router.post('/insert_new_word',async (req, res) => {
   try {
    const { word, tag, pos, meaning, audio='', is_collected = 0 ,review} = req.body;

    /* 简单校验 */
    if (!word || !tag || !pos || !meaning) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if ((await getWord(`SELECT * FROM word WHERE lower(word) = lower('${word}')`)).length>0) {
      
      return res.status(400).json({ error: '已经有了单词' });
    }
    const lastID = await insertWord(
      word,
      tag,
      pos,
      meaning,
      audio,
      Number(is_collected),
      review
    );

    res.status(201).json({ id: lastID, message: '单词已创建' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
// router.ts
router.post('/collects', async (req, res) => {
  try {
    const { word, is_collected } = req.body;

    /* 简单校验 */
    if (word === undefined || is_collected === undefined) {
      return res.status(400).json({ error: '缺少参数 word 或 is_collected' });
    }

    const changes = await updateCollectByWord(word, is_collected);
    res.json({ changes, message: '收藏状态已更新' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
router.post('/review', async (req, res) => {
  try {
    const { word, review } = req.body;

    /* 简单校验 */
    if (word === undefined || review === undefined) {
      return res.status(400).json({ error: '缺少参数 word 或 is_collected' });
    }

    const changes = await updateReviewByWord(word, review);
    res.json({ changes, message: '收藏状态已更新' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
/* ========== 新增【进度】接口 ========== */

// GET /api/progress  获取当前指针 & 总题数
router.get('/progress', async (_, res) => {
  try {
    const prog = await getProgress();
    res.json(prog);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// PUT /api/progress/reset  重置指针与计数
router.put('/progress/reset', async (_, res) => {
  try {
    await resetProgress();
    res.json({ message: '进度已重置' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// PUT /api/progress/count  设置本次总题数
router.put('/progress/count', async (req, res) => {
  try {
    const { total } = req.body;
    if (typeof total !== 'number' || total <= 0)
      return res.status(400).json({ error: 'total 必须是正整数' });
    await setLearningCount(total);
    res.json({ message: '总题数已更新' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// PATCH /api/progress/pointer  指针 +delta（默认 +1）
router.patch('/progress/pointer', async (req, res) => {
  try {
    const delta = typeof req.body.delta === 'number' ? req.body.delta : 1;
    await updatePointer(delta);
    res.json({ message: '指针已更新' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;