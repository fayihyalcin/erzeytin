@extends('layouts.admin')

@section('title', 'Müşteriler - Er Zeytinyağı')
@section('admin_search_placeholder', 'Müşteri ara... (ad, e-posta, telefon)')
@section('admin_content_class', 'order-admin')

@section('admin_shell_attributes')
    x-data="{
            sidebarOpen: false,
            sidebarCollapsed: false,
            passwordModalOpen: false,
            selectedUser: null,
            openPassword(user) {
                this.selectedUser = user;
                this.passwordModalOpen = true;
                document.body.classList.add('modal-open');
            },
            closeModals() {
                this.passwordModalOpen = false;
                document.body.classList.remove('modal-open');
            }
        }"
@endsection

@section('content')
    <div class="admin-heading-row">
        <div>
            <h1>Müşteriler</h1>
            <p>Kayıtlı müşteri hesaplarını, sipariş sayılarını ve ödenen sipariş toplamlarını görüntüleyin; şifresini unutan müşteriye yeni şifre belirleyin.</p>
        </div>
    </div>

    @if (session('status'))
        <div class="panel-card admin-flash">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="settings-alert is-error">
            <strong>İşlem yapılamadı.</strong>
            <span>{{ $errors->first() }}</span>
        </div>
    @endif

    <form class="panel-card category-tools" method="GET" action="{{ route('admin.customers.index') }}">
        <div class="category-form-grid">
            <label class="category-field-wide">
                <span>Müşteri Ara</span>
                <input type="search" name="q" value="{{ $search }}" placeholder="Ad, e-posta veya telefon">
            </label>
        </div>
        <div class="category-modal-actions">
            <button type="submit">Ara</button>
        </div>
    </form>

    <section class="panel-card order-table-card">
        <div class="panel-header">
            <h2>Kayıtlı Müşteriler ({{ $customers->total() }})</h2>
        </div>

        <div class="order-table-wrap">
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Müşteri</th>
                        <th>Telefon</th>
                        <th>Sipariş</th>
                        <th>Toplam Harcama</th>
                        <th>Kayıt Tarihi</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($customers as $customer)
                        <tr>
                            <td data-label="Müşteri"><strong>{{ $customer->name }}</strong><small>{{ $customer->email }}</small></td>
                            <td data-label="Telefon">{{ $customer->phone ?: '-' }}</td>
                            <td data-label="Sipariş">{{ $customer->orders_count }} sipariş</td>
                            <td data-label="Toplam Harcama"><strong>₺{{ number_format((float) $customer->paid_total, 2, ',', '.') }}</strong><small>Ödenen siparişler</small></td>
                            <td data-label="Kayıt Tarihi">{{ $customer->created_at?->format('d.m.Y H:i') }}</td>
                            <td data-label="İşlem">
                                <div class="category-row-actions order-row-actions">
                                    <button type="button" x-on:click="openPassword({
                                        name: @js($customer->name),
                                        email: @js($customer->email),
                                        password_url: @js(route('admin.users.password', $customer))
                                    })">Şifre belirle</button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6"><div class="dashboard-empty">{{ $search !== '' ? 'Aramaya uyan müşteri bulunamadı.' : 'Henüz kayıtlı müşteri yok.' }}</div></td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{ $customers->links() }}
    </section>

    @include('admin.partials.user-password-modal')
@endsection
