
# Trinetra Backend Documentation
## Project Overview
Trinetra is an AI-powered surveillance backend that integrates motion detection, object recognition, AI reasoning, and real-time notifications. It is modular, production-ready, and scalable.

---

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Project Structure](#project-structure)
4. [Modules](#modules)
5. [Dependencies](#dependencies)
6. [Workflow](#workflow)
7. [Running the Server](#running-the-server)
8. [Testing](#testing)
9. [API Documentation](#api-documentation)

---

## Installation
### Prerequisites
- Python 3.11 or higher
- MongoDB running locally or remotely
- Redis running locally or remotely
- Groq API key (for AI features)
- (Optional) GPU with CUDA for faster YOLO inference

### Steps
1. **Clone the repository**:
   ```bash
   git clone &lt;repository-url&gt;
   cd final-capstone-project-agentic-ai-trinetra/server
   ```

2. **Create and activate virtual environment**:
   - Using uv:
     ```bash
     uv venv
     .venv\Scripts\Activate.ps1  # Windows
     # source .venv/bin/activate  # Linux/macOS
     ```
   - Or using venv:
     ```bash
     python -m venv .venv
     .venv\Scripts\Activate.ps1  # Windows
     # source .venv/bin/activate  # Linux/macOS
     ```

3. **Install dependencies**:
   - Using uv:
     ```bash
     uv pip install -e .
     ```
   - Or using pip:
     ```bash
     pip install -e .
     ```

4. **Configure environment variables**:
   - Copy the example environment file:
     ```bash
     copy .env.example .env  # Windows
     # cp .env.example .env  # Linux/macOS
     ```
   - Update `.env` with your own values (see [Configuration](#configuration) section)

---

## Configuration
All configuration is managed in `app/config/settings.py` and loaded from environment variables (via `.env` file).

Key environment variables:
```env
# Core settings
APP_NAME=Trinetra
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# Server settings
HOST=0.0.0.0
PORT=8000

# Database settings
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=trinetra
REDIS_URI=redis://localhost:6379/0

# AI settings
AI_PROVIDER=Groq
GROQ_API_KEY=&lt;your-groq-api-key&gt;
GROQ_MODEL=llama3-8b-8192
AI_MAX_RETRIES=3
AI_REQUEST_TIMEOUT=30

# Security settings
SECRET_KEY=&lt;your-secret-key&gt;
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# YOLO settings
YOLO_MODEL=yolov8n.pt
YOLO_CONFIDENCE=0.5

# Event settings
EVENT_COOLDOWN_SECONDS=10
```

---

## Project Structure
```
server/
├── app/
│   ├── ai/                  # AI service and reasoning
│   ├── auth/                # Authentication and authorization
│   ├── cameras/             # Camera capture and management
│   ├── config/              # Configuration and logging setup
│   ├── database/            # MongoDB and Redis clients and models
│   ├── detection/           # MOG, YOLO, and event building
│   ├── notifications/       # Notification dispatcher and WebSocket
│   ├── routers/             # API endpoints
│   ├── schemas/             # Pydantic models
│   ├── services/            # Business logic
│   ├── utils/               # Helper functions and utilities
│   └── main.py              # FastAPI application entry point
├── docs/                    # Documentation files
├── logs/                    # Log files
├── scripts/                 # Helper scripts
├── tests/                   # Unit and integration tests
└── pyproject.toml           # Project dependencies
```

---

## Modules
### 1. AI Module (`app/ai/`)
- **`service.py`**: Manages Groq client and AI request handling
- **`prompt_builder.py`**: Builds prompts for AI analysis
- **`reasoning.py`**: Validates and normalizes AI responses
- **`router.py`**: Maps threat levels to notification recipients

### 2. Auth Module (`app/auth/`)
- **`jwt.py`**: Creates and verifies JWT tokens
- **`password.py`**: Hashes and verifies passwords
- **`dependencies.py`**: FastAPI dependencies for authentication
- **`permissions.py`**: Defines role-based permissions

### 3. Cameras Module (`app/cameras/`)
- **`capture.py`**: Captures frames from cameras or video files
- **`manager.py`**: Manages multiple camera streams
- **`stream.py`**: Handles camera streaming

### 4. Detection Module (`app/detection/`)
- **`yolo.py`**: YOLO object detection service
- **`mog.py`**: MOG motion detection
- **`pipeline.py`**: Combines MOG, YOLO, and tracking
- **`event_builder.py`**: Builds structured events from detections
- **`tracker.py`**: Tracks objects across frames (IoU-based)

### 5. Notifications Module (`app/notifications/`)
- **`sender.py`**: Creates and sends notifications
- **`dispatcher.py`**: Determines notification recipients
- **`websocket.py`**: Manages WebSocket connections

### 6. Services Module (`app/services/`)
- **`event_service.py`**: Event lifecycle management and persistence
- **`camera_service.py`**: Camera CRUD operations
- **`notification_service.py`**: Orchestrates full detection → notification pipeline
- **`threat_service.py`**: Rule-based threat classification
- **`analytics_service.py`**: Aggregates analytics data
- **`storage_service.py`**: Saves snapshots and video clips

---

## Dependencies
### Core Dependencies
- **FastAPI**: Web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Motor**: Asynchronous MongoDB driver
- **Redis (asyncio)**: Asynchronous Redis client
- **Groq**: AI API client
- **Ultralytics YOLO**: Object detection library
- **Pydantic**: Data validation and settings management
- **Python-JOSE**: JWT token handling
- **Passlib**: Password hashing
- **Email-Validator**: Email address validation
- **Loguru**: Structured logging

### Development Dependencies
- **Pytest**: Testing framework
- **Black**: Code formatter
- **Ruff**: Linter

See `pyproject.toml` for complete list.

---

## Workflow
### Detection and Notification Pipeline
1. **Motion Detection**: MOG detects movement in camera frames
2. **Object Detection**: If motion detected, YOLO runs on frame
3. **Tracking**: Objects are tracked across frames
4. **Event Creation**: Structured event is built
5. **AI Analysis**: Groq analyzes the event
6. **Threat Classification**: Rule-based engine classifies threat level
7. **Notification**: WebSocket sends alerts to connected clients
8. **Persistence**: Event is stored in MongoDB

---

## Running the Server
### Start the server locally
```bash
cd server
uv run uvicorn app.main:app --reload  # Using uv
# Or
.venv\Scripts\uvicorn.exe app.main:app --reload  # Windows
# .venv/bin/uvicorn app.main:app --reload  # Linux/macOS
```

The server will start at http://127.0.0.1:8000

---

## Testing
### Run End-to-End Test
```bash
cd server
uv run python scripts/e2e_test.py
```

### Run Unit Tests
```bash
cd server
uv run pytest tests/
```

---

## API Documentation
Once the server is running, you can access:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **Redoc**: http://127.0.0.1:8000/redoc
- **OpenAPI JSON**: http://127.0.0.1:8000/openapi.json

### API Endpoints Overview
| Group     | Endpoints                                                                 |
|-----------|--------------------------------------------------------------------------|
| **Auth**  | POST /auth/login, POST /auth/register, GET /auth/me, GET /auth/users      |
| **Cameras** | GET /cameras, GET /cameras/{id}, POST /cameras, PUT /cameras/{id}, DELETE /cameras/{id} |
| **Alerts** | GET /alerts, GET /alerts/{id}                                           |
| **Events** | GET /events, GET /events/{id}                                           |
| **Analytics** | GET /analytics                                                          |
| **System** | GET /health, GET /system/status, GET /system/metrics                    |

For detailed API documentation, see `server/docs/api.md`.

---

## Deployment Notes
1. Ensure MongoDB and Redis are running
2. Set appropriate values for environment variables (especially `SECRET_KEY`)
3. Disable debug mode (`DEBUG=false`) in production
4. Use a process manager like systemd or supervisor to keep the server running
5. Use a reverse proxy like Nginx in front of Uvicorn for production

For more deployment details, see `server/docs/deployment.md`.
