<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Support\Arr;

class PageController extends Controller
{
    public function show(string $slug)
    {
        if ($slug === 'iletisim') {
            return to_route('contact.show');
        }

        $page = Arr::get($this->pages(), $slug);

        abort_unless($page, 404);

        return view('pages.show', [
            'page' => $page,
            'slug' => $slug,
        ]);
    }

    private function pages(): array
    {
        return [
            'hakkimizda' => [
                'title' => 'Hakkımızda',
                'kicker' => 'Kurumsal',
                'intro' => 'Er Zeytinyağı, Mudanya’nın bereketli topraklarından gelen doğal zeytin ve zeytinyağı ürünlerini sofralara ulaştırır.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Köklerimiz', 'body' => 'Zeytin kültürünü sofralara taşıyan anlayışımızla ürünlerimizi kalite, doğallık ve güven ilkeleriyle sunuyoruz.'],
                    ['heading' => 'Ürün Anlayışımız', 'body' => 'Zeytinyağı, siyah zeytin ve yeşil zeytin kategorilerinde özenle seçilmiş ürünleri müşterilerimizle buluşturuyoruz.'],
                    ['heading' => 'Güvenilir Alışveriş', 'body' => 'Ürün, kategori, stok ve sipariş süreçleri sistem üzerinden takip edilir; müşteriye net ve düzenli bilgi sunulması hedeflenir.'],
                    ['heading' => 'Mudanya’dan Sofranıza', 'body' => 'Doğal lezzeti koruyan, sade ve güvenilir bir alışveriş deneyimi için çalışıyoruz.'],
                ],
            ],
            'vizyon-misyon' => [
                'title' => 'Vizyon & Misyon',
                'kicker' => 'Kurumsal',
                'intro' => 'Doğal zeytin ürünlerini güvenilir, erişilebilir ve sürdürülebilir bir alışveriş deneyimiyle sunmayı amaçlıyoruz.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Vizyonumuz', 'body' => 'Er Zeytinyağı markasını doğal zeytin ürünlerinde güvenilir, kaliteli ve tercih edilen bir marka haline getirmek.'],
                    ['heading' => 'Misyonumuz', 'body' => 'Müşterilerimize doğru ürün bilgisi, özenli paketleme, hızlı teslimat ve kaliteli hizmet sunmak.'],
                    ['heading' => 'Değerlerimiz', 'body' => 'Doğallık, şeffaflık, müşteri memnuniyeti ve ürün kalitesi işimizin merkezindedir.'],
                    ['heading' => 'Hizmet Yaklaşımı', 'body' => 'Siparişten teslimata kadar tüm süreçleri anlaşılır, düzenli ve güvenilir biçimde yönetmek.'],
                ],
            ],
            'kalite-belgelerimiz' => [
                'title' => 'Kalite Belgelerimiz',
                'kicker' => 'Kurumsal',
                'intro' => 'Kalite yaklaşımımız; ürün güvenliği, doğru bilgilendirme ve düzenli süreç yönetimi üzerine kuruludur.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Kalite Kontrol', 'body' => 'Ürünlerin kategori, stok, fiyat ve açıklama bilgileri düzenli olarak yönetilir ve müşteriye açık şekilde sunulur.'],
                    ['heading' => 'Ürün Güvenliği', 'body' => 'Gıda ürünlerinde ambalaj, saklama ve teslimat süreçleri ürün niteliğine uygun şekilde ele alınır.'],
                    ['heading' => 'Belge Yönetimi', 'body' => 'Kalite belgeleri, analiz raporları veya sertifika görselleri hazırlandığında bu sayfadan müşterilerle paylaşılabilir.'],
                    ['heading' => 'Sürekli İyileştirme', 'body' => 'Müşteri geri bildirimleri ve operasyonel takipler kalite sürecimizin önemli parçalarıdır.'],
                ],
            ],
            'surdurulebilirlik' => [
                'title' => 'Sürdürülebilirlik',
                'kicker' => 'Kurumsal',
                'intro' => 'Doğal ürünleri geleceğe taşımak için kaynaklara saygılı, dikkatli ve sorumlu bir yaklaşımı benimsiyoruz.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Doğaya Saygı', 'body' => 'Zeytin kültürünü koruyan, doğal üretim değerlerine önem veren bir marka yaklaşımıyla hareket ediyoruz.'],
                    ['heading' => 'Sorumlu Tedarik', 'body' => 'Ürün seçiminde kalite, güvenilirlik ve devamlılık unsurlarını birlikte değerlendiriyoruz.'],
                    ['heading' => 'Daha Az İsraf', 'body' => 'Stok ve sipariş yönetimini dijital olarak takip ederek ürün planlamasında daha kontrollü ilerliyoruz.'],
                    ['heading' => 'Uzun Vadeli Değer', 'body' => 'Müşteri memnuniyeti ve ürün kalitesi kadar, sürdürülebilir hizmet anlayışına da önem veriyoruz.'],
                ],
            ],
            'iletisim' => [
                'title' => 'İletişim',
                'kicker' => 'Kurumsal',
                'intro' => 'Sipariş, ürün, kargo ve iş birliği talepleriniz için Er Zeytinyağı ile iletişime geçebilirsiniz.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Telefon', 'body' => '0530 516 54 98 numarası üzerinden bize ulaşabilirsiniz.'],
                    ['heading' => 'E-posta', 'body' => 'Sorularınız ve talepleriniz için celalergida@gmail.com adresine yazabilirsiniz.'],
                    ['heading' => 'Adres', 'body' => 'Çepni mahallesi Çepni 25. sokak no:3 Mudanya/Bursa adresinde hizmet veriyoruz.'],
                    ['heading' => 'Müşteri Hizmetleri', 'body' => 'Ürün, sipariş, iade ve teslimat konularında footer’daki müşteri hizmetleri sayfalarından da bilgi alabilirsiniz.'],
                ],
            ],
            'sikca-sorulan-sorular' => [
                'title' => 'Sıkça Sorulan Sorular',
                'kicker' => 'Müşteri Hizmetleri',
                'intro' => 'Er Zeytinyağı alışveriş süreci, ürünler, ödeme ve teslimat hakkında en çok merak edilen yanıtlar.',
                'type' => 'faq',
                'items' => [
                    ['question' => 'Ürünleriniz doğal mı?', 'answer' => 'Ürünlerimiz seçilmiş zeytinlerden hazırlanır. Ürün detaylarında kategori, açıklama ve stok bilgilerini görebilirsiniz.'],
                    ['question' => 'Sipariş verdikten sonra nasıl takip ederim?', 'answer' => 'Siparişiniz oluşturulduktan sonra hazırlık ve kargo süreçleri müşteri hizmetleri tarafından takip edilir.'],
                    ['question' => 'Ödeme güvenli mi?', 'answer' => 'Sitede güvenli ödeme altyapısı ve SSL koruması kullanılması hedeflenmiştir. Ödeme entegrasyon bilgileri admin panelinden yönetilir.'],
                    ['question' => 'Toplu alım yapabilir miyim?', 'answer' => 'Toplu alımlar için telefon veya e-posta üzerinden bizimle iletişime geçebilirsiniz.'],
                    ['question' => 'Ürün görselleri gerçek ürünleri mi temsil eder?', 'answer' => 'Ürün görselleri admin panelinden her ürün için manuel yüklenir ve ürün kartlarında bu görseller kullanılır.'],
                ],
            ],
            'kargo-teslimat' => [
                'title' => 'Kargo & Teslimat',
                'kicker' => 'Teslimat Süreci',
                'intro' => 'Siparişlerinizin hazırlanması, paketlenmesi ve teslimat süreci hakkında bilmeniz gerekenler.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Hazırlık Süreci', 'body' => 'Siparişler, ödeme ve stok kontrolünden sonra özenle hazırlanır. Ürünlerin zarar görmemesi için taşıma koşullarına uygun paketleme yapılır.'],
                    ['heading' => 'Kargo Bilgilendirmesi', 'body' => 'Kargoya verilen siparişlerde takip ve durum bilgisi sipariş kayıtları üzerinden yönetilir. Admin panelinde sipariş kargo durumu ayrıca güncellenebilir.'],
                    ['heading' => 'Teslimat Adresi', 'body' => 'Teslimatın sorunsuz yapılması için adres, telefon ve alıcı bilgilerinin eksiksiz girilmesi gerekir. Eksik veya hatalı adreslerde teslimat süresi uzayabilir.'],
                    ['heading' => 'Ücretsiz Kargo', 'body' => 'Tüm ürünlerde ücretsiz kargo fırsatı sunulur. Kampanya ve teslimat şartları mağaza politikalarına göre güncellenebilir.'],
                ],
            ],
            'iade-degisim' => [
                'title' => 'İade & Değişim',
                'kicker' => 'Müşteri Memnuniyeti',
                'intro' => 'İade ve değişim taleplerinde ürün güvenliği, ambalaj durumu ve yasal süreler dikkate alınır.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'İade Talebi', 'body' => 'İade talebinizi ürün tesliminden sonra müşteri hizmetleri ile paylaşabilirsiniz. Talep sırasında sipariş numarası ve iletişim bilgileri istenir.'],
                    ['heading' => 'Ürün Koşulları', 'body' => 'Gıda ürünlerinde iade ve değişim değerlendirmesi hijyen, ambalaj, ürün bütünlüğü ve mevzuat çerçevesinde yapılır.'],
                    ['heading' => 'Hasarlı Teslimat', 'body' => 'Kargo tesliminde hasar fark edilirse paket teslim alınmadan önce tutanak tutulması önerilir. Hasarlı paketler için görsel ve tutanak bilgisi süreci hızlandırır.'],
                    ['heading' => 'Değişim Süreci', 'body' => 'Uygun görülen değişim taleplerinde stok durumuna göre aynı ürün veya muadil ürün için işlem yapılır.'],
                ],
            ],
            'gizlilik-politikasi' => [
                'title' => 'Gizlilik Politikası',
                'kicker' => 'Kişisel Veriler',
                'intro' => 'Er Zeytinyağı, müşteri bilgilerinin gizliliğini ve güvenliğini korumayı önemser.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Toplanan Bilgiler', 'body' => 'Sipariş, iletişim, fatura ve teslimat işlemleri için ad, soyad, telefon, e-posta ve adres bilgileri işlenebilir.'],
                    ['heading' => 'Kullanım Amacı', 'body' => 'Bilgiler siparişin hazırlanması, teslimatın yapılması, müşteri iletişimi ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılır.'],
                    ['heading' => 'Güvenlik', 'body' => 'Kişisel verilerin yetkisiz erişime karşı korunması için teknik ve idari önlemler alınır. Ödeme bilgileri güvenli ödeme sağlayıcıları üzerinden işlenir.'],
                    ['heading' => 'Haklarınız', 'body' => 'Kişisel verilerinizle ilgili bilgi alma, düzeltme ve silme talepleri için iletişim kanallarımız üzerinden başvurabilirsiniz.'],
                ],
            ],
            'mesafeli-satis-sozlesmesi' => [
                'title' => 'Mesafeli Satış Sözleşmesi',
                'kicker' => 'Satış Koşulları',
                'intro' => 'Bu sayfa, internet üzerinden yapılan alışverişlerde temel satış ve teslimat koşullarını açıklar.',
                'type' => 'content',
                'sections' => [
                    ['heading' => 'Taraflar', 'body' => 'Sözleşme, Er Zeytinyağı ile internet sitesi üzerinden sipariş veren alıcı arasında elektronik ortamda kurulur.'],
                    ['heading' => 'Ürün ve Fiyat', 'body' => 'Ürün adı, miktarı, fiyatı ve varsa kampanya bilgileri sipariş onayı sırasında alıcıya gösterilir.'],
                    ['heading' => 'Ödeme ve Teslimat', 'body' => 'Ödeme, sitede sunulan ödeme yöntemleriyle yapılır. Teslimat, alıcının bildirdiği adrese kargo aracılığıyla gerçekleştirilir.'],
                    ['heading' => 'Cayma ve İade', 'body' => 'Cayma hakkı ve iade süreçleri ilgili mevzuat ve ürün niteliği dikkate alınarak değerlendirilir. Gıda ürünlerinde hijyen ve ambalaj koşulları önemlidir.'],
                    ['heading' => 'Uyuşmazlık', 'body' => 'Uyuşmazlıklarda yürürlükteki tüketici mevzuatı ve yetkili merciler esas alınır.'],
                ],
            ],
        ];
    }
}
