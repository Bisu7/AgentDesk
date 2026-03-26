# AI-Powered Customer Support System

An industry-level, full-stack customer support application featuring real-time communication, intelligent AI-driven ticket management, and professional analytics dashboards.

## 🚀 Key Features

- **🤖 AI-Driven Intelligence**: Automatic ticket classification, sentiment analysis, and smart reply suggestions for agents powered by OpenAI.
- **💬 Real-Time Communication**: Live, bidirectional chat between customers and support agents using WebSockets (Socket.IO).
- **📊 Role-Based Dashboards**:
  - **Customer**: Submit tickets, track status, and chat with agents.
  - **Agent**: Manage ticket queues, track SLAs, and use AI-assist for replies.
  - **Admin**: Monitor system KPIs, track agent performance, and use "Smart Routing" to assign tickets.
- **🔒 Secure Architecture**: Robust JWT-based authentication with role-based access control (RBAC).
- **📈 Advanced Analytics**: Data visualization for ticket volume trends and resolution performance.

---

## 🛠️ Technology Stack

**Frontend**:
- React 18+
- Tailwind CSS (Modern, Responsive UI)
- Lucide React (Iconography)
- Recharts (Data Visualization)
- Axios (API Communication)
- Socket.io-client (Real-time)

**Backend**:
- Flask (Python Web Framework)
- PostgreSQL (Relational Database)
- Flask-SQLAlchemy (ORM)
- Flask-JWT-Extended (Authentication)
- Flask-SocketIO (Real-time)
- OpenAI API (Intelligence)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Python 3.8+
- Node.js & npm
- PostgreSQL Database

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder:
   ```env
   SECRET_KEY=your-long-random-secret-key-32-chars+
   JWT_SECRET_KEY=your-long-random-jwt-key-32-chars+
   DATABASE_URL=postgresql://user:password@localhost:5432/db_name
   OPENAI_API_KEY=your-openai-key
   ```
5. Initialize the database:
   ```bash
   flask db upgrade
   ```
6. Run the server:
   ```bash
   python app.py
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### 4. Docker Setup (Recommended)
If you have Docker installed, you can start the entire stack (Database, Backend, Frontend) with a single command:

1.  **Build and Start**:
    ```bash
    docker-compose up --build
    ```
2.  **Access the App**:
    - **Frontend**: `http://localhost`
    - **Backend API**: `http://localhost:5000/api`
    - **Database**: `localhost:5432`

---

## 📂 Project Structure

```text
├── backend/
│   ├── routes/          # API Blueprints (Auth, Tickets, Admin, Chat)
│   ├── services/        # AI Service logic
│   ├── models.py        # Database Schema
│   ├── extensions.py    # Flask Extensions
│   └── app.py           # Application Factory
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI elements
│   │   ├── context/     # Auth & State Management
│   │   ├── pages/       # Dashboard & Auth views
│   │   └── services/    # API & WebSocket clients

```

## 🛡️ License
Distributed under the MIT License.
