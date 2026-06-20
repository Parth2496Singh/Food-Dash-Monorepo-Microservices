<div align="center">
  <h1>🌌 FOOD-DASH: Containerized Enterprise Architecture</h1>
  <p>A production-grade, container-first food delivery platform. This project serves as a comprehensive showcase of <b>DevOps orchestration, Docker containerization, and Polyglot Microservices</b>, demonstrating how disparate technologies and databases seamlessly integrate within a unified Docker network.</p>
  
  <br />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot" />
  <br /><br />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" />
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

### ☁️ Cloud & Infrastructure as Code
*   **AWS** (EC2, S3, DynamoDB)
*   **Terraform** (Remote State, Automated Provisioning)

### ⚙️ Container Orchestration
*   **Docker & Docker Compose** (Primary Infrastructure)
*   **NGINX** (Frontend Reverse Proxy & API Gateway)

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

The system is fully decoupled. The React frontend is served by an **NGINX API Gateway**, which natively bypasses CORS restrictions by proxying all `/api/...` requests directly to the internal backend cluster over the Docker network:

```mermaid
graph TD
    TF["🏗️ Terraform (IaC)"]
    
    subgraph "☁️ AWS Cloud Environment"
        S3[("🪣 S3 (Remote State)")]
        DDB[("⚡ DynamoDB (State Lock)")]
        
        subgraph "🐳 Docker Compose Cluster (EC2 Instance)"
            UI["📱 React Frontend"]
            NGINX["🚦 NGINX API Gateway<br/>(Port 8080)"]
            
            RS["🟢 Restaurant Service<br/>(Node.js)"]
            MS["🐍 Menu Service<br/>(FastAPI)"]
            OS["🐹 Order Service<br/>(Go/Gin)"]
            DS["☕ Delivery Service<br/>(Spring Boot)"]

            DB_M[("🍃 MongoDB")]
            DB_P[("🐘 PostgreSQL")]
            DB_S[("🐬 MySQL")]
            DB_R[("🔴 Redis")]
        end
    end

    TF -.->|"1. Secures State"| S3
    TF -.->|"2. Locks State"| DDB
    TF ===>|"3. Provisions & Boots"| UI

    %% Interactions
    UI -->|"Relative API Requests"| NGINX
    NGINX -->|"1. /api/restaurants"| RS
    NGINX -->|"2. /api/menu"| MS
    NGINX -->|"3. /api/orders"| OS
    NGINX -->|"5. /api/delivery"| DS

    OS -->|"4. Async Webhook"| DS

    %% DB Connections
    RS -.-> DB_M
    MS -.-> DB_P
    OS -.-> DB_S
    DS -.-> DB_R

    classDef frontend fill:#9d00ff,stroke:#fff,stroke-width:2px,color:#fff;
    classDef gateway fill:#ff4400,stroke:#fff,stroke-width:2px,color:#fff;
    classDef node fill:#43853d,stroke:#fff,stroke-width:2px,color:#fff;
    classDef python fill:#3776ab,stroke:#fff,stroke-width:2px,color:#fff;
    classDef go fill:#00add8,stroke:#fff,stroke-width:2px,color:#fff;
    classDef java fill:#ed8b00,stroke:#fff,stroke-width:2px,color:#fff;
    classDef tf fill:#7b42bc,stroke:#fff,stroke-width:2px,color:#fff;
    classDef aws fill:#ff9900,stroke:#fff,stroke-width:2px,color:#fff;
    
    class UI frontend;
    class NGINX gateway;
    class RS node;
    class MS python;
    class OS go;
    class DS java;
    class TF tf;
    class S3,DDB aws;
```

1.  **API Gateway Routing**: NGINX receives all requests and securely proxies them to the internal microservices, preventing the browser from raising Cross-Origin Resource Sharing (CORS) errors.
2.  **Browsing**: NGINX routes restaurant requests to the Node.js/MongoDB service.
3.  **Viewing Menus**: NGINX routes menu queries to the Python/PostgreSQL service.
4.  **Checkout**: NGINX routes cart payloads to the Go/MySQL service.
5.  **Asynchronous Handoff**: The Go Order Service bypasses NGINX, firing an internal webhook *directly* across the Docker network to the Java/Redis Delivery Service.

