import express from 'express';
import http from 'http';
import cors from 'cors';
import { insertWord, updateWord, deleteWord, getWord } from './database';


const router = express.Router();

router.get('/get_all_word',async  (req, res) => {
  console.log(1);
  try {
      const words = await getWord('SELECT * FROM word ORDER BY word ASC');
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
    const { word, tag, pos, meaning, audio='', is_collected = 0 } = req.body;

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
      Number(is_collected)
    );

    res.status(201).json({ id: lastID, message: '单词已创建' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
export default router;