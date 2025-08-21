import React, { useState } from 'react';
import { Heart, Share2, RotateCcw, Home, Target, Shield, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Activity, ActivityStep } from '../App';

interface ActivityResultProps {
  activities: Activity[];
  onStartOver: () => void;
  onGenerateNew: () => void;
}

const ActivityResult: React.FC<ActivityResultProps> = ({ 
  activities, 
  onStartOver, 
  onGenerateNew 
}) => {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);

  const currentActivity = activities[currentActivityIndex];
  const [isFavorited, setIsFavorited] = useState(currentActivity.isFavorited);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const playAudio = (instruction: string) => {
    // Stop any currently playing audio
    if (playingAudio !== null && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    setPlayingAudio(null);
    
    // Use Web Speech API for text-to-speech
    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    
    utterance.onend = () => {
      setPlayingAudio(null);
    };
    
    utterance.onerror = () => {
      setPlayingAudio(null);
    };
    
    speechSynthesis.speak(utterance);
  };

  const handlePrevActivity = () => {
    setCurrentActivityIndex((prev) => (prev > 0 ? prev - 1 : activities.length - 1));
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setPlayingAudio(null);
  };

  const handleNextActivity = () => {
    setCurrentActivityIndex((prev) => (prev < activities.length - 1 ? prev + 1 : 0));
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setPlayingAudio(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentActivity.name,
          text: `${currentActivity.name} - 适合${currentActivity.ageInMonths}个月宝宝的游戏`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享失败');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = `${currentActivity.name} - 适合${currentActivity.ageInMonths}个月宝宝的游戏`;
      navigator.clipboard.writeText(text);
      alert('游戏方案已复制到剪贴板');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        {/* Game Navigation */}
        {activities.length > 1 && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevActivity}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex space-x-2">
              {activities.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentActivityIndex ? 'bg-pink-400' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNextActivity}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-full">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{currentActivity.name}</h2>
              <p className="text-sm text-gray-500">适合 {currentActivity.ageInMonths}个月宝宝</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFavorited ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Game Steps */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
            🎮
          </span>
          游戏步骤
        </h3>
        <ol className="space-y-4">
          {currentActivity.steps.map((step, index) => (
            <li key={index} className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-pink-400 to-purple-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1">{step.mainStepChinese}</p>
              </div>
              
              {/* English Instruction */}
              <div className="ml-9 bg-blue-50 rounded-xl p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-blue-800 font-medium text-sm mb-1">
                      {step.instructionEnglish}
                    </p>
                    <p className="text-blue-600 text-xs mb-1">
                      {step.instructionChinese}
                    </p>
                  </div>
                  <button
                    onClick={() => playAudio(step.instructionEnglish)}
                    disabled={playingAudio !== null}
                    className={`ml-3 p-2 rounded-full transition-all duration-200 ${
                      playingAudio !== null
                        ? 'bg-blue-200 text-blue-600 animate-pulse'
                        : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 text-purple-600 mr-3" />
          发展目标
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentActivity.goals.map((goal, index) => (
            <span 
              key={index}
              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              {goal}
            </span>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
          <Shield className="w-5 h-5 text-red-600 mr-3" />
          安全提示
        </h3>
        <ul className="space-y-2">
          {currentActivity.safetyTips.map((tip, index) => (
            <li key={index} className="flex items-start space-x-2 text-red-700">
              <span className="text-red-500 mt-1">⚠️</span>
              <span className="text-sm">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onGenerateNew}
          className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>生成新游戏</span>
        </button>
        
        <button
          onClick={onStartOver}
          className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
        >
          <Home className="w-5 h-5" />
          <span>重新开始</span>
        </button>
      </div>
    </div>
  );
};

export default ActivityResult;