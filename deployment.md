# Smile Design AI - Online Deployment Guide (Ücretsiz & Tek Servis)

Bu projeyi **tek bir ücretsiz servis** olarak Render'da çalıştırıyoruz.

## Nasıl Güncellenir?

1.  **Değişiklikleri Gönderin:**
    Terminalde şu komutları çalıştırın:
    ```bash
    git add .
    git commit -m "Fix: Consolidate to single service"
    git push origin main
    ```

2.  **Render'da İzleyin:**
    Render Dashboard'da `smile-design-ai` servisinizin yeniden deploy olduğunu göreceksiniz.
    
    *Not: Eğer daha önce `smile-design-frontend` diye ikinci bir servis açtıysanız, onu silebilirsiniz. Artık ihtiyacımız yok.*

## Kurulum (Sıfırdan Yapacaklar İçin)

1.  [Render.com](https://render.com)'a gidin.
2.  **New +** -> **Blueprint** seçin.
3.  GitHub projenizi seçin.
4.  **Apply** butonuna basın.
5.  Servis oluştuktan sonra **Environment** kısmına `REPLICATE_API_TOKEN` eklemeyi unutmayın.

## Sonuç
Uygulamanız (hem site hem API) şu adreste çalışacak:
`https://smile-design-ai.onrender.com`