---

## 📁 Project Structure

This monorepo is meticulously organized to keep all microservices entirely isolated, ensuring a clean, production-ready environment.

```text
Food-Dash-Monorepo-Microservices/
├── docker-compose.yaml        # 🐳 Master orchestrator for the polyglot cluster
├── .gitignore                 # 🚫 Git ignore rules
├── README.md                  # 📖 Project documentation
│
├── frontend/                  # 🎨 React + Vite UI (API Orchestrator)
│   ├── nginx.conf             # 🚦 API Gateway & Reverse Proxy configuration
│   ├── src/
│   │   ├── components/        # 🧩 Reusable UI components (Glassmorphism)
│   │   ├── context/           # 🌐 Global React Context (Cart & Theme)
│   │   └── pages/             # 📄 Route views (Landing, Menu, Checkout, Tracker)
│   ├── Dockerfile             # 📦 Multi-stage build (Node build -> NGINX serve)
│   └── package.json           # 📦 Frontend dependencies
│
├── restaurant-service/        # 🟢 Node.js + Express (Port 3001)
│   ├── config/db.js           # 🔌 MongoDB connection & Mock Fallback logic
│   ├── models/Restaurant.js   # 🍃 Mongoose schema for restaurants
│   ├── index.js               # 🚀 Express server entry point
│   └── Dockerfile             # 📦 Node.js Alpine image
│
├── menu-service/              # 🐍 Python + FastAPI (Port 3002)
│   ├── database.py            # 🔌 PostgreSQL connection & SQLite degradation
│   ├── models.py              # 🐘 SQLAlchemy ORM models
│   ├── main.py                # ⚡ FastAPI application & endpoints
│   └── Dockerfile             # 📦 Python Slim image
│
├── order-service/             # 🐹 Go + Gin (Port 3003)
│   ├── main.go                # 🚀 Gin server, GORM logic, & Webhook dispatcher
│   ├── go.mod                 # 📦 Go module dependencies
│   └── Dockerfile             # 📦 Multi-stage build (Compiles to Scratch)
│
├── delivery-service/          # ☕ Java + Spring Boot (Port 3004)
│   ├── src/main/java/.../     # 📦 Spring Boot application source code
│   │   ├── DeliveryController.java  # 🚦 REST endpoints & Webhook receiver
│   │   └── DeliveryApplication.java # 🚀 Spring Boot entry point
│   ├── pom.xml                # 🐘 Maven dependencies
│   └── Dockerfile             # 📦 Multi-stage build (Maven build -> JRE serve)
│
└── terraform/                 # 🏗️ AWS Infrastructure as Code
    ├── ec2-infra/             # 💻 EC2 instance & Security Group definitions
    │   └── User_data-ec2.sh   # 📜 Bash script to auto-install Docker & deploy
    ├── remote-backend/        # 🪣 S3 + DynamoDB state locking infrastructure
    └── main.tf                # 🚀 Master Terraform entry point
```

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

## 📡 NGINX API Gateway Endpoints

When running the Docker Compose stack, all client API requests are securely routed through the Frontend NGINX container. NGINX acts as an API Gateway, secretly proxying the traffic to the isolated internal microservices to bypass CORS constraints.

### 🏪 Restaurant Service (Internal Port 3001)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Retrieves a list of all available restaurants. |
| `GET` | `/api/restaurants/:id` | Retrieves detailed info for a specific restaurant. |

### 🍕 Menu Service (Internal Port 3002)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/menu` | Retrieves all menu items. |
| `GET` | `/api/menu?restaurantId={id}`| Retrieves menu items for a specific restaurant. |

### 🛒 Order Service (Internal Port 3003)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Submits a new order payload to MySQL. |
| `GET` | `/api/orders/:id` | Retrieves the receipt from MySQL. |

### 🚚 Delivery Service (Internal Port 3004)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/delivery/:orderId` | Checks Redis for dispatch status. |
| `POST` | `/api/delivery/update` | Internal webhook triggered by Order Service. |

---

## 📝 API Contracts & Data Payloads

