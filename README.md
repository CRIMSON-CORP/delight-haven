# Delight Haven Assisted Living - Website

Welcome to the official repository for the **Delight Haven Assisted Living** website. This project is a modern, responsive, and animated landing page/website built for an assisted living facility in Randallstown, MD. 

The application is structured to allow both **Static Deployment** (using EmailJS for forms) and **Full-stack Deployment** (using a custom Bun server, PostgreSQL, and Drizzle ORM).

## 🚀 Tech Stack

### Frontend
* **Vite:** High-performance, modern build tool and development server.
* **HTML/Vanilla JS/TypeScript:** Core structure and logic.
* **Tailwind CSS (v4):** Utility-first styling with modern Vite integration.
* **GSAP:** Advanced animations and timelines.
* **Lenis:** Smooth scrolling experience.
* **Swiper:** Touch-enabled sliders and carousels.

### Backend (Full-stack Mode)
* **Bun:** Blazing fast JavaScript runtime and server.
* **PostgreSQL:** Primary relationship database.
* **Drizzle ORM:** TypeScript ORM for database interactions and schema management.
* **Nodemailer:** Email dispatching (for full-stack contact/scheduling logic).

### Third-Party / Static Fallback
* **EmailJS:** Used for processing static form submissions without requiring the backend server.

---

## 📦 Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) or [Yarn](https://yarnpkg.com/)
* [Bun](https://bun.sh/) (Required if running the backend server)
* PostgreSQL (If running the full-stack database schema)

---

## 🛠️ How to Run Locally

### 1. Install Dependencies
You can install dependencies using Yarn or Bun:
```bash
yarn install
# or
bun install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory.

*If running strictly static (Frontend only):* 
Ensure your EmailJS public keys, service IDs, and template IDs are configured correctly within the frontend JavaScript where initialized.

*If running the full-stack backend:*
Include the necessary database and mailer configurations:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/delight-haven

# Mailer Configurations
MAILER_EMAIL=your-email@example.com
DOMAIN=http://localhost:5181
ALLOWED_ORIGIN=http://localhost:5181
PORT=3000
```

### 3. Run Development Server (Frontend UI)
To start the Vite development server for the static UI:
```bash
yarn dev
# or
bun run dev
```
The site will be available typically at `http://localhost:5181`.

### 4. Run Backend Server (Optional)
If you are running the full-stack version with API endpoints (`/api/contact`, `/api/schedule-date`, `/api/newsletter`):
```bash
bun run server
```

---

## 🗄️ Database Configuration (Full-stack)

If you plan to use the PostgreSQL database to manage schedules and newsletter subscribers, use the Drizzle scripts provided:

* **Generate Migrations:** `yarn db:generate` or `bun run db:generate`
* **Run Migrations:** `yarn db:migrate` or `bun run db:migrate`
* **Seed Database:** `yarn db:seed` or `bun run db:seed`

---

## 🏗️ How to Build

To build the static assets for production:

```bash
yarn build
# or
bun run build
```
This command compiles TypeScript and bundles the Vite project. The output will be located in the `dist/` directory.

To preview the built production build locally:
```bash
yarn preview
```

---

## 🚀 Deployment Options

### Option A: Static Deployment (Current Setup)
The project is currently configured to be deployed as a static site (e.g., Vercel, Netlify, GitHub Pages, AWS S3).
* Forms (Contact, Schedule) are wired using **EmailJS** on the frontend, meaning no backend server is needed to capture leads.
* Simply run `yarn build` and upload the `/dist` folder to your static hosting provider.

### Option B: Full-stack Deployment
If you wish to manage leads directly in a database:
1. Provision a PostgreSQL database and a Node.js/Bun hosting environment (e.g., Render, Railway, DigitalOcean).
2. Wire the frontend form `fetch` calls to hit the backend API endpoints (`/api/contact`, `/api/newsletter`, etc.) instead of EmailJS.
3. Use the start script which builds the frontend and spawns the Bun server to serve both static files and API routes:
   ```bash
   yarn start
   ```

---

## 🤝 Handover Details & Maintenance Notes

* **Animations:** Most interactive elements and scrolling animations are handled by **GSAP** and **Lenis**. If scroll behavior feels off, verify Lenis initialization in the core JS files.
* **Component Styling:** The project utilizes a strict design system defined in `Tailwind`. Reusable buttons and layout classes (e.g., `.magnetic-btn`, `.container`) simplify scaling.
* **API Endpoints (When switched to Full-stack):**
  * `POST /api/schedule-date`: Schedules a facility tour.
  * `POST /api/contact`: Submits a contact form inquiry.
  * `POST /api/newsletter`: Subscribes a user to the newsletter list.
* **EmailJS Fallback:** Ensure that if you migrate away from static hosting, you remove the EmailJS implementation to avoid double-processing leads. If staying on EmailJS, ensure your monthly limits correlate with the anticipated website traffic.

---

*Documentation generated for Delight Haven Assited Living.*
