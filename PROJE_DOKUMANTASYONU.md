# SmileBot.ai - Proje Dokümantasyonu

## 1. Proje Hakkında
**SmileBot.ai**, yapay zeka destekli bir gülüş tasarımı simülasyon aracıdır. Kullanıcıların yüklediği fotoğraflar üzerinde diş estetiği analizi yaparak, "Hollywood Smile", "Doğal Beyazlık" veya "Zirkonyum" gibi farklı stillerde yeni gülüşler tasarlar. Sistem, profesyonel dental fotoğrafçılık standartlarında, yüksek çözünürlüklü ve gerçekçi sonuçlar üretmek için gelişmiş üretken yapay zeka modellerini kullanır.

## 2. Teknoloji Yığını (Tech Stack)

### Frontend (Ön Yüz)
- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS
- **Animasyon**: Framer Motion
- **İkonlar**: Lucide React
- **Görsel Karşılaştırma**: React Compare Image

### Backend (Arka Yüz)
- **Framework**: FastAPI (Python)
- **Veritabanı**: SQLite (SQLAlchemy ORM)
- **Kimlik Doğrulama**: JWT (JSON Web Tokens)
- **Görüntü İşleme**: OpenCV, NumPy, PIL
- **AI Entegrasyonu**: Replicate API

### Yapay Zeka (AI Pipeline)
1.  **Maskeleme (Masking)**: OpenCV ve MediaPipe (veya Replicate Face Parsing) kullanılarak diş bölgesinin hassas tespiti.
2.  **Üretim (Inpainting)**: `Stability AI - SDXL Inpainting` modeli ile yüksek kaliteli diş dokusu ve ışıklandırma üretimi.
3.  **Restorasyon (Restoration)**: `CodeFormer` modeli ile yüz ve diş detaylarının netleştirilmesi ve iyileştirilmesi.

## 3. Sistem Mimarisi

### 3.1. Frontend Mimarisi
Kullanıcı arayüzü modern, "glassmorphism" tasarım dilini benimser ve tamamen mobildir uyumludur.
- **`app/page.tsx`**: Ana karşılama sayfası. Kullanıcı giriş durumunu kontrol eder ve yönlendirir.
- **`app/login/page.tsx`**: Kullanıcı kayıt ve giriş işlemleri.
- **`app/dashboard/page.tsx`**: Kullanıcının geçmiş tasarımlarını görüntülediği panel.

### 3.2. Backend Mimarisi
RESTful API yapısında çalışan servis, görüntü işleme ve AI isteklerini yönetir.
- **`main.py`**: API endpoint'leri (`/generate-smile`, `/register`, `/history` vb.).
- **`auth.py`**: Kullanıcı doğrulama ve token yönetimi.
- **`database.py`**: Veritabanı modelleri (`User`, `Generation`) ve bağlantı ayarları.
- **`generative_service.py`**: Replicate API ile iletişim kuran ana AI servisi.
- **`image_processing.py`**: Görüntü ön işleme ve maskeleme mantığı.

## 4. Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18+)
- Python (v3.9+)
- Replicate API Token

### Adım 1: Backend Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`.env` dosyası oluşturun ve API anahtarınızı ekleyin:
```env
REPLICATE_API_TOKEN=r8_...
SECRET_KEY=gizli_anahtariniz
```

Sunucuyu başlatın:
```bash
uvicorn main:app --reload
```
Backend `http://localhost:8000` adresinde çalışacaktır.

### Adım 2: Frontend Kurulumu
```bash
cd frontend
npm install
```

`.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Uygulamayı başlatın:
```bash
npm run dev
```
Frontend `http://localhost:3000` adresinde çalışacaktır.

## 5. Özellikler

### 🔐 Kullanıcı Sistemi
- **Kayıt Ol / Giriş Yap**: Güvenli hesap oluşturma.
- **Oturum Yönetimi**: JWT ile güvenli oturumlar.

### 🎨 AI Gülüş Tasarımı
- **Otomatik Maskeleme**: Dişlerin otomatik tespiti.
- **Prompt Seçenekleri**:
    - *Natural White*: Doğal ve anatomik görünüm.
    - *Hollywood Smile*: Parlak, mükemmel hizalanmış dişler.
    - *Zirconium*: Premium, yarı saydam doku.
- **Öncesi/Sonrası**: Kaydırmalı karşılaştırma aracı.

### 📊 Dashboard (Panel)
- **Geçmiş**: Eski tasarımların saklanması ve listelenmesi.
- **İndirme**: Yüksek çözünürlüklü sonuçların indirilmesi.

## 6. Geliştirme Notları
- **Veritabanı**: Şu an SQLite kullanılmaktadır. Prodüksiyon ortamında PostgreSQL'e geçiş önerilir.
- **Dosya Depolama**: Görseller şu an geçici URL'ler veya Base64 olarak işlenmektedir. Prodüksiyon için AWS S3 veya benzeri bir bulut depolama çözümü entegre edilmelidir.
- **AI Maliyeti**: Her üretim işlemi Replicate üzerinde kredi harcar.

---
*Bu doküman 27.11.2025 tarihinde oluşturulmuştur.*
