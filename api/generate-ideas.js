// api/generate-ideas.js - 终极修正版 (添加 express.json())

import express from 'express';
import cors from 'cors';
// multer 不再需要
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

// --- 关键修改点 START ---
// 1. 启用 CORS
app.use(cors({ origin: 'http://localhost:5174', credentials: true }));

// 2. 添加 express.json() 中间件来解析 application/json 请求体
//    这是后端无法获取 age 和 image 数据的根本原因
//    增加 limit 以支持较大的 base64 图片字符串
app.use(express.json({ limit: '10mb' }));
// --- 关键修改点 END ---


app.post('/api/generate-ideas', async (req, res) => {
  try {
    const difyApiBaseUrl = process.env.DIFY_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiBaseUrl || !difyApiKey) {
      return res.status(500).json({ error: 'Missing Dify API configuration' });
    }

    // 现在 req.body 应该能被正确解析
    const { age, image: imageBase64, imageName, imageType } = req.body;

    if (!age || !imageBase64 || !imageName || !imageType) {
      console.error('Backend validation failed. Received body:', req.body);
      return res.status(400).json({ error: 'Age and image data are required' });
    }
    
    // 将 Base64 字符串解码为 Buffer
    const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');

    let apiUrl = difyApiBaseUrl.trim().replace(/\/$/, '');
    if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
    
    // 步骤 1: 上传文件到 Dify
    const uploadFileUrl = `${apiUrl}/v1/files/upload`;
    const uploadFormData = new FormData();
    uploadFormData.append('user', 'my-app-user-123');
    uploadFormData.append('file', buffer, {
      filename: imageName,
      contentType: imageType,
    });
    
    const uploadResponse = await axios.post(uploadFileUrl, uploadFormData, {
      headers: { ...uploadFormData.getHeaders(), 'Authorization': `Bearer ${difyApiKey}` },
    });
    const fileId = uploadResponse.data.id;
    console.log('File uploaded to Dify successfully, file_id:', fileId);

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
      port++;
      setTimeout(() => server.listen(port), 100);
    } else {
      console.error(err);
    }
});