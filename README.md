# Aurix Intel: AI-Powered Smart Decision System
**Intelligent Fintech Pipeline for Digital Gold Transactions**

---

## 🚀 Executive Summary
Aurix Intel is a high-frequency decision-making pipeline that bridges **Quantitative Machine Learning** with **Agentic Reasoning**. Developed as part of a technical evaluation, this system demonstrates how a multi-agent architecture can provide grounded, risk-aware financial advice by synthesizing historical data, technical indicators (RSI/SMA), and live market reality.

---

## 🧠 Part 1: Intelligent Decision System
The system uses a **Hybrid Intelligence Architecture**:
1.  **The Quantitative Layer (ML):** A Random Forest Regressor trained on 5 years of Gold Futures data. It provides a 5-day price forecast.
2.  **The Reasoning Layer (LLM):** Powered by **Claude 3.5 Sonnet**, this agent acts as a "Quant Brain." It receives the ML forecast but contrasts it against real-time technicals (RSI) and Expert Sentiment.
3.  **The Governance Layer (Auditor):** A separate agent audits the Brain’s advice for logical contradictions (e.g., suggesting a BUY when the forecast is lower than the spot price).

---

## 📊 Part 2 & 3: Data & API Layer
- **Live Data:** Integrated with Yahoo Finance (`yfinance`) for real-time spot prices.
- **Simulation:** Uses a 5-year historical dataset (`gold_data.csv`) for model training.
- **API (FastAPI):**
    - `GET /recommendation`: Returns Decision (BUY/HOLD/SELL), Confidence, Reasoning, and the raw **Input Data Used** (satisfying Part 3 requirements).
    - `GET /market-data`: Returns the last 30 days of technical indicators.
    - `GET /chat`: Interactive agentic workflow.

---

## 🏗️ Part 4: System Design Thinking

### **Scalability**
- **In-Memory Caching:** Currently uses `joblib` for model persistence. In production, this would migrate to **Redis** for sub-millisecond lookups across thousands of user sessions.
- **Horizontal Scaling:** The Stateless FastAPI backend is containerized with **Docker**, allowing it to scale across **AWS ECS/Fargate** clusters behind an Application Load Balancer.

### **Real-Time Data Integration**
- The current system uses a "Pull" model via `yfinance`. A production system would use a "Push" model via **WebSockets** (e.g., AlphaVantage or Bloomberg Terminal APIs) to feed a real-time feature store.

### **Improving AI Models**
- **Feature Engineering:** Transitioning from 9 basic features to including macro-economic indicators (USD Index, Fed Interest Rates, Geopolitical Risk scores).
- **Feedback Loops:** Logging user decisions to create a supervised dataset for improving the Agent's reasoning quality.     

### **Fintech Ecosystem Fit**
- This system fits as a **"Wealth Co-Pilot"** plugin. It can be integrated into digital wallets to provide automated "Stop-Loss" triggers or "Dollar-Cost Averaging" (DCA) suggestions based on technical health.

---

## 🌟 Part 5: Optional (Strong Bonus)

### **1. Predictive UI Dashboard (React)**
The frontend features a **Predictive Chart** that "stitches" historical price lines with a dashed 5-day forecast, giving users a visual roadmap of the AI's expectations.

### **2. Voice AI Agent (ElevenLabs)**
Incorporated a **Voice-to-Voice** interface via ElevenLabs Conversational AI. Users can speak directly to "Aurix" to get portfolio briefings, leveraging low-latency WebRTC technology.

### **3. Reinforcement Learning (Concept)**
*Connecting my robotics background to fintech:*
Instead of a static Random Forest, we can implement a **Deep Q-Network (DQN)**.
- **State:** [Spot Price, RSI, SMA, User Balance, Gold Weight].
- **Action:** [Buy, Sell, Hold].
- **Reward:** Net Profit - (Transaction Fees + Volatility Penalty).
Over time, the agent would learn the "optimal policy" for gold accumulation, specifically tailored to the user's risk tolerance.

---

## 📦 Setup & Deployment

### **Local Setup**
1.  **Clone the Repo:** `git clone <repo-url>`
2.  **Environment:** Create `backend/.env` with `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY`.
3.  **Run with Docker (Recommended):**
    ```bash
    docker-compose up --build
    ```
4.  **Manual Start:**
    - Backend: `pip install -r requirements.txt && python main.py`
    - Frontend: `npm install && npm run dev`

---

## 🛠️ Tech Stack
- **AI:** Claude 3.5 Sonnet, ElevenLabs Conversational SDK.
- **ML:** Scikit-Learn (RandomForest), Pandas, Numpy.
- **Backend:** FastAPI, Uvicorn, YFinance.
- **Frontend:** React (Vite), Recharts, TailwindCSS v4.
- **Ops:** Docker, Nginx Proxy.

---
**Developed by:** ALI Elmowafi
**Submission for:** Technical Evaluation (AI-Powered Smart Decision System)
