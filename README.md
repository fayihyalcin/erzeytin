# Er Zeytin

Monorepo yapisinda bir e-ticaret yonetim paneli + vitrinden olusan proje.

## Teknolojiler

- Backend: Node.js + TypeScript + NestJS
- Frontend: React + TypeScript + Vite
- Veritabani: PostgreSQL
- Cache / Realtime: Redis + Socket.io

## Klasor Yapisi

- `backend`: API, kimlik dogrulama, urun/kategori/siparis yonetimi
- `frontend`: admin panel + musteri vitrini
- `docker-compose.yml`: PostgreSQL ve Redis servisleri

## Gereksinimler

- Node.js 20+
- npm 10+
- Docker + Docker Compose (PostgreSQL/Redis icin)

## Lokal Gelistirme Kurulumu

1. Veritabani servislerini kaldir:

```bash
docker compose up -d
```

2. Ortam dosyalarini olustur:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Bagimliliklari kur:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

4. Gelistirme modunda calistir:

```bash
npm run dev
```

Uygulama:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

## Varsayilan Giris Bilgileri

- Kullanici: `admin`
- Sifre: `admin123`

Ilk kurulumdan sonra sifreyi degistirmeniz onerilir.

## Build

```bash
npm run build
```

Bu komut backend ve frontend icin production build alir.

## Sunucu Kurulumu

Detayli kurulum adimlari icin [DEPLOYMENT.md](DEPLOYMENT.md) dosyasini kullanin.
