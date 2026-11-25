# Sho Shop

Sho Shop is a demo online storefront for skincare and makeup products. It features an Indonesian and English interface, a shopping bag, product details, user authentication, and a checkout flow that saves orders to a SQLite database.

## Features

- **Product catalog** — search, category filters, sorting, and product details.
- **Shopping bag** — add products and adjust quantities; bag contents are stored in the browser.
- **Checkout** — place orders as a guest or registered user; the server recalculates shipping and totals.
- **User accounts** — register, sign in, sign out, and view order history while signed in.
- **Bilingual interface** — switch between Indonesian and English; the selected language is stored in the browser.
- **Data persistence** — products, users, sessions, orders, and order items are stored in SQLite.
- **Responsive layout** — storefront, sign-in, and registration pages support desktop and mobile screens.

## Technology

- HTML, CSS, and JavaScript
- Node.js and Express.js
- SQLite through the built-in `node:sqlite` module

## Requirements

- Node.js **22.13 or later**
- npm

## Run locally

From the project directory, run:

```bash
npm install
npm start
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

On the first server start, the app creates `data/sho-shop.sqlite` and seeds the sample product catalog. No manual database setup is required.

## Server configuration

All configuration variables are optional:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Express HTTP port |
| `HOST` | `127.0.0.1` | Network address the server listens on |
| `SHO_SHOP_DB` | `data/sho-shop.sqlite` | SQLite database file location |

Example: change the port in PowerShell:

```powershell
$env:PORT = "4000"
npm start
```

## API

All endpoints return JSON except the logout endpoint, which returns an empty response.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | Retrieve the product catalog |
| `GET` | `/api/auth/me` | Check the current user session |
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in to an account |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/orders` | Retrieve order history for the signed-in user |
| `POST` | `/api/orders` | Create an order; guests are also supported |

Example request body for creating an order:

```json
{
  "customer": {
    "name": "Customer Name",
    "phone": "08123456789",
    "address": "Delivery address",
    "city": "Jakarta",
    "postalCode": "12345"
  },
  "payment": "cod",
  "items": [
    {
      "productId": "dew-diary-cleanser",
      "quantity": 1
    }
  ],
  "note": ""
}
```

Supported `payment` values: `cod`, `bank_transfer`, and `qris`.

## Database and account security

The database automatically creates the `products`, `users`, `sessions`, `orders`, and `order_items` tables. Product prices are retrieved from the database when an order is placed, so the server does not trust prices sent by the browser when calculating the subtotal, shipping, or total. Demo shipping is Rp15,000 and is free for subtotals of Rp250,000 or more.

Account passwords are stored as salted scrypt hashes. Sessions use an `HttpOnly` cookie. The local database file is stored in `data/` and is ignored by Git.

## Demo limitations

- The catalog contains sample products seeded on the first server start. There is no admin panel or product-management API.
- Payment methods are simulations; no real payments are processed and no payment gateway is integrated.
- This project is intended for demonstration and local development. Additional configuration and security review are required before using it as a production service.
