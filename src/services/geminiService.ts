// src/services/geminiService.ts

import { Activity } from '../App';

// 新增一个辅助函数，用于将 File 对象转换为 Base64 Data URL
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  try {
    // 1. 将 File 对象转换为 Base64 字符串
    const imageUrlBase64 = await fileToDataUrl(imageFile);

    // 2. 构建纯 JSON 请求体
    const payload = {
      age: ageInMonths.toString(),
      image: imageUrlBase64, // 发送 Base64 字符串
      imageName: imageFile.name, // 附加文件名
      imageType: imageFile.type,   // 附加文件类型
    };
    
    // 3. 发送 application/json 请求
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // 明确指定为 JSON
      },
      body: JSON.stringify(payload) // 序列化为 JSON 字符串
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