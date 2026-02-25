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
- `ADMIN_PASSWORD=<guclu_admin_sifresi>`
- `REP_PASSWORD=<guclu_temsilci_sifresi>`

`frontend/.env`:

- `VITE_API_URL=/api`

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
