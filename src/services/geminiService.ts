// src/services/geminiService.ts

import { Activity } from '../App';

export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  
  // =================================================================
  // ▼▼▼ 请在这里添加前端日志 ▼▼▼
  // =================================================================
  console.log('--- 验证前端数据 ---');
  console.log('接收到的 imageFile 对象:', imageFile);
  console.log('是否是 File 类型:', imageFile instanceof File);
  console.log('文件名:', imageFile.name);
  console.log('文件大小:', imageFile.size);
  console.log('文件类型:', imageFile.type);
  console.log('接收到的 ageInMonths:', ageInMonths);
  console.log('--------------------');

  if (imageFile.size === 0) {
    alert("错误：选择的图片文件为空，请重新选择！");
    throw new Error("Selected file is empty.");
  }
  // =================================================================
  // ▲▲▲ 日志代码结束 ▲▲▲
  // =================================================================

  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('age', ageInMonths.toString());
    
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