Because this is a decoupled polyglot architecture, there are no shared type libraries across services. Any future microservice replacements (or database migrations) must strictly adhere to the following JSON API contracts to ensure frontend compatibility.

### 1. Restaurant Object
**Source:** `GET /api/restaurants`
```json
{
  "id": "rest-1",
  "name": "Pizza Paradise",
  "cuisine": "Italian",
  "rating": 4.8,
  "address": "123 Main St",
  "image": "https://example.com/pizza.jpg"
}
```

### 2. Menu Item Object
**Source:** `GET /api/menu?restaurantId={id}`
```json
{
  "id": "menu-1",
  "restaurantId": "rest-1",
  "name": "Margherita Pizza",
  "description": "Classic cheese and tomato",
  "price": 14.99,
  "category": "Pizza"
}
```

### 3. Order Checkout Payload
**Target:** `POST /api/orders`
```json
{
  "restaurantId": "rest-1",
  "customerName": "John Doe",
  "totalAmount": 29.98,
  "items": "[{\"id\":\"menu-1\",\"quantity\":2}]" 
}
```
*(Note: `items` is stringified JSON to accommodate SQL databases without native JSON column support).*

### 4. Delivery Status Object
**Source:** `GET /api/delivery/:orderId`
```json
{
  "orderId": "ord-7f8a9b",
  "status": "Order Dispatched to Courier",
  "driverName": "Alice",
  "message": "Your driver is on the way!"
}
```

---

## 🏗️ Infrastructure as Code (Terraform)

This project utilizes **Terraform** to automate the provisioning of the AWS cloud infrastructure. Rather than manually clicking through the AWS Console, the entire environment (EC2 instances, security groups, and networking) is defined in code. 

**Benefits of this Setup:**
* **Automated & Repeatable:** The entire 5-container microservice architecture can be spun up from scratch in minutes.
* **Remote State Management:** We use an S3 Bucket and DynamoDB table to store the Terraform state file remotely. This prevents state corruption, enables state locking, and allows multiple DevOps engineers to collaborate safely.
* **Security First:** SSH keys are generated locally and explicitly ignored by Git, ensuring zero credential leakage into version control.
* **Cost Control:** A single command tears down the entire infrastructure when testing is complete, preventing unexpected AWS bills.

### Provisioning Steps

#### 1. Configure AWS CLI
Ensure you have the AWS CLI installed, then authenticate with your IAM user credentials:
```bash
aws configure
```
*(Provide your Access Key, Secret Key, and default region when prompted).*

#### 2. Generate Infrastructure SSH Keys
We generate a dedicated ed25519 SSH key pair strictly for this EC2 deployment.

Run this command from the root of the project to generate the keys directly inside the terraform directory:
```bash
ssh-keygen -t ed25519 -f ./terraform/terraform-ec2-key -C "aws-ec2-deployments"
```
*(Note: These files are included in the `.gitignore` to prevent accidental commits).*

Copy the generated keys into the remote backend folder so they are available during the state bootstrapping phase:
```bash
cp ./terraform/terraform-ec2-key ./terraform/remote-backend/
cp ./terraform/terraform-ec2-key.pub ./terraform/remote-backend/
```

#### 3. Bootstrap the Remote State
Before we build the server, we must build the "vault" that holds our Terraform state (S3 and DynamoDB).

Navigate to the remote backend directory:
```bash
cd terraform/remote-backend
```
Initialize and apply the backend infrastructure:
```bash
terraform init
terraform apply -auto-approve
```

#### 4. Provision the Microservices Environment
Now that the remote state is configured, deploy the actual application infrastructure.

Navigate back to the main terraform directory:
```bash
cd ..
```
Initialize the main configuration and provision the EC2 server:
```bash
terraform init
terraform apply -auto-approve
```
Once complete, Terraform will output the public IP address of your new EC2 instance. The EC2 User Data script will automatically install Docker, clone the application code, and spin up the microservices network.

### 🧹 Teardown (Destroying Infrastructure)
To stop incurring AWS charges, destroy the infrastructure when you are done testing.

From the `terraform/` directory, run:
```bash
terraform destroy -auto-approve
```
*(Note: You will also need to run this inside `terraform/remote-backend/` if you wish to destroy the S3 bucket and DynamoDB locking table).*
