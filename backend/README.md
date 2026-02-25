# Backend

NestJS tabanli API katmani.

## Gelistirme

```bash
npm install
npm run start:dev
```

## Production

```bash
npm run build
npm run start:prod
```

## Veritabani (Drizzle)

```bash
# yeni migration uret
npm run db:generate

# localde tablolar zaten varsa migration kaydi olustur
npm run db:baseline

# migrationlari uygula
npm run db:migrate
```

Ortam degiskenleri icin `backend/.env.example` dosyasini baz alin. `DB_SYNC=false` ile kullanin.
