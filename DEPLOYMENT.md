# Er Zeytin - Sunucu Kurulum Notlari

Bu dokuman, projeyi Linux sunucuda (Ubuntu/Debian) ayaga kaldirmak icin pratik adimlari icerir.

## 1) Sunucu Gereksinimleri

- Node.js 20+
- npm 10+
- Docker + Docker Compose plugin
- Nginx
- PM2 (backend surec yonetimi)

## 2) Kaynak Kodu Cek

```bash
cd /var/www
git clone https://github.com/fayihyalcin/erzeytin.git
cd erzeytin
```

## 3) Ortam Degiskenlerini Hazirla

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` icinde en az su degerleri uretim icin guncelleyin:

- `DB_SYNC=false`
- `JWT_SECRET=<guclu_ve_uzun_bir_deger>`
- `CORS_ORIGIN=https://alanadiniz.com`
- `UPLOAD_DIR=uploads`
- `ADMIN_PASSWORD=<guclu_admin_sifresi>`
- `REP_PASSWORD=<guclu_temsilci_sifresi>`

`frontend/.env`:

- `VITE_API_URL=/api`

Not: Upload edilen medya dosyalari varsayilan olarak `backend/uploads` altina yazilir. PM2 ile backend'i calistiran kullanicinin bu klasore yazma izni oldugundan emin olun.

## 4) PostgreSQL ve Redis Servislerini Ac

```bash
docker compose up -d
```

## 5) Paketleri Kur ve Build Al

```bash
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run db:migrate
npm --prefix backend run build
npm --prefix frontend run build
```

Not: Eger veritabani zaten doluysa ve tablolar mevcutsa bir kez `npm --prefix backend run db:baseline` komutuyla migration kaydi olusturup sonra `db:migrate` calistirin.

## 6) Backend'i PM2 Ile Calistir

```bash
npm install -g pm2
pm2 start "npm --prefix backend run start:prod" --name zeytin-backend
pm2 save
pm2 startup
```

Backend varsayilan olarak `3000` portunda calisir.

## 7) Nginx Ayari

`deploy/nginx.example.conf` dosyasini referans alarak Nginx site konfigurasyonu olusturun:

```bash
sudo cp deploy/nginx.example.conf /etc/nginx/sites-available/erzeytin
sudo ln -s /etc/nginx/sites-available/erzeytin /etc/nginx/sites-enabled/erzeytin
sudo nginx -t
sudo systemctl reload nginx
```

Notlar:

- `server_name` alanini kendi domaininizle degistirin.
- `root` yolunu repo konumunuza gore guncelleyin.
- `/uploads/` blogu backend'e proxy edilmelidir; ornek konfigurasyonda bu hazir.
- Buyuk medya yuklemeleri icin Nginx tarafinda `client_max_body_size 0;` tanimlidir. Mevcut sunucuda 413 hatasi aliyorsaniz aktif Nginx config icinde ayni ayarin yer aldigini `nginx -T | grep client_max_body_size` ile kontrol edin.

## 8) SSL (Lets Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alanadiniz.com -d www.alanadiniz.com
```

## 9) Guncelleme Akisi

```bash
cd /var/www/erzeytin
git pull
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run db:migrate
npm --prefix backend run build
npm --prefix frontend run build
pm2 restart zeytin-backend
sudo systemctl reload nginx
```

Medya yukleme sonrasi hala boyut limiti hatasi aliyorsaniz:

```bash
sudo nginx -T | grep client_max_body_size -n
sudo editor /etc/nginx/sites-available/erzeytin
sudo nginx -t
sudo systemctl reload nginx
```

`server {}` blogu icine su ayari ekleyin:

```nginx
client_max_body_size 0;
client_body_timeout 300s;

location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_request_buffering off;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
