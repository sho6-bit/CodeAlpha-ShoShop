const products = [
    {
        id: "dew-diary-cleanser",
        brand: "Dew Diary",
        name: "Mizu Dew Gentle Cleanser",
        label: "mizu dew",
        size: "120 ml",
        category: "Cleanser",
        price: 89000,
        badge: "DAILY FAVE",
        art: "cleanser",
        packaging: "cleanser",
        description: "Pembersih wajah lembut untuk menemani rutinitas pagi dan malam. Teksturnya nyaman digunakan sebagai langkah awal perawatan.",
        highlights: ["Membersihkan dengan lembut", "Nyaman untuk rutinitas harian", "Isi 120 ml"]
    },
    {
        id: "bloom-lab-serum",
        brand: "Bloom Lab",
        name: "Petal Milk Barrier Serum",
        label: "petal milk",
        size: "30 ml",
        category: "Skincare",
        price: 149000,
        badge: "SHO PICK",
        art: "serum",
        packaging: "serum",
        description: "Serum bertekstur ringan yang membantu menjaga kelembapan dan membuat kulit terasa nyaman.",
        highlights: ["Tekstur ringan", "Mudah menyatu dalam rutinitas", "Isi 30 ml"]
    },
    {
        id: "cloud-nine-cream",
        brand: "Cloud Nine",
        name: "Cloud Soft Moisture Cream",
        label: "cloud soft",
        size: "50 g",
        category: "Skincare",
        price: 129000,
        badge: "SOFT TOUCH",
        art: "cream",
        packaging: "cream",
        description: "Krim pelembap dengan tekstur lembut untuk melengkapi rutinitas perawatan harian.",
        highlights: ["Membantu menjaga kelembapan", "Tekstur lembut dan nyaman", "Isi 50 g"]
    },
    {
        id: "sunny-side-uv",
        brand: "Sunny Side",
        name: "Daydream UV Essence SPF 50",
        label: "daydream uv",
        size: "50 ml",
        category: "Sunscreen",
        price: 119000,
        badge: "SUN CARE",
        art: "sunscreen",
        packaging: "sunscreen",
        description: "Essence sunscreen ringan untuk menjadi bagian dari rutinitas pagi sebelum beraktivitas.",
        highlights: ["SPF 50", "Tekstur essence ringan", "Isi 50 ml"]
    },
    {
        id: "peachy-cheek-tint",
        brand: "Peachy Days",
        name: "Bloom Cheek & Lip Tint",
        label: "bloom tint",
        size: "4 g",
        category: "Makeup",
        price: 79000,
        badge: "NEW",
        art: "makeup",
        packaging: "makeup",
        description: "Tint mungil dengan warna lembut untuk memberi sentuhan segar pada bibir dan pipi.",
        highlights: ["Bisa digunakan di bibir dan pipi", "Mudah dibawa", "Isi 4 g"]
    },
    {
        id: "mori-dew-toner",
        brand: "Mori Dew",
        name: "Dewdrop Hydrating Toner",
        label: "dewdrop",
        size: "150 ml",
        category: "Skincare",
        price: 109000,
        badge: "HYDRATING",
        art: "toner",
        packaging: "toner",
        description: "Toner ringan untuk langkah persiapan kulit setelah membersihkan wajah.",
        highlights: ["Membantu memberi rasa lembap", "Ringan untuk dipakai sehari-hari", "Isi 150 ml"]
    },
    {
        id: "mellow-melt-balm",
        brand: "Mellow Melt",
        name: "Soft Melt Cleansing Balm",
        label: "soft melt",
        size: "80 g",
        category: "Cleanser",
        price: 135000,
        badge: "GENTLE CLEAN",
        art: "cream",
        packaging: "cream",
        description: "Balm pembersih dengan tekstur lembut untuk membantu mengangkat sisa makeup dan sunscreen.",
        highlights: ["Tekstur balm yang meleleh", "Untuk langkah pembersihan pertama", "Isi 80 g"]
    },
    {
        id: "peach-hour-glaze",
        brand: "Peach Hour",
        name: "Juicy Petal Lip Glaze",
        label: "juicy petal",
        size: "3.5 g",
        category: "Makeup",
        price: 99000,
        badge: "LOVELY COLOR",
        art: "makeup",
        packaging: "makeup",
        description: "Lip glaze dengan hasil akhir berkilau untuk melengkapi tampilan sehari-hari.",
        highlights: ["Hasil akhir berkilau", "Warna lembut untuk daily look", "Isi 3.5 g"]
    }
];

