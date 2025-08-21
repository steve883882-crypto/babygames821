import React, { useRef, useState } from 'react';
import { Camera, Image, Upload, ArrowLeft } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  selectedAge: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, selectedAge }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleConfirmUpload = () => {
    if (selectedImage) {
      setIsProcessing(true);
      onImageUpload(selectedImage);
    }
  };

  const getAgeLabel = (months: number) => {
    return `${months}个月`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <Upload className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          上传玩具照片
        </h2>
        <p className="text-gray-600 text-sm mb-1">
          为 {getAgeLabel(selectedAge)} 宝宝生成专属游戏
        </p>
      </div>

      {!selectedImage ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="space-y-4">
              <button
                onClick={handleCameraClick}
                className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-4 px-6 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center space-x-3"
              >
                <Camera className="w-6 h-6" />
                <span>拍摄玩具照片</span>
              </button>
              
              <button
                onClick={handleGalleryClick}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-4 px-6 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center space-x-3"
              >
                <Image className="w-6 h-6" />
                <span>从相册选择</span>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">📸 拍摄小贴士</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 确保玩具清晰可见</li>
              <li>• 选择光线充足的环境</li>
              <li>• 避免反光和阴影</li>
              <li>• 可以包含多个玩具</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-lg">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <img 
                src={selectedImage} 
                alt="Selected toy" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedImage(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : '开始识别'}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;