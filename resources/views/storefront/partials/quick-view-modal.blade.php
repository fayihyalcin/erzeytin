<div
    class="quick-view-overlay"
    x-cloak
    x-show="quickViewOpen"
    x-transition.opacity
    x-on:click.self="closeQuickView()"
    aria-modal="true"
    role="dialog"
    aria-labelledby="quick-view-title"
>
    <div class="quick-view-modal" x-show="quickViewOpen" x-transition.scale.origin.center>
        <button class="quick-view-close" type="button" x-on:click="closeQuickView()" aria-label="Hızlı incelemeyi kapat">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
        </button>

        <template x-if="selectedProduct">
            <div class="quick-view-content">
                <div class="quick-view-media">
                    <span class="product-badge" x-text="selectedProduct.badge"></span>
                    <img :src="selectedProduct.image" :alt="selectedProduct.title">
                </div>

                <div class="quick-view-info">
                    <p class="quick-view-kicker" x-text="selectedProduct.category"></p>
                    <h3 id="quick-view-title" x-text="selectedProduct.title"></h3>
                    <p class="quick-view-price">₺<span x-text="selectedProduct.price"></span></p>
                    <p class="quick-view-description" x-text="selectedProduct.description"></p>

                    <div class="quick-view-meta">
                        <span><strong>Stok</strong><small x-text="selectedProduct.stock"></small></span>
                        <span><strong>Teslimat</strong><small>24 saat içinde kargo</small></span>
                    </div>

                    <div class="quick-view-actions">
                        <div class="quantity-control" aria-label="Adet seçimi">
                            <button type="button" x-on:click="quantity = Math.max(1, quantity - 1)" aria-label="Adedi azalt">−</button>
                            <output x-text="quantity"></output>
                            <button type="button" x-on:click="quantity++" aria-label="Adedi artır">+</button>
                        </div>
                        <form class="quick-add-cart-form" method="POST" :action="selectedProduct.cartUrl">
                            @csrf
                            <input type="hidden" name="quantity" x-bind:value="quantity">
                            <button class="quick-add-cart" type="submit">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 6h15l-2 8H8L6 3H3"></path>
                                    <circle cx="9" cy="20" r="1.7"></circle>
                                    <circle cx="18" cy="20" r="1.7"></circle>
                                </svg>
                                <span>Sepete Ekle</span>
                            </button>
                        </form>
                    </div>

                    <a :href="selectedProduct.detailUrl" class="quick-detail-link">
                        <span>Ürün detayına git</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>
                    </a>
                </div>
            </div>
        </template>
    </div>
</div>
