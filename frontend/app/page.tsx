'use client';

import { useState } from 'react';
import { Upload, ArrowRight, Loader2 } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("perfect white teeth, natural smile");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview original image
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsLoading(true);
    setError(null);
    setMaskedImage(null);
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/generate-mask`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      // Backend returns base64 strings without prefix
      setMaskedImage(`data:image/png;base64,${data.mask}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !maskedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/generate-smile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          mask: maskedImage,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate smile' }));
        throw new Error(errorData.detail || 'Failed to generate smile');
      }

      const data = await response.json();
      setGeneratedImage(data.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Smile Design
          </h1>
          <p className="text-slate-400 text-lg">
            Upload a photo to detect and mask the smile area automatically.
          </p>
        </div>

        {/* Upload Section */}
        {!selectedImage && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <label className="relative cursor-pointer group">
              <div className="w-64 h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center transition-all group-hover:border-blue-500 group-hover:bg-slate-900">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mb-2" />
                <span className="text-sm text-slate-400 group-hover:text-blue-300">
                  Click to upload photo
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}

        {/* Controls */}
        {selectedImage && (
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPrompt("perfect white teeth, natural smile")}
                        className={`px-4 py-2 rounded-full text-sm ${prompt === "perfect white teeth, natural smile" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                        Natural White
                    </button>
                    <button 
                        onClick={() => setPrompt("hollywood smile, bright white teeth, perfect alignment")}
                        className={`px-4 py-2 rounded-full text-sm ${prompt === "hollywood smile, bright white teeth, perfect alignment" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                        Hollywood Smile
                    </button>
                    <button 
                        onClick={() => setPrompt("natural teeth, slightly imperfect, realistic texture")}
                        className={`px-4 py-2 rounded-full text-sm ${prompt === "natural teeth, slightly imperfect, realistic texture" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                        Realistic
                    </button>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !maskedImage}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Generate New Smile"}
                </button>
            </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {/* Results Grid */}
        {(selectedImage || isLoading) && (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Original Image */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                Original Photo
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3]">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Masked Image */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                Generated Mask
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3]">
                {maskedImage ? (
                  <img
                    src={maskedImage}
                    alt="Mask"
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                    Waiting for mask...
                  </div>
                )}
              </div>
            </div>

            {/* Generated Image / Comparison */}
            <div className="space-y-4 md:col-span-3">
              <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2 justify-center">
                Before / After Comparison
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 max-w-4xl mx-auto aspect-[4/3]">
                {generatedImage && selectedImage ? (
                  <ReactCompareImage 
                    leftImage={selectedImage} 
                    rightImage={generatedImage} 
                    sliderLineWidth={2}
                    handleSize={40}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                    {isLoading ? "Generating..." : "Generate a smile to see comparison"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="border-t border-slate-800 pt-8 text-center space-y-2">
            <p className="text-slate-500 text-sm">
                ⚠️ Yasal Uyarı / Disclaimer
            </p>
            <p className="text-slate-600 text-xs max-w-2xl mx-auto">
                Bu görüntü yapay zeka tarafından simülasyon ve görselleştirme amaçlı üretilmiştir. 
                Gerçek tedavi sonucu, hastanın anatomik yapısına, kemik dokusuna ve biyolojik faktörlere göre değişiklik gösterebilir. 
                Bu bir tıbbi taahhüt değildir.
            </p>
        </div>
      </div>
    </main>
  );
}
