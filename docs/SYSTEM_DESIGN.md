# Aurix Intel: System Design & Scalability Report

## 1. Architectural Overview
Aurix Intel uses a **Decoupled Agent Architecture**. Instead of a monolithic decision function, we separate technical analysis, market sentiment, and price prediction into independent "Agents" that report to an **Orchestrator**.

### Key Components:
- **ML Predictor:** Random Forest Regressor (Sklearn) for price forecasting.
- **Advisor Agent:** LLM-based reasoning (designed for Gemini API).
- **API Layer:** FastAPI (high-performance, asynchronous).
- **Frontend:** React + Recharts (real-time visualization).

## 2. Scaling to Millions of Users
To handle high traffic, we would implement:
- **Distributed Task Queues:** Use `Celery` with `Redis` to pre-calculate recommendations for all active users periodically, rather than calculating on every GET request.
- **Database:** `PostgreSQL` for user data and `TimeScaleDB` (built on top of Postgres) for high-frequency price history.
- **Load Balancing:** Deploying backend containers across multiple regions using **Kubernetes (K8s)**.

## 3. Real-time Data Integration
Currently, we simulate data. In production, we would use:
- **WebSockets:** For streaming live gold prices from providers like OANDA or AlphaVantage.
- **Event-Driven Scrapers:** Agents that listen to Twitter/X and News APIs to update the `SentimentAgent` in real-time.

## 4. Improving AI Models over Time
- **Online Learning:** Transition from static Random Forest to incremental models (like `River` or `XGBoost` with warm starts) that learn from new price ticks without full retraining.
- **Feedback Loops:** Track user "Buy" success rates. If a user follows a "BUY" signal and profits, we use that data point as a positive reinforcement for the model.
- **RL (Reinforcement Learning):** Implementing a DQN (Deep Q-Network) that learns the optimal "Buy/Sell" timing by playing through historical market episodes as a game.

## 5. Security & Fintech Integrity
- **Audit Trails:** Every AI recommendation is logged with its original features (RSI, Sentiment) so that regulators can audit *why* the AI gave specific advice.
- **Risk Circuit Breakers:** If volatility exceeds a threshold, the AI is programmed to automatically switch to "HOLD" or "CAUTION" to protect user capital.
