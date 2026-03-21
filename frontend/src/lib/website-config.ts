import type {
  WebsiteConfig,
  WebsiteContactInfo,
  WebsiteContactPageContent,
  WebsiteFeatureItem,
  WebsiteFooterColumn,
  WebsiteFooterLink,
  WebsiteHeroSlide,
  WebsiteHomeSections,
  WebsiteLegalDocument,
  WebsiteLegalPagesConfig,
  WebsiteManagedPageContent,
  WebsiteManagedPagesConfig,
  WebsiteNavItem,
  WebsiteParallaxCard,
  WebsitePromoCard,
  WebsiteRibbonConfig,
  WebsiteThemeConfig,
} from '../types/api';
import { canonicalizeAssetUrl } from './asset-url';

const DEFAULT_THEME: WebsiteThemeConfig = {
  brandName: 'Er Zeytincilik',
  tagline: "Ege'den sofrana do\u011fal lezzet",
  adminButtonLabel: 'Y\u00f6netim Giri\u015fi',
};

const DEFAULT_NAV_ITEMS: WebsiteNavItem[] = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'Kategoriler', href: '/kategoriler' },
  { label: '\u00dcr\u00fcnler', href: '/urunler' },
  { label: 'Kampanyalar', href: '/kampanyalar' },
  { label: 'Yaz\u0131lar', href: '/#blog' },
  { label: '\u0130leti\u015fim', href: '/iletisim' },
];

const DEFAULT_HERO_SLIDES: WebsiteHeroSlide[] = [
  {
    badge: 'Yeni Hasat',
    title: 'Ayval\u0131k Erken Hasat S\u0131zma Zeytinya\u011f\u0131',
    subtitle: 'Ta\u015f de\u011firmen, so\u011fuk s\u0131k\u0131m, y\u00fcksek polifenol',
    description:
      'Aromas\u0131 g\u00fc\u00e7l\u00fc, meyvemsili\u011fi y\u00fcksek premium s\u0131zma serimizi bug\u00fcn ke\u015ffedin.',
    ctaLabel: '\u015eimdi \u0130ncele',
    ctaHref: '/urunler',
    imageUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    posterUrl: '',
  },
  {
    badge: 'Y\u00f6resel Se\u00e7ki',
    title: 'Gemlik Siyah Zeytin Koleksiyonu',
    subtitle: 'Do\u011fal fermantasyon, iri tane se\u00e7imi',
    description:
      'Kahvalt\u0131l\u0131k ve mezelik se\u00e7eneklerde sofran\u0131za uygun taze \u00fcr\u00fcnleri se\u00e7in.',
    ctaLabel: '\u015eimdi \u0130ncele',
    ctaHref: '/urunler',
    imageUrl:
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    posterUrl: '',
  },
  {
    badge: 'Butik Seri',
    title: 'K\u0131r\u0131lm\u0131\u015f Ye\u015fil Zeytin ve Gurme Paketler',
    subtitle: 'Limonlu, kekikli ve ac\u0131 biberli se\u00e7enekler',
    description:
      'At\u0131\u015ft\u0131rmal\u0131k ve servislik paketlerle zeytin lezzetini her ana ta\u015f\u0131y\u0131n.',
    ctaLabel: '\u015eimdi \u0130ncele',
    ctaHref: '/urunler',
    imageUrl:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    posterUrl: '',
  },
];

const DEFAULT_PARALLAX_CARDS: WebsiteParallaxCard[] = [
  {
    title: 'Erken Hasat \u00d6zel Se\u00e7ki',
    subtitle: 'Ayval\u0131k bah\u00e7elerinden so\u011fuk s\u0131k\u0131m tazelik',
    ctaLabel: 'Koleksiyonu \u0130ncele',
    ctaHref: '/urunler',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1800&q=80',
  },
  {
    title: 'Butik \u00dcretim Siyah Zeytin',
    subtitle: 'Geleneksel fermantasyon, do\u011fal aroma',
    ctaLabel: 'Lezzetleri Ke\u015ffet',
    ctaHref: '/kampanyalar',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80',
  },
];

const DEFAULT_PROMO_CARDS: WebsitePromoCard[] = [
  {
    title: 'Erken Hasat Serisinde 3 Al 2 \u00d6de',
    subtitle: '500 ml ve 750 ml cam \u015fi\u015fe \u00fcr\u00fcnlerinde ge\u00e7erli kampanya',
    ctaLabel: '\u015eimdi \u0130ncele',
    ctaHref: '/urunler',
    imageUrl:
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Kahvalt\u0131l\u0131k Zeytin Paketleri',
    subtitle: 'Aile boyu siyah ve ye\u015fil zeytin paketlerinde haftal\u0131k indirim',
    ctaLabel: 'Detay\u0131 G\u00f6r',
    ctaHref: '/kampanyalar',
    imageUrl:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Kurumsal Tedarik ve Hediye Kutular\u0131',
    subtitle:
      'Restoranlar, oteller ve kurumsal firmalar i\u00e7in \u00f6zel fiyatland\u0131rma',
    ctaLabel: 'Teklif Al',
    ctaHref: '/iletisim',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1400&q=80',
  },
];

const DEFAULT_RIBBON: WebsiteRibbonConfig = {
  eyebrow: 'Do\u011fadan sofraya \u00f6zel seri',
  title: 'Zeytinya\u011f\u0131 ve zeytinlerde taze dolum kampanyalar\u0131',
  ctaLabel: 'Kampanyay\u0131 A\u00e7',
  ctaHref: '/kampanyalar',
  imageUrl:
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=2000&q=80',
};

const DEFAULT_FEATURE_ITEMS: WebsiteFeatureItem[] = [
  {
    icon: 'truck',
    title: 'H\u0131zl\u0131 Kargo',
    description: "Saat 14:00'e kadar verilen sipari\u015fler ayn\u0131 g\u00fcn kargoda.",
  },
  {
    icon: 'leaf',
    title: 'Do\u011fal \u00dcretim',
    description: 'Katk\u0131s\u0131z, filtreli veya filtresiz naturel s\u0131zma se\u00e7enekleri.',
  },
  {
    icon: 'shield',
    title: 'G\u00fcvenli \u00d6deme',
    description: '3D Secure destekli g\u00fcvenli online \u00f6deme altyap\u0131s\u0131.',
  },
  {
    icon: 'gift',
    title: 'Hediye Paketi',
    description: '\u00d6zel kutu ve not kart\u0131 ile g\u00f6nderim se\u00e7enekleri.',
  },
];

