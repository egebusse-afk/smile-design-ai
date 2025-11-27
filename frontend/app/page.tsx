'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, ArrowRight, Check, Sparkles, Download, Share2, RefreshCw, ChevronRight, User } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  // State for Wizard Flow
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Hero, 2: Upload, 3: Processing, 4: Result
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Data State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("perfect white teeth, natural smile, detailed anatomy");
  const [error, setError] = useState<string | null>(null);
  
  // Processing Animation State
  const [processingStage, setProcessingStage] = useState(0);
  const processingMessages = [
    "Yüz hatları taranıyor...",
    "Diş yapısı analiz ediliyor...",
    "Gülüş estetiği hesaplanıyor...",
    "Yapay zeka tasarımı uyguluyor...",
    "Son rütuşlar yapılıyor..."
  ];

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Handlers ---

  const handleStart = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] } }) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Start Processing Flow
    setStep(3);
    setProcessingStage(0);
    setError(null);

    // Simulate analysis steps while uploading/masking
    const stageInterval = setInterval(() => {
        setProcessingStage(prev => (prev < 4 ? prev + 1 : prev));
    }, 4000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      
      // 1. Generate Mask
      const maskResponse = await fetch(`${apiUrl}/generate-mask`, {
        method: 'POST',
        body: formData,
      });

      if (!maskResponse.ok) throw new Error('Maskeleme işlemi başarısız oldu.');
      
      const maskData = await maskResponse.json();
      const maskBase64 = `data:image/png;base64,${maskData.mask}`;
      setMaskedImage(maskBase64);

      // 2. Generate Smile (Auto-trigger after mask)
      // We wait a bit to let the user see the "Processing" stages
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const generateResponse = await fetch(`${apiUrl}/generate-smile`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          image: await new Promise<string>((resolve) => {
             const r = new FileReader();
             r.onload = (e) => resolve(e.target?.result as string);
             r.readAsDataURL(file);
          }),
          mask: maskBase64,
          prompt: prompt,
        }),
      });

      if (!generateResponse.ok) {
          const errData = await generateResponse.json();
          throw new Error(errData.detail || 'Gülüş tasarımı oluşturulamadı.');
      }

      const genData = await generateResponse.json();
      setGeneratedImage(genData.image_url);
      
      clearInterval(stageInterval);
      setStep(4); // Go to Result

    } catch (err) {
      clearInterval(stageInterval);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      setStep(2); // Go back to upload on error
    }
  };

  const handleRegenerate = async (newPrompt: string) => {
      setPrompt(newPrompt);
      setStep(3);
      setProcessingStage(2); // Skip initial analysis
      setError(null);
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${apiUrl}/generate-smile`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
            image: selectedImage,
            mask: maskedImage,
            prompt: newPrompt,
            }),
        });

        if (!response.ok) throw new Error('Yeniden oluşturma başarısız.');

        const data = await response.json();
        setGeneratedImage(data.image_url);
        setStep(4);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Hata oluştu');
          setStep(4);
      }
  };

  // Camera Logic
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Kameraya erişilemedi.");
      setShowCamera(false);
    }
  };
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            handleImageUpload({ target: { files: [file] } } as any);
            setShowCamera(false);
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  // --- Render Steps ---

  return (
    <div className="min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span className="text-xl font-bold tracking-tight">SmileBot<span className="text-blue-400">.ai</span></span>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-slate-400">Premium Dental AI</span>
                {isLoggedIn ? (
                  <Link href="/dashboard" className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                    Giriş Yap
                  </Link>
                )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 md:pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
            
            {/* STEP 1: HERO */}
            {step === 1 && (
                <motion.div 
                    key="hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8"
                >
                    <div className="inline-flex items-center px-4 py-2 rounded-full glass-panel text-amber-400 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Yeni Nesil Yapay Zeka Teknolojisi
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                        Mükemmel Gülüşünüzü <br />
                        <span className="text-gradient-blue">Saniyeler İçinde</span> Tasarlayın
                    </h1>
                    
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Diş hekimleri ve hastalar için geliştirilmiş en gelişmiş AI simülasyon aracı. 
                        Fotoğrafınızı yükleyin, gerisini yapay zekaya bırakın.
                    </p>
                    
                    <button 
                        onClick={handleStart}
                        className="group relative px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-base md:text-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
                    >
                        <span className="flex items-center gap-2">
                            {isLoggedIn ? 'Dashboard\'a Git' : 'Ücretsiz Dene'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    
                    {/* Trust Indicators */}
                    <div className="pt-8 md:pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 text-slate-500 text-sm font-medium">
                        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center text-blue-400">
                                <Camera className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span>Kolay Kullanım</span>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center text-amber-400">
                                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span>AI Destekli</span>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center text-green-400">
                                <Check className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span>Anında Sonuç</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: UPLOAD */}
            {step === 2 && (
                <motion.div 
                    key="upload"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="max-w-2xl mx-auto mt-12"
                >
                    <div className="text-center mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Fotoğrafınızı Yükleyin</h2>
                        <p className="text-slate-400">Net, aydınlık ve dişlerin göründüğü bir fotoğraf seçin.</p>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors cursor-pointer relative group">
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-4 group-hover:scale-105 transition-transform duration-300">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-2 md:mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Upload className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-center px-4">Fotoğrafı Sürükleyin veya Seçin</h3>
                            <p className="text-sm text-slate-500">JPG, PNG formatları desteklenir</p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <span className="text-slate-500 text-sm uppercase tracking-widest">veya</span>
                    </div>

                    <button 
                        onClick={startCamera}
                        className="mt-6 w-full py-4 glass-panel rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium text-slate-300 hover:text-white"
                    >
                        <Camera className="w-5 h-5" /> Kamerayı Kullan
                    </button>
                    
                    {error && (
                        <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-200 text-center">
                            {error}
                        </div>
                    )}
                </motion.div>
            )}

            {/* STEP 3: PROCESSING */}
            {step === 3 && (
                <motion.div 
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                    <div className="relative w-32 h-32 mb-8">
                        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-amber-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-white animate-pulse" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">Gülüşünüz Tasarlanıyor</h2>
                    
                    <div className="h-8 overflow-hidden relative w-full max-w-md">
                        <AnimatePresence mode="wait">
                            <motion.p 
                                key={processingStage}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="text-blue-400 font-medium absolute w-full"
                            >
                                {processingMessages[processingStage] || "İşlem tamamlanıyor..."}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                    
                    <p className="text-slate-500 text-sm mt-8 max-w-xs mx-auto">
                        Yüksek kaliteli sonuç için yapay zeka modellerimiz detaylı analiz yapıyor. Bu işlem yaklaşık 20-30 saniye sürebilir.
                    </p>
                </motion.div>
            )}

            {/* STEP 4: RESULT */}
            {step === 4 && generatedImage && selectedImage && (
                <motion.div 
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        
                        {/* Left: Controls */}
                        <div className="w-full md:w-1/3 space-y-6">
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-blue-400" /> Tasarım Seçenekleri
                                </h3>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => handleRegenerate("perfect white teeth, natural smile, detailed anatomy")}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${prompt.includes("natural") ? "bg-blue-600/20 border-blue-500 text-white" : "bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800"}`}
                                    >
                                        <div className="font-medium">Natural White</div>
                                        <div className="text-xs opacity-70">Doğal beyazlık ve anatomik yapı</div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleRegenerate("hollywood smile, bright white teeth, perfect alignment, celebrity look")}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${prompt.includes("hollywood") ? "bg-blue-600/20 border-blue-500 text-white" : "bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800"}`}
                                    >
                                        <div className="font-medium">Hollywood Smile</div>
                                        <div className="text-xs opacity-70">Mükemmel hizalanmış, parlak beyaz</div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleRegenerate("zirconium teeth, translucent enamel, perfect white, high end dental work")}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${prompt.includes("zirconium") ? "bg-blue-600/20 border-blue-500 text-white" : "bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800"}`}
                                    >
                                        <div className="font-medium">Zirconium</div>
                                        <div className="text-xs opacity-70">Yarı saydam, premium zirkonyum dokusu</div>
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-4 glass-panel rounded-xl hover:bg-slate-800 transition-colors text-slate-300"
                            >
                                Yeni Fotoğraf Yükle
                            </button>
                        </div>

                        {/* Right: Comparison */}
                        <div className="w-full md:w-2/3">
                            <div className="glass-panel p-2 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="relative w-full h-auto rounded-2xl overflow-hidden">
                                    <ReactCompareImage 
                                        leftImage={selectedImage} 
                                        rightImage={generatedImage} 
                                        sliderLineWidth={2}
                                        handleSize={40}
                                        sliderLineColor="#3b82f6"
                                    />
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white">Önce</div>
                                    <div className="absolute bottom-4 right-4 bg-blue-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white">Sonra</div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                                <a 
                                    href={generatedImage} 
                                    download="smile-design.png"
                                    target="_blank"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> İndir
                                </a>
                                <button className="px-6 py-3 glass-panel hover:bg-slate-800 rounded-full font-medium flex items-center gap-2 transition-colors text-slate-300">
                                    <Share2 className="w-4 h-4" /> Paylaş
                                </button>
                            </div>
                            
                            <p className="text-center text-slate-600 text-xs mt-8">
                                ⚠️ Bu simülasyon sadece görselleştirme amaçlıdır. Tıbbi tavsiye niteliği taşımaz.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>

        {/* Camera Modal */}
        {showCamera && (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full border border-slate-700">
                    <div className="relative aspect-video bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="p-4 md:p-6 flex justify-between items-center bg-slate-800">
                        <button onClick={() => setShowCamera(false)} className="px-4 py-2 md:px-6 text-slate-300 hover:text-white font-medium text-sm md:text-base">İptal</button>
                        <button onClick={takePhoto} className="px-6 py-2 md:px-8 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 font-medium flex items-center gap-2 text-sm md:text-base">
                            <Camera className="w-4 h-4 md:w-5 md:h-5" /> Çek
                        </button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

