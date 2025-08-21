import React from 'react';
import { Baby, ChevronRight } from 'lucide-react';

interface AgeSelectorProps {
  onAgeSelect: (age: number) => void;
  onAgeChange: (age: number) => void;
  selectedAge: number;
}

// Generate age options from 0 to 36 months
const generateAgeOptions = () => {
  const options = [];
  for (let i = 0; i <= 36; i++) {
    let description = '';
    let icon = '';
    
    if (i <= 6) {
      description = '感官探索期';
      icon = '👶';
    } else if (i <= 12) {
      description = '爬行探索期';
      icon = '🍼';
    } else if (i <= 18) {
      description = '学步期';
      icon = '👣';
    } else if (i <= 24) {
      description = '模仿学习期';
      icon = '🎈';
    } else if (i <= 30) {
      description = '语言爆发期';
      icon = '💬';
    } else {
      description = '独立游戏期';
      icon = '🎨';
    }
    
    options.push({
      label: `${i}个月`,
      months: i,
      description,
      icon
    });
  }
  return options;
};

const ageOptions = generateAgeOptions();

const AgeSelector: React.FC<AgeSelectorProps> = ({ onAgeSelect, onAgeChange, selectedAge }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <Baby className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          选择宝宝年龄
        </h2>
        <p className="text-gray-600 text-sm">
          为您的宝宝推荐最适合的游戏活动
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            宝宝月龄
          </label>
          <select
            value={selectedAge}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800"
          >
            {ageOptions.map((option) => (
              <option key={option.months} value={option.months}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-center">
          {(() => {
            const selectedOption = ageOptions.find(opt => opt.months === selectedAge);
            return selectedOption ? (
              <div className="flex items-center justify-center space-x-3 p-4 bg-pink-50 rounded-xl">
                <span className="text-3xl">{selectedOption.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">{selectedOption.label}</div>
                  <div className="text-sm text-gray-500">{selectedOption.description}</div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      <button
        onClick={() => onAgeSelect(selectedAge)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        继续下一步
      </button>
    </div>
  );
};

export default AgeSelector;