const DEFAULT_CONTACT: WebsiteContactInfo = {
  phoneDisplay: '0530 516 54 98',
  phoneLink: 'tel:+905305165498',
  whatsappLink:
    'https://wa.me/905305165498?text=Merhaba%2C%20siparis%20ve%20odeme%20hakkinda%20bilgi%20almak%20istiyorum.',
  email: 'celalergida@gmail.com',
  address: '\u00c7epni mahallesi \u00c7epni 25. sokak no:3 Mudanya/Bursa',
  workingHours: 'Pazartesi - Cumartesi, 09:00 - 18:00',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=%C3%87epni%20mahallesi%20%C3%87epni%2025.%20sokak%20no%3A3%20Mudanya%20Bursa&output=embed',
};

const DEFAULT_HOME_SECTIONS: WebsiteHomeSections = {
  hotDealsTitle: 'G\u00fcn\u00fcn S\u0131cak F\u0131rsatlar\u0131',
  hotDealsDescription:
    'G\u00fcn\u00fcn en h\u0131zl\u0131 hareket eden \u00fcr\u00fcnlerini tek alanda y\u00f6netin.',
  featuredTitle: '\u00d6ne \u00c7\u0131kan \u00dcr\u00fcnler',
  featuredDescription: 'Ay\u0131n en \u00e7ok tercih edilen zeytin ve zeytinya\u011f\u0131 \u00fcr\u00fcnleri',
  bestSellersTitle: '\u00c7ok Satanlar',
  bestSellersDescription: 'Daimi talep g\u00f6ren \u00fcr\u00fcnleri \u00f6ne \u00e7\u0131kar\u0131n.',
  popularTitle: 'En Pop\u00fcler',
  popularDescription:
    'Yeni gelen \u00fcr\u00fcnleri \u00f6zenle se\u00e7ilmi\u015f koleksiyonda ke\u015ffedin',
  blogTitle: 'Yaz\u0131lar ve Rehberler',
  blogDescription: 'Blog, tarif ve marka hikayelerinizi bu alandan yay\u0131nlay\u0131n.',
};

const DEFAULT_CONTACT_PAGE: WebsiteContactPageContent = {
  badge: '7/24 H\u0131zl\u0131 \u0130leti\u015fim',
  title: '\u0130leti\u015fim Merkezi',
  description:
    'Sipari\u015f, \u00f6deme, kargo, iade ve kurumsal talepleriniz i\u00e7in bize telefon, WhatsApp veya e-posta \u00fczerinden hemen ula\u015fabilirsiniz.',
  quickInfoTitle: 'H\u0131zl\u0131 Eri\u015fim Bilgileri',
  mapTitle: 'Ma\u011faza Konumu',
  mapDescription: 'Mudanya Bursa operasyon merkezimize haritadan ula\u015f\u0131n.',
  formTitle: 'H\u0131zl\u0131 Mesaj Formu',
  formDescription:
    'Mesaj\u0131n\u0131z\u0131 b\u0131rak\u0131n, ekibimiz en k\u0131sa s\u00fcrede d\u00f6n\u00fc\u015f sa\u011flas\u0131n.',
  footerDescription:
    'Do\u011fal zeytin ve zeytinya\u011f\u0131 \u00fcr\u00fcnlerinde g\u00fcvenli \u00f6deme, h\u0131zl\u0131 teslimat ve m\u00fc\u015fteri odakl\u0131 destek deneyimi.',
};

const DEFAULT_MANAGED_PAGES: WebsiteManagedPagesConfig = {
  categories: {
    badge: 'Koleksiyonlar',
    title: 'T\u00fcm kategorileri modern vitrinle ke\u015ffedin',
    description:
      'Her kategori kendi \u00fcr\u00fcn se\u00e7kisi, g\u00f6rseli ve a\u00e7\u0131klamas\u0131yla y\u00f6netilir; m\u00fc\u015fteriler arad\u0131\u011f\u0131 gruba tek t\u0131kla ula\u015f\u0131r.',
    primaryCtaLabel: '\u00dcr\u00fcnleri G\u00f6r',
    primaryCtaHref: '/urunler',
    secondaryCtaLabel: '\u0130leti\u015fime Ge\u00e7',
    secondaryCtaHref: '/iletisim',
    mediaUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1800&q=80',
    videoUrl: '',
    posterUrl: '',
    summaryTitle: 'Kategori operasyonu',
    summaryText:
      'Kategori isimleri, a\u00e7\u0131klamalar\u0131, kapak g\u00f6rselleri ve SEO alanlar\u0131 admin panelinden tam y\u00f6netilir.',
    highlights: [
      'Kategori kapak g\u00f6rselleri admin panelinden de\u011fi\u015ftirilebilir',
      '\u00dcr\u00fcn adetleri ve \u00f6ne \u00e7\u0131kan gruplar otomatik hesaplan\u0131r',
      'Mobilde h\u0131zl\u0131 ge\u00e7i\u015f ve filtre deneyimi sunar',
    ],
  },
  products: {
    badge: 'Ma\u011faza',
    title: 'T\u00fcm \u00fcr\u00fcnler tek ak\u0131\u015fta, h\u0131zl\u0131 filtrelerle',
    description:
      'Modern e-ticaret katalog yap\u0131s\u0131 ile \u00fcr\u00fcnler kategoriye g\u00f6re filtrelenir, h\u0131zl\u0131 sepete ekleme ve detay ge\u00e7i\u015fiyle desteklenir.',
    primaryCtaLabel: 'Sepeti A\u00e7',
    primaryCtaHref: '/cart',
    secondaryCtaLabel: 'Kampanyalar\u0131 \u0130ncele',
    secondaryCtaHref: '/kampanyalar',
    mediaUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1800&q=80',
    videoUrl: '',
    posterUrl: '',
    summaryTitle: '\u00dcr\u00fcn y\u00f6netimi',
    summaryText:
      '\u00dcr\u00fcnler, g\u00f6rseller, fiyatlar, stok, varyantlar ve SEO alanlar\u0131 admin taraf\u0131ndan tek tek d\u00fczenlenir.',
    highlights: [
      'Kategoriye g\u00f6re filtreleme ve arama',
      'H\u0131zl\u0131 sepete ekleme ve \u00fcr\u00fcn detay ge\u00e7i\u015fi',
      'Stok ve indirim bilgisi kart seviyesinde g\u00f6r\u00fcn\u00fcr',
    ],
  },
  campaigns: {
    badge: 'F\u0131rsatlar',
    title: 'Kampanyalar, vitrin bloklar\u0131 ve promosyon ak\u0131\u015flar\u0131',
    description:
      'Ribbon, promo kartlar\u0131 ve kampanya g\u00f6rselleriyle ma\u011faza i\u00e7indeki sat\u0131\u015f odakl\u0131 bloklar\u0131 tek merkezden y\u00f6netin.',
    primaryCtaLabel: '\u0130ndirimli \u00dcr\u00fcnleri G\u00f6r',
    primaryCtaHref: '/urunler',
    secondaryCtaLabel: 'Teklif Al',
    secondaryCtaHref: '/iletisim',
    mediaUrl:
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1800&q=80',
    videoUrl: '',
    posterUrl: '',
    summaryTitle: 'Kampanya kontrol\u00fc',
    summaryText:
      'Anasayfa kampanya bloklar\u0131, bannerlar, ribbon alan\u0131 ve sayfa kahraman i\u00e7eri\u011fi admin panelinden y\u00f6netilir.',
    highlights: [
      'Promo kartlar\u0131 ve ribbon bloklar\u0131 adminden gelir',
      '\u0130ndirimli \u00fcr\u00fcnler dinamik olarak \u00f6ne \u00e7\u0131kar\u0131l\u0131r',
      'Kurumsal teklif ve ileti\u015fim \u00e7a\u011fr\u0131lar\u0131 eklenebilir',
    ],
  },
};

