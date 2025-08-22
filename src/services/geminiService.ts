import { Activity } from '../App';
import axios from 'axios';
import { resizeImageForAPI } from '../utils/imageUtils';

export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  try {
    // Convert image file to base64 string
    const base64Image = await resizeImageForAPI(imageFile);

    // Send request to local backend API
    const response = await axios.post('/api/generate-ideas', {
      image: base64Image,
      imageName: imageFile.name,
      imageType: imageFile.type,
      age: ageInMonths
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const activities = response.data;
    if (!Array.isArray(activities)) {
      throw new Error('Backend did not return an array of activities');
    }

    const processedActivities = activities.map(activity => ({ 
      ...activity, 
      isFavorited: false 
    }));
    
    return processedActivities;

  } catch (error: any) {
    console.error('Error calling backend API:', error);
    
    let errorMessage = '生成游戏方案失败';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}
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