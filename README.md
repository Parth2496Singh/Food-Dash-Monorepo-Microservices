<div align="center">
  <h1>🌌 FOOD-DASH: Containerized Enterprise Architecture</h1>
  <p>A production-grade, container-first food delivery platform. This project serves as a comprehensive showcase of <b>DevOps orchestration, Docker containerization, and Polyglot Microservices</b>, demonstrating how disparate technologies and databases seamlessly integrate within a unified Docker network.</p>
  
  <br />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
</div>

<br />

## 🐳 DevOps & Containerization (Core Contribution)

The primary focus of this project is its robust deployment architecture. Rather than relying on fragile local environments, the entire stack is heavily containerized and orchestrated using advanced **Docker Compose** patterns.

*   **Custom Bridge Networks**: Secure internal DNS resolution (e.g., `http://delivery-service:3004`) ensuring microservices communicate securely without exposing internal traffic to the host machine.
*   **Intelligent Healthchecks**: Strict dependency trees implemented in `docker-compose.yml`. For example, the Go Order Service will not attempt to fire webhooks until the Java Delivery Service's JVM has fully booted and returned a healthy ping.
*   **Multi-Stage Dockerfiles**: Optimized, production-ready image builds specifically tailored for 5 completely different ecosystems (Node.js, Python, Go, Java, and NGINX).
*   **Environment Injection**: Secure credential injection enabling zero-downtime database swapping across environments.

---

## 🚀 Tech Stack & Infrastructure

### ⚙️ Orchestration
*   **Docker & Docker Compose** (Primary Infrastructure)
*   **NGINX** (Frontend Reverse Proxy)

### 🧠 Backend Microservices
*   🟢 **Restaurant Service**: Node.js + Express | **Database**: MongoDB 
*   🐍 **Menu Service**: Python + FastAPI | **Database**: PostgreSQL 
*   🐹 **Order Service**: Go + Gin | **Database**: MySQL 
*   ☕ **Delivery Service**: Java + Spring Boot | **Database**: Redis 

### 🎨 Frontend UI
*   React + Vite, styled with Tailwind CSS (Glassmorphism) & Framer Motion.

---

## ⚡ One-Click Deployment

The absolute fastest way to boot the entire Polyglot architecture is using Docker Compose. The `docker-compose.yml` handles all networking, volumes, and builds automatically.

```bash
# Build and boot all 5 services simultaneously
docker compose up --build -d

# View live orchestration logs
docker compose logs -f

# Spin down the cluster
docker compose down
```

The application will be instantly available at `http://localhost:5173`.

*(Note: The Docker environment variables are intentionally populated with placeholder credentials to automatically trigger the Graceful Degradation logic, meaning it will run perfectly out of the box without requiring you to manually spin up 4 different database servers).*

---

## 🏗️ Architectural Workflow

The system is fully decoupled. The React frontend acts as the API orchestrator, interacting directly with the backend cluster:

```mermaid
graph TD
    %% Frontend
    UI["📱 Frontend (React + Vite)"]
    
    %% Services
    RS["🟢 Restaurant Service<br/>(Node.js)"]
    MS["🐍 Menu Service<br/>(FastAPI)"]
    OS["🐹 Order Service<br/>(Go/Gin)"]
    DS["☕ Delivery Service<br/>(Spring Boot)"]

    %% Databases
    DB_M[("🍃 MongoDB")]
    DB_P[("🐘 PostgreSQL")]
    DB_S[("🐬 MySQL")]
    DB_R[("🔴 Redis")]

    %% Interactions
    UI -->|"1. Browse Restaurants"| RS
    UI -->|"2. View Menus"| MS
    UI -->|"3. Submit Order"| OS
    UI -->|"5. Track Status"| DS

    OS -->|"4. Async Webhook"| DS

    %% DB Connections
    RS -.-> DB_M
    MS -.-> DB_P
    OS -.-> DB_S
    DS -.-> DB_R

    classDef frontend fill:#9d00ff,stroke:#fff,stroke-width:2px,color:#fff;
    classDef node fill:#43853d,stroke:#fff,stroke-width:2px,color:#fff;
    classDef python fill:#3776ab,stroke:#fff,stroke-width:2px,color:#fff;
    classDef go fill:#00add8,stroke:#fff,stroke-width:2px,color:#fff;
    classDef java fill:#ed8b00,stroke:#fff,stroke-width:2px,color:#fff;
    
    class UI frontend;
    class RS node;
    class MS python;
    class OS go;
    class DS java;
```