const DEFAULT_FOOTER_COLUMNS: WebsiteFooterColumn[] = [
  {
    title: 'Kurumsal',
    links: [
      { label: 'Hakk\u0131m\u0131zda', href: '/' },
      { label: '\u00dcretim S\u00fcreci', href: '/kampanyalar' },
      { label: 'Sertifikalar', href: '/kampanyalar' },
      { label: '\u0130leti\u015fim', href: '/iletisim' },
    ],
  },
  {
    title: 'M\u00fc\u015fteri Hizmetleri',
    links: [
      { label: 'S\u0131k\u00e7a Sorulan Sorular', href: '/gizlilik' },
      { label: 'Kargo ve Teslimat', href: '/satis-sozlesmesi' },
      { label: '\u0130ade Politikas\u0131', href: '/satis-sozlesmesi' },
    ],
  },
  {
    title: 'Hesab\u0131m',
    links: [
      { label: 'Sipari\u015flerim', href: '/customer/dashboard' },
      { label: 'M\u00fc\u015fteri Giri\u015fi', href: '/customer/login' },
      { label: 'Kay\u0131t Ol', href: '/customer/register' },
    ],
  },
];

const DEFAULT_LEGAL_PAGES: WebsiteLegalPagesConfig = {
  kvkk: {
    title: 'KVKK Ayd\u0131nlatma Metni',
    subtitle:
      '6698 say\u0131l\u0131 Ki\u015fisel Verilerin Korunmas\u0131 Kanunu kapsam\u0131nda veri i\u015fleme s\u00fcre\u00e7lerimiz.',
    sections: [
      {
        heading: '1. Veri Sorumlusu',
        body:
          'Bu ayd\u0131nlatma metni, veri sorumlusu s\u0131fat\u0131yla Er Zeytin G\u0131da ve E-Ticaret \u0130\u015fletmesi taraf\u0131ndan m\u00fc\u015fterilerimizin ki\u015fisel verilerinin i\u015flenmesine ili\u015fkin olarak haz\u0131rlanm\u0131\u015ft\u0131r.',
      },
      {
        heading: '2. \u0130\u015flenen Ki\u015fisel Veriler',
        body:
          'Ad soyad, telefon, e-posta, teslimat ve fatura adresleri, sipari\u015f bilgileri, \u00f6deme durumu, i\u015flem kay\u0131tlar\u0131 ve ileti\u015fim talepleri kanuni y\u00fck\u00fcml\u00fcl\u00fckler kapsam\u0131nda i\u015flenmektedir.',
      },
      {
        heading: '3. \u0130\u015fleme Amac\u0131 ve Hukuki Sebep',
        body:
          'Veriler; sipari\u015fin al\u0131nmas\u0131, \u00f6demenin do\u011frulanmas\u0131, \u00fcr\u00fcn\u00fcn teslimi, sat\u0131\u015f sonras\u0131 destek, muhasebe ve yasal y\u00fck\u00fcml\u00fcl\u00fcklerin yerine getirilmesi ama\u00e7lar\u0131yla KVKK madde 5/2 kapsam\u0131ndaki hukuki sebeplere dayan\u0131larak i\u015flenmektedir.',
      },
      {
        heading: '4. Aktar\u0131m ve Saklama',
        body:
          'Veriler, \u00f6deme ve kargo operasyonu i\u00e7in gerekli oldu\u011fu \u00f6l\u00e7\u00fcde yetkili i\u015f ortaklar\u0131 ve resmi kurumlarla payla\u015f\u0131labilir. Kay\u0131tlar, ilgili mevzuatta belirtilen yasal s\u00fcreler boyunca saklan\u0131r ve s\u00fcre sonunda imha edilir.',
      },
      {
        heading: '5. Haklar\u0131n\u0131z',
        body:
          'KVKK madde 11 kapsam\u0131nda; verilerinize eri\u015fim, d\u00fczeltme, silme, i\u015fleme itiraz ve aktar\u0131m taleplerinizi kvkk@erzeytin.com adresine iletebilirsiniz.',
      },
    ],
  },
  privacy: {
    title: 'Gizlilik Politikas\u0131',
    subtitle:
      'Web sitemizi kullan\u0131rken payla\u015ft\u0131\u011f\u0131n\u0131z veriler i\u00e7in gizlilik taahh\u00fcd\u00fcm\u00fcz.',
    sections: [
      {
        heading: '1. Genel \u0130lke',
        body:
          'M\u00fc\u015fteri verileri gizli kabul edilir. Veriler, sadece hizmetin sunulmas\u0131 ve yasal zorunluluklar\u0131n yerine getirilmesi amac\u0131yla i\u015flenir.',
      },
      {
        heading: '2. \u00c7erezler ve Teknik Veriler',
        body:
          'Site performans\u0131, g\u00fcvenlik ve al\u0131\u015fveri\u015f deneyimini iyile\u015ftirmek amac\u0131yla zorunlu \u00e7erezler ve teknik log kay\u0131tlar\u0131 kullan\u0131l\u0131r. Taray\u0131c\u0131 ayarlar\u0131n\u0131zdan \u00e7erez tercihlerinizi y\u00f6netebilirsiniz.',
      },
      {
        heading: '3. \u00d6deme G\u00fcvenli\u011fi',
        body:
          'Kart bilgileri taraf\u0131m\u0131zca saklanmaz; \u00f6deme s\u00fcreci g\u00fcvenli \u00f6deme altyap\u0131s\u0131 \u00fczerinden y\u00fcr\u00fct\u00fcl\u00fcr. \u0130\u015flem kay\u0131tlar\u0131 yaln\u0131zca finansal mutabakat amac\u0131yla tutulur.',
      },
      {
        heading: '4. \u00dc\u00e7\u00fcnc\u00fc Taraflar',
        body:
          'Kargo, \u00f6deme, muhasebe ve mevzuat kapsam\u0131ndaki zorunlu i\u015flemler haricinde verileriniz izniniz olmadan pazarlama ama\u00e7l\u0131 \u00fc\u00e7\u00fcnc\u00fc ki\u015filerle payla\u015f\u0131lmaz.',
      },
      {
        heading: '5. \u0130leti\u015fim',
        body:
          'Gizlilik ile ilgili talepleriniz i\u00e7in destek@erzeytin.com adresine e-posta g\u00f6nderebilirsiniz.',
      },
    ],
  },
  sales: {
    title: 'Mesafeli Sat\u0131\u015f S\u00f6zle\u015fmesi',
    subtitle:
      'Site \u00fczerinden olu\u015fturulan sipari\u015flerde taraflar\u0131n hak ve y\u00fck\u00fcml\u00fcl\u00fckleri.',
    sections: [
      {
        heading: '1. Taraflar ve Konu',
        body:
          'Sat\u0131c\u0131: Er Zeytin G\u0131da ve E-Ticaret \u0130\u015fletmesi. Al\u0131c\u0131: Sipari\u015fi onaylayan son kullan\u0131c\u0131. \u0130\u015fbu s\u00f6zle\u015fme, internet \u00fczerinden kurulan mesafeli sat\u0131\u015fa ili\u015fkin hak ve y\u00fck\u00fcml\u00fcl\u00fckleri belirler.',
      },
      {
        heading: '2. Sipari\u015f ve \u00d6deme',
        body:
          'Al\u0131c\u0131, sipari\u015f \u00f6ncesinde \u00fcr\u00fcn nitelikleri, toplam tutar, kargo bedeli ve \u00f6deme \u015fekline ili\u015fkin bilgileri g\u00f6rd\u00fc\u011f\u00fcn\u00fc kabul eder. \u00d6deme onay\u0131 al\u0131nmadan sipari\u015f kesinle\u015fmez.',
      },
      {
        heading: '3. Teslimat',
        body:
          'Sipari\u015fler stok durumu ve operasyon yo\u011funlu\u011funa g\u00f6re en k\u0131sa s\u00fcrede kargoya teslim edilir. Teslimat s\u00fcresi; resmi tatiller, olumsuz hava ko\u015fullar\u0131 ve m\u00fc\u015fteri kaynakl\u0131 gecikmelerde farkl\u0131l\u0131k g\u00f6sterebilir.',
      },
      {
        heading: '4. Cayma Hakk\u0131 ve \u0130ade',
        body:
          'Mevzuat kapsam\u0131nda cayma hakk\u0131 bulunan \u00fcr\u00fcnlerde al\u0131c\u0131, teslimattan itibaren 14 g\u00fcn i\u00e7inde iade talebi olu\u015fturabilir. Hijyen, bozulabilir g\u0131da ve ambalaj\u0131 a\u00e7\u0131lm\u0131\u015f \u00fcr\u00fcnlerde iade s\u0131n\u0131rlamalar\u0131 uygulan\u0131r.',
      },
      {
        heading: '5. Uyu\u015fmazl\u0131k ve Y\u00fcr\u00fcm',
        body:
          'Uyu\u015fmazl\u0131k durumunda T\u00fcketici Hakem Heyetleri ve T\u00fcketici Mahkemeleri yetkilidir. \u0130\u015fbu s\u00f6zle\u015fme, al\u0131c\u0131n\u0131n sipari\u015fi onaylad\u0131\u011f\u0131 an y\u00fcr\u00fcrl\u00fc\u011fe girer.',
      },
    ],
  },
};

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

