<div align="center">
  <h1>🌌 FOOD-DASH: Enterprise Edition</h1>
  <p>A production-grade, high-end food delivery application built on a <b>Polyglot Microservices Architecture</b>. This project showcases how different enterprise technologies and distinct databases can integrate harmoniously behind a visually stunning React frontend featuring a <i>Nebula Purple & Golden Spark</i> glassmorphism aesthetic.</p>
</div>

<br />

## 🚀 Tech Stack & Databases

### 🎨 Frontend
*   **Framework**: React + Vite (TypeScript)
*   **Styling**: Tailwind CSS (Custom Glassmorphism + Dark/Light Theme Toggle)
*   **Animations**: Framer Motion
*   **Icons**: Lucide React

### 🧠 Backend Microservices
*   🟢 **Restaurant Service**: Node.js + Express | **Database**: MongoDB (Mongoose)
*   🐍 **Menu Service**: Python + FastAPI | **Database**: PostgreSQL (SQLAlchemy)
*   🐹 **Order Service**: Go + Gin | **Database**: MySQL (GORM)
*   ☕ **Delivery Service**: Java + Spring Boot | **Database**: Redis (Spring Data Redis)

---

## 🏗️ Architecture & Workflow

The system is fully decoupled into 5 isolated layers. The frontend acts as an API orchestrator.

1.  **Browsing**: Fetches restaurants from the Node.js/MongoDB service.
2.  **Viewing Menus**: Queries specific menu items via the Python/PostgreSQL service.
3.  **Local Cart**: Managed instantly via React Context API.
4.  **Checkout**: Submits the cart payload to the Go/MySQL service. The Order Service persists the payload to MySQL.
5.  **Handoff & Tracking**: The Go Order Service asynchronously fires a webhook to the Java/Redis Delivery Service to mark the order as dispatched. The Frontend fetches this confirmation instantly with a success animation.

---

## ⚙️ Environment Configuration (.env Guide)

Each microservice manages its own completely isolated connection state. You **must** configure these variables with remote cloud connection strings before running the application.

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

Don't have enterprise databases set up locally? **No problem.** 

This project is engineered to work straight out of the box. If a microservice fails to connect to its respective database (or detects a placeholder connection string in your `.env`), it will intelligently intercept the fatal crash, log a warning to the console, and gracefully degrade to using **Local Mock Mode**:

*   🟢 **Node.js**: Falls back from MongoDB to an internal JavaScript array.
*   🐍 **Python**: Swaps out AWS PostgreSQL for a local auto-seeded `sqlite3` database file.
*   🐹 **Go**: Aborts GORM MySQL connections and handles orders via an in-memory Map.
*   ☕ **Java**: Bypasses strict Redis auto-configuration and tracks active deliveries using a high-performance `ConcurrentHashMap`.

You can follow the standard setup guide below without changing a single line of code!

---

## 🐳 Docker Deployment (Recommended)

The absolute fastest way to boot the entire Polyglot architecture is using Docker Compose. The provided `docker-compose.yml` handles network creation, port binding, and intelligent health checks (ensuring services like Java boot fully before Go attempts to fire webhooks).

```bash
# Build and boot all 5 services simultaneously
docker compose up --build -d

# View live logs for all services
docker compose logs -f
```

The application will be instantly available at `http://localhost:5173`. 
*(Note: The Docker environment variables are intentionally populated with placeholder credentials to automatically trigger the Graceful Degradation logic, meaning it will run perfectly out of the box without any external database dependencies).*

---

## 🛠️ Step-by-Step Local Installation (Manual)

### Prerequisites
*   **Node.js** (v16+) & npm
*   **Python** (v3.9+) & pip
*   **Go** (v1.20+)
*   **Java** (v17+)

### 1. Restaurant Service Setup (Node.js)
```bash
cd restaurant-service
npm install
# Ensure your .env is configured
npm start
```
*Runs on `http://localhost:3001`*

### 2. Menu Service Setup (Python)
It is highly recommended to use a virtual environment (`venv`).
```bash
cd menu-service
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Ensure your .env is configured
uvicorn main:app --reload --port 3002
```
*Runs on `http://localhost:3002`*

### 3. Order Service Setup (Go)
```bash
cd order-service
# Pull down all go module dependencies
go mod tidy

# Ensure your .env is configured
go run main.go
```
*Runs on `http://localhost:3003`*

### 4. Delivery Service Setup (Java)
Ensure you have Maven installed globally (`mvn -version`).
```bash
cd delivery-service
# Ensure application.properties is configured with Redis details
mvn spring-boot:run
```
*Runs on `http://localhost:3004`*

### 5. Frontend UI Setup (React)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

---

## 📡 API Endpoints Guide

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
| `GET` | `/api/menu/:id` | Retrieves details of a specific menu item. |

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