1.  **Browsing**: Fetches restaurants from the Node.js/MongoDB service.
2.  **Viewing Menus**: Queries specific menu items via the Python/PostgreSQL service.
3.  **Checkout**: Submits the cart payload to the Go/MySQL service.
4.  **Asynchronous Handoff**: The Go Order Service fires an internal webhook across the Docker network to the Java/Redis Delivery Service to mark the order as dispatched.

---

## ⚙️ Environment Configuration (.env Guide)

To deploy this cluster into production, each microservice manages its own completely isolated connection state. You must configure these variables with your remote cloud connection strings before running the application without Mock Mode.

### 1. Restaurant Service (`restaurant-service/.env`)
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fooddash?retryWrites=true&w=majority
PORT=3001
```

### 2. Menu Service (`menu-service/.env`)
```env
DATABASE_URL=postgresql://user:password@aws-rds.postgres.net:5432/fooddash
```

### 3. Order Service (`order-service/.env`)
```env
MYSQL_DSN="user:password@tcp(aws-rds.mysql.net:3306)/fooddash?charset=utf8mb4&parseTime=True&loc=Local"
```

### 4. Delivery Service (`delivery-service/src/main/resources/application.properties`)
```properties
server.port=3004
spring.data.redis.host=redis-cloud.net
spring.data.redis.port=6379
spring.data.redis.password=your_redis_password
```

---

## 🛡️ Graceful Degradation (Local Mock Mode)

Designed for CI/CD testing and rapid local deployments, this project features built-in fallback mechanics. If a microservice fails to connect to its remote database (or detects the default mock credentials injected by Docker Compose), it intelligently intercepts the fatal crash and gracefully degrades:

*   🟢 **Node.js**: Falls back to an internal JavaScript array.
*   🐍 **Python**: Swaps AWS PostgreSQL for an auto-seeded local `sqlite3` database.
*   🐹 **Go**: Aborts GORM MySQL connections and handles orders via an in-memory Map.
*   ☕ **Java**: Bypasses strict Redis auto-configuration for a high-performance `ConcurrentHashMap`.

---

<details>
<summary><b>🛠️ Step-by-Step Local Development (Manual / Non-Docker)</b></summary>
<br/>

*(If you wish to bypass Docker and run the raw source code locally for development)*

### 1. Restaurant Service (Node.js)
```bash
cd restaurant-service && npm install && npm start
```

### 2. Menu Service (Python)
```bash
cd menu-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 3002
```

### 3. Order Service (Go)
```bash
cd order-service && go mod tidy && go run main.go
```

### 4. Delivery Service (Java)
```bash
cd delivery-service && mvn spring-boot:run
```

### 5. Frontend UI (React)
```bash
cd frontend && npm install && npm run dev
```
</details>

---

## 📡 Microservice API Endpoints

### 🏪 Restaurant Service (Port 3001)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Retrieves a list of all available restaurants. |
| `GET` | `/api/restaurants/:id` | Retrieves detailed info for a specific restaurant. |

### 🍕 Menu Service (Port 3002)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/menu` | Retrieves all menu items. |
| `GET` | `/api/menu?restaurantId={id}`| Retrieves menu items for a specific restaurant. |

### 🛒 Order Service (Port 3003)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Submits a new order payload to MySQL. |
| `GET` | `/api/orders/:id` | Retrieves the receipt from MySQL. |

### 🚚 Delivery Service (Port 3004)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/delivery/:orderId` | Checks Redis for dispatch status. |
| `POST` | `/api/delivery/update` | Webhook triggered by Order Service. |
