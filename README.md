# 🕉 Shree Ramchandra Temple — Website

Full-stack MERN website for **Shree Ramchandra Temple**, Battisputali, Kathmandu (Gaushala), serving devotees from
Nepal and abroad: temple history, puja booking, donations, events, gallery, blog and a built-in temple assistant.

> **Stack:** React (Create React App) + Tailwind CSS on the frontend, Node.js + Express + MongoDB on the backend,
> Cloudinary for media, JWT for auth, and eSewa / Khalti / IPS for payments.

---

## 🛕 About the Temple

Shree Ramchandra Temple (श्री रामचन्द्र मन्दिर) is an important religious, cultural, historical and archaeological site
dedicated to **Lord Shri Ram**. It sits in **Thumka, south-west of Pashupati**, on the bank of the Bagmati River in
Battisputali, Kathmandu.

| | |
|---|---|
| **Deity** | Shri Ram, Mata Sita, Lakshman, Bharat, Shatrughna (with Hanuman) |
| **Established** | 1928 VS, by Commander Karnel Sanaksinh Tandan |
| **Sanctum** | Main *garbhagriha* houses the five idols of the Ramayan family |
| **Rituals** | Daily puja, aarti, bhog and abhishek from around 5:00 AM |
| **Services** | Ram–Sita puja, Hanuman Chaalisha, Vishnu Sahasranama, Tulsi Archana, Navagraha Japa, Satya Narayan Puja, Akhand Ramayan Path, Bhagwat Puja, Ram Navami Archana, Tri Ramanjan, Ekadashi Special Bhog |
| **Festivals** | Ram Navami, Hanuman Jayanti, Krishna Janmashtami, Sarada Puja, Maha Shivaratri |

The temple also cares for **Gaushala** (cow shelter), runs community **satsang**, seminars, cultural programmes and
**conservation work** on its historic structure, surviving Nepal's earthquakes and multiple renovation phases.

---

## ✨ Features

### Public site
- 🏛️ **Home** — hero, darshan timings, festivals, quick links
- 📖 **About / हाम्रो परिचय** — religious significance, daily puja, architecture, deity, location
- 🕰️ **History** — founding, archaeological significance, conservation timeline
- 🙏 **Puja booking** — 15+ puja types, date/time slot, price, booking confirmation
- 💰 **Donate** — one-time donations with eSewa / Khalti / IPS gateways, receipt, donation history
- 🎉 **Events & calendar** — festivals, programmes, event detail pages
- 📸 **Gallery / videos** — photos and YouTube embeds (Cloudinary backed)
- 📝 **Blog** — articles with detail pages
- 🧑‍🤝‍🧑 **Team** — temple committee members
- 📬 **Contact** — validated contact form + email + OpenStreetMap/Google Maps embed and directions
- 💬 **Temple assistant (chatbot)** — keyword-matched answers from a local dataset, persisted messages
- 🔤 **Nepali Unicode converter** (Ram Modal)
- 📄 **Privacy policy & terms** pages
- 🔔 **Visitor tracking** and **newsletter subscription**

### Accounts
- 🔐 Email/password sign-up & login, password reset
- 🔵 Google OAuth login (`@react-oauth/google` + Passport)
- 👤 Profile management
- 📋 **My bookings** and **My donations** dashboards

### Admin / Super admin
- 🗂️ Manage content: pages, about sections, events, gallery, blog, team, puja types
- 🧾 Booking & donation management with status updates
- 📊 Analytics — Recharts charts for visitors, revenue, bookings
- ⚙️ Site settings — logo, footer, hero, contact info, theme colours, maintenance mode
- 🔔 Admin notifications
- 💾 Database backup & restore (`archiver`), activity logs
- 🛡️ Role-based access: `user` → `admin` → `superadmin`
- 📄 PDF generation for receipts/reports (`jspdf`, `jspdf-autotable`)