const ASCII_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bYonetim\b/g, 'Y\u00f6netim'],
  [/\bGirisi\b/g, 'Giri\u015fi'],
  [/\bGiris\b/g, 'Giri\u015f'],
  [/\bUrunler\b/g, '\u00dcr\u00fcnler'],
  [/\bUrunleri\b/g, '\u00dcr\u00fcnleri'],
  [/\bUrunu\b/g, '\u00dcr\u00fcn\u00fc'],
  [/\bUrun\b/g, '\u00dcr\u00fcn'],
  [/\bIletisim\b/g, '\u0130leti\u015fim'],
  [/\bIletisime\b/g, '\u0130leti\u015fime'],
  [/\bMusteri\b/g, 'M\u00fc\u015fteri'],
  [/\bMusteriler\b/g, 'M\u00fc\u015fteriler'],
  [/\bSiparis\b/g, 'Sipari\u015f'],
  [/\bOdeme\b/g, '\u00d6deme'],
  [/\bHizli\b/g, 'H\u0131zl\u0131'],
  [/\bGuvenli\b/g, 'G\u00fcvenli'],
  [/\bUcretsiz\b/g, '\u00dcretsiz'],
  [/\bTum\b/g, 'T\u00fcm'],
  [/\bKesfet\b/g, 'Ke\u015ffet'],
  [/\bSimdi\b/g, '\u015eimdi'],
  [/\bCok\b/g, '\u00c7ok'],
  [/\bPopuler\b/g, 'Pop\u00fcler'],
  [/\bOzel\b/g, '\u00d6zel'],
  [/\bDogal\b/g, 'Do\u011fal'],
  [/\bAyvalik\b/g, 'Ayval\u0131k'],
  [/\bSizma\b/g, 'S\u0131zma'],
  [/\bYoresel\b/g, 'Y\u00f6resel'],
  [/\bSecki\b/g, 'Se\u00e7ki'],
  [/\bKahvaltilik\b/g, 'Kahvalt\u0131l\u0131k'],
  [/\bYazilar\b/g, 'Yaz\u0131lar'],
  [/\bAydinlatma\b/g, 'Ayd\u0131nlatma'],
  [/\bKisisel\b/g, 'Ki\u015fisel'],
  [/\bSatis\b/g, 'Sat\u0131\u015f'],
  [/\bIade\b/g, '\u0130ade'],
  [/\bHesabim\b/g, 'Hesab\u0131m'],
  [/\bKayit\b/g, 'Kay\u0131t'],
  [/\bAyin\b/g, 'Ay\u0131n'],
  [/\bGunun\b/g, 'G\u00fcn\u00fcn'],
  [/\bOne\b/g, '\u00d6ne'],
  [/\bAromasi\b/g, 'Aromas\u0131'],
  [/\bguclu\b/g, 'g\u00fc\u00e7l\u00fc'],
  [/\bGuclu\b/g, 'G\u00fc\u00e7l\u00fc'],
  [/\bmeyvemsiligi\b/g, 'meyvemsili\u011fi'],
  [/\bMeyvemsiligi\b/g, 'Meyvemsili\u011fi'],
  [/\byuksek\b/g, 'y\u00fcksek'],
  [/\bYuksek\b/g, 'Y\u00fcksek'],
  [/\bbugun\b/g, 'bug\u00fcn'],
  [/\bBugun\b/g, 'Bug\u00fcn'],
  [/\bsecenekler\b/g, 'se\u00e7enekler'],
  [/\bseceneklerde\b/g, 'se\u00e7eneklerde'],
  [/\bsecenekleri\b/g, 'se\u00e7enekleri'],
  [/\bsecimi\b/g, 'se\u00e7imi'],
  [/\bSecimi\b/g, 'Se\u00e7imi'],
  [/\bsecin\b/g, 'se\u00e7in'],
  [/\bsecili\b/g, 'se\u00e7ili'],
  [/\bsecilmis\b/g, 'se\u00e7ilmi\u015f'],
  [/\bsofraniza\b/g, 'sofran\u0131za'],
  [/\bGorsel\b/g, 'G\u00f6rsel'],
  [/\bgorsel\b/g, 'g\u00f6rsel'],
  [/\bgorselleri\b/g, 'g\u00f6rselleri'],
  [/\baciklama\b/g, 'a\u00e7\u0131klama'],
  [/\baciklamalari\b/g, 'a\u00e7\u0131klamalar\u0131'],
  [/\byonetilir\b/g, 'y\u00f6netilir'],
  [/\byonetilebilir\b/g, 'y\u00f6netilebilir'],
  [/\byonetin\b/g, 'y\u00f6netin'],
  [/\byonlendirme\b/g, 'y\u00f6nlendirme'],
  [/\byonlendirir\b/g, 'y\u00f6nlendirir'],
  [/\bduzenlenir\b/g, 'd\u00fczenlenir'],
  [/\bduyurulari\b/g, 'duyurular\u0131'],
  [/\bTuketici\b/g, 'T\u00fcketici'],
  [/\bMagaza\b/g, 'Ma\u011faza'],
  [/\bmagaza\b/g, 'ma\u011faza'],
  [/\bSikca\b/g, 'S\u0131k\u00e7a'],
  [/\bSicak\b/g, 'S\u0131cak'],
  [/\bFirsatlar\b/g, 'F\u0131rsatlar'],
  [/\bFirsatlari\b/g, 'F\u0131rsatlar\u0131'],
  [/\bUretim\b/g, '\u00dcretim'],
  [/\bYesil\b/g, 'Ye\u015fil'],
  [/\bKirilmis\b/g, 'K\u0131r\u0131lm\u0131\u015f'],
  [/\baci\b/g, 'ac\u0131'],
  [/\bAci\b/g, 'Ac\u0131'],
  [/\bsise\b/g, '\u015fi\u015fe'],
  [/\bSise\b/g, '\u015ei\u015fe'],
  [/\bolcude\b/g, '\u00f6l\u00e7\u00fcde'],
  [/\bUlasin\b/g, 'Ula\u015f\u0131n'],
  [/\bdonus\b/g, 'd\u00f6n\u00fc\u015f'],
  [/\bDonus\b/g, 'D\u00f6n\u00fc\u015f'],
  [/\bsurede\b/g, 's\u00fcrede'],
  [/\bSurede\b/g, 'S\u00fcrede'],
  [/\bsureci\b/g, 's\u00fcreci'],
  [/\bSureci\b/g, 'S\u00fcreci'],
  [/\bsoguk\b/g, 'so\u011fuk'],
  [/\bSoguk\b/g, 'So\u011fuk'],
  [/\bsikim\b/g, 's\u0131k\u0131m'],
  [/\bSikim\b/g, 'S\u0131k\u0131m'],
  [/\bzeytinyagi\b/g, 'zeytinya\u011f\u0131'],
  [/\bZeytinyagi\b/g, 'Zeytinya\u011f\u0131'],
];

