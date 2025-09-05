import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, Image } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useNavigate, useParams } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { createSession } = useChat();

  const handleNewProject = () => {
    const newSessionId = createSession();
    navigate(`/chat/${newSessionId}`);
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      // TODO: Handle file upload
      console.log('Files selected:', (e.target as HTMLInputElement).files);
    };
    input.click();
  };

  const promptExamples = [
    "A lifestyle photo of a luxury hotel room with ocean view",
    "An editorial shot of a hotel spa with natural lighting",
    "An overhead editorial shot of a hotel breakfast spread"
  ];

  return (
    <div className="flex-1 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">
              What are we creating today?
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium">
                  1:1
                </div>
                <span>4:5</span>
                <span>9:16</span>
                <span>16:9</span>
              </div>
              <Button 
                onClick={handleNewProject}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-4 py-2"
              >
                Done
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-12 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            {/* Upload Section */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">Upload photo</h2>
                <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                  Recommended
                </div>
              </div>

              <div className="space-y-3 text-gray-600 mb-8">
                <div className="flex items-center gap-3">
                  <span className="font-medium">1.</span>
                  <span>Use your phone or upload existing image</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">2.</span>
                  <span>Press "Make this beautiful" or describe what you want</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">3.</span>
                  <span>Let us cook</span>
                </div>
              </div>

              <Button 
                onClick={handleFileUpload}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-lg font-medium rounded-lg flex items-center justify-center gap-3"
              >
                <Upload className="h-5 w-5" />
                Upload Image
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or</span>
              </div>
            </div>

            {/* Describe Vision Section */}
            <div>
              <h2 className="text-2xl font-medium text-gray-900 mb-2">Describe your vision</h2>
              <p className="text-gray-600 mb-8">Tell us what you want to create or select one of our crafted prompts</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {promptExamples.map((prompt, index) => (
                  <button
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg text-left hover:border-gray-300 transition-colors"
                    onClick={() => {
                      // TODO: Handle prompt selection
                      console.log('Selected prompt:', prompt);
                    }}
                  >
                    <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-700">{prompt}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  View all prompts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Text Input */}
              <div className="mt-8">
                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                  <span className="text-gray-400">+</span>
                  <input
                    type="text"
                    placeholder="Describe your hotel marketing photo..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                  />
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
