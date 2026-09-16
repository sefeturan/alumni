# Alumni Network - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Backend RESTful API and communication service for the **Alumni Networking Platform**, a dedicated web application connecting university and school graduates to network, collaborate, share career opportunities, and communicate.

---

## 📌 Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture & Structure](#project-architecture--structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Running with Docker (Recommended)](#3-running-with-docker-recommended)
  - [4. Running Locally without Docker](#4-running-locally-without-docker)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
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

## 📂 Project Architecture & Structure

A standard structure for the Node.js backend:

```text
alumni-backend/
├── src/
│   ├── config/         # Database and environment configurations
│   ├── controllers/    # Request handlers & controllers
│   ├── middlewares/    # Authentication, validation, and error middlewares
│   ├── models/         # Database models / schemas
│   ├── routes/         # API endpoint routes
│   ├── services/       # Business logic layer
│   ├── utils/          # Utility functions and helpers
│   └── app.js          # App entrypoint and Express setup
├── .env.example        # Sample environment variables
├── .dockerignore       # Excluded files for Docker build
├── .gitignore          # Git ignore file
├── Dockerfile          # Docker container configuration
├── docker-compose.yml  # Multi-container orchestration (App + DB)
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
```

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

## 🔌 API Overview (Sample Endpoints)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new alumni account | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | Public |
| `GET` | `/api/alumni` | List and search alumni directory | Protected |
| `GET` | `/api/alumni/:id` | Get detailed alumni profile | Protected |
| `PUT` | `/api/alumni/profile` | Update current user profile | Protected |
| `GET` | `/api/messages/:userId`| Get chat history with another alumni | Protected |
| `POST` | `/api/messages` | Send a direct message | Protected |
| `GET` | `/api/posts` | Get community posts & announcements | Protected |

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