function cloneList<T>(items: T[], clone: (item: T) => T) {
  return items.map(clone);
}

function cloneFooterColumns(columns: WebsiteFooterColumn[]) {
  return columns.map((column) => ({
    title: column.title,
    links: column.links.map((link) => ({ ...link })),
  }));
}

function cloneLegalDocument(document: WebsiteLegalDocument): WebsiteLegalDocument {
  return {
    title: document.title,
    subtitle: document.subtitle,
    sections: document.sections.map((section) => ({ ...section })),
  };
}

function cloneManagedPage(page: WebsiteManagedPageContent): WebsiteManagedPageContent {
  return {
    ...page,
    highlights: [...page.highlights],
  };
}

export function createDefaultWebsiteConfig(): WebsiteConfig {
  return {
    theme: normalizeTheme(DEFAULT_THEME, DEFAULT_THEME),
    announcement: normalizeMarketingText(
      'Yeni hasat so\u011fuk s\u0131k\u0131m zeytinya\u011flar\u0131 ve se\u00e7ili zeytin serileri stokta.',
    ),
    navItems: normalizeNavItems(DEFAULT_NAV_ITEMS, DEFAULT_NAV_ITEMS),
    heroSlides: normalizeHeroSlides(DEFAULT_HERO_SLIDES, DEFAULT_HERO_SLIDES),
    parallaxCards: normalizeParallaxCards(DEFAULT_PARALLAX_CARDS, DEFAULT_PARALLAX_CARDS),
    promoCards: normalizePromoCards(DEFAULT_PROMO_CARDS, DEFAULT_PROMO_CARDS),
    ribbon: normalizeRibbon(DEFAULT_RIBBON, DEFAULT_RIBBON),
    featureItems: normalizeFeatureItems(DEFAULT_FEATURE_ITEMS, DEFAULT_FEATURE_ITEMS),
    newsletterTitle: normalizeDisplayText('Lezzet B\u00fcltenine Kat\u0131l\u0131n'),
    newsletterDescription: normalizeDisplayText(
      '\u0130ndirimler, yeni hasat duyurular\u0131 ve zeytinya\u011fl\u0131 tarifler e-posta kutunuza gelsin.',
    ),
    contact: normalizeContact(DEFAULT_CONTACT, DEFAULT_CONTACT),
    homeSections: normalizeHomeSections(DEFAULT_HOME_SECTIONS, DEFAULT_HOME_SECTIONS),
    contactPage: normalizeContactPage(DEFAULT_CONTACT_PAGE, DEFAULT_CONTACT_PAGE),
    pages: {
      categories: normalizeManagedPage(
        DEFAULT_MANAGED_PAGES.categories,
        DEFAULT_MANAGED_PAGES.categories,
      ),
      products: normalizeManagedPage(DEFAULT_MANAGED_PAGES.products, DEFAULT_MANAGED_PAGES.products),
      campaigns: normalizeManagedPage(
        DEFAULT_MANAGED_PAGES.campaigns,
        DEFAULT_MANAGED_PAGES.campaigns,
      ),
    },
    legalPages: {
      kvkk: normalizeLegalDocument(DEFAULT_LEGAL_PAGES.kvkk, DEFAULT_LEGAL_PAGES.kvkk),
      privacy: normalizeLegalDocument(DEFAULT_LEGAL_PAGES.privacy, DEFAULT_LEGAL_PAGES.privacy),
      sales: normalizeLegalDocument(DEFAULT_LEGAL_PAGES.sales, DEFAULT_LEGAL_PAGES.sales),
    },
    footerColumns: normalizeFooterColumns(DEFAULT_FOOTER_COLUMNS, DEFAULT_FOOTER_COLUMNS),
  };
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => toStringValue(item)).filter((item) => item.length > 0);
}

