import { Activity } from '../App';
import axios from 'axios'; // 引入 axios 以便在前端使用
import FormData from 'form-data'; // 引入 form-data

// generatePlayActivities 现在直接与 Dify API 通信
export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  try {
    // =================================================================
    // 步骤 1: (前端) 直接上传文件到 Dify
    // =================================================================
    const uploadFormData = new FormData();
    uploadFormData.append('user', 'my-app-user-123');
    uploadFormData.append('file', imageFile);

    console.log('Attempting to upload file directly to Dify proxy...');
    
    // 注意：我们请求的是 /dify-api，Vite 会自动代理并加上认证头
    const uploadResponse = await axios.post('/dify-api/files/upload', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const fileId = uploadResponse.data.id;
    console.log('File uploaded via proxy, file_id:', fileId);

    // =================================================================
    // 步骤 2: (前端) 直接执行 Dify 工作流
    // =================================================================
    const workflowPayload = {
      inputs: {
        age: ageInMonths.toString(),
        toyimage: [{
          type: "image",
          transfer_method: "local_file",
          upload_file_id: fileId
        }]
      },
      response_mode: "blocking",
      user: 'my-app-user-123'
    };
    
    // 再次请求 /dify-api，Vite 会自动代理并加上认证头
    const difyResponse = await axios.post('/dify-api/workflows/run', workflowPayload);

    const result = difyResponse.data.data?.outputs?.result;
    if (!result) throw new Error('Unexpected response format from Dify API');
    
    const activities = typeof result === 'string' ? JSON.parse(result) : result;
    if (!Array.isArray(activities)) throw new Error('Dify API did not return an array of activities');

    const processedActivities = activities.map(activity => ({ ...activity, isFavorited: false }));
    return processedActivities;

  } catch (error: any) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Error in direct Dify call:', errorDetails);
    throw new Error(`直接调用Dify失败: ${JSON.stringify(errorDetails)}`);
  }
}