{{-- Şifre belirleme modalı. Kapsayan x-data: passwordModalOpen, selectedUser { name, email, password_url }, closeModals(). --}}
<div class="category-modal-overlay" x-cloak x-show="passwordModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
    <form class="category-modal" x-show="passwordModalOpen" x-transition.scale.origin.center method="POST" :action="selectedUser?.password_url"
        x-on:submit="if (! confirm('Bu hesabın şifresi değiştirilecek. Onaylıyor musunuz?')) $event.preventDefault()">
        @csrf
        @method('PATCH')
        <div class="category-modal-header">
            <div>
                <span>Şifre Belirle</span>
                <h2 id="password-modal-title" x-text="selectedUser?.name"></h2>
            </div>
            <button type="button" x-on:click="closeModals()" aria-label="Modalı kapat">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
            </button>
        </div>
        <div class="category-form-grid">
            <p class="category-field-wide"><strong x-text="selectedUser?.email"></strong> hesabı için yeni şifre girin ve kullanıcıya güvenli bir kanaldan iletin.</p>
            <label><span>Yeni Şifre</span><input type="password" name="password" autocomplete="new-password" required></label>
            <label><span>Yeni Şifre (tekrar)</span><input type="password" name="password_confirmation" autocomplete="new-password" required></label>
        </div>
        <div class="category-modal-actions">
            <button type="button" x-on:click="closeModals()">Vazgeç</button>
            <button type="submit">Şifreyi Kaydet</button>
        </div>
    </form>
</div>