const freeShippingThreshold = 250000;
const standardShipping = 15000;
const cartStorageKey = "shoShopCartV1";
const orderStorageKey = "shoShopOrdersV1";

const productGrid = document.getElementById("product-grid");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("product-search");
const sortSelect = document.getElementById("sort-products");
const resultCaption = document.getElementById("result-caption");
const emptyResults = document.getElementById("empty-results");
const filterButtons = document.querySelectorAll("[data-category]");
const cartDialog = document.getElementById("cart-dialog");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const toast = document.getElementById("toast");
const checkoutDialog = document.getElementById("checkout-dialog");
const checkoutForm = document.getElementById("checkout-form");

let activeCategory = "Semua";
let cart = loadStoredArray(cartStorageKey).filter(item =>
    item &&
    typeof item.id === "string" &&
    products.some(product => product.id === item.id) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
);
let detailQuantity = 1;
let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function loadStoredArray(key) {
    try {
        const stored = window.localStorage.getItem(key);
        if (stored === null) {
            return [];
        }

        const value = JSON.parse(stored);
        if (!Array.isArray(value)) {
            throw new TypeError("Saved value is not a list.");
        }
        return value;
    } catch (error) {
        console.error(`Could not read ${key} from local storage.`, error);
        showToast("Data tersimpan tidak dapat dibaca. Kamu bisa mulai lagi.");
        return [];
    }
}

