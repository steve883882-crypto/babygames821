import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div className="relative">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-full animate-pulse">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-800">
          AI正在识别玩具...
        </h3>
        <p className="text-gray-600 text-sm">
          为您的宝宝生成专属游戏方案
        </p>
      </div>

      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse" 
             style={{ width: '70%' }} />
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 max-w-sm">
        <p className="text-blue-800 text-sm text-center">
          💡 我们正在根据玩具特性和宝宝年龄，为您定制最合适的互动游戏
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;