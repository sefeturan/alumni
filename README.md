# Alumni Network - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?logo=swagger&logoColor=black)](http://localhost:5000/api/swagger)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Backend RESTful API and communication service for the **Alumni Networking Platform**, a dedicated web application connecting university and school graduates to network, collaborate, share career opportunities, and communicate.

---

## 📌 Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [MVC Architecture & Project Structure](#mvc-architecture--project-structure)
  - [MVC Architecture Overview](#mvc-architecture-overview)
  - [Request Lifecycle (Flow Diagram)](#request-lifecycle-flow-diagram)
  - [Directory, Folder & File Structure](#directory-folder--file-structure)
  - [Detailed Component Breakdown](#detailed-component-breakdown)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Running with Docker (Recommended)](#3-running-with-docker-recommended)
  - [4. Running Locally without Docker](#4-running-locally-without-docker)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [📘 Swagger API Documentation](#-swagger-api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About the Project

The **Alumni Networking Platform** is designed to bridge the gap between graduates, current students, and academic institutions. This repository hosts the backend services providing:
- Secure authentication and role-based access control.
- Alumni directory search and profile management.
- Real-time and direct communication channels.
- Career updates, job boards, and community discussions.

---

## 🚀 Key Features

- 🔐 **Authentication & Authorization**: JWT-based user authentication, password hashing with bcrypt, and role-based permissions (Student, Alumni, Admin).
- 👤 **Alumni Directory & Profiles**: Rich profiles with graduation year, department, current company/title, skills, and social links.
- 💬 **Communication & Messaging**: Direct messaging and discussion forum/board capabilities for alumni interactions.
- 💼 **Job & Opportunity Board**: Share job openings, internships, and mentorship opportunities.
- 🐳 **Containerized Setup**: Pre-configured `Dockerfile` and `docker-compose.yml` for seamless development and deployment.

---

## 🛠 Tech Stack

- **Runtime Environment**: [Node.js](https://nodejs.org/) (JavaScript)
- **Web Framework**: Express.js
- **Database**: PostgreSQL / MongoDB (configurable via environment variables)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **Real-Time Messaging**: Socket.io / WebSockets (optional)
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose

---

## 📂 MVC Architecture & Project Structure

The application is structured following the **MVC (Model-View-Controller)** architectural pattern, enriched with service and middleware layers to separate concerns, improve maintainability, and ensure scalable code organization.

### 🏛 MVC Architecture Overview

| Layer | Directory | Responsibility / Role in App |
| :--- | :--- | :--- |
| **Model** | `src/models/` | Represents the data layer, schemas, database entities, and validation rules (e.g., User, Alumni, Post models). |
| **View** | `src/views/` | The presentation layer containing client-facing templates and static HTML documents served to the user (e.g., landing page, about page). |
| **Controller** | `src/controllers/` | Coordinates the flow between Models, Services, and Views. Receives client HTTP requests, invokes business logic, and returns formatted responses (JSON or rendered views). |
| **Routes** | `src/routes/` | Maps HTTP methods and URL paths (endpoints) to their corresponding controller functions or views. |

#### Supporting Architectural Layers
- **Services (`src/services/`)**: Encapsulates core business logic, third-party integrations, and complex data operations decoupled from HTTP controllers.
- **Middlewares (`src/middlewares/`)**: Intercepts requests for authentication (JWT), role checking, request validation, and centralized error handling.
- **Config (`src/config/`)**: Centralizes configuration settings such as database connections, environment variables, and third-party credentials.
- **Utils (`src/utils/`)**: Reusable helper functions, formatters, and utility modules across the codebase.

---

### 🔄 Request Lifecycle (Flow Diagram)

```text
 ┌────────────┐
 │   Client   │ (Browser / Mobile / Postman)
 └──────┬─────┘
        │ HTTP Request (e.g. GET /about, GET /sum/5/10)
        ▼
 ┌──────────────┐
 │  src/app.js  │ Express Entrypoint & Global Middlewares (CORS, JSON Parser)
 └──────┬───────┘
        │ Dispatches to matching route
        ▼
 ┌──────────────┐
 │  src/routes/ │ Route Definitions (e.g., routes/about.js, routes/sum.js)
 └──────┬───────┘
        │ Passes to Middlewares (Auth, Validation) & Controllers
        ▼
 ┌──────────────────┐
 │ src/controllers/ │ Request Handler & Orchestration
 └──────┬───────────┘
        ├──────────────────────────┬──────────────────────────┐
        ▼                          ▼                          ▼
 ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
 │src/services/ │           │ src/models/  │           │  src/views/  │
 │Business Logic│           │Data & Schemas│           │  HTML Views  │
 └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │ Response (HTML / JSON)
                                   ▼
                            ┌────────────┐
                            │   Client   │
                            └────────────┘
```

---

### 🗂 Directory, Folder & File Structure

Below is the complete project directory layout including currently existing files and architectural directories:

```text
alumni-main/
├── src/
│   ├── app.js                 # [Entrypoint] Express setup, middlewares, port listener, route bindings
│   ├── config/                # [Configuration] Database connections, environment & Swagger OpenAPI setup
│   │   └── swagger.js         # OpenAPI 3.0 / Swagger UI configuration for Users & Announcements
│   ├── controllers/           # [Controller Layer] Request handlers connecting Routes with Models
│   │   ├── AnnouncementController.js     # Traditional MVC web controller for announcements management view
│   │   ├── ApiAnnouncementController.js  # RESTful JSON API controller for announcement CRUD operations
│   │   ├── ApiUserController.js          # RESTful JSON API controller for User CRUD operations
│   │   └── UserController.js             # Traditional MVC web controller for User views & forms
│   ├── middlewares/           # [Middlewares] Auth guards, schema validators, error handlers
│   ├── models/                # [Model Layer] In-memory data models providing full CRUD operations
│   │   ├── Announcement.js    # In-memory Announcement model (news, notifications, events)
│   │   └── User.js            # In-memory User model providing full CRUD operations
│   ├── routes/                # [Routing Layer] API & View endpoint definitions
│   │   ├── about.js           # Route serving the About page view (/about)
│   │   ├── announcement.js    # Web MVC routes for announcements management (/announcements)
│   │   ├── apiAnnouncement.js # RESTful API routes mounted at /api/announcements
│   │   ├── apiUser.js         # RESTful API routes mounted at /api/users
│   │   ├── sum.js             # Route performing arithmetic summation (/sum/:number1/:number2)
│   │   └── user.js            # Traditional MVC web routes mounted at /users
│   ├── services/              # [Service Layer] Business logic & database operations
│   ├── utils/                 # [Utilities] Helper functions, logging, and common tools
│   └── views/                 # [View Layer] Front-end presentation templates and HTML files
│       ├── about.html         # About page UI template for Alumni Network Platform
│       ├── announcement-detail.html # Dedicated announcement reading view (GET /announcements/:id)
│       ├── announcement-edit.html   # Announcement edit form view (GET /announcements/:id/edit)
│       ├── announcements.html # Announcement management interface with publishing form & list
│       ├── index.html         # Interactive landing page UI for Alumni Network Platform
│       ├── user-detail.html   # User profile detail view (GET /users/:id)
│       ├── user-edit.html     # User profile edit form view (GET /users/:id/edit)
│       └── users.html         # Users management view with registration form and listing table
├── .env                       # Local environment variables file (ignored by git)
├── .env.example               # Template environment variables for setup
├── .gitignore                 # Files and directories ignored by Git
├── package.json               # Project manifest, npm dependencies, and npm scripts
├── package-lock.json          # Deterministic dependency tree lockfile
└── README.md                  # Comprehensive project documentation
```

---

### 🔍 Detailed Component Breakdown

| Type | Path / Name | Layer | Description |
| :--- | :--- | :--- | :--- |
| **File** | [`src/app.js`](file:///Users/sefeturan/Downloads/alumni-main/src/app.js) | **Entrypoint** | Initializes Express, mounts middlewares, Swagger UI, core endpoints, User and Announcement routes. |
| **Directory** | `src/config/` | **Config** | Manages environment-specific configurations and Swagger documentation setups. |
| **File** | [`src/config/swagger.js`](file:///Users/sefeturan/Downloads/alumni-main/src/config/swagger.js) | **Config / Docs** | OpenAPI 3.0 specification defining schemas and endpoints for Users and Announcements. |
| **Directory** | `src/models/` | **Model** | In-memory data models with asynchronous CRUD methods. |
| **File** | [`src/models/Announcement.js`](file:///Users/sefeturan/Downloads/alumni-main/src/models/Announcement.js) | **Model** | In-memory Announcement model (`create`, `findAll`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete`). |
| **File** | [`src/models/User.js`](file:///Users/sefeturan/Downloads/alumni-main/src/models/User.js) | **Model** | In-memory User data model with asynchronous CRUD methods. |
| **Directory** | `src/views/` | **View** | Front-end templates and interfaces for user and announcement management. |
| **File** | [`src/views/announcements.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/announcements.html) | **View** | Management interface for creating and listing announcements (`GET /announcements`). |
| **File** | [`src/views/announcement-detail.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/announcement-detail.html) | **View** | Detailed announcement view (`GET /announcements/:id`). |
| **File** | [`src/views/announcement-edit.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/announcement-edit.html) | **View** | Edit form for updating announcements (`GET /announcements/:id/edit`). |
| **File** | [`src/views/users.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/users.html) | **View** | User management view with registration form and listing table (`GET /users`). |
| **File** | [`src/views/user-detail.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/user-detail.html) | **View** | Dedicated single user profile view page (`GET /users/:id`). |
| **File** | [`src/views/user-edit.html`](file:///Users/sefeturan/Downloads/alumni-main/src/views/user-edit.html) | **View** | Pre-filled profile update form view page (`GET /users/:id/edit`). |
| **Directory** | `src/controllers/`| **Controller** | Handles HTTP requests, calls models, and generates responses/views. |
| **File** | [`src/controllers/AnnouncementController.js`](file:///Users/sefeturan/Downloads/alumni-main/src/controllers/AnnouncementController.js) | **Controller** | Traditional MVC controller for announcement management views and form actions. |
| **File** | [`src/controllers/ApiAnnouncementController.js`](file:///Users/sefeturan/Downloads/alumni-main/src/controllers/ApiAnnouncementController.js) | **Controller** | RESTful JSON API controller for announcement CRUD endpoints. |
| **File** | [`src/controllers/ApiUserController.js`](file:///Users/sefeturan/Downloads/alumni-main/src/controllers/ApiUserController.js) | **Controller** | RESTful JSON API controller for User CRUD operations. |
| **File** | [`src/controllers/UserController.js`](file:///Users/sefeturan/Downloads/alumni-main/src/controllers/UserController.js) | **Controller** | Traditional MVC controller for User views, listings, and form submissions. |
| **Directory** | `src/routes/` | **Routing** | Maps HTTP URLs to corresponding controllers. |
| **File** | [`src/routes/announcement.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/announcement.js) | **Routing / Web** | Web routes mounted at `/announcements` for announcement views and actions. |
| **File** | [`src/routes/apiAnnouncement.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/apiAnnouncement.js) | **Routing / API** | REST API routes mounted at `/api/announcements`. |
| **File** | [`src/routes/apiUser.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/apiUser.js) | **Routing / API** | Routes HTTP requests to `ApiUserController` (mounted at `/api/users`). |
| **File** | [`src/routes/user.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/user.js) | **Routing / Web** | Routes HTTP requests to `UserController` (mounted at `/users`). |
| **File** | [`src/routes/about.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/about.js) | **Routing / View** | Delivers the `about.html` view upon receiving `GET /about`. |
| **File** | [`src/routes/sum.js`](file:///Users/sefeturan/Downloads/alumni-main/src/routes/sum.js) | **Routing / Logic**| Handles path parameters at `GET /sum/:number1/:number2` and returns the calculation result. |
| **Directory** | `src/services/` | **Service** | Manages application business rules, external API integrations, and database operations. |
| **Directory** | `src/middlewares/`| **Middleware**| Custom Express middlewares for JWT authentication, request validation, logging, and error handling. |
| **Directory** | `src/utils/` | **Utility** | Shared helper functions (formatters, response helpers, math utilities). |
| **File** | [`.env.example`](file:///Users/sefeturan/Downloads/alumni-main/.env.example) | **Config** | Environment variable blueprint specifying `PORT`, `DATABASE_URL`, `JWT_SECRET`, etc. |
| **File** | [`package.json`](file:///Users/sefeturan/Downloads/alumni-main/package.json) | **Config** | Node.js project configuration, npm run scripts (`start`, `dev`), and dependencies (`express`, `cors`, `dotenv`, `swagger-ui-express`). |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/)

---

## ⚡ Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/alumni.git
cd alumni
```

### 2. Environment Configuration

Create a `.env` file based on the `.env.example`:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
PORT=5000
NODE_ENV=development

# Database Settings
DATABASE_URL=postgres://user:password@db:5432/alumni_db
# or for MongoDB:
# MONGO_URI=mongodb://db:27017/alumni_db

# Security & Tokens
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

---

### 3. Running with Docker (Recommended)

Build and start the application along with the database service:

```bash
# Build and run containers in the background
docker-compose up --build -d

# View live container logs
docker-compose logs -f app

# Stop the running containers
docker-compose down
```

The API will be available at: `http://localhost:5000`

---

### 4. Running Locally without Docker

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start in development mode** (with hot reload):
   ```bash
   npm run dev
   ```

3. **Start in production mode**:
   ```bash
   npm start
   ```

---

## 📜 Available Scripts

Inside `package.json`, the following scripts are typically used:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with live reload |
| `npm start` | Starts the production server |
| `npm test` | Runs the test suite |
| `npm run lint` | Checks code style and syntax errors |

---

## 🔌 API Overview & Documentation

> 📖 **Interactive Swagger UI:** Visit [`http://localhost:5001/api-docs`](http://localhost:5001/api-docs) to test and inspect all endpoints interactively in your browser. Raw OpenAPI spec: [`/swagger.json`](http://localhost:5001/swagger.json).

### 👥 User Endpoints (Implemented)

| Method | Endpoint | Layer / Controller | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | REST API (`ApiUserController`) | List all users (supports `?role=`, `?department=`) | Public |
| `POST` | `/api/users` | REST API (`ApiUserController`) | Create a new user (JSON body) | Public |
| `GET` | `/api/users/:id` | REST API (`ApiUserController`) | Get single user by UUID (JSON) | Public |
| `PUT` | `/api/users/:id` | REST API (`ApiUserController`) | Update user by UUID (JSON) | Public |
| `DELETE` | `/api/users/:id` | REST API (`ApiUserController`) | Delete user by UUID | Public |
| `GET` | `/users` | Web MVC (`UserController`) | List all users (HTML View) | Public |
| `POST` | `/users` | Web MVC (`UserController`) | Create user via web form & redirect | Public |
| `GET` | `/users/:id` | Web MVC (`UserController`) | Show user profile page (HTML View) | Public |
| `POST` | `/users/:id/update` | Web MVC (`UserController`) | Update user from web form & redirect | Public |
| `POST` | `/users/:id/delete` | Web MVC (`UserController`) | Delete user from web & redirect | Public |

### 📢 Announcement Endpoints (Implemented)

| Method | Endpoint | Layer / Controller | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/announcements` | REST API (`ApiAnnouncementController`) | List all announcements (supports `?category=`, `?priority=`) | Public |
| `POST` | `/api/announcements` | REST API (`ApiAnnouncementController`) | Create a new announcement (JSON body) | Public |
| `GET` | `/api/announcements/:id` | REST API (`ApiAnnouncementController`) | Get single announcement by UUID (JSON) | Public |
| `PUT` | `/api/announcements/:id` | REST API (`ApiAnnouncementController`) | Update announcement by UUID (JSON) | Public |
| `DELETE` | `/api/announcements/:id` | REST API (`ApiAnnouncementController`) | Delete announcement by UUID | Public |
| `GET` | `/announcements` | Web MVC (`AnnouncementController`) | Management interface & list view (HTML) | Public |
| `POST` | `/announcements` | Web MVC (`AnnouncementController`) | Publish announcement via web form & redirect | Public |
| `GET` | `/announcements/:id` | Web MVC (`AnnouncementController`) | Show announcement detail page (HTML View) | Public |
| `GET` | `/announcements/:id/edit` | Web MVC (`AnnouncementController`) | Show announcement edit form (HTML View) | Public |
| `POST` | `/announcements/:id/update`| Web MVC (`AnnouncementController`) | Update announcement via web form & redirect | Public |
| `POST` | `/announcements/:id/delete`| Web MVC (`AnnouncementController`) | Delete announcement via web & redirect | Public |

### 🚀 Other & Future Planned Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api-docs` | Interactive Swagger API Documentation | Public |
| `GET` | `/health` | Service health status check | Public |
| `GET` | `/about` | Serves About Us HTML page | Public |
| `GET` | `/sum/:n1/:n2` | Arithmetic summation utility | Public |
| `POST` | `/api/auth/register` | Register a new alumni account (Planned) | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT (Planned) | Public |
| `GET` | `/api/messages/:userId`| Get chat history with another alumni (Planned) | Protected |
| `POST` | `/api/messages` | Send a direct message (Planned) | Protected |
| `GET` | `/api/posts` | Get community posts & announcements (Planned) | Protected |

---

## 📘 Swagger API Documentation

Bu proje, tüm REST API uç noktalarının interaktif olarak görüntülenebildiği ve test edilebildiği **Swagger UI** entegrasyonu içermektedir.

### 🔗 Swagger UI Adresi

Sunucu çalışır durumdayken tarayıcınızdan aşağıdaki adrese gidin:

```
http://localhost:5000/api/swagger
```

### ✨ Swagger ile Neler Yapabilirsiniz?

- **Tüm endpoint'leri görüntüleme:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE` metodlarıyla tüm uç noktalar tek bir sayfada listelenir.
- **Canlı test:** Her endpoint'i doğrudan Swagger arayüzünden test edebilirsiniz; body, parametre ve response'ları anında görebilirsiniz.
- **Parametre ve şema bilgisi:** Her endpoint'in hangi veri tiplerini kabul ettiğini ve hangi yanıtları döndürdüğünü detaylıca inceleyebilirsiniz.
- **OpenAPI JSON:** `http://localhost:5000/api/swagger.json` adresinden OpenAPI 3.0 formatındaki tam spesifikasyonu indirebilirsiniz (Postman import için kullanışlıdır).

### 🛠 Swagger Teknik Detayları

| Özellik | Detay |
| :--- | :--- |
| **Kütüphane** | `swagger-ui-express` + `swagger-jsdoc` |
| **Standart** | OpenAPI 3.0 |
| **Konfigürasyon Dosyası** | `src/config/swagger.js` |
| **UI Adresi** | `http://localhost:5000/api/swagger` |
| **JSON Spec Adresi** | `http://localhost:5000/api/swagger.json` |

### ➕ Yeni Endpoint Nasıl Swagger'a Eklenir?

Bundan sonra geliştirilen tüm endpoint'ler `src/config/swagger.js` dosyasındaki `paths` nesnesine eklenerek dokümante edilmelidir. Böylece Swagger her zaman güncel ve tam kalır.

```js
// Örnek: src/config/swagger.js içindeki paths bölümüne yeni endpoint eklemek
'/api/posts': {
  get: {
    tags: ['Paylaşımlar'],
    summary: 'Tüm postları listele',
    responses: {
      200: { description: 'Başarılı' }
    }
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
