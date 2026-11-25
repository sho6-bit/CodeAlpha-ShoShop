# Sho Shop

Sho Shop is a small storefront with an Indonesian/English interface, an Express.js API, and a local SQLite database.

## Requirements

- Node.js 22.13 or newer (uses the built-in `node:sqlite` module)

## Run locally

```sh
npm install
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The server creates `data/sho-shop.sqlite` and seeds the sample products on first run.

The database stores products, registered users, sessions, orders, and order items. Passwords are stored as salted scrypt hashes, and the session cookie is HTTP-only. Checkout saves orders but is still a local demo; the listed payment methods do not contact a payment provider.

