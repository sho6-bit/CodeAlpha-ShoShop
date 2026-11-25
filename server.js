const fs = require("node:fs");
const path = require("node:path");
const {
    createHash,
    randomBytes,
    scryptSync,
    timingSafeEqual
} = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const root = __dirname;
const databasePath = process.env.SHO_SHOP_DB || path.join(root, "data", "sho-shop.sqlite");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;
const freeShippingThreshold = 250000;
const standardShipping = 15000;

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON");
database.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        size TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL CHECK (price >= 0),
        badge TEXT NOT NULL,
        art TEXT NOT NULL,
        packaging TEXT NOT NULL,
        description_id TEXT NOT NULL,
        description_en TEXT NOT NULL,
        highlights_id TEXT NOT NULL,
        highlights_en TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        reference TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
        shipping INTEGER NOT NULL CHECK (shipping >= 0),
        total INTEGER NOT NULL CHECK (total >= 0),
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        UNIQUE (order_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON orders(user_id, created_at);
`);

const seedProducts = [
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
        descriptionId: "Pembersih wajah lembut untuk menemani rutinitas pagi dan malam. Teksturnya nyaman digunakan sebagai langkah awal perawatan.",
        descriptionEn: "A gentle facial cleanser for your morning and evening routine, with a comfortable texture for the first step of your skincare ritual.",
        highlightsId: ["Membersihkan dengan lembut", "Nyaman untuk rutinitas harian", "Isi 120 ml"],
        highlightsEn: ["Gentle daily cleansing", "Comfortable for everyday use", "120 ml"]
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
        descriptionId: "Serum bertekstur ringan yang membantu menjaga kelembapan dan membuat kulit terasa nyaman.",
        descriptionEn: "A lightweight serum that helps maintain hydration and keeps skin feeling comfortable.",
        highlightsId: ["Tekstur ringan", "Mudah menyatu dalam rutinitas", "Isi 30 ml"],
        highlightsEn: ["Lightweight texture", "Easy to add to your routine", "30 ml"]
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
        descriptionId: "Krim pelembap dengan tekstur lembut untuk melengkapi rutinitas perawatan harian.",
        descriptionEn: "A moisturizer with a soft texture to round out your daily skincare routine.",
        highlightsId: ["Membantu menjaga kelembapan", "Tekstur lembut dan nyaman", "Isi 50 g"],
        highlightsEn: ["Helps maintain moisture", "Soft, comfortable texture", "50 g"]
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
        descriptionId: "Essence sunscreen ringan untuk menjadi bagian dari rutinitas pagi sebelum beraktivitas.",
        descriptionEn: "A lightweight sunscreen essence for your morning routine before heading out.",
        highlightsId: ["SPF 50", "Tekstur essence ringan", "Isi 50 ml"],
        highlightsEn: ["SPF 50", "Lightweight essence texture", "50 ml"]
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
        descriptionId: "Tint mungil dengan warna lembut untuk memberi sentuhan segar pada bibir dan pipi.",
        descriptionEn: "A pocket-sized tint in a soft shade for a fresh touch on lips and cheeks.",
        highlightsId: ["Bisa digunakan di bibir dan pipi", "Mudah dibawa", "Isi 4 g"],
        highlightsEn: ["For lips and cheeks", "Easy to carry", "4 g"]
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
        descriptionId: "Toner ringan untuk langkah persiapan kulit setelah membersihkan wajah.",
        descriptionEn: "A lightweight toner to prep your skin after cleansing.",
        highlightsId: ["Membantu memberi rasa lembap", "Ringan untuk dipakai sehari-hari", "Isi 150 ml"],
        highlightsEn: ["Helps skin feel hydrated", "Lightweight for everyday use", "150 ml"]
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
        descriptionId: "Balm pembersih dengan tekstur lembut untuk membantu mengangkat sisa makeup dan sunscreen.",
        descriptionEn: "A soft cleansing balm that helps remove makeup and sunscreen residue.",
        highlightsId: ["Tekstur balm yang meleleh", "Untuk langkah pembersihan pertama", "Isi 80 g"],
        highlightsEn: ["Melting balm texture", "For the first cleansing step", "80 g"]
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
        descriptionId: "Lip glaze dengan hasil akhir berkilau untuk melengkapi tampilan sehari-hari.",
        descriptionEn: "A glossy lip glaze to finish off your everyday look.",
        highlightsId: ["Hasil akhir berkilau", "Warna lembut untuk daily look", "Isi 3.5 g"],
        highlightsEn: ["Glossy finish", "A soft shade for everyday looks", "3.5 g"]
    }
];

const insertProduct = database.prepare(`
    INSERT OR IGNORE INTO products (
        id, brand, name, label, size, category, price, badge, art, packaging,
        description_id, description_en, highlights_id, highlights_en, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const seededAt = new Date().toISOString();
for (const product of seedProducts) {
    insertProduct.run(
        product.id,
        product.brand,
        product.name,
        product.label,
        product.size,
        product.category,
        product.price,
        product.badge,
        product.art,
        product.packaging,
        product.descriptionId,
        product.descriptionEn,
        JSON.stringify(product.highlightsId),
        JSON.stringify(product.highlightsEn),
        seededAt
    );
}

const app = express();
app.disable("x-powered-by");
app.use((request, response, next) => {
    response.set("X-Content-Type-Options", "nosniff");
    next();
});
app.use(express.json({ limit: "1mb" }));

function getSessionToken(request) {
    const cookieHeader = request.headers.cookie || "";
    const cookie = cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith("sho_session="));
    if (!cookie) {
        return "";
    }
    try {
        return decodeURIComponent(cookie.slice("sho_session=".length));
    } catch (error) {
        console.warn("Ignoring malformed session cookie.", error);
        return "";
    }
}

function getAuthenticatedUser(request) {
    const token = getSessionToken(request);
    if (!token) {
        return null;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = database.prepare(`
        SELECT users.id, users.name, users.phone, users.email
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(tokenHash, new Date().toISOString());
    return session || null;
}

function setSessionCookie(response, token, request) {
    const secure = request.secure ? "; Secure" : "";
    response.cookie("sho_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: Boolean(secure),
        maxAge: sessionLifetimeSeconds * 1000,
        path: "/"
    });
}

function createSession(userId) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + sessionLifetimeSeconds * 1000).toISOString();
    database.prepare(`
        INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    `).run(tokenHash, userId, createdAt.toISOString(), expiresAt);
    return token;
}

function clearSession(request, response) {
    const token = getSessionToken(request);
    if (token) {
        const tokenHash = createHash("sha256").update(token).digest("hex");
        database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    }
    response.clearCookie("sho_session", {
        httpOnly: true,
        sameSite: "lax",
        secure: request.secure,
        path: "/"
    });
}

function requireAuthenticatedUser(request, response) {
    const user = getAuthenticatedUser(request);
    if (!user) {
        response.status(401).json({ error: "Please sign in to continue." });
        return null;
    }
    return user;
}

function normalizeText(value, maximumLength) {
    return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function createUser(request, response) {
    const name = normalizeText(request.body.name, 100);
    const phone = normalizeText(request.body.phone, 40);
    const email = normalizeText(request.body.email, 254).toLowerCase();
    const password = typeof request.body.password === "string" ? request.body.password : "";

    if (name.length < 2 || phone.length < 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        response.status(400).json({ error: "Enter a valid name, phone number, and email address." });
        return;
    }
    if (password.length < 8 || password.length > 128) {
        response.status(400).json({ error: "Password must be between 8 and 128 characters." });
        return;
    }
    if (database.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
        response.status(409).json({ error: "An account with this email already exists." });
        return;
    }

    const salt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(password, salt, 64).toString("hex");
    const createdAt = new Date().toISOString();
    database.exec("BEGIN IMMEDIATE");
    try {
        const result = database.prepare(`
            INSERT INTO users (name, phone, email, password_salt, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, phone, email, salt, passwordHash, createdAt);
        const userId = Number(result.lastInsertRowid);
        const token = createSession(userId);
        database.exec("COMMIT");
        setSessionCookie(response, token, request);
        response.status(201).json({ user: { id: userId, name, phone, email } });
    } catch (error) {
        database.exec("ROLLBACK");
        if (String(error.message).includes("users.email")) {
            response.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        throw error;
    }
}

function loginUser(request, response) {
    const email = normalizeText(request.body.email, 254).toLowerCase();
    const password = typeof request.body.password === "string" ? request.body.password : "";
    const user = database.prepare(`
        SELECT id, name, phone, email, password_salt, password_hash
        FROM users WHERE email = ?
    `).get(email);

    if (!user || !password) {
        response.status(401).json({ error: "Email or password is incorrect." });
        return;
    }

    const passwordHash = scryptSync(password, user.password_salt, 64);
    const savedHash = Buffer.from(user.password_hash, "hex");
    if (passwordHash.length !== savedHash.length || !timingSafeEqual(passwordHash, savedHash)) {
        response.status(401).json({ error: "Email or password is incorrect." });
        return;
    }

    const token = createSession(user.id);
    setSessionCookie(response, token, request);
    response.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email } });
}

