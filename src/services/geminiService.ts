// src/services/geminiService.ts

import { Activity } from '../App';

// generatePlayActivities now accepts a File object directly
export async function generatePlayActivities(imageFile: File, ageInMonths: number): Promise<Activity[]> {
  try {
    // No conversion needed! The imageFile is already in the correct format.
    const formData = new FormData();
    formData.append('image', imageFile); // This is now guaranteed to be a valid File/Blob
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