function normalizeMediaUrl(value: unknown, fallback = '') {
  return canonicalizeAssetUrl(toStringValue(value, fallback));
}

function decodeUtf8Mojibake(value: string) {
  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0) & 0xff);
    return UTF8_DECODER.decode(bytes);
  } catch {
    return value;
  }
}

function fixMojibake(value: string) {
  let current = value;

  for (let index = 0; index < 3; index += 1) {
    if (!/[\u00c2-\u00c5\u00e2]/.test(current)) {
      break;
    }

    const decoded = decodeUtf8Mojibake(current);
    if (decoded === current) {
      break;
    }

    current = decoded;
  }

  return current.replace(/\u00a0/g, ' ');
}

function replaceAsciiTurkish(value: string) {
  return ASCII_WORD_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

function normalizeDisplayText(value: string) {
  return replaceAsciiTurkish(fixMojibake(value));
}

function normalizeMarketingText(value: string) {
  return normalizeDisplayText(value)
    .replace(/\bsoguk\b/gi, (match) => (match[0] === 'S' ? 'So\u011fuk' : 'so\u011fuk'))
    .replace(/\bsikim\b/gi, (match) => (match[0] === 'S' ? 'S\u0131k\u0131m' : 's\u0131k\u0131m'))
    .replace(/\bSimdi\b/g, '\u015eimdi');
}

function normalizeTheme(value: unknown, fallback: WebsiteThemeConfig): WebsiteThemeConfig {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteThemeConfig, unknown>>;
  return {
    brandName: normalizeDisplayText(toStringValue(record.brandName, fallback.brandName)),
    tagline: normalizeDisplayText(toStringValue(record.tagline, fallback.tagline)),
    adminButtonLabel: normalizeDisplayText(toStringValue(record.adminButtonLabel, fallback.adminButtonLabel)),
  };
}

function normalizeNavItems(value: unknown, fallback: WebsiteNavItem[]) {
  if (!Array.isArray(value)) {
    return cloneList(fallback, (item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteNavItem, unknown>>;
      const label = toStringValue(record.label);
      const href = toStringValue(record.href);
      if (!label || !href) {
        return null;
      }

      return { label: normalizeDisplayText(label), href };
    })
    .filter((item): item is WebsiteNavItem => item !== null);

  return items.length > 0 ? items : cloneList(fallback, (item) => ({ ...item }));
}

function normalizeHeroSlides(value: unknown, fallback: WebsiteHeroSlide[]) {
  if (!Array.isArray(value)) {
    return cloneList(fallback, (item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = toStringValue(record.title);
      const imageUrl = normalizeMediaUrl(record.imageUrl);
      const videoUrl = normalizeMediaUrl(record.videoUrl);
      const posterUrl = normalizeMediaUrl(record.posterUrl);
      if (!title || (!imageUrl && !videoUrl)) {
        return null;
      }

      return {
        badge: normalizeMarketingText(toStringValue(record.badge)),
        title: normalizeMarketingText(title),
        subtitle: normalizeMarketingText(toStringValue(record.subtitle)),
        description: normalizeMarketingText(toStringValue(record.description)),
        ctaLabel: normalizeDisplayText(
          toStringValue(record.ctaLabel, '\u00dcr\u00fcnleri Ke\u015ffet'),
        ),
        ctaHref: toStringValue(record.ctaHref, '#products'),
        imageUrl,
        videoUrl,
        posterUrl,
      };
    })
    .filter((item): item is WebsiteHeroSlide => item !== null);

  return items.length > 0 ? items : cloneList(fallback, (item) => ({ ...item }));
}

function normalizeParallaxCards(value: unknown, fallback: WebsiteParallaxCard[]) {
  if (!Array.isArray(value)) {
    return cloneList(fallback, (item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteParallaxCard, unknown>>;
      const title = toStringValue(record.title);
      const imageUrl = normalizeMediaUrl(record.imageUrl);
      if (!title || !imageUrl) {
        return null;
      }

      return {
        title: normalizeMarketingText(title),
        subtitle: normalizeMarketingText(toStringValue(record.subtitle)),
        ctaLabel: normalizeDisplayText(toStringValue(record.ctaLabel, 'Ke\u015ffet')),
        ctaHref: toStringValue(record.ctaHref, '#products'),
        imageUrl,
      };
    })
    .filter((item): item is WebsiteParallaxCard => item !== null);

  return items.length > 0 ? items : cloneList(fallback, (item) => ({ ...item }));
}

function normalizePromoCards(value: unknown, fallback: WebsitePromoCard[]) {
  if (!Array.isArray(value)) {
    return cloneList(fallback, (item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsitePromoCard, unknown>>;
      const title = toStringValue(record.title);
      const imageUrl = normalizeMediaUrl(record.imageUrl);
      if (!title || !imageUrl) {
        return null;
      }

      return {
        title: normalizeMarketingText(title),
        subtitle: normalizeMarketingText(toStringValue(record.subtitle)),
        ctaLabel: normalizeDisplayText(toStringValue(record.ctaLabel, 'Detay\u0131 G\u00f6r')),
        ctaHref: toStringValue(record.ctaHref, '#products'),
        imageUrl,
      };
    })
    .filter((item): item is WebsitePromoCard => item !== null);

  return items.length > 0 ? items : cloneList(fallback, (item) => ({ ...item }));
}

function normalizeRibbon(value: unknown, fallback: WebsiteRibbonConfig): WebsiteRibbonConfig {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteRibbonConfig, unknown>>;
  return {
    eyebrow: normalizeMarketingText(toStringValue(record.eyebrow, fallback.eyebrow)),
    title: normalizeMarketingText(toStringValue(record.title, fallback.title)),
    ctaLabel: normalizeDisplayText(toStringValue(record.ctaLabel, fallback.ctaLabel)),
    ctaHref: toStringValue(record.ctaHref, fallback.ctaHref),
    imageUrl: normalizeMediaUrl(record.imageUrl, fallback.imageUrl),
  };
}

function normalizeFeatureItems(value: unknown, fallback: WebsiteFeatureItem[]) {
  if (!Array.isArray(value)) {
    return cloneList(fallback, (item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteFeatureItem, unknown>>;
      const title = toStringValue(record.title);
      if (!title) {
        return null;
      }

      return {
        icon: toStringValue(record.icon, 'leaf'),
        title: normalizeDisplayText(title),
        description: normalizeDisplayText(toStringValue(record.description)),
      };
    })
    .filter((item): item is WebsiteFeatureItem => item !== null);

  return items.length > 0 ? items : cloneList(fallback, (item) => ({ ...item }));
}

function normalizeFooterLinks(value: unknown, fallback: WebsiteFooterLink[]) {
  if (!Array.isArray(value)) {
    return fallback.map((item) => ({ ...item }));
  }

  const links = value
    .map((item) => {
      if (typeof item === 'string') {
        const label = toStringValue(item);
        return label ? { label: normalizeDisplayText(label), href: '#' } : null;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteFooterLink, unknown>>;
      const label = toStringValue(record.label);
      if (!label) {
        return null;
      }

      return {
        label: normalizeDisplayText(label),
        href: toStringValue(record.href, '#'),
      };
    })
    .filter((item): item is WebsiteFooterLink => item !== null);

  return links.length > 0 ? links : fallback.map((item) => ({ ...item }));
}

function normalizeFooterColumns(value: unknown, fallback: WebsiteFooterColumn[]) {
  if (!Array.isArray(value)) {
    return cloneFooterColumns(fallback);
  }

  const columns = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteFooterColumn, unknown>>;
      const title = toStringValue(record.title);
      if (!title) {
        return null;
      }

      const fallbackLinks = fallback[index]?.links ?? [];
      return {
        title: normalizeDisplayText(title),
        links: normalizeFooterLinks(record.links, fallbackLinks),
      };
    })
    .filter((item): item is WebsiteFooterColumn => item !== null);

  return columns.length > 0 ? columns : cloneFooterColumns(fallback);
}

function normalizeContact(value: unknown, fallback: WebsiteContactInfo): WebsiteContactInfo {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteContactInfo, unknown>>;
  return {
    phoneDisplay: toStringValue(record.phoneDisplay, fallback.phoneDisplay),
    phoneLink: toStringValue(record.phoneLink, fallback.phoneLink),
    whatsappLink: toStringValue(record.whatsappLink, fallback.whatsappLink),
    email: toStringValue(record.email, fallback.email),
    address: normalizeDisplayText(toStringValue(record.address, fallback.address)),
    workingHours: normalizeDisplayText(toStringValue(record.workingHours, fallback.workingHours)),
    mapsEmbedUrl: toStringValue(record.mapsEmbedUrl, fallback.mapsEmbedUrl),
  };
}

function normalizeHomeSections(value: unknown, fallback: WebsiteHomeSections): WebsiteHomeSections {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteHomeSections, unknown>>;
  return {
    hotDealsTitle: normalizeDisplayText(toStringValue(record.hotDealsTitle, fallback.hotDealsTitle)),
    hotDealsDescription: normalizeDisplayText(toStringValue(record.hotDealsDescription, fallback.hotDealsDescription)),
    featuredTitle: normalizeDisplayText(toStringValue(record.featuredTitle, fallback.featuredTitle)),
    featuredDescription: normalizeDisplayText(
      toStringValue(record.featuredDescription, fallback.featuredDescription),
    ),
    bestSellersTitle: normalizeDisplayText(toStringValue(record.bestSellersTitle, fallback.bestSellersTitle)),
    bestSellersDescription: normalizeDisplayText(
      toStringValue(record.bestSellersDescription, fallback.bestSellersDescription),
    ),
    popularTitle: normalizeDisplayText(toStringValue(record.popularTitle, fallback.popularTitle)),
    popularDescription: normalizeDisplayText(toStringValue(record.popularDescription, fallback.popularDescription)),
    blogTitle: normalizeDisplayText(toStringValue(record.blogTitle, fallback.blogTitle)),
    blogDescription: normalizeDisplayText(toStringValue(record.blogDescription, fallback.blogDescription)),
  };
}

function normalizeContactPage(
  value: unknown,
  fallback: WebsiteContactPageContent,
): WebsiteContactPageContent {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteContactPageContent, unknown>>;
  return {
    badge: normalizeDisplayText(toStringValue(record.badge, fallback.badge)),
    title: normalizeDisplayText(toStringValue(record.title, fallback.title)),
    description: normalizeDisplayText(toStringValue(record.description, fallback.description)),
    quickInfoTitle: normalizeDisplayText(toStringValue(record.quickInfoTitle, fallback.quickInfoTitle)),
    mapTitle: normalizeDisplayText(toStringValue(record.mapTitle, fallback.mapTitle)),
    mapDescription: normalizeDisplayText(toStringValue(record.mapDescription, fallback.mapDescription)),
    formTitle: normalizeDisplayText(toStringValue(record.formTitle, fallback.formTitle)),
    formDescription: normalizeDisplayText(toStringValue(record.formDescription, fallback.formDescription)),
    footerDescription: normalizeDisplayText(toStringValue(record.footerDescription, fallback.footerDescription)),
  };
}

function normalizeManagedPage(
  value: unknown,
  fallback: WebsiteManagedPageContent,
): WebsiteManagedPageContent {
  if (!value || typeof value !== 'object') {
    return cloneManagedPage(fallback);
  }

  const record = value as Partial<Record<keyof WebsiteManagedPageContent, unknown>>;
  const highlightsRaw = Array.isArray(record.highlights) ? record.highlights : [];
  const highlights = highlightsRaw
    .map((item) => normalizeMarketingText(toStringValue(item)))
    .filter((item) => item.length > 0);

  return {
    badge: normalizeMarketingText(toStringValue(record.badge, fallback.badge)),
    title: normalizeMarketingText(toStringValue(record.title, fallback.title)),
    description: normalizeMarketingText(toStringValue(record.description, fallback.description)),
    primaryCtaLabel: normalizeDisplayText(toStringValue(record.primaryCtaLabel, fallback.primaryCtaLabel)),
    primaryCtaHref: toStringValue(record.primaryCtaHref, fallback.primaryCtaHref),
    secondaryCtaLabel: normalizeDisplayText(toStringValue(record.secondaryCtaLabel, fallback.secondaryCtaLabel)),
    secondaryCtaHref: toStringValue(record.secondaryCtaHref, fallback.secondaryCtaHref),
    mediaUrl: normalizeMediaUrl(record.mediaUrl, fallback.mediaUrl),
    videoUrl: normalizeMediaUrl(record.videoUrl, fallback.videoUrl),
    posterUrl: normalizeMediaUrl(record.posterUrl, fallback.posterUrl),
    summaryTitle: normalizeMarketingText(toStringValue(record.summaryTitle, fallback.summaryTitle)),
    summaryText: normalizeMarketingText(toStringValue(record.summaryText, fallback.summaryText)),
    highlights: highlights.length > 0 ? highlights : [...fallback.highlights],
  };
}

function normalizeManagedPages(
  value: unknown,
  fallback: WebsiteManagedPagesConfig,
): WebsiteManagedPagesConfig {
  if (!value || typeof value !== 'object') {
    return {
      categories: cloneManagedPage(fallback.categories),
      products: cloneManagedPage(fallback.products),
      campaigns: cloneManagedPage(fallback.campaigns),
    };
  }

  const record = value as Partial<Record<keyof WebsiteManagedPagesConfig, unknown>>;
  return {
    categories: normalizeManagedPage(record.categories, fallback.categories),
    products: normalizeManagedPage(record.products, fallback.products),
    campaigns: normalizeManagedPage(record.campaigns, fallback.campaigns),
  };
}

function normalizeLegalDocument(
  value: unknown,
  fallback: WebsiteLegalDocument,
): WebsiteLegalDocument {
  if (!value || typeof value !== 'object') {
    return cloneLegalDocument(fallback);
  }

  const record = value as Partial<Record<keyof WebsiteLegalDocument, unknown>>;
  const sectionsRaw = Array.isArray(record.sections) ? record.sections : [];
  const sections = sectionsRaw
    .map((section) => {
      if (!section || typeof section !== 'object') {
        return null;
      }

      const sectionRecord = section as Record<string, unknown>;
      const heading = normalizeDisplayText(toStringValue(sectionRecord.heading));
      const body = normalizeDisplayText(toStringValue(sectionRecord.body));
      if (!heading || !body) {
        return null;
      }

      return { heading, body };
    })
    .filter((section): section is WebsiteLegalDocument['sections'][number] => section !== null);

  return {
    title: normalizeDisplayText(toStringValue(record.title, fallback.title)),
    subtitle: normalizeDisplayText(toStringValue(record.subtitle, fallback.subtitle)),
    sections: sections.length > 0 ? sections : fallback.sections.map((section) => ({ ...section })),
  };
}

function normalizeLegalPages(value: unknown, fallback: WebsiteLegalPagesConfig): WebsiteLegalPagesConfig {
  if (!value || typeof value !== 'object') {
    return {
      kvkk: cloneLegalDocument(fallback.kvkk),
      privacy: cloneLegalDocument(fallback.privacy),
      sales: cloneLegalDocument(fallback.sales),
    };
  }

  const record = value as Partial<Record<keyof WebsiteLegalPagesConfig, unknown>>;
  return {
    kvkk: normalizeLegalDocument(record.kvkk, fallback.kvkk),
    privacy: normalizeLegalDocument(record.privacy, fallback.privacy),
    sales: normalizeLegalDocument(record.sales, fallback.sales),
  };
}

export function parseWebsiteConfig(raw?: string | null): WebsiteConfig {
  const fallback = createDefaultWebsiteConfig();

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebsiteConfig>;

    return {
      theme: normalizeTheme(parsed.theme, fallback.theme),
      announcement: normalizeMarketingText(toStringValue(parsed.announcement, fallback.announcement)),
      navItems: normalizeNavItems(parsed.navItems, fallback.navItems),
      heroSlides: normalizeHeroSlides(parsed.heroSlides, fallback.heroSlides),
      parallaxCards: normalizeParallaxCards(parsed.parallaxCards, fallback.parallaxCards),
      promoCards: normalizePromoCards(parsed.promoCards, fallback.promoCards),
      ribbon: normalizeRibbon(parsed.ribbon, fallback.ribbon),
      featureItems: normalizeFeatureItems(parsed.featureItems, fallback.featureItems),
      newsletterTitle: normalizeDisplayText(toStringValue(parsed.newsletterTitle, fallback.newsletterTitle)),
      newsletterDescription: normalizeDisplayText(
        toStringValue(parsed.newsletterDescription, fallback.newsletterDescription),
      ),
      contact: normalizeContact(parsed.contact, fallback.contact),
      homeSections: normalizeHomeSections(parsed.homeSections, fallback.homeSections),
      contactPage: normalizeContactPage(parsed.contactPage, fallback.contactPage),
      pages: normalizeManagedPages(parsed.pages, fallback.pages),
      legalPages: normalizeLegalPages(parsed.legalPages, fallback.legalPages),
      footerColumns: normalizeFooterColumns(parsed.footerColumns, fallback.footerColumns),
    };
  } catch {
    return fallback;
  }
}

export function createLegacyFooterLabels(columns: WebsiteFooterColumn[]) {
  return columns.map((column) => ({
    title: column.title,
    links: toStringArray(column.links.map((link) => link.label)),
  }));
}
