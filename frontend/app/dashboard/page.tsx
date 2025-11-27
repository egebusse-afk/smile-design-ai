'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, Clock, Plus, ChevronRight, User as UserIcon, Upload, Camera, Download, Share2, X, Wand2 } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import Link from 'next/link';

interface Generation {
  id: number;
  image_url: string;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
}

const MATERIALS = [
  { id: 'whitening', name: 'Doğal Beyazlatma (Whitening)', prompt: 'Natural teeth texture, brighter shade, translucent edges, retain original shape.' },
  { id: 'hollywood', name: 'Hollywood Smile', prompt: 'Perfectly aligned teeth, bright white, symmetrical, flawless, celebrity smile style.' },
  { id: 'veneer', name: 'Lamine (Veneer)', prompt: 'Porcelain veneer texture, high translucency, perfectly smooth surface, anatomical contouring.' },
  { id: 'emax', name: 'E-Max (Lithium Disilicate)', prompt: 'Glass-ceramic texture, highly aesthetic, natural light transmission, warm white tone.' },
  { id: 'zirconium', name: 'Zirkonyum (Zirconium)', prompt: 'Opaque white, high durability look, monolithic zirconia texture, hollywood smile style.' },
  { id: 'allon4', name: 'İmplant Üstü Zirkonyum (All-on-4)', prompt: 'Fixed prosthesis, pink gum architecture integration, perfectly aligned artificial gum line, white zirconium teeth.' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  // New Design State
  const [showNewDesign, setShowNewDesign] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0].id);
  const [expertNotes, setExpertNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      
      try {
        // Fetch User
        const userRes = await fetch(`${apiUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error('Auth failed');
        const userData = await userRes.json();
        setUser(userData);

        // Fetch History
        const historyRes = await fetch(`${apiUrl}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setGenerations(historyData);
        }
      } catch (err) {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
    
    // Reset states
    setMaskedImage(null);
    setGeneratedImage(null);
    setIsProcessing(true);
    setProcessingStage('Yüz taranıyor ve analiz ediliyor...');

    try {
        const formData = new FormData();
        formData.append('file', file);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        
        // Step 1: Generate Mask
        const maskResponse = await fetch(`${apiUrl}/generate-mask`, {
            method: 'POST',
            body: formData,
        });

        if (!maskResponse.ok) throw new Error('Maskeleme başarısız.');
        const maskData = await maskResponse.json();
        const newMaskedImage = `data:image/png;base64,${maskData.mask}`;
        setMaskedImage(newMaskedImage);

        // Step 2: Auto-Generate Smile
        setProcessingStage('Google Vertex AI ile yeni gülüş tasarlanıyor...');
        
        const token = localStorage.getItem('token');
        const materialPrompt = MATERIALS.find(m => m.id === selectedMaterial)?.prompt;

        // Use the newly read image data directly or wait for state? 
        // Better to use the file reader result or just pass the file again?
        // Actually, we need the base64 string for the API.
        // Since FileReader is async, let's wait for it or use a promise wrapper.
        // A simpler way: we already have the file, let's read it to base64 synchronously-ish or just wait.
        
        // Let's use a helper to get base64 from file to be sure
        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

        const base64Image = await toBase64(file);

        const response = await fetch(`${apiUrl}/generate-smile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                image: base64Image,
                mask: newMaskedImage,
                style_prompt: materialPrompt,
                expert_prompt: expertNotes
            }),
        });

        if (!response.ok) throw new Error('Üretim başarısız.');
        const data = await response.json();
        setGeneratedImage(data.image_url);
        
        // Refresh history
        const historyRes = await fetch(`${apiUrl}/history`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
            const historyData = await historyRes.json();
            setGenerations(historyData);
        }

    } catch (error) {
        console.error(error);
        alert("İşlem sırasında bir hata oluştu.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !maskedImage) return;

    setIsProcessing(true);
    setProcessingStage('Google Vertex AI ile gülüş tasarlanıyor...');

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const materialPrompt = MATERIALS.find(m => m.id === selectedMaterial)?.prompt;

        const response = await fetch(`${apiUrl}/generate-smile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                image: selectedImage,
                mask: maskedImage,
                style_prompt: materialPrompt,
                expert_prompt: expertNotes
            }),
        });

        if (!response.ok) throw new Error('Üretim başarısız.');
        const data = await response.json();
        setGeneratedImage(data.image_url);
        
        // Refresh history
        const historyRes = await fetch(`${apiUrl}/history`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
            const historyData = await historyRes.json();
            setGenerations(historyData);
        }

    } catch (error) {
        console.error(error);
        alert("Tasarım oluşturulurken hata oluştu.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold tracking-tight">SmileBot<span className="text-blue-500">.ai</span> <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded ml-2">v2.0 PRO</span></span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-3 py-1.5 rounded-full">
                <UserIcon className="w-4 h-4" />
                {user?.full_name || user?.email}
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Kontrol Paneli</h1>
            <p className="text-slate-400 mt-1">Profesyonel gülüş tasarımı stüdyosu.</p>
          </div>
          <button 
            onClick={() => setShowNewDesign(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-5 h-5" /> Yeni Tasarım Başlat
          </button>
        </div>

        {/* New Design Modal / Section */}
        {showNewDesign && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm overflow-y-auto">
                <div className="min-h-screen px-4 py-8 flex items-center justify-center">
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-6xl p-6 md:p-8 relative">
                        <button 
                            onClick={() => setShowNewDesign(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Wand2 className="w-6 h-6 text-blue-500" /> Yeni Gülüş Tasarımı
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Upload & Preview */}
                            <div className="lg:col-span-2 space-y-6">
                                {!selectedImage ? (
                                    <div className="border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer relative group bg-white/5">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                                        <h3 className="text-lg font-medium text-slate-300">Fotoğraf Yükle</h3>
                                        <p className="text-sm text-slate-500 mt-2">Hasta fotoğrafını buraya sürükleyin veya seçin</p>
                                    </div>
                                ) : (
                                <div className="flex flex-col gap-4">
                                    {/* Main Comparison View */}
                                    <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center min-h-[400px] max-h-[60vh]">
                                        {generatedImage ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ReactCompareImage 
                                                    leftImage={selectedImage} 
                                                    rightImage={generatedImage} 
                                                    sliderLineWidth={2}
                                                    handleSize={40}
                                                />
                                            </div>
                                        ) : (
                                            <img 
                                                src={selectedImage} 
                                                alt="Original" 
                                                className="max-w-full max-h-[60vh] w-auto h-auto object-contain" 
                                            />
                                        )}
                                        
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-blue-400 font-medium animate-pulse">{processingStage}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Side-by-Side Preview (Only when generated) */}
                                    {generatedImage && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-500 text-center uppercase tracking-wider">Öncesi</p>
                                                <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-[4/3]">
                                                    <img src={selectedImage} alt="Before" className="w-full h-full object-contain" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs text-blue-500 text-center uppercase tracking-wider">Sonrası</p>
                                                <div className="rounded-xl overflow-hidden border border-blue-500/30 bg-black aspect-[4/3]">
                                                    <img src={generatedImage} alt="After" className="w-full h-full object-contain" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>

                            {/* Right: Controls */}
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Materyal & Stil Seçimi</label>
                                    <div className="space-y-2">
                                        {MATERIALS.map((mat) => (
                                            <button
                                                key={mat.id}
                                                onClick={() => setSelectedMaterial(mat.id)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedMaterial === mat.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'}`}
                                            >
                                                <div className="font-medium text-sm">{mat.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Hekim/Teknisyen Notları (Opsiyonel)</label>
                                    <textarea
                                        value={expertNotes}
                                        onChange={(e) => setExpertNotes(e.target.value)}
                                        placeholder="Örn: Kanin dişleri biraz daha sivri olsun, A1 renk kodu..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 min-h-[100px]"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={!selectedImage || isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" /> Tasarımı Oluştur
                                </button>
                                
                                {generatedImage && (
                                    <a 
                                        href={generatedImage} 
                                        download="smile-design-v2.png"
                                        className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-center transition-colors"
                                    >
                                        Sonucu İndir
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* History Grid */}
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Geçmiş Tasarımlar
        </h2>

        {generations.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border border-dashed border-slate-800">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">Henüz tasarım yok</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              İlk gülüş tasarımınızı oluşturmak için "Yeni Tasarım" butonuna tıklayın.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((gen) => (
              <div key={gen.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-900/10">
                <img 
                  src={gen.image_url} 
                  alt={`Design ${gen.id}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <div className="text-xs text-slate-400 mb-1">
                    {new Date(gen.created_at).toLocaleDateString('tr-TR')}
                  </div>
                  <a 
                    href={gen.image_url} 
                    target="_blank"
                    className="flex items-center gap-2 text-white font-medium hover:text-blue-400 transition-colors"
                  >
                    Görüntüle <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
