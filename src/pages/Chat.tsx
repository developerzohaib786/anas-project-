import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

const Chat = () => {
  const [inputValue, setInputValue] = useState("");

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      console.log('Files selected:', (e.target as HTMLInputElement).files);
    };
    input.click();
  };

  const promptExamples = [
    "A lifestyle photo of a...",
    "An editorial shot of a...", 
    "An overhead editorial..."
  ];

  return (
    <div className="flex-1 bg-white h-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h1 className="text-base font-medium text-gray-900">
            What are we creating today?
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="bg-black text-white px-2 py-1 rounded text-xs font-medium">
                1:1
              </button>
              <button className="text-gray-400 text-xs">4:5</button>
              <button className="text-gray-400 text-xs">9:16</button>
              <button className="text-gray-400 text-xs">16:9</button>
            </div>
            <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-4 py-1 text-sm">
              Done
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-6 py-16">
            {/* Upload Section */}
            <div className="text-center mb-16">
              <h2 className="text-xl font-medium text-gray-900 mb-3">Upload photo</h2>
              <div className="inline-flex items-center bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm mb-8">
                Recommended
              </div>
              
              <div className="text-left space-y-2 text-gray-600 mb-8 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <span className="font-semibold">1.</span>
                  <span>Use your phone or upload existing image</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold">2.</span>
                  <span>Press "Make this beautiful" or describe what you want</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold">3.</span>
                  <span>Let us cook</span>
                </div>
              </div>
            </div>

            {/* Describe Vision Section */}
            <div className="text-center mb-12">
              <h2 className="text-xl font-medium text-gray-900 mb-2">Describe your vision</h2>
              <p className="text-gray-600 mb-8">Tell us what you want to create or select one of our crafted prompts</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {promptExamples.map((prompt, index) => (
                  <button
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg text-left hover:border-gray-300 transition-colors"
                    onClick={() => setInputValue(prompt)}
                  >
                    <div className="aspect-video bg-gray-100 rounded mb-2"></div>
                    <p className="text-xs text-gray-600">{prompt}</p>
                  </button>
                ))}
              </div>

              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 text-sm mb-8">
                View all prompts →
              </Button>
            </div>

            {/* Text Input */}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Plus className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your hotel marketing photo..."
                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm"
              />
              <Button 
                size="sm"
                className="bg-black hover:bg-gray-800 text-white rounded-full p-2"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
