import { Activity } from '../App';

// Helper function to convert data URL to File object
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Generate play activities using our serverless proxy
export async function generatePlayActivities(imageUrl: string, ageInMonths: number): Promise<Activity[]> {
  try {
    // Convert data URL to File object
    const imageFile = dataUrlToFile(imageUrl, 'toy-image.jpg');
    
    // Create FormData for the request to our serverless function
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('age', ageInMonths.toString());
    
    // Send request to our serverless proxy function
    const response = await fetch('/api/generate-ideas', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    
    // Check for error in response
    if (data.error) {
      throw new Error(data.message || data.error);
    }

    // Extract activities from response
    if (!data.activities || !Array.isArray(data.activities)) {
      throw new Error('Invalid response format: activities array not found');
    }

    return data.activities;

  } catch (error) {
    console.error('Error calling API:', error);
    throw new Error(`Failed to generate activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}