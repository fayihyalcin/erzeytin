@extends('layouts.admin')

@section('title', 'İletişim Talepleri - Er Zeytinyağı')
@section('admin_search_placeholder', 'Talep ara... (ad, e-posta, telefon, konu)')
@section('admin_content_class', 'contact-admin')

@section('admin_shell_attributes')
    x-data="{ sidebarOpen: false, sidebarCollapsed: false }"
@endsection

@section('content')
    <div class="admin-heading-row">
        <div>
            <h1>İletişim Talepleri</h1>
            <p>Web sitesinden gelen iletişim formu taleplerini takip edin, not alın ve durumunu güncelleyin.</p>
        </div>
    </div>

    @if (session('status'))
        <div class="panel-card admin-flash">{{ session('status') }}</div>
    @endif

    <section class="category-summary-grid order-summary-grid" aria-label="İletişim talebi özeti">
        <article><span>Toplam Talep</span><strong>{{ $messages->count() }}</strong><small>Tüm iletişim kayıtları</small></article>
        <article><span>Yeni</span><strong>{{ $messages->where('status', 'Yeni')->count() }}</strong><small>Yanıt bekleyen</small></article>
        <article><span>Cevaplandı</span><strong>{{ $messages->where('status', 'Cevaplandı')->count() }}</strong><small>Sonuçlanan talepler</small></article>
        <article><span>Bugün</span><strong>{{ $messages->where('created_at', '>=', now()->startOfDay())->count() }}</strong><small>Güncel girişler</small></article>
    </section>

    <section class="panel-card contact-message-list">
        @forelse ($messages as $message)
            <article class="contact-message-card">
                <div class="contact-message-main">
                    <span>{{ $message->created_at->format('d.m.Y H:i') }}</span>
                    <h2>{{ $message->subject ?: 'Konu belirtilmedi' }}</h2>
                    <p>{{ $message->message }}</p>
                    <div class="contact-message-meta">
                        <strong>{{ $message->name }}</strong>
                        <a href="mailto:{{ $message->email }}">{{ $message->email }}</a>
                        @if ($message->phone)
                            <a href="tel:{{ preg_replace('/\D+/', '', $message->phone) }}">{{ $message->phone }}</a>
                        @endif
                    </div>
                </div>
                <form class="contact-message-actions" method="POST" action="{{ route('admin.contact-messages.update', $message) }}">
                    @csrf
                    @method('PATCH')
                    <label>
                        <span>Durum</span>
                        <select name="status">
                            @foreach (['Yeni', 'Okundu', 'Cevaplandı', 'Arşiv'] as $status)
                                <option value="{{ $status }}" @selected($message->status === $status)>{{ $status }}</option>
                            @endforeach
                        </select>
                    </label>
                    <label>
                        <span>Admin Notu</span>
                        <textarea name="admin_note" rows="3">{{ $message->admin_note }}</textarea>
                    </label>
                    <div>
                        <button type="submit">Güncelle</button>
                    </div>
                </form>
                <form method="POST" action="{{ route('admin.contact-messages.destroy', $message) }}">
                    @csrf
                    @method('DELETE')
                    <button class="contact-message-delete" type="submit">Sil</button>
                </form>
            </article>
        @empty
            <div class="dashboard-empty">Henüz iletişim talebi yok.</div>
        @endforelse
    </section>
@endsection
