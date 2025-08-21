import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const app = express();
let port = 3001;

// Configure multer for handling multipart/form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

// Main endpoint for generating ideas
app.post('/api/generate-ideas', upload.single('image'), async (req, res) => {
  try {
    console.log('Received request to /api/generate-ideas');
    
    // Get Dify API configuration from environment variables
    const difyApiBaseUrl = process.env.DIFY_API_BASE_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiBaseUrl || !difyApiKey) {
      return res.status(500).json({
        error: 'Missing Dify API configuration',
        message: 'Please check your .env.local file and ensure DIFY_API_BASE_URL and DIFY_API_KEY are set'
      });
    }

    // Extract image file and age from request
    const imageFile = req.file;
    const age = req.body.age;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!age) {
      return res.status(400).json({ error: 'Age parameter is required' });
    }

    console.log('Image file type:', imageFile.mimetype);
    console.log('Age:', age);

    // Validate and clean the API URL
    let apiUrl = difyApiBaseUrl.trim();
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = 'https://' + apiUrl;
    }
    // Remove trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');
    
    console.log('Using Dify API base URL:', apiUrl);

    // Step 1: Upload the image file to Dify's /files/upload endpoint
    const uploadFileUrl = `${apiUrl}/files/upload`;
    const uploadFormData = new FormData();
    
    // In Node.js, we can directly use the buffer with FormData
    uploadFormData.append('file', imageFile.buffer, {
      filename: imageFile.originalname || 'image.jpg',
      contentType: imageFile.mimetype,
    });
    uploadFormData.append('user', 'my-app-user-123');

    console.log('Uploading file to Dify:', uploadFileUrl);
    console.log('File details:', {
      originalname: imageFile.originalname,
      mimetype: imageFile.mimetype,
      size: imageFile.size
    });

    const uploadResponse = await fetch(uploadFileUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${difyApiKey}`,
        ...uploadFormData.getHeaders()
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Dify file upload error response:', errorText);
      return res.status(uploadResponse.status).json({
        error: `Dify file upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        details: errorText,
        url: uploadFileUrl,
      });
    }

    const uploadData = await uploadResponse.json();
    const fileId = uploadData.id; // Extract the file_id
    console.log('Uploaded file to Dify, file_id:', fileId);

    // Step 2: Create workflow run request
    const workflowUrl = `${apiUrl}/workflows/run`;
    console.log('Using Dify workflow API URL:', workflowUrl);

    // Create FormData for Dify workflow run API
    const difyFormData = new FormData();

    // Package inputs into "inputs" JSON string field, including the file_id
    const inputs = {
      age: age,
      toyimage: { 
        type: "image",
        transfer_method: "upload_file_id",
        upload_file_id: fileId
      }
    };
    difyFormData.append('inputs', JSON.stringify(inputs));

    // Add user field as required by Dify
    difyFormData.append('user', 'my-app-user-123');

    console.log('Sending request to Dify API with FormData');
    console.log('- Inputs:', inputs);

    // Send FormData request to Dify API
    const difyResponse = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        // Note: Do NOT set Content-Type header when using FormData
        // fetch() will automatically set it to multipart/form-data with boundary
      },
      body: difyFormData
    });

    console.log('Dify API response status:', difyResponse.status);
    console.log('Dify API response headers:', Object.fromEntries(difyResponse.headers.entries()));

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error response:', errorText);
      console.error('Request URL was:', workflowUrl);
      return res.status(difyResponse.status).json({
        error: `Dify API request failed: ${difyResponse.status} ${difyResponse.statusText}`,
        details: errorText,
        url: workflowUrl
      });
    }

    const difyData = await difyResponse.json();
    console.log('Dify API response:', difyData);

    // Parse the structured output from Dify
    let activities;
    
    if (difyData.data && difyData.data.outputs && difyData.data.outputs.result) {
      // If result is a string, parse it as JSON
      if (typeof difyData.data.outputs.result === 'string') {
        activities = JSON.parse(difyData.data.outputs.result);
      } else {
        activities = difyData.data.outputs.result;
      }
    } else {
      console.error('Unexpected Dify response structure:', difyData);
      throw new Error('Unexpected response format from Dify API');
    }

    // Validate the response structure
    if (!Array.isArray(activities)) {
      console.error('Activities is not an array:', activities);
      throw new Error('Dify API did not return an array of activities');
    }

    // Add isFavorited property to each activity (default to false)
    const processedActivities = activities.map(activity => ({
      ...activity,
      isFavorited: false
    }));

    console.log('Successfully processed', processedActivities.length, 'activities');
    return res.status(200).json({ activities: processedActivities });

  } catch (error) {
    console.error('Error in generate-ideas API:', error);
    return res.status(500).json({
      error: 'Failed to generate activities',
      message: error.message
    });
  }
});

// Function to find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Start the server with automatic port selection
findAvailablePort(port).then((availablePort) => {
  port = availablePort;
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
    console.log('Environment check:');
    console.log('- DIFY_API_BASE_URL:', process.env.DIFY_API_BASE_URL ? '✓ Set' : '✗ Missing');
    console.log('- DIFY_API_KEY:', process.env.DIFY_API_KEY ? '✓ Set' : '✗ Missing');
  });
}).catch((error) => {
  console.error('Failed to find an available port:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  process.exit(0);
});