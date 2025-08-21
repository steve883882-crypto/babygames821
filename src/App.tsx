import React, { useState } from 'react';
import { Camera, Heart, Share2 } from 'lucide-react';
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedActivities, setGeneratedActivities] = useState<Activity[]>([]);

  const handleAgeChange = (age: number) => {
    setSelectedAge(age);
  };

  const handleAgeSelection = (age: number) => {
    setSelectedAge(age);
    setCurrentStep('upload');
  };

  const handleImageUpload = async (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setCurrentStep('loading');
    
    try {
      const activities = await generatePlayActivities(imageUrl, selectedAge);
      setGeneratedActivities(activities);
      setCurrentStep('result');
    } catch (error) {
      console.error('Failed to generate activity:', error);
      // Handle error - could show error state
      setCurrentStep('upload');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('age');
    setUploadedImage(null);
    setGeneratedActivities([]);
  };

  const handleGenerateNew = async () => {
    if (!uploadedImage) return;
    
    setCurrentStep('loading');
    try {
      const activities = await generatePlayActivities(uploadedImage, selectedAge);
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
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-3 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Time to Play!
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            宝宝AI游戏伙伴
          </p>
          <p className="text-sm text-gray-500 mt-1">
            为您的宝宝定制专属游戏方案
          </p>
        </header>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${
              currentStep === 'age' ? 'bg-pink-400' : 'bg-gray-300'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              ['upload', 'loading', 'result'].includes(currentStep) ? 'bg-pink-400' : 'bg-gray-300'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              currentStep === 'result' ? 'bg-pink-400' : 'bg-gray-300'
            }`} />
          </div>
        </div>

        {/* Content */}
        <main className="space-y-6">
          {currentStep === 'age' && (
            <AgeSelector 
              selectedAge={selectedAge}
              onAgeChange={setSelectedAge}
              onAgeSelect={handleAgeSelection}
            />
          )}
          
          {currentStep === 'upload' && (
            <ImageUpload onImageUpload={handleImageUpload} selectedAge={selectedAge} />
          )}
          
          {currentStep === 'loading' && (
            <LoadingScreen />
          )}
          
          {currentStep === 'result' && generatedActivities.length > 0 && (
            <ActivityResult 
              activities={generatedActivities}
              onStartOver={handleStartOver}
              onGenerateNew={handleGenerateNew}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;