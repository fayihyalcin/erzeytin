@extends('layouts.admin')

@section('title', 'Yönetim Paneli - Er Zeytinyağı')
@section('admin_search_placeholder', 'Ara... (sipariş, ürün, müşteri, fatura)')
@section('admin_content_class', '')

@section('admin_shell_attributes')
    x-data="{ sidebarOpen: false, sidebarCollapsed: false }"
@endsection

@section('admin_topbar_actions')
<a class="admin-action-button" href="{{ route('admin.products.index') }}">
    <span class="admin-icon-bottle"></span>
    Ürünler
</a>
<a class="admin-action-button" href="{{ route('admin.orders.index') }}">
    <span class="admin-icon-cart"></span>
    Siparişler
</a>
@endsection

@section('content')
<div class="admin-heading-row">
    <div>
        <h1>Yönetim Paneli</h1>
        <p>Er Zeytinyağı yönetim özetiniz</p>
    </div>
    <div class="date-filter">
        <span>{{ $dateRangeLabel }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M16 3v4M8 3v4M3 11h18"></path>
        </svg>
    </div>
</div>

<section class="metric-grid" aria-label="Özet metrikler">
    @foreach ($metrics as $metric)
        <article class="metric-card">
            <span class="metric-icon admin-icon-{{ $metric['icon'] }}"></span>
            <div>
                <p>{{ $metric['title'] }}</p>
                <strong>{{ $metric['value'] }}</strong>
                <small class="{{ ! empty($metric['warning']) ? 'warning' : '' }}">{{ $metric['trend'] }} <em>{{ $metric['note'] }}</em></small>
            </div>
        </article>
    @endforeach
</section>

<section class="dashboard-grid">
    <article class="panel-card chart-card wide">
        <div class="panel-header">
            <h2>Ciro (TL)</h2>
            <span>Son 6 ay</span>
        </div>
        <div class="line-chart">
            <div class="chart-legend"><span></span>Ciro (TL)</div>
            <svg viewBox="0 0 640 225" preserveAspectRatio="none" aria-label="Ciro çizgi grafiği">
                <defs>
                    <linearGradient id="adminLineFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#8a872d" stop-opacity="0.28"></stop>
                        <stop offset="100%" stop-color="#8a872d" stop-opacity="0.02"></stop>
                    </linearGradient>
                </defs>
                <g class="chart-grid-lines">
                    <path d="M46 20H620M46 62H620M46 104H620M46 146H620M46 188H620"></path>
                </g>
                <path class="line-area" d="{{ $revenueChart['area'] }}"></path>
                <path class="line-path" d="{{ $revenueChart['line'] }}"></path>
                <g class="line-dots">
                    @foreach ($revenueChart['points'] as $point)
                        <circle cx="{{ $point['x'] }}" cy="{{ $point['y'] }}" r="5"></circle>
                    @endforeach
                </g>
                <g class="chart-labels">
                    @foreach ($monthlyRevenue as $index => $month)
                        <text x="{{ 46 + ($index * 94) }}" y="206">{{ $month['label'] }}</text>
                    @endforeach
                    <text x="0" y="191">0</text><text x="0" y="149">25%</text><text x="0" y="107">50%</text><text x="0" y="65">75%</text><text x="0" y="23">100%</text>
                </g>
            </svg>
        </div>
    </article>

    <article class="panel-card chart-card wide">
        <div class="panel-header">
            <h2>Sipariş Trendi</h2>
            <span>Son 6 ay</span>
        </div>
        <div class="bar-chart">
            <div class="chart-legend gold"><span></span>Sipariş Sayısı</div>
            <div class="bar-grid">
                @foreach ($monthlyOrders as $month)
                    <span style="--bar-height: {{ max(4, (($month['value'] / $maxOrderCount) * 100)) }}%"></span>
                @endforeach
            </div>
            <div class="bar-labels">
                @foreach ($monthlyOrders as $month)
                    <span>{{ $month['label'] }}</span>
                @endforeach
            </div>
        </div>
    </article>

    <article class="panel-card stock-card">
        <div class="panel-header">
            <h2>Kritik Stok Uyarıları</h2>
            <a href="{{ route('admin.products.index') }}">Tümünü Gör →</a>
        </div>
        @forelse ($criticalProducts as $product)
            <div class="stock-row">
                <img src="{{ $product->image_path ? Storage::url($product->image_path) : asset('images/hero-olive-oil.jpg') }}" alt="">
                <span><strong>{{ $product->name }}</strong><small>Stok: {{ $product->stock }} adet</small></span>
                <a href="{{ route('admin.products.index') }}">Stok Ekle</a>
            </div>
        @empty
            <div class="dashboard-empty">Kritik stokta ürün yok.</div>
        @endforelse
    </article>

    <article class="panel-card orders-card">
        <div class="panel-header">
            <h2>Son Siparişler</h2>
            <a href="{{ route('admin.orders.index') }}">Tümünü Gör →</a>
        </div>
        <div class="admin-table">
            <div class="table-row table-head"><span>Sipariş No</span><span>Müşteri</span><span>Tutar</span><span>Durum</span><span>Tarih</span></div>
            @forelse ($latestOrders as $order)
                <div class="table-row">
                    <span>{{ $order->code }}</span>
                    <span>{{ $order->customer_name }}</span>
                    <span>₺ {{ number_format((float) $order->total, 2, ',', '.') }}</span>
                    <span><em>{{ $order->status }}</em></span>
                    <span>{{ $order->created_at?->format('d.m.Y H:i') }}</span>
                </div>
            @empty
                <div class="dashboard-empty">Henüz sipariş yok.</div>
            @endforelse
        </div>
        <a href="{{ route('admin.orders.index') }}" class="panel-footer-link">Tüm siparişleri görüntüle →</a>
    </article>

    <article class="panel-card dealer-card">
        <div class="panel-header">
            <h2>Müşteri Performansı</h2>
            <a href="{{ route('admin.orders.index') }}">Siparişlere Git →</a>
        </div>
        @forelse ($customerPerformance as $index => $customer)
            <div class="dealer-row">
                <b>{{ $index + 1 }}</b>
                <span>{{ $customer->customer_name }}</span>
                <strong>₺ {{ number_format((float) $customer->revenue, 2, ',', '.') }}</strong>
                <small>{{ $customer->order_count }} sipariş</small>
            </div>
        @empty
            <div class="dashboard-empty">Müşteri verisi henüz oluşmadı.</div>
        @endforelse
    </article>

    <article class="panel-card accounting-card">
        <div class="panel-header">
            <h2>Muhasebe Özeti</h2>
            <a href="{{ route('admin.orders.index') }}">Detaylı Rapor →</a>
        </div>
        <div class="accounting-grid">
            <div><span>Toplam Gelir</span><strong>₺ {{ number_format((float) $accounting['total_revenue'], 2, ',', '.') }}</strong><small>Sipariş toplamı</small></div>
            <div><span>Ödenen</span><strong>₺ {{ number_format((float) $accounting['paid_revenue'], 2, ',', '.') }}</strong><small>Tahsil edilen</small></div>
            <div><span>Bekleyen</span><strong>₺ {{ number_format((float) $accounting['pending_revenue'], 2, ',', '.') }}</strong><small class="danger">Ödeme bekliyor</small></div>
        </div>
    </article>

    <article class="panel-card top-products-card">
        <div class="panel-header">
            <h2>En Çok Satan Ürünler</h2>
            <a href="{{ route('admin.orders.index') }}">Siparişlere Git →</a>
        </div>
        <div class="top-products">
            @forelse ($topProducts as $index => $item)
                <div>
                    <b>{{ $index + 1 }}</b>
                    <img src="{{ $item->product?->image_path ? Storage::url($item->product->image_path) : asset('images/hero-olive-oil.jpg') }}" alt="">
                    <strong>{{ $item->product_name }}</strong>
                    <small>{{ $item->sold_quantity }} adet</small>
                </div>
            @empty
                <div class="dashboard-empty">Ürün satış kalemi bulunamadı.</div>
            @endforelse
        </div>
    </article>

    <article class="panel-card category-card">
        <div class="panel-header">
            <h2>Kategori Dağılımı</h2>
            <a href="{{ route('admin.categories.index') }}">Tümünü Gör →</a>
        </div>
        <div class="category-layout">
            <div class="donut-chart"></div>
            <div class="category-list">
                @forelse ($categoryDistribution as $category)
                    <div>
                        <span>{{ $category->name }}</span>
                        <b>%{{ number_format((((float) $category->inventory_value / $categoryTotal) * 100), 1, ',', '.') }}</b>
                        <strong>₺ {{ number_format((float) $category->inventory_value, 2, ',', '.') }}</strong>
                    </div>
                @empty
                    <div class="dashboard-empty">Kategori verisi yok.</div>
                @endforelse
            </div>
        </div>
    </article>
</section>
@endsection
