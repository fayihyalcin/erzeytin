@extends('layouts.admin')

@section('title', 'Vitrin Yönetimi - Er Zeytinyağı')
@section('admin_search_placeholder', 'Vitrin bölümü ara...')
@section('admin_content_class', 'category-admin home-section-admin')

@section('admin_shell_attributes')
    x-data="{
        sidebarOpen: false,
        sidebarCollapsed: false,
        sectionModalOpen: false,
        modalMode: 'create',
        formAction: @js(route('admin.home-sections.store')),
        formMethod: 'POST',
        sectionForm: {
            title: '',
            section_key: '',
            category_id: '',
            subtitle: '',
            badge_label: 'Yeni',
            product_limit: '6',
            style: 'default',
            status: 'Aktif',
            sort_order: '10',
            show_compare_price: false
        },
        openCreate() {
            this.modalMode = 'create';
            this.formAction = @js(route('admin.home-sections.store'));
            this.formMethod = 'POST';
            this.sectionForm = { title: '', section_key: '', category_id: '', subtitle: '', badge_label: 'Yeni', product_limit: '6', style: 'default', status: 'Aktif', sort_order: '10', show_compare_price: false };
            this.sectionModalOpen = true;
            document.body.classList.add('modal-open');
        },
        openEdit(section) {
            this.modalMode = 'edit';
            this.formAction = section.update_url;
            this.formMethod = 'PATCH';
            this.sectionForm = { ...section };
            this.sectionModalOpen = true;
            document.body.classList.add('modal-open');
        },
        closeModal() {
            this.sectionModalOpen = false;
            document.body.classList.remove('modal-open');
        }
    }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="button" x-on:click="openCreate()">
    <span>+</span>
    Yeni Vitrin
</button>
@endsection

@section('content')
<div class="admin-heading-row">
    <div>
        <h1>Vitrin Yönetimi</h1>
        <p>Ana sayfadaki ürün bölümlerini, başlıkları ve ürün etiketlerini yönetin.</p>
    </div>
    <button class="category-primary-button" type="button" x-on:click="openCreate()">
        <span>+</span>
        Yeni Vitrin
    </button>
</div>

@if (session('status'))
    <div class="settings-alert">{{ session('status') }}</div>
@endif

<section class="category-summary-grid">
    <article><span>Toplam Bölüm</span><strong>{{ $sections->count() }}</strong><small>Yönetilen kayıt</small></article>
    <article><span>Aktif</span><strong>{{ $sections->where('status', 'Aktif')->count() }}</strong><small>Sitede görünür</small></article>
    <article><span>Ürün Limiti</span><strong>{{ $sections->sum('product_limit') }}</strong><small>Toplam vitrin alanı</small></article>
</section>

<section class="category-table-card">
    <div class="panel-header">
        <div>
            <span>Ana Sayfa</span>
            <h2>Ürün bölüm listesi</h2>
        </div>
    </div>

    <div class="category-table-wrap">
        <table class="category-table">
            <thead>
                <tr>
                    <th>Başlık</th>
                    <th>Kategori</th>
                    <th>Etiket</th>
                    <th>Limit</th>
                    <th>Stil</th>
                    <th>Durum</th>
                    <th>Aksiyon</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($sections as $section)
                    <tr>
                        <td data-label="Başlık">
                            <strong>{{ $section->title }}</strong>
                            <small>{{ $section->section_key }}</small>
                        </td>
                        <td data-label="Kategori">{{ $section->category?->name ?? 'Tüm ürünler' }}</td>
                        <td data-label="Etiket">{{ $section->badge_label ?: '-' }}</td>
                        <td data-label="Limit">{{ $section->product_limit }}</td>
                        <td data-label="Stil">{{ $section->style }}</td>
                        <td data-label="Durum"><span class="category-status {{ $section->status === 'Aktif' ? 'is-active' : 'is-passive' }}">{{ $section->status }}</span></td>
                        <td data-label="Aksiyon">
                            <div class="category-row-actions">
                                <button type="button" x-on:click="openEdit({
                                    update_url: @js(route('admin.home-sections.update', $section)),
                                    title: @js($section->title),
                                    section_key: @js($section->section_key),
                                    category_id: @js((string) $section->category_id),
                                    subtitle: @js($section->subtitle),
                                    badge_label: @js($section->badge_label),
                                    product_limit: @js((string) $section->product_limit),
                                    style: @js($section->style),
                                    status: @js($section->status),
                                    sort_order: @js((string) $section->sort_order),
                                    show_compare_price: @js($section->show_compare_price)
                                })">Edit</button>
                                <form method="POST" action="{{ route('admin.home-sections.destroy', $section) }}">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit">Sil</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7">Henüz vitrin bölümü eklenmedi.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</section>

<div class="category-modal-overlay" x-cloak x-show="sectionModalOpen" x-transition.opacity x-on:click.self="closeModal()" role="dialog" aria-modal="true" aria-labelledby="section-modal-title">
    <form class="category-modal" x-show="sectionModalOpen" x-transition.scale.origin.center method="POST" :action="formAction">
        @csrf
        <input type="hidden" name="_method" :value="formMethod">
        <input type="hidden" name="show_compare_price" value="0">

        <div class="category-modal-header">
            <div>
                <span x-text="modalMode === 'create' ? 'Yeni Vitrin' : 'Vitrin Düzenle'"></span>
                <h2 id="section-modal-title" x-text="modalMode === 'create' ? 'Bölüm ekle' : 'Bölüm bilgileri'"></h2>
            </div>
            <button type="button" x-on:click="closeModal()" aria-label="Kapat">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="category-form-grid">
            <label><span>Başlık</span><input type="text" name="title" x-model="sectionForm.title" required></label>
            <label><span>Teknik Anahtar</span><input type="text" name="section_key" x-model="sectionForm.section_key" placeholder="yeni-gelenler"></label>
            <label>
                <span>Kategori Filtresi</span>
                <select name="category_id" x-model="sectionForm.category_id">
                    <option value="">Tüm ürünler</option>
                    @foreach ($categories as $category)
                        <option value="{{ $category->id }}">{{ $category->name }}</option>
                    @endforeach
                </select>
            </label>
            <label><span>Ürün Etiketi</span><input type="text" name="badge_label" x-model="sectionForm.badge_label"></label>
            <label><span>Ürün Limiti</span><input type="number" name="product_limit" min="1" max="12" x-model="sectionForm.product_limit" required></label>
            <label>
                <span>Stil</span>
                <select name="style" x-model="sectionForm.style">
                    <option value="default">Standart</option>
                    <option value="best">Çok Satan</option>
                    <option value="featured">Öne Çıkan</option>
                    <option value="sale">İndirim</option>
                </select>
            </label>
            <label><span>Sıra</span><input type="number" name="sort_order" min="1" x-model="sectionForm.sort_order" required></label>
            <label><span>Durum</span><select name="status" x-model="sectionForm.status"><option>Aktif</option><option>Pasif</option></select></label>
            <label class="category-field-wide"><span>Alt Açıklama</span><textarea rows="3" name="subtitle" x-model="sectionForm.subtitle"></textarea></label>
            <label class="category-switch-field category-field-wide">
                <input type="checkbox" name="show_compare_price" value="1" x-model="sectionForm.show_compare_price">
                <span>Varsa eski fiyatı ürün kartında göster</span>
            </label>
        </div>

        <div class="category-modal-actions">
            <button type="button" x-on:click="closeModal()">Vazgeç</button>
            <button type="submit" x-text="modalMode === 'create' ? 'Vitrin Ekle' : 'Kaydet'"></button>
        </div>
    </form>
</div>
@endsection