function getProducts() {
    return database.prepare(`
        SELECT id, brand, name, label, size, category, price, badge, art, packaging,
            description_id AS descriptionId, description_en AS descriptionEn,
            highlights_id AS highlightsId, highlights_en AS highlightsEn
        FROM products
        ORDER BY rowid
    `).all().map(product => ({
        ...product,
        highlightsId: JSON.parse(product.highlightsId),
        highlightsEn: JSON.parse(product.highlightsEn)
    }));
}

function validateOrderBody(body) {
    const customer = body.customer && typeof body.customer === "object" ? body.customer : {};
    const orderCustomer = {
        name: normalizeText(customer.name, 100),
        phone: normalizeText(customer.phone, 40),
        address: normalizeText(customer.address, 500),
        city: normalizeText(customer.city, 100),
        postalCode: normalizeText(customer.postalCode, 20)
    };
    const paymentMethods = ["cod", "bank_transfer", "qris"];

    if (
        orderCustomer.name.length < 2 ||
        orderCustomer.phone.length < 7 ||
        !orderCustomer.address ||
        !orderCustomer.city ||
        !orderCustomer.postalCode
    ) {
        const error = new Error("Complete the recipient and delivery details.");
        error.statusCode = 400;
        throw error;
    }
    if (!paymentMethods.includes(body.payment)) {
        const error = new Error("Choose a supported demo payment method.");
        error.statusCode = 400;
        throw error;
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
        const error = new Error("Add between 1 and 30 products to your order.");
        error.statusCode = 400;
        throw error;
    }

    const quantities = new Map();
    for (const item of body.items) {
        if (
            !item ||
            typeof item.productId !== "string" ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99
        ) {
            const error = new Error("Order items contain an invalid product or quantity.");
            error.statusCode = 400;
            throw error;
        }
        quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }

    return {
        customer: orderCustomer,
        payment: body.payment,
        note: normalizeText(body.note, 500),
        quantities
    };
}