function saveStoredArray(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Could not save ${key} to local storage.`, error);
        showToast("Data tidak dapat disimpan di browser ini. Coba lagi atau periksa pengaturan browser.");
        return false;
    }
}

function formatPrice(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

function getProduct(productId) {
    return products.find(product => product.id === productId);
}

function packageMarkup(product) {
    return `<div class="product-pack pack-${product.packaging}">
        <span class="pack-brand">${product.brand}</span>
        <span class="pack-label">${product.label}</span>
        <span class="pack-size">${product.size}</span>
    </div>`;
}

function getVisibleProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase("id");
    let visibleProducts = products.filter(product => {
        const matchesSearch = !query ||
            `${product.brand} ${product.name} ${product.category}`.toLocaleLowerCase("id").includes(query);
        const matchesCategory = activeCategory === "Semua" ||
            product.category === activeCategory ||
            (activeCategory === "Skincare" && ["Cleanser", "Sunscreen"].includes(product.category));
        return matchesSearch && matchesCategory;
    });

    if (sortSelect.value === "price-low") {
        visibleProducts = visibleProducts.slice().sort((first, second) => first.price - second.price);
    } else if (sortSelect.value === "price-high") {
        visibleProducts = visibleProducts.slice().sort((first, second) => second.price - first.price);
    } else if (sortSelect.value === "name") {
        visibleProducts = visibleProducts.slice().sort((first, second) => first.name.localeCompare(second.name, "id"));
    }

    return visibleProducts;
}

function renderProducts() {
    const visibleProducts = getVisibleProducts();
    resultCaption.textContent = `${visibleProducts.length} produk`;
    emptyResults.hidden = visibleProducts.length > 0;
    productGrid.innerHTML = visibleProducts.map(product => `
        <article class="product-card">
            <button class="product-open" type="button" data-view-product="${product.id}" aria-label="Lihat detail ${product.name}">
                <span class="product-art art-${product.art}" aria-hidden="true">
                    <span class="product-badge">${product.badge}</span>
                    ${packageMarkup(product)}
                </span>
            </button>
            <div class="product-info">
                <p class="product-brand">${product.brand}</p>
                <p class="product-name">${product.name}</p>
                <p class="product-size">${product.category} · ${product.size}</p>
                <div class="product-price-row">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="add-button" type="button" data-add-product="${product.id}" aria-label="Tambah ${product.name} ke tas">+</button>
                </div>
            </div>
        </article>
    `).join("");
}

function setCategory(category) {
    activeCategory = category;
    filterButtons.forEach(button => {
        button.classList.toggle("is-active", button.dataset.category === category);
    });
    renderProducts();
}

function getCartQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartSubtotal() {
    return cart.reduce((total, item) => {
        const product = getProduct(item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function getShipping(subtotal) {
    return subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : standardShipping;
}

function addToCart(productId, quantity) {
    const product = getProduct(productId);
    if (!product) {
        showToast("Produk tidak ditemukan.");
        return;
    }

    const previousCart = cart.map(item => ({ ...item }));
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }

    if (!saveStoredArray(cartStorageKey, cart)) {
        cart = previousCart;
        renderCart();
        return;
    }
    renderCart();
    showToast(`${product.name} ditambahkan ke tas.`);
}

function changeQuantity(productId, change) {
    const item = cart.find(cartItem => cartItem.id === productId);
    if (!item) {
        return;
    }

    const previousCart = cart.map(cartItem => ({ ...cartItem }));
    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(cartItem => cartItem.id !== productId);
    }

    if (!saveStoredArray(cartStorageKey, cart)) {
        cart = previousCart;
    }
    renderCart();
}

function removeFromCart(productId) {
    const previousCart = cart.map(item => ({ ...item }));
    cart = cart.filter(item => item.id !== productId);
    if (!saveStoredArray(cartStorageKey, cart)) {
        cart = previousCart;
    }
    renderCart();
}

function renderCart() {
    cartCount.textContent = String(getCartQuantity());
    document.getElementById("open-cart").setAttribute(
        "aria-label",
        `Buka keranjang, ${getCartQuantity()} item`
    );
    document.getElementById("cart-title-count").textContent =
        getCartQuantity() ? `(${getCartQuantity()})` : "";

    const isEmpty = cart.length === 0;
    document.getElementById("cart-empty").hidden = !isEmpty;
    document.getElementById("cart-summary").hidden = isEmpty;
    cartItemsContainer.hidden = isEmpty;

    cartItemsContainer.innerHTML = cart.map(item => {
        const product = getProduct(item.id);
        if (!product) {
            return "";
        }
        return `
            <article class="cart-item">
                <div class="cart-thumb art-${product.art}" aria-hidden="true">${packageMarkup(product)}</div>
                <div>
                    <p class="cart-item-name">${product.name}</p>
                    <p class="cart-item-price">${formatPrice(product.price * item.quantity)}</p>
                    <div class="quantity-control" aria-label="Jumlah ${product.name}">
                        <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Kurangi jumlah">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Tambah jumlah">+</button>
                    </div>
                    <button class="remove-item" type="button" data-cart-action="remove" data-product-id="${product.id}">Hapus</button>
                </div>
                <strong aria-label="Harga per item">${formatPrice(product.price)}</strong>
            </article>
        `;
    }).join("");

    const subtotal = getCartSubtotal();
    const shipping = getShipping(subtotal);
    document.getElementById("cart-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("cart-shipping").textContent = shipping ? formatPrice(shipping) : "Gratis";
    document.getElementById("cart-total").textContent = formatPrice(subtotal + shipping);
}

function openDialog(dialog) {
    if (!dialog.open) {
        dialog.showModal();
    }
}

function openProductDetails(productId) {
    const product = getProduct(productId);
    if (!product) {
        showToast("Produk tidak ditemukan.");
        return;
    }

    detailQuantity = 1;
    document.getElementById("product-detail").innerHTML = `
        <div class="product-detail-layout">
            <div class="detail-art art-${product.art}" aria-hidden="true">
                ${packageMarkup(product)}
            </div>
            <div class="detail-copy">
                <p class="eyebrow">${product.brand} · ${product.category.toUpperCase()}</p>
                <h2>${product.name}</h2>
                <p class="detail-size">${product.size}</p>
                <p class="detail-price">${formatPrice(product.price)}</p>
                <p class="detail-description">${product.description}</p>
                <ul class="detail-highlights">${product.highlights.map(item => `<li>${item}</li>`).join("")}</ul>
                <div class="detail-actions">
                    <div class="detail-quantity" aria-label="Atur jumlah produk">
                        <button type="button" data-detail-quantity="-1" aria-label="Kurangi jumlah">−</button>
                        <output id="detail-quantity">1</output>
                        <button type="button" data-detail-quantity="1" aria-label="Tambah jumlah">+</button>
                    </div>
                    <button class="primary-button" type="button" data-detail-add="${product.id}">Tambah ke tas · ${formatPrice(product.price)}</button>
                </div>
            </div>
        </div>
    `;
    openDialog(document.getElementById("product-dialog"));
}

function renderCheckoutSummary() {
    const subtotal = getCartSubtotal();
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;
    document.getElementById("checkout-summary").innerHTML = `
        <span>${getCartQuantity()} item · Subtotal ${formatPrice(subtotal)}${shipping ? ` · Ongkir ${formatPrice(shipping)}` : " · Ongkir gratis"}</span>
        <strong>${formatPrice(total)}</strong>
    `;
}

function makeOrderReference() {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `SH-${Date.now().toString().slice(-8)}-${suffix}`;
}

function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) {
        showToast("Tas belanjamu masih kosong.");
        checkoutDialog.close();
        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    const formData = new FormData(checkoutForm);
    const customer = {
        name: String(formData.get("name")).trim(),
        phone: String(formData.get("phone")).trim(),
        address: String(formData.get("address")).trim(),
        city: String(formData.get("city")).trim(),
        postalCode: String(formData.get("postalCode")).trim()
    };
    if (Object.values(customer).some(value => !value)) {
        showToast("Lengkapi detail penerima dan alamat pengiriman.");
        return;
    }

    const subtotal = getCartSubtotal();
    const shipping = getShipping(subtotal);
    const order = {
        reference: makeOrderReference(),
        createdAt: new Date().toISOString(),
        status: "Diterima (demo)",
        customer,
        payment: String(formData.get("payment")),
        note: String(formData.get("note") || "").trim(),
        items: cart.map(item => {
            const product = getProduct(item.id);
            return {
                id: item.id,
                name: product.name,
                unitPrice: product.price,
                quantity: item.quantity
            };
        }),
        subtotal,
        shipping,
        total: subtotal + shipping
    };

    const previousOrders = loadStoredArray(orderStorageKey);
    if (!saveStoredArray(orderStorageKey, [order, ...previousOrders])) {
        return;
    }

    const previousCart = cart;
    cart = [];
    if (!saveStoredArray(cartStorageKey, cart)) {
        cart = previousCart;
        showToast("Pesanan tercatat, tetapi tas belum berhasil dikosongkan. Periksa isinya sebelum checkout kembali.");
    }
    renderCart();
    checkoutForm.reset();
    checkoutDialog.close();
    document.getElementById("order-number").textContent = order.reference;
    document.getElementById("order-total").textContent = formatPrice(order.total);
    openDialog(document.getElementById("order-dialog"));
}

document.getElementById("category-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) {
        setCategory(button.dataset.category);
    }
});

document.querySelectorAll("[data-nav-category]").forEach(link => {
    link.addEventListener("click", () => setCategory(link.dataset.navCategory));
});

searchForm.addEventListener("submit", event => {
    event.preventDefault();
    renderProducts();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

productGrid.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
        addToCart(addButton.dataset.addProduct, 1);
        return;
    }

    const productButton = event.target.closest("[data-view-product]");
    if (productButton) {
        openProductDetails(productButton.dataset.viewProduct);
    }
});

document.getElementById("open-cart").addEventListener("click", () => {
    renderCart();
    openDialog(cartDialog);
});

cartDialog.addEventListener("click", event => {
    if (event.target === cartDialog) {
        cartDialog.close();
        return;
    }

    const button = event.target.closest("[data-cart-action]");
    if (!button) {
        return;
    }

    const { cartAction, productId } = button.dataset;
    if (cartAction === "increase") {
        changeQuantity(productId, 1);
    } else if (cartAction === "decrease") {
        changeQuantity(productId, -1);
    } else if (cartAction === "remove") {
        removeFromCart(productId);
    }
});

document.getElementById("product-detail").addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-detail-quantity]");
    if (quantityButton) {
        detailQuantity = Math.max(1, detailQuantity + Number(quantityButton.dataset.detailQuantity));
        document.getElementById("detail-quantity").textContent = String(detailQuantity);
        return;
    }

    const addButton = event.target.closest("[data-detail-add]");
    if (addButton) {
        addToCart(addButton.dataset.detailAdd, detailQuantity);
        document.getElementById("product-dialog").close();
    }
});

document.getElementById("start-checkout").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Tambahkan produk sebelum checkout.");
        return;
    }
    renderCheckoutSummary();
    cartDialog.close();
    openDialog(checkoutDialog);
});

checkoutForm.addEventListener("submit", submitOrder);

document.addEventListener("click", event => {
    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
        document.getElementById(closeButton.dataset.closeDialog).close();
    }
});

renderProducts();
renderCart();
