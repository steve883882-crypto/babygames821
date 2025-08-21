// api/generate-ideas.js - 最终修正版 (手动发送 Buffer)

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios'; // 确认已安装 axios
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

// --- (环境变量和服务器基础配置) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });
const app = express();
let port = 3001;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// --- (以上部分不变) ---

app.post('/api/generate-ideas', upload.single('image'), async (req, res) => {
  try {
    const difyApiBaseUrl = process.env.DIFY_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiBaseUrl || !difyApiKey) {
      return res.status(500).json({ error: 'Missing Dify API configuration' });
    }

    const imageFile = req.file;
    const age = req.body.age;

    if (!imageFile || !age) {
      return res.status(400).json({ error: 'Image file and age are required' });
    }

    let apiUrl = difyApiBaseUrl.trim().replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
    
    // =================================================================
    // 步骤 1: 上传文件 - **改用直接发送 Buffer 的方式**
    // =================================================================
    const uploadFileUrl = `${apiUrl}/v1/files/upload`;

    // 创建一个新的 FormData 实例，仅用于构建请求体，但不直接传递给 axios
    const formData = new FormData();
    formData.append('file', imageFile.buffer, imageFile.originalname);
    formData.append('user', 'my-app-user-123');
    
    console.log('Uploading file to Dify by sending buffer directly...');
    
    // 使用 axios 直接发送 buffer
    const uploadResponse = await axios.post(uploadFileUrl, formData.getBuffer(), {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${difyApiKey}`,
      },
    });

    const fileId = uploadResponse.data.id;
    console.log('Uploaded file to Dify, file_id:', fileId);

    // =================================================================
    // 步骤 2: 执行工作流 (保持不变)
    // =================================================================
    const workflowUrl = `${apiUrl}/v1/workflows/run`;
    const workflowPayload = {
      inputs: {
        age: age,
        toyimage: [{
          type: "image",
          transfer_method: "local_file",
          upload_file_id: fileId
        }]
      },
      response_mode: "blocking",
      user: 'my-app-user-123'
    };

    console.log('Sending JSON request to Dify Workflow API...');
    
    const difyResponse = await axios.post(workflowUrl, workflowPayload, {
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Dify API response received.');

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
    return res.status(status).json({
      error: 'Failed to generate activities',
      details: errorDetails,
    });
  }
});

// ... (服务器启动和错误处理代码保持不变) ...
const server = createServer(app);
server.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying another one...`);
        server.close();
        port += 1;
        setTimeout(() => server.listen(port), 100);
    } else {
        console.error(err);
    }
});