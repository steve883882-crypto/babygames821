// api/generate-ideas.js - 最终修正版

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

// 初始化 multer，但不要在这里全局使用 app.use()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// --- 关键修改点 START ---
// 将 multer 中间件 upload.any() 直接放在这个路由处理器中
// 这是处理 multipart/form-data 的最标准方式
app.post('/api/generate-ideas', upload.any(), async (req, res) => {
// --- 关键修改点 END ---
  try {
    const difyApiBaseUrl = process.env.DIFY_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiBaseUrl || !difyApiKey) {
      return res.status(500).json({ error: 'Missing Dify API configuration' });
    }

    // 从 req.files 和 req.body 中获取数据
    // upload.any() 会确保 req.files 和 req.body 在这里是可用的
    const imageFile = req.files && req.files.find(f => f.fieldname === 'image');
    const age = req.body.age;

    if (!imageFile || !age) {
      console.error('Backend validation failed:', { hasImage: !!imageFile, hasAge: !!age });
      return res.status(400).json({ error: 'Image file and age are required' });
    }

    let apiUrl = difyApiBaseUrl.trim().replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
    
    // 步骤 1: 上传文件到 Dify
    const uploadFileUrl = `${apiUrl}/v1/files/upload`;
    const uploadFormData = new FormData();
    uploadFormData.append('file', imageFile.buffer, imageFile.originalname);
    uploadFormData.append('user', 'my-app-user-123');
    
    const uploadResponse = await axios.post(uploadFileUrl, uploadFormData.getBuffer(), {
      headers: { ...uploadFormData.getHeaders(), 'Authorization': `Bearer ${difyApiKey}` },
    });
    const fileId = uploadResponse.data.id;

    // 步骤 2: 执行 Dify 工作流
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