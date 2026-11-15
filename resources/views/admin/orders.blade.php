@extends('layouts.admin')

@section('title', 'Siparişler - Er Zeytinyağı')
@section('admin_search_placeholder', 'Sipariş ara... (no, müşteri, telefon, şehir)')
@section('admin_content_class', 'order-admin')

@section('admin_shell_attributes')
    x-data="{
            sidebarOpen: false,
            sidebarCollapsed: false,
            orderModalOpen: false,
            detailModalOpen: false,
            deleteModalOpen: false,
            modalMode: 'detail',
            selectedOrder: null,
            formAction: @js(route('admin.orders.store')),
            formMethod: 'POST',
            orderForm: {
                code: '',
                customer_name: '',
                phone: '',
                city: '',
                address: '',
                item_count: '0',
                products_summary: '',
                total: '',
                payment_status: 'Bekliyor',
                payment_method: 'Kredi Kartı',
                status: 'Hazırlanıyor',
                cargo_status: 'Kargoya Hazır',
                note: ''
            },
            openCreate() {
                this.modalMode = 'create';
                this.selectedOrder = null;
                this.formAction = @js(route('admin.orders.store'));
                this.formMethod = 'POST';
                this.orderForm = {
                    code: '',
                    customer_name: '',
                    phone: '',
                    city: '',
                    address: '',
                    item_count: '0',
                    products_summary: '',
                    total: '',
                    payment_status: 'Bekliyor',
                    payment_method: 'Kredi Kartı',
                    status: 'Yeni',
                    cargo_status: 'Beklemede',
                    note: ''
                };
                this.orderModalOpen = true;
                document.body.classList.add('modal-open');
            },
            openDetail(order) {
                this.selectedOrder = order;
                this.detailModalOpen = true;
                document.body.classList.add('modal-open');
            },
            openEdit(order) {
                this.modalMode = 'edit';
                this.selectedOrder = order;
                this.formAction = order.update_url;
                this.formMethod = 'PATCH';
                this.orderForm = { ...order };
                this.orderModalOpen = true;
                document.body.classList.add('modal-open');
            },
            openDelete(order) {
                this.selectedOrder = order;
                this.deleteModalOpen = true;
                document.body.classList.add('modal-open');
            },
            closeModals() {
                this.orderModalOpen = false;
                this.detailModalOpen = false;
                this.deleteModalOpen = false;
                document.body.classList.remove('modal-open');
            }
        }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="button" x-on:click="openCreate()">
                        <span class="admin-icon-cart"></span>
                        Yeni Sipariş
                    </button>
                    <button class="admin-action-button" type="button">
                        <span class="admin-icon-box"></span>
                        Kargo Fişi
                    </button>
@endsection

