
import router from './router'
import axios from 'axios'
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
//tsx backend.ts
import { insertWord, updateWord, deleteWord, getWord } from './database';

const app = express();
const PORT = 3001;

// 中间件顺序：先 cors，再路由
app.use(cors());
app.use(express.json());
app.use('/word_data', router);

// 启动 HTTP 服务（不是 HTTPS）
app.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
});