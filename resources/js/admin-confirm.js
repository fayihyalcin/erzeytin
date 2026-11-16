const DEFAULT_TEXT = 'Bu işlem geri alınamaz.';
let dialog = null;
let textEl = null;
let cancelBtn = null;
let confirmed = false;
let lastFocus = null;

function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'admin-confirm';
    dialog.setAttribute('aria-labelledby', 'admin-confirm-title');
    dialog.setAttribute('aria-describedby', 'admin-confirm-text');
    dialog.innerHTML =
        '<h2 class="admin-confirm__title" id="admin-confirm-title">Silmek istediğinize emin misiniz?</h2>' +
        '<p class="admin-confirm__text" id="admin-confirm-text"></p>' +
        '<div class="admin-confirm__actions">' +
        '<button type="button" class="admin-confirm__btn" data-cancel>Vazgeç</button>' +
        '<button type="button" class="admin-confirm__btn admin-confirm__btn--danger" data-ok>Sil</button>' +
        '</div>';
    textEl = dialog.querySelector('#admin-confirm-text');
    cancelBtn = dialog.querySelector('[data-cancel]');
    cancelBtn.addEventListener('click', () => dialog.close('cancel'));
    dialog.querySelector('[data-ok]').addEventListener('click', () => dialog.close('ok'));
    // Dışarı (backdrop) tıklama
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close('cancel');
    });
    document.body.appendChild(dialog);
}

function ask(message) {
    if (!dialog) build();
    textEl.textContent = message || DEFAULT_TEXT;
    dialog.returnValue = '';
    return new Promise((resolve) => {
        dialog.addEventListener('close', () => {
            resolve(dialog.returnValue === 'ok');
            if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        }, { once: true });
        dialog.showModal();
        cancelBtn.focus();
    });
}

function needsConfirm(form) {
    if (form.dataset.confirm) return true;
    if (!location.pathname.startsWith('/dashboard')) return false;
    const m = form.querySelector('input[name="_method"]');
    return !!m && String(m.value).toUpperCase() === 'DELETE';
}

document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || confirmed || e.defaultPrevented) return;
    if (!needsConfirm(form)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    lastFocus = e.submitter || document.activeElement;

    ask(form.dataset.confirm).then((ok) => {
        if (!ok) return;
        confirmed = true;
        try {
            form.submit(); // submit olayı tetiklemez; bayrak yine de güvence
        } finally {
            confirmed = false;
        }
    });
}, true);