### Cross-cutting
- 🌐 **5 languages** — English, नेपाली, हिन्दी, 中文, தமிழ் (`src/utils/translations.js`)
- 🗓️ **Bikram Sambat calendar** for Nepali users (`src/utils/nepaliCalendar.js`)
- 📱 Fully responsive, mobile-first Tailwind design with dark/photo/video footer backgrounds
- 🎬 Scroll animations (Framer Motion, GSAP), toasts (Sonner), confirm dialogs (SweetAlert2)
- 🖼️ Image crop before upload (`react-image-crop`), QR codes (`qrcode.react`)
- 🛡️ GeoIP-based visitor analytics (`geoip-lite`)

---

## 🧰 Dependencies Used

### Frontend (`frontend/package.json`)

| Package | Purpose |
|---|---|
| `react` / `react-dom` 18 | UI runtime |
| `react-scripts` 5.0.1 | CRA build tooling (bundler, dev server, ESLint) |
| `react-router-dom` 6 | Client-side routing |
| `tailwindcss` + `postcss` + `autoprefixer` | Utility-first styling |
| `framer-motion` | Component/page animations |
| `gsap` | Scroll and timeline animations |
| `lucide-react` | Icon set |
| `axios` | HTTP client for the API |
| `@react-oauth/google` | Google sign-in button + token flow |
| `sonner` | Toast notifications |
| `sweetalert2` | Confirmation / alert dialogs |
| `recharts` | Admin analytics charts |
| `jspdf` + `jspdf-autotable` | Receipt / report PDFs |
| `html2canvas` | Capture DOM as image for PDF export |
| `react-image-crop` | Crop images before upload |
| `react-color` | Colour picker in admin settings |
| `qrcode.react` | QR codes (booking / donation receipts) |
| `react-youtube` | YouTube embeds |
| `uuid` | Client-side IDs |

### Backend (`backend/package.json`)

| Package | Purpose |
|---|---|
| `express` 4 | HTTP server and routing |
| `mongoose` 8 | MongoDB ODM |
| `dotenv` | Loads `.env` |
| `jsonwebtoken` | JWT signing/verification |
| `bcryptjs` | Password hashing |
| `passport` + `passport-google-oauth20` + `express-session` | Google OAuth strategy + session |
| `cloudinary` + `multer` + `multer-storage-cloudinary` | Image/video uploads |
| `nodemailer` | Outgoing email (contact, bookings, receipts) |
| `cors` | Cross-origin access for the frontend |
| `validator` | Payload validation |
| `geoip-lite` | Resolves visitor country from IP |
| `jspdf` | Server-side PDF generation |
| `archiver` | Zipped database backups |
| `axios` | Outbound HTTP calls (payment verification) |
| `uuid` | ID generation |
| `nodemon` *(dev)* | Auto-restart on file change |

> Payments (eSewa, Khalti, IPS) are implemented in `backend/src/controllers/paymentController.js` using **axios** against
> each gateway's REST endpoints — no extra SDK needed.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v18+** and **npm**
- **MongoDB** — a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Optional: **Cloudinary** account (image/video uploads), **Gmail** app password (email),
  **Google Cloud OAuth** credentials, and **eSewa / Khalti / IPS** merchant keys for real payments

### 1. Clone

```bash
git clone <repository-url>
cd shree-ramchandra-temple
```

### 2. Start the backend (port `5000`)

```bash
cd backend
npm install          # postinstall also downloads the GeoIP database
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB (Atlas SRV string or local mongodb://127.0.0.1:27017/temple)
MONGODB_URI=mongodb+srv:<user>:<pass>@<cluster>.mongodb.net/temple

# Auth — used by `npm run seed` to create the first super admin
SUPERADMIN_EMAIL=super@gmail.com
SUPERADMIN_PASSWORD=yourStrongPassword
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=30d

# Cloudinary (media uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Nodemailer)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Allowed frontend origin for CORS
FRONTEND_URL=http://localhost:4000

# Payments (leave blank to run without them)
ESEWA_MERCHANT_ID=
ESEWA_SECRET_KEY=
ESEWA_MPIN=
KHALTI_SECRET_KEY=
IPS_MERCHANT_ID=
IPS_APP_ID=
IPS_APP_NAME=
IPS_PASSWORD=
IPS_PRIVATE_KEY=
```

Then start it:

```bash
npm run dev     # nodemon, watches files   -> http://localhost:5000
npm start       # plain node               -> http://localhost:5000
npm run seed    # creates the super admin from SUPERADMIN_EMAIL/PASSWORD
```

Check it is alive:

```bash
curl http://localhost:5000/api/health
```

### 3. Start the frontend (port `4000`)

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
PORT=4000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FRONTEND_URL=http://localhost:4000
REACT_APP_GOOGLE_CLIENT_ID=
```

Then:

```bash
npm start            # CRA dev server      -> http://localhost:4000
npm run start:lan    # bind 0.0.0.0, for testing on a phone on the same Wi-Fi
npm run build        # production bundle in frontend/build
```

> `REACT_APP_*` variables are inlined at **build time** — rebuild after changing them.

### 4. Run both with one command (Windows)

```bash
start backend && start frontend
```

---

## 🗂️ Project Structure

```
shree-ramchandra-temple/
├── backend/
│   ├── server.js                  # entry point
│   ├── Dockerfile / docker-compose.yml
│   └── src/
│       ├── app.js                 # express app, CORS, routes
│       ├── config/                # database, cloudinary, passport
│       ├── controllers/           # request handlers
│       ├── middleware/            # auth, admin, superadmin, upload, errors
│       ├── models/                # mongoose schemas (User, Booking, Donation, …)
│       ├── routes/                # /api/* routers
│       ├── services/              # email, cloudinary, pdf, admin
│       ├── data/                  # seed content (puja types, events, history)
│       └── scripts/seedAdmin.js
├── frontend/
│   ├── tailwind.config.js
│   └── src/
│       ├── pages/                 # one file per route (Home, Booking, Donate, Admin…)
│       ├── components/            # common/, admin/, chatbot/, modals/
│       ├── context/               # Language, Auth, Toast, Chatbot
│       ├── services/api.js        # axios instance + interceptors
│       ├── utils/                 # translations, nepaliCalendar helpers
│       └── data/chatbotData.json  # assistant knowledge base
└── docs/api-documentation.md
```

---

## 🔌 API

Base URL `http://localhost:5000/api`. Full reference: [`docs/api-documentation.md`](docs/api-documentation.md).

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/register` · `/login` · `/logout` · `/forgot-password` | JWT auth |
| `GET /api/auth/google` | Google OAuth start |
| `GET /api/bookings` · `POST /api/bookings` | Puja bookings (user/admin) |
| `GET /api/donations` · `POST /api/donations` | Donations |
| `POST /api/payment/esewa` · `/khalti` · `/ips` | Payment init + verification |
| `GET /api/events` · `/api/about` · `/api/gallery` · `/api/blog` · `/api/team` | Public content |
| `POST /api/contact` | Contact form |
| `POST /api/subscribe` | Newsletter |
| `GET/POST/PUT/DELETE /api/admin/*` | Admin CRUD, settings, backups, logs |
| `GET /api/chatbot/message` | Temple assistant |
| `GET /api/health` | Health check (used by Render) |

Protected routes expect `Authorization: Bearer <token>`.

---

## 🐳 Docker (backend)

```bash
cd backend
docker compose up --build -d
```

---

## 📦 Production build & deploy

```bash
# Backend (Render / Railway / VPS)
cd backend
npm install --omit=dev
npm start        # or `npm run prod` on Windows

# Frontend (static host)
cd frontend
npm run build    # outputs frontend/build
```

Set every value in `backend/.env.production` (MongoDB Atlas, Cloudinary, email, payment and OAuth keys), and
`REACT_APP_API_URL=https://<your-api-domain>/api` before building the frontend. The backend logs in
non-production mode only; in production it logs errors and 4xx/5xx responses.

---

## 🔐 Roles

| Role | Access |
|---|---|
| `user` | Book puja, donate, view own bookings/donations, comment-free browsing |
| `admin` | All `user` rights + content management, settings, notifications, analytics |
| `superadmin` | Everything, including admin accounts, backups and maintenance mode |

---

## 📄 License

Developed by **ZeroInfinity** (zeroinfinitytechnologies.com) for Shree Ramchandra Temple.