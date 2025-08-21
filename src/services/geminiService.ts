// src/services/geminiService.ts - 最终修正版

import { Activity } from '../App';

// 使用 fetch 和 blob 的方式将 dataUrl 转换为 File 对象，这种方法更健壮
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

// Generate play activities using our serverless proxy
export async function generatePlayActivities(imageUrl: string, ageInMonths: number): Promise<Activity[]> {
  try {
    // 将 data URL 转换为 File 对象
    // 使用 await 等待 Promise 完成
    const imageFile = await dataUrlToFile(imageUrl, 'toy-image.jpg');
    
    // 创建 FormData
    const formData = new FormData();
    formData.append('image', imageFile); // 现在 imageFile 肯定是一个有效的 File 对象
    formData.append('age', ageInMonths.toString());
    
    // 发送请求到我们的后端代理
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.details || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.details || data.error);
    }

    if (!data.activities || !Array.isArray(data.activities)) {
      throw new Error('Invalid response format: activities array not found');
    }

    return data.activities;

  } catch (error) {
    console.error('Error in generatePlayActivities:', error);
    // 向用户抛出一个更友好的错误信息
    throw new Error(`生成游戏失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}