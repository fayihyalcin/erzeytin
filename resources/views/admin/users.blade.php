@extends('layouts.admin')

@section('title', 'Kullanıcılar - Er Zeytinyağı')
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
            <h1>Kullanıcılar</h1>
            <p>Yönetim paneline erişebilen yöneticileri yönetin. Yönetici yapmak için kişinin önce sitede bir hesabı olmalıdır.</p>
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

    <form class="panel-card category-tools" method="POST" action="{{ route('admin.users.grant') }}"
        x-on:submit="if (! confirm('Bu hesap yönetici yapılacak ve panele tam erişim kazanacak. Onaylıyor musunuz?')) $event.preventDefault()">
        @csrf
        @method('PATCH')
        <div class="category-form-grid">
            <label class="category-field-wide">
                <span>E-posta ile Yönetici Yap</span>
                <input type="email" name="email" value="{{ old('email') }}" placeholder="kayitli-hesap@ornek.com" required>
            </label>
        </div>
        <div class="category-modal-actions">
            <button type="submit">Yönetici Yap</button>
        </div>
    </form>

    <section class="panel-card order-table-card">
        <div class="panel-header">
            <h2>Yöneticiler ({{ $admins->count() }})</h2>
        </div>

        <div class="order-table-wrap">
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Yönetici</th>
                        <th>Telefon</th>
                        <th>Rol</th>
                        <th>Kayıt Tarihi</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($admins as $admin)
                        <tr>
                            <td data-label="Yönetici"><strong>{{ $admin->name }}</strong><small>{{ $admin->email }}</small></td>
                            <td data-label="Telefon">{{ $admin->phone ?: '-' }}</td>
                            <td data-label="Rol"><span class="order-status is-paid">{{ $admin->is(auth()->user()) ? 'Yönetici (siz)' : 'Yönetici' }}</span></td>
                            <td data-label="Kayıt Tarihi">{{ $admin->created_at?->format('d.m.Y H:i') }}</td>
                            <td data-label="İşlem">
                                <div class="category-row-actions order-row-actions">
                                    <button type="button" x-on:click="openPassword({
                                        name: @js($admin->name),
                                        email: @js($admin->email),
                                        password_url: @js(route('admin.users.password', $admin))
                                    })">Şifre belirle</button>
                                    @unless ($admin->is(auth()->user()) || $admins->count() <= 1)
                                        <form method="POST" action="{{ route('admin.users.revoke', $admin) }}"
                                            x-on:submit="if (! confirm(@js($admin->email.' kullanıcısının yöneticiliği kaldırılacak. Onaylıyor musunuz?'))) $event.preventDefault()">
                                            @csrf
                                            @method('PATCH')
                                            <button type="submit">Yöneticiliği kaldır</button>
                                        </form>
                                    @endunless
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </section>

    @include('admin.partials.user-password-modal')
@endsection