function createOrder(request, response) {
    const validated = validateOrderBody(request.body);
    const items = [];
    let subtotal = 0;

    for (const [productId, quantity] of validated.quantities) {
        const product = database.prepare("SELECT id, name, price FROM products WHERE id = ?").get(productId);
        if (!product) {
            const error = new Error("One or more selected products are no longer available.");
            error.statusCode = 400;
            throw error;
        }
        subtotal += product.price * quantity;
        items.push({ ...product, quantity });
    }

    const shipping = subtotal >= freeShippingThreshold ? 0 : standardShipping;
    const total = subtotal + shipping;
    const reference = `SH-${Date.now().toString().slice(-8)}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const user = getAuthenticatedUser(request);

    database.exec("BEGIN IMMEDIATE");
    try {
        const result = database.prepare(`
            INSERT INTO orders (
                reference, user_id, customer_name, customer_phone, address, city,
                postal_code, payment_method, note, subtotal, shipping, total, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            reference,
            user ? user.id : null,
            validated.customer.name,
            validated.customer.phone,
            validated.customer.address,
            validated.customer.city,
            validated.customer.postalCode,
            validated.payment,
            validated.note,
            subtotal,
            shipping,
            total,
            "received",
            createdAt
        );

        const insertOrderItem = database.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);
        for (const item of items) {
            insertOrderItem.run(Number(result.lastInsertRowid), item.id, item.name, item.price, item.quantity);
        }
        database.exec("COMMIT");
    } catch (error) {
        database.exec("ROLLBACK");
        throw error;
    }

    response.status(201).json({
        order: { reference, status: "received", subtotal, shipping, total, createdAt }
    });
}

function getOrderHistory(userId) {
    const orders = database.prepare(`
        SELECT id, reference, customer_name AS customerName, payment_method AS payment,
            subtotal, shipping, total, status, created_at AS createdAt
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(userId);
    const getItems = database.prepare(`
        SELECT product_id AS productId, product_name AS name, unit_price AS unitPrice, quantity
        FROM order_items WHERE order_id = ?
    `);
    return orders.map(order => ({ ...order, items: getItems.all(order.id) }));
}

app.get("/api/products", (request, response) => {
    response.json({ products: getProducts() });
});

app.get("/api/auth/me", (request, response) => {
    response.json({ user: getAuthenticatedUser(request) });
});

app.post("/api/auth/register", (request, response) => {
    createUser(request, response);
});

app.post("/api/auth/login", (request, response) => {
    loginUser(request, response);
});

app.post("/api/auth/logout", (request, response) => {
    const token = getSessionToken(request);
    if (token) {
        const tokenHash = createHash("sha256").update(token).digest("hex");
        database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    }
    response.clearCookie("sho_session", {
        httpOnly: true,
        sameSite: "lax",
        secure: request.secure,
        path: "/"
    });
    response.status(204).end();
});

app.get("/api/orders", (request, response) => {
    const user = requireAuthenticatedUser(request, response);
    if (!user) {
        return;
    }
    response.json({ orders: getOrderHistory(user.id) });
});

app.post("/api/orders", (request, response) => {
    createOrder(request, response);
});

app.use("/api", (request, response) => {
    response.status(404).json({ error: "API route not found." });
});

app.use("/data", (request, response) => {
    response.status(404).send("Not found.");
});

app.use(express.static(root, {
    dotfiles: "deny",
    index: "index.html",
    setHeaders(response) {
        response.set("Cache-Control", "no-cache");
    }
}));

app.use((request, response) => {
    response.status(404).send("Not found.");
});

app.use((error, request, response, next) => {
    if (response.headersSent) {
        next(error);
        return;
    }

    if (error.type === "entity.too.large") {
        response.status(413).json({ error: "Request body is too large." });
        return;
    }
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        response.status(400).json({ error: "Request body must be valid JSON." });
        return;
    }

    console.error("Express request failed.", error);
    response.status(error.statusCode || 500).json({
        error: error.statusCode ? error.message : "The request could not be completed."
    });
});

const server = app.listen(port, host, () => {
    console.log(`Sho Shop running at http://${host}:${port}`);
    console.log(`SQLite database: ${databasePath}`);
});

function closeServer() {
    server.close(() => {
        database.close();
    });
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