@section('content')
<div class="admin-heading-row">
                    <div>
                        <h1>Sipariş Yönetimi</h1>
                        <p>Gelen siparişleri, ödeme durumlarını, kargo süreçlerini ve müşteri notlarını tek ekrandan yönetin.</p>
                    </div>
                    <button class="category-primary-button" type="button" x-on:click="openCreate()">
                        <span>+</span>
                        Manuel Sipariş Ekle
                    </button>
                </div>

                @if (session('status'))
                    <div class="panel-card admin-flash">{{ session('status') }}</div>
                @endif

                <section class="category-summary-grid order-summary-grid" aria-label="Sipariş özeti">
                    <article><span>Bugünkü Sipariş</span><strong>{{ $orders->where('created_at', '>=', now()->startOfDay())->count() }}</strong><small>₺{{ number_format($orders->sum('total'), 2, ',', '.') }} ciro</small></article>
                    <article><span>Hazırlanan</span><strong>{{ $orders->where('status', 'Hazırlanıyor')->count() }}</strong><small>Paketleme bekliyor</small></article>
                    <article><span>Kargoda</span><strong>{{ $orders->where('status', 'Kargoda')->count() }}</strong><small>Takip aktif</small></article>
                    <article><span>İptal / İade</span><strong>{{ $orders->whereIn('status', ['İptal'])->count() + $orders->where('payment_status', 'İade edildi')->count() }}</strong><small>Kontrol gerekli</small></article>
                </section>

                <section class="panel-card category-tools order-tools">
                    <div class="category-tools-grid order-tools-grid">
                        <label>
                            <span>Sipariş Durumu</span>
                            <select>
                                <option>Tüm Durumlar</option>
                                <option>Yeni</option>
                                <option>Hazırlanıyor</option>
                                <option>Kargoda</option>
                                <option>Tamamlandı</option>
                                <option>İptal</option>
                            </select>
                        </label>
                        <label>
                            <span>Ödeme</span>
                            <select>
                                <option>Tümü</option>
                                <option>Ödendi</option>
                                <option>Bekliyor</option>
                                <option>İade edildi</option>
                            </select>
                        </label>
                        <label>
                            <span>Kargo</span>
                            <select>
                                <option>Tüm kargo durumları</option>
                                <option>Kargoya Hazır</option>
                                <option>Kargoda</option>
                                <option>Teslim Edildi</option>
                            </select>
                        </label>
                        <label>
                            <span>Tarih</span>
                            <select>
                                <option>Son 30 gün</option>
                                <option>Bugün</option>
                                <option>Bu hafta</option>
                                <option>Bu ay</option>
                            </select>
                        </label>
                        <button type="button">Filtrele</button>
                    </div>
                </section>

                <section class="panel-card product-bulk-card">
                    <div class="bulk-actions">
                        <label><input type="checkbox"> Tümünü seç</label>
                        <button type="button">Toplu Hazırla</button>
                        <button type="button">Kargo Fişi Bas</button>
                        <button type="button">Durum Güncelle</button>
                        <button type="button">Excel Dışa Aktar</button>
                    </div>
                </section>

                <section class="panel-card order-table-card">
                    <div class="panel-header">
                        <h2>Gelen Siparişler</h2>
                        <div class="category-table-actions">
                            <button type="button">İçe Aktar</button>
                            <button type="button">Dışa Aktar</button>
                            <button type="button">Kargo Listesi</button>
                        </div>
                    </div>

                    <div class="order-table-wrap">
                        <table class="order-table">
                            <thead>
                                <tr>
                                    <th>Sipariş</th>
                                    <th>Müşteri</th>
                                    <th>Ürün</th>
                                    <th>Tutar</th>
                                    <th>Ödeme</th>
                                    <th>Durum</th>
                                    <th>Kargo</th>
                                    <th>Tarih</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($orders as $order)
                                    <tr>
                                        <td data-label="Sipariş"><strong>{{ $order->code }}</strong><small>{{ $order->city }}</small></td>
                                        <td data-label="Müşteri"><strong>{{ $order->customer_name }}</strong><small>{{ $order->phone }}</small></td>
                                        <td data-label="Ürün">{{ $order->item_count }} ürün</td>
                                        <td data-label="Tutar"><strong>₺{{ number_format($order->total, 2, ',', '.') }}</strong><small>{{ $order->payment_method }}</small></td>
                                        <td data-label="Ödeme">
                                            <span class="order-status {{ $order->payment_status === 'Ödendi' ? 'is-paid' : ($order->payment_status === 'Bekliyor' ? 'is-waiting' : 'is-cancelled') }}">{{ $order->payment_status }}</span>
                                        </td>
                                        <td data-label="Durum">
                                            <span class="order-status {{ in_array($order->status, ['Yeni', 'Hazırlanıyor']) ? 'is-new' : (in_array($order->status, ['Kargoda', 'Tamamlandı']) ? 'is-shipped' : 'is-cancelled') }}">{{ $order->status }}</span>
                                        </td>
                                        <td data-label="Kargo">{{ $order->cargo_status }}</td>
                                        <td data-label="Tarih">{{ $order->created_at->format('d.m.Y H:i') }}</td>
                                        <td data-label="İşlem">
                                            <div class="category-row-actions order-row-actions">
                                                <button type="button" x-on:click="openDetail({
                                                    code: @js($order->code),
                                                    customer: @js($order->customer_name),
                                                    phone: @js($order->phone),
                                                    city: @js($order->city),
                                                    items: @js($order->item_count.' ürün'),
                                                    total: @js(number_format($order->total, 2, ',', '.')),
                                                    payment: @js($order->payment_status),
                                                    payment_method: @js($order->payment_method),
                                                    status: @js($order->status),
                                                    cargo: @js($order->cargo_status),
                                                    date: @js($order->created_at->format('d.m.Y H:i')),
                                                    address: @js($order->address),
                                                    note: @js($order->note),
                                                    products: @js($order->products_summary)
                                                })">İncele</button>
                                                <button type="button" x-on:click="openEdit({
                                                    update_url: @js(route('admin.orders.update', $order)),
                                                    code: @js($order->code),
                                                    customer_name: @js($order->customer_name),
                                                    phone: @js($order->phone),
                                                    city: @js($order->city),
                                                    address: @js($order->address),
                                                    item_count: @js((string) $order->item_count),
                                                    products_summary: @js($order->products_summary),
                                                    total: @js((string) $order->total),
                                                    payment_status: @js($order->payment_status),
                                                    payment_method: @js($order->payment_method),
                                                    status: @js($order->status),
                                                    cargo_status: @js($order->cargo_status),
                                                    note: @js($order->note)
                                                })">Edit</button>
                                                <form method="POST" action="{{ route('admin.orders.destroy', $order) }}">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit">Sil</button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </section>

                <div class="category-modal-overlay" x-cloak x-show="detailModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
                    <div class="category-modal order-detail-modal" x-show="detailModalOpen" x-transition.scale.origin.center>
                        <div class="category-modal-header">
                            <div>
                                <span>Sipariş Detayı</span>
                                <h2 id="order-detail-title" x-text="selectedOrder?.code"></h2>
                            </div>
                            <button type="button" x-on:click="closeModals()" aria-label="Modalı kapat">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
                            </button>
                        </div>
                        <div class="order-detail-grid">
                            <article><span>Müşteri</span><strong x-text="selectedOrder?.customer"></strong><small x-text="selectedOrder?.phone"></small></article>
                            <article><span>Adres</span><strong x-text="selectedOrder?.address"></strong><small x-text="selectedOrder?.city"></small></article>
                            <article><span>Ürünler</span><strong x-text="selectedOrder?.products"></strong><small x-text="selectedOrder?.items"></small></article>
                            <article><span>Ödeme</span><strong x-text="'₺' + (selectedOrder?.total || '')"></strong><small x-text="selectedOrder?.payment_method + ' - ' + selectedOrder?.payment"></small></article>
                            <article><span>Durum</span><strong x-text="selectedOrder?.status"></strong><small x-text="selectedOrder?.cargo"></small></article>
                            <article><span>Not</span><strong x-text="selectedOrder?.note"></strong><small x-text="selectedOrder?.date"></small></article>
                        </div>
                        <div class="category-modal-actions">
                            <button type="button" x-on:click="closeModals()">Kapat</button>
                            <button type="button" x-on:click="detailModalOpen = false; openEdit(selectedOrder)">Düzenle</button>
                        </div>
                    </div>
                </div>

                <div class="category-modal-overlay" x-cloak x-show="orderModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
                    <form class="category-modal order-modal" x-show="orderModalOpen" x-transition.scale.origin.center method="POST" :action="formAction">
                        @csrf
                        <input type="hidden" name="_method" :value="formMethod">
                        <div class="category-modal-header">
                            <div>
                                <span>Sipariş Düzenleme</span>
                                <h2 id="order-modal-title" x-text="modalMode === 'create' ? 'Sipariş ekle' : orderForm.code"></h2>
                            </div>
                            <button type="button" x-on:click="closeModals()" aria-label="Modalı kapat">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
                            </button>
                        </div>
                        <div class="category-form-grid order-form-grid">
                            <label><span>Sipariş No</span><input type="text" name="code" x-model="orderForm.code"></label>
                            <label><span>Müşteri</span><input type="text" name="customer_name" x-model="orderForm.customer_name"></label>
                            <label><span>Telefon</span><input type="text" name="phone" x-model="orderForm.phone"></label>
                            <label><span>Şehir</span><input type="text" name="city" x-model="orderForm.city"></label>
                            <label><span>Adres</span><input type="text" name="address" x-model="orderForm.address"></label>
                            <label><span>Ürün Adedi</span><input type="number" name="item_count" x-model="orderForm.item_count" min="0"></label>
                            <label><span>Tutar</span><input type="text" name="total" x-model="orderForm.total"></label>
                            <label>
                                <span>Ödeme Yöntemi</span>
                                <select name="payment_method" x-model="orderForm.payment_method">
                                    <option>Kredi Kartı</option>
                                    <option>Havale</option>
                                    <option>Kapıda Ödeme</option>
                                </select>
                            </label>
                            <label>
                                <span>Ödeme Durumu</span>
                                <select name="payment_status" x-model="orderForm.payment_status">
                                    <option>Ödendi</option>
                                    <option>Bekliyor</option>
                                    <option>İade edildi</option>
                                </select>
                            </label>
                            <label>
                                <span>Sipariş Durumu</span>
                                <select name="status" x-model="orderForm.status">
                                    <option>Yeni</option>
                                    <option>Ödeme Bekliyor</option>
                                    <option>Hazırlanıyor</option>
                                    <option>Kargoda</option>
                                    <option>Tamamlandı</option>
                                    <option>İptal</option>
                                </select>
                            </label>
                            <label class="category-field-wide"><span>Ürün Özeti</span><input type="text" name="products_summary" x-model="orderForm.products_summary"></label>
                            <label class="category-field-wide"><span>Kargo Bilgisi</span><input type="text" name="cargo_status" x-model="orderForm.cargo_status"></label>
                            <label class="category-field-wide"><span>Sipariş Notu</span><textarea rows="4" name="note" x-model="orderForm.note"></textarea></label>
                        </div>
                        <div class="category-modal-actions">
                            <button type="button" x-on:click="closeModals()">Vazgeç</button>
                            <button type="submit" x-text="modalMode === 'create' ? 'Sipariş Ekle' : 'Değişiklikleri Kaydet'"></button>
                        </div>
                    </form>
                </div>

                <div class="category-modal-overlay" x-cloak x-show="deleteModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div class="delete-modal" x-show="deleteModalOpen" x-transition.scale.origin.center>
                        <h2 id="delete-modal-title">Siparişi sil?</h2>
                        <p><strong x-text="selectedOrder?.code"></strong> numaralı sipariş yönetim listesinden kaldırılacak. Operasyonel kaydı korumak için gerçek sistemde bu işlem iptal/arsiv olarak ele alınmalıdır.</p>
                        <div class="delete-modal-actions">
                            <button type="button" x-on:click="closeModals()">Vazgeç</button>
                            <button type="button" x-on:click="closeModals()">Sil</button>
                        </div>
                    </div>
                </div>
@endsection
