import { Activity } from '../App';

// generatePlayActivities现在直接接收一个File对象
export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  try {
    // 不再需要fileToDataUrl转换，imageFile本身就是正确的格式
    const formData = new FormData();
    formData.append('image', imageFile); // 直接使用传入的File对象
    formData.append('age', ageInMonths.toString());
    
    // 发送请求到我们的后端代理
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API error response:', data);
      throw new Error(data.details?.message || data.details || `API request failed: ${response.status}`);
    }

    if (!data.activities || !Array.isArray(data.activities)) {
      throw new Error('Invalid response format: activities array not found');
    }

    return data.activities;

  } catch (error) {
    console.error('Error in generatePlayActivities:', error);
    throw new Error(`生成游戏失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}