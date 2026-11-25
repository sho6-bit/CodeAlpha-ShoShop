const freeShippingThreshold = 250000;
const standardShipping = 15000;
const cartStorageKey = "shoShopCartV1";

const productGrid = document.getElementById("product-grid");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("product-search");
const sortSelect = document.getElementById("sort-products");
const resultCaption = document.getElementById("result-caption");
const emptyResults = document.getElementById("empty-results");
const productError = document.getElementById("product-error");
const filterButtons = document.querySelectorAll("[data-category]");
const cartDialog = document.getElementById("cart-dialog");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const toast = document.getElementById("toast");
const checkoutDialog = document.getElementById("checkout-dialog");
const checkoutForm = document.getElementById("checkout-form");
const productDialog = document.getElementById("product-dialog");
const accountLink = document.querySelector(".account-link");
const logoutButton = document.getElementById("logout-button");

let products = [];
let productsLoaded = false;
let activeCategory = "Semua";
let cart = loadStoredCart();
let detailQuantity = 1;
let activeProductId = null;
let currentUser = null;
let toastTimer;

function t(key, values) {
    return window.ShopI18n.t(key, values);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function loadStoredCart() {
    try {
        const stored = window.localStorage.getItem(cartStorageKey);
        if (stored === null) {
            return [];
        }
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) {
            throw new TypeError("Saved shopping bag is not a list.");
        }
        return value.filter(item =>
            item &&
            typeof item.id === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch (error) {
        console.error("Could not read the shopping bag from local storage.", error);
        showToast(t("toast.read.error"));
        return [];
    }
}

function saveCart() {
    try {
        window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error("Could not save the shopping bag to local storage.", error);
        showToast(t("toast.save.error"));
        return false;
    }
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        ...options
    });
    const contentType = response.headers.get("content-type") || "";
    const result = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
        const error = new Error(result && result.error ? result.error : `Request failed (${response.status}).`);
        error.status = response.status;
        throw error;
    }
    return result;
}

