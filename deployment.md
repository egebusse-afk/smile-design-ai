# Smile Design AI - Online Deployment Guide

Bu projeyi online'a taşımak için en kolay ve hızlı yöntem **Vercel** (Frontend için) ve **Render** (Backend için) kullanmaktır. İkisi de ücretsiz başlangıç paketleri sunar.

## Adım 1: Projeyi GitHub'a Yükleyin

Projeniz şu an bilgisayarınızda hazır. Bunu GitHub'a yüklemeniz gerekiyor.

1.  [GitHub](https://github.com) hesabınıza giriş yapın.
2.  **New Repository** diyerek yeni bir depo oluşturun (örn: `smile-design-ai`).
3.  "Public" veya "Private" seçebilirsiniz.
4.  Oluşturduktan sonra size verilen komutları terminalde çalıştırarak kodunuzu yükleyin:

```bash
# Terminalde proje klasöründe olduğunuzdan emin olun
git remote add origin https://github.com/KULLANICI_ADINIZ/smile-design-ai.git
git branch -M main
git push -u origin main
```

## Adım 2: Backend'i Render'a Yükleyin (Python API)

1.  [Render.com](https://render.com) adresine gidin ve üye olun.
2.  **New +** -> **Web Service** seçin.
3.  GitHub deponuzu bağlayın ve seçin.
4.  Render otomatik olarak `backend` klasörünü algılayacaktır (veya `Root Directory` olarak `backend` yazın).
5.  **Environment Variables** kısmına şunu ekleyin:
    *   Key: `REPLICATE_API_TOKEN`
    *   Value: `r8_...` (Replicate anahtarınız)
6.  **Create Web Service** butonuna basın.
7.  Deploy bitince size `https://smile-design-backend.onrender.com` gibi bir URL verecek. **Bu URL'i kopyalayın.**

## Adım 3: Frontend'i Vercel'e Yükleyin (Next.js)

1.  [Vercel.com](https://vercel.com) adresine gidin ve üye olun.
2.  **Add New...** -> **Project** seçin.
3.  GitHub deponuzu seçin (Import).
4.  **Root Directory** kısmında `Edit`'e basın ve `frontend` klasörünü seçin.
5.  **Environment Variables** kısmına şunu ekleyin:
    *   Key: `NEXT_PUBLIC_API_URL`
    *   Value: `https://smile-design-backend.onrender.com` (Render'dan aldığınız URL - sonunda / olmasın)
6.  **Deploy** butonuna basın.

Tebrikler! 🎉 Projeniz artık internette canlı yayında.
