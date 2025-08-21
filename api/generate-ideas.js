// api/generate-ideas.js

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });
const app = express();
let port = 3001;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: 'http://localhost:5174', credentials: true }));

// =================================================================
// ▼▼▼ 请在这里添加第一处后端日志 (请求头检查) ▼▼▼
// =================================================================
app.use('/api/generate-ideas', (req, res, next) => {
    console.log('\n--- 收到请求 /api/generate-ideas ---');
    console.log('请求时间:', new Date().toISOString());
    console.log('请求头 (Content-Type):', req.headers['content-type']);
    console.log('---------------------------------');
    next();
});
// =================================================================
// ▲▲▲ 日志代码结束 ▲▲▲
// =================================================================

app.post('/api/generate-ideas', upload.single('image'), async (req, res) => {
  // =================================================================
  // ▼▼▼ 请在这里添加第二处后端日志 (Multer解析后检查) ▼▼▼
  // =================================================================
  console.log('\n--- Multer 中间件已执行 ---');
  console.log('req.file (图片文件):', req.file ? `存在, 文件名: ${req.file.originalname}` : '不存在');
  console.log('req.body (文本字段):', req.body);
  console.log('---------------------------');
  // =================================================================
  // ▲▲▲ 日志代码结束 ▲▲▲
  // =================================================================

  try {
    const difyApiBaseUrl = process.env.DIFY_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiBaseUrl || !difyApiKey) {
      return res.status(500).json({ error: 'Missing Dify API configuration' });
    }

    const imageFile = req.file;
    const age = req.body.age;

    if (!imageFile || !age) {
      console.error('Backend validation failed:', { hasImage: !!imageFile, hasAge: !!age });
      return res.status(400).json({ error: 'Image file and age are required' });
    }

    let apiUrl = difyApiBaseUrl.trim().replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
    
    const uploadFileUrl = `${apiUrl}/v1/files/upload`;
    const uploadFormData = new FormData();
    uploadFormData.append('user', 'my-app-user-123');
    uploadFormData.append('file', imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype,
    });
    
    const uploadResponse = await axios.post(uploadFileUrl, uploadFormData, {
      headers: { ...uploadFormData.getHeaders(), 'Authorization': `Bearer ${difyApiKey}` },
    });
    const fileId = uploadResponse.data.id;

    const workflowUrl = `${apiUrl}/v1/workflows/run`;
    const workflowPayload = {
      inputs: {
        age: age,
        toyimage: [{ type: "image", transfer_method: "local_file", upload_file_id: fileId }]
      },
      response_mode: "blocking",
      user: 'my-app-user-123'
    };
    
    const difyResponse = await axios.post(workflowUrl, workflowPayload, {
      headers: { 'Authorization': `Bearer ${difyApiKey}`, 'Content-Type': 'application/json' },
    });

    const result = difyResponse.data.data?.outputs?.result;
    if (!result) throw new Error('Unexpected response format from Dify API');
    
    const activities = typeof result === 'string' ? JSON.parse(result) : result;
    if (!Array.isArray(activities)) throw new Error('Dify API did not return an array of activities');

    const processedActivities = activities.map(activity => ({ ...activity, isFavorited: false }));
    return res.status(200).json({ activities: processedActivities });

  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Error in generate-ideas API:', errorDetails);
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ error: 'Failed to generate activities', details: errorDetails });
  }
});

// ... (服务器启动代码保持不变) ...
const server = createServer(app);
server.listen(port, () => console.log(`API server running at http://localhost:${port}`))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another one...`);
      port++;
      setTimeout(() => server.listen(port), 100);
    } else {
      console.error(err);
    }
});