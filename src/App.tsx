// src/App.tsx

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import AgeSelector from './components/AgeSelector';
import ImageUpload from './components/ImageUpload';
import ActivityResult from './components/ActivityResult';
import LoadingScreen from './components/LoadingScreen';
import { generatePlayActivities } from './services/geminiService';

export interface ActivityStep {
  mainStepChinese: string;
  instructionEnglish: string;
  instructionChinese: string;
}
export interface Activity {
  id: string;
  name: string;
  ageInMonths: number;
  steps: ActivityStep[];
  goals: string[];
  safetyTips: string[];
  isFavorited: boolean;
}

function App() {
  const [currentStep, setCurrentStep] = useState<'age' | 'upload' | 'loading' | 'result'>('age');
  const [selectedAge, setSelectedAge] = useState<number>(12);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // State now holds a File object
  const [generatedActivities, setGeneratedActivities] = useState<Activity[]>([]);

  const handleAgeSelection = (age: number) => {
    setSelectedAge(age);
    setCurrentStep('upload');
  };

  const handleImageUpload = async (imageFile: File) => { // Now receives a File object
    setUploadedFile(imageFile);
    setCurrentStep('loading');
    
    try {
      const activities = await generatePlayActivities(imageFile, selectedAge); // Pass File object to service
      setGeneratedActivities(activities);
      setCurrentStep('result');
    } catch (error) {
      console.error('Failed to generate activity:', error);
      setCurrentStep('upload'); // Go back on error
    }
  };

  const handleStartOver = () => {
    setCurrentStep('age');
    setUploadedFile(null);
    setGeneratedActivities([]);
  };

  const handleGenerateNew = async () => {
    if (!uploadedFile) return;
    
    setCurrentStep('loading');
    try {
      const activities = await generatePlayActivities(uploadedFile, selectedAge); // Pass File object again
      setGeneratedActivities(activities);
      setCurrentStep('result');
    } catch (error) {
      console.error('Failed to generate new activity:', error);
      setCurrentStep('result');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-yellow-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-3 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Time to Play!</h1>
          <p className="text-xl text-gray-600 font-medium">宝宝AI游戏伙伴</p>
        </header>

        <main className="space-y-6">
          {currentStep === 'age' && (
            <AgeSelector selectedAge={selectedAge} onAgeChange={setSelectedAge} onAgeSelect={handleAgeSelection} />
          )}
          {currentStep === 'upload' && (
            <ImageUpload onImageUpload={handleImageUpload} selectedAge={selectedAge} />
          )}
          {currentStep === 'loading' && <LoadingScreen />}
          {currentStep === 'result' && generatedActivities.length > 0 && (
            <ActivityResult activities={generatedActivities} onStartOver={handleStartOver} onGenerateNew={handleGenerateNew} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;