function formatPrice(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

function categoryLabel(category) {
    const keys = {
        Skincare: "products.category.skincare",
        Sunscreen: "products.category.sunscreen",
        Makeup: "products.category.makeup",
        Cleanser: "products.category.cleanser"
    };
    return t(keys[category] || "products.category.skincare");
}

function badgeLabel(badge) {
    const keys = {
        "DAILY FAVE": "badge.daily",
        "SHO PICK": "badge.pick",
        "SOFT TOUCH": "badge.soft",
        "SUN CARE": "badge.sun",
        NEW: "badge.new",
        HYDRATING: "badge.hydrating",
        "GENTLE CLEAN": "badge.clean",
        "LOVELY COLOR": "badge.color"
    };
    return t(keys[badge] || "badge.pick");
}

function productDescription(product) {
    const language = window.ShopI18n.getLanguage();
    return language === "en" ? product.descriptionEn : product.descriptionId;
}

function productHighlights(product) {
    return window.ShopI18n.getLanguage() === "en" ? product.highlightsEn : product.highlightsId;
}

function packageMarkup(product) {
    return `<div class="product-pack pack-${product.packaging}">
        <span class="pack-brand">${product.brand}</span>
        <span class="pack-label">${product.label}</span>
        <span class="pack-size">${product.size}</span>
    </div>`;
}

function getVisibleProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase(window.ShopI18n.getLanguage());
    let visibleProducts = products.filter(product => {
        const matchesSearch = !query ||
            `${product.brand} ${product.name} ${product.category}`.toLocaleLowerCase(window.ShopI18n.getLanguage()).includes(query);
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
        visibleProducts = visibleProducts.slice().sort((first, second) => first.name.localeCompare(second.name, window.ShopI18n.getLanguage()));
    }

    return visibleProducts;
}

function renderProducts() {
    if (!productsLoaded) {
        return;
    }

    const visibleProducts = getVisibleProducts();
    resultCaption.textContent = t("products.count", { count: visibleProducts.length });
    emptyResults.hidden = visibleProducts.length > 0;
    productError.hidden = true;
    productGrid.innerHTML = visibleProducts.map(product => `
        <article class="product-card">
            <button class="product-open" type="button" data-view-product="${product.id}" aria-label="${t("products.view", { name: product.name })}">
                <span class="product-art art-${product.art}" aria-hidden="true">
                    <span class="product-badge">${badgeLabel(product.badge)}</span>
                    ${packageMarkup(product)}
                </span>
            </button>
            <div class="product-info">
                <p class="product-brand">${product.brand}</p>
                <p class="product-name">${product.name}</p>
                <p class="product-size">${categoryLabel(product.category)} · ${product.size}</p>
                <div class="product-price-row">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="add-button" type="button" data-add-product="${product.id}" aria-label="${t("products.add", { name: product.name })}">+</button>
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

function getProduct(productId) {
    return products.find(product => product.id === productId);
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
        showToast(t("toast.product.missing"));
        return;
    }

    const previousCart = cart.map(item => ({ ...item }));
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }

    if (!saveCart()) {
        cart = previousCart;
        renderCart();
        return;
    }
    renderCart();
    showToast(t("toast.product.added", { name: product.name }));
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

    if (!saveCart()) {
        cart = previousCart;
    }
    renderCart();
}

function removeFromCart(productId) {
    const previousCart = cart.map(item => ({ ...item }));
    cart = cart.filter(item => item.id !== productId);
    if (!saveCart()) {
        cart = previousCart;
    }
    renderCart();
}

function renderCart() {
    const quantity = getCartQuantity();
    cartCount.textContent = String(quantity);
    document.getElementById("open-cart").setAttribute(
        "aria-label",
        t("cart.open", { count: quantity })
    );
    document.getElementById("cart-title-count").textContent = quantity ? `(${quantity})` : "";

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
                    <div class="quantity-control" aria-label="${t("cart.quantity", { name: product.name })}">
                        <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="${t("cart.decrease")}">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="${t("cart.increase")}">+</button>
                    </div>
                    <button class="remove-item" type="button" data-cart-action="remove" data-product-id="${product.id}">${t("cart.remove")}</button>
                </div>
                <strong aria-label="${t("cart.unit.price")}">${formatPrice(product.price)}</strong>
            </article>
        `;
    }).join("");

    const subtotal = getCartSubtotal();
    const shipping = getShipping(subtotal);
    document.getElementById("cart-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("cart-shipping").textContent = shipping ? formatPrice(shipping) : t("cart.free");
    document.getElementById("cart-total").textContent = formatPrice(subtotal + shipping);
}

function openDialog(dialog) {
    if (!dialog.open) {
        dialog.showModal();
    }
}

function renderProductDetails(productId) {
    const product = getProduct(productId);
    if (!product) {
        return;
    }

    detailQuantity = 1;
    productDialog.setAttribute("aria-label", t("products.view", { name: product.name }));
    document.getElementById("product-detail").innerHTML = `
        <div class="product-detail-layout">
            <div class="detail-art art-${product.art}" aria-hidden="true">
                ${packageMarkup(product)}
            </div>
            <div class="detail-copy">
                <p class="eyebrow">${product.brand} · ${categoryLabel(product.category).toUpperCase()}</p>
                <h2>${product.name}</h2>
                <p class="detail-size">${product.size}</p>
                <p class="detail-price">${formatPrice(product.price)}</p>
                <p class="detail-description">${productDescription(product)}</p>
                <ul class="detail-highlights">${productHighlights(product).map(item => `<li>${item}</li>`).join("")}</ul>
                <div class="detail-actions">
                    <div class="detail-quantity" aria-label="${t("product.quantity")}">
                        <button type="button" data-detail-quantity="-1" aria-label="${t("cart.decrease")}">−</button>
                        <output id="detail-quantity">1</output>
                        <button type="button" data-detail-quantity="1" aria-label="${t("cart.increase")}">+</button>
                    </div>
                    <button class="primary-button" type="button" data-detail-add="${product.id}">${t("product.add")} · ${formatPrice(product.price)}</button>
                </div>
            </div>
        </div>
    `;
}

function openProductDetails(productId) {
    if (!getProduct(productId)) {
        showToast(t("toast.product.missing"));
        return;
    }
    activeProductId = productId;
    renderProductDetails(productId);
    openDialog(productDialog);
}

function renderCheckoutSummary() {
    const subtotal = getCartSubtotal();
    const shipping = getShipping(subtotal);
    const shippingText = shipping
        ? t("checkout.summary.shipping", { amount: formatPrice(shipping) })
        : t("checkout.summary.free");
    document.getElementById("checkout-summary").innerHTML = `
        <span>${t("checkout.summary.items", { count: getCartQuantity() })} · ${t("checkout.summary.subtotal", { amount: formatPrice(subtotal) })} · ${shippingText}</span>
        <strong>${formatPrice(subtotal + shipping)}</strong>
    `;
}

function updateAccountDisplay() {
    const label = accountLink.querySelector("span");
    if (currentUser) {
        label.textContent = t("account.greeting", { name: currentUser.name });
        accountLink.href = "#products";
        accountLink.setAttribute("aria-label", t("account.greeting", { name: currentUser.name }));
        logoutButton.hidden = false;
    } else {
        label.textContent = t("account.login");
        accountLink.href = "login.html";
        accountLink.setAttribute("aria-label", t("account.aria"));
        logoutButton.hidden = true;
    }
}

async function loadCurrentUser() {
    try {
        const result = await apiRequest("/api/auth/me");
        currentUser = result.user;
        updateAccountDisplay();
        if (currentUser) {
            checkoutForm.elements.name.value = currentUser.name;
            checkoutForm.elements.phone.value = currentUser.phone;
        }
    } catch (error) {
        console.error("Could not load the current Sho Shop account.", error);
    }
}

async function loadProducts() {
    try {
        const result = await apiRequest("/api/products");
        if (!Array.isArray(result.products)) {
            throw new TypeError("The products API returned an invalid response.");
        }
        products = result.products;
        productsLoaded = true;
        const validProductIds = new Set(products.map(product => product.id));
        const previousCart = cart;
        cart = cart.filter(item => validProductIds.has(item.id));
        if (cart.length !== previousCart.length) {
            saveCart();
        }
        productError.hidden = true;
        renderProducts();
        renderCart();
    } catch (error) {
        console.error("Could not load products from the Sho Shop API.", error);
        productGrid.replaceChildren();
        emptyResults.hidden = true;
        productError.hidden = false;
        resultCaption.textContent = "";
        showToast(t("toast.products.error"));
    }
}

async function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) {
        showToast(t("toast.cart.empty"));
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
        showToast(t("toast.customer.required"));
        return;
    }

    const submitButton = checkoutForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        const result = await apiRequest("/api/orders", {
            method: "POST",
            body: JSON.stringify({
                customer,
                payment: String(formData.get("payment")),
                note: String(formData.get("note") || "").trim(),
                items: cart.map(item => ({ productId: item.id, quantity: item.quantity }))
            })
        });

        const previousCart = cart;
        cart = [];
        if (!saveCart()) {
            cart = previousCart;
            showToast(t("toast.order.cart.error"));
        }
        renderCart();
        checkoutForm.reset();
        checkoutDialog.close();
        document.getElementById("order-number").textContent = result.order.reference;
        document.getElementById("order-total").textContent = formatPrice(result.order.total);
        openDialog(document.getElementById("order-dialog"));
    } catch (error) {
        console.error("Could not create Sho Shop order.", error);
        showToast(t("toast.order.error"));
    } finally {
        submitButton.disabled = false;
    }
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
        productDialog.close();
    }
});

document.getElementById("start-checkout").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast(t("toast.cart.checkout.empty"));
        return;
    }
    renderCheckoutSummary();
    cartDialog.close();
    openDialog(checkoutDialog);
});

checkoutForm.addEventListener("submit", submitOrder);

document.getElementById("logout-button").addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
        await apiRequest("/api/auth/logout", { method: "POST" });
        currentUser = null;
        updateAccountDisplay();
    } catch (error) {
        console.error("Could not sign out of Sho Shop.", error);
        showToast(t("auth.error"));
    } finally {
        logoutButton.disabled = false;
    }
});

document.addEventListener("click", event => {
    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
        document.getElementById(closeButton.dataset.closeDialog).close();
    }
});

document.addEventListener("shop:languagechange", () => {
    renderProducts();
    renderCart();
    updateAccountDisplay();
    if (activeProductId && productDialog.open) {
        renderProductDetails(activeProductId);
    }
    if (checkoutDialog.open) {
        renderCheckoutSummary();
    }
});

renderCart();
loadProducts();
loadCurrentUser();
