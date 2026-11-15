<aside class="customer-sidebar">
    <div class="customer-sidebar-card">
        <span>HESABIM</span>
        <strong>{{ auth()->user()?->name }}</strong>
        <small>{{ auth()->user()?->email }}</small>
    </div>

    <nav class="customer-sidebar-nav" aria-label="Müşteri menüsü">
        <a href="{{ route('customer.dashboard') }}" @class(['active' => request()->routeIs('customer.dashboard')])>Panelim</a>
        <a href="{{ route('customer.orders.index') }}" @class(['active' => request()->routeIs('customer.orders.*')])>Siparişlerim</a>
        <a href="{{ route('customer.payments') }}" @class(['active' => request()->routeIs('customer.payments')])>Ödemelerim</a>
        <a href="{{ route('customer.settings') }}" @class(['active' => request()->routeIs('customer.settings')])>Hesap Ayarları</a>
    </nav>

    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit">Çıkış Yap</button>
    </form>
</aside>
