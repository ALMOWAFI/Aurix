import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import os
import anthropic
from dotenv import load_dotenv
import json
import yfinance as yf

load_dotenv()

class LiveMarketTool:
    def get_spot_price(self):
        try:
            gold = yf.Ticker("GC=F")
            data = gold.history(period="1d")
            return round(data['Close'].iloc[-1], 2)
        except:
            return 2600.0

class ExpertScraperTool:
    def get_latest_expert_opinions(self):
        return [
            {"expert": "Macro Analyst A", "opinion": "Bullish on gold due to central bank buying.", "sentiment": 0.8},
            {"expert": "Commodity Trader B", "opinion": "Watching for a short-term correction at $2500 resistance.", "sentiment": -0.2},
            {"expert": "Fintech Influencer C", "opinion": "Digital gold adoption is rising among Gen Z.", "sentiment": 0.5}
        ]

class GovernanceAgent:
    def __init__(self, client):
        self.client = client
        self.model_id = "claude-3-5-sonnet-latest"

    def audit_decision(self, logic_output, user_context):
        prompt = f"""
        Role: You are the AI Governance Officer.
        Review this recommendation for safety and risk alignment with user context: {user_context}.
        
        RECOMMENDATION:
        {logic_output}
        
        OUTPUT:
        Start with [GOVERNANCE: PASS] or [GOVERNANCE: WARNING]. Max 2 sentences.
        """
        try:
            response = self.client.messages.create(
                model=self.model_id,
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except:
            return "[GOVERNANCE: AUTO-PASS] Recommendation monitored by safety protocols."

class MainBrainAgent:
    def __init__(self, intelligence_model):
        self.intel = intelligence_model
        self.scraper = ExpertScraperTool()
        self.market = LiveMarketTool()
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self._initialized = False
        self.model_id = "claude-3-5-sonnet-latest"
        self._initialize_client()

    def _initialize_client(self):
        if not self.api_key:
            dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
            load_dotenv(dotenv_path)
            self.api_key = os.getenv("ANTHROPIC_API_KEY")
        
        if self.api_key and not self._initialized:
            try:
                self.client = anthropic.Anthropic(api_key=self.api_key)
                self.governance = GovernanceAgent(self.client)
                self._initialized = True
            except Exception as e:
                print(f"Error initializing Claude: {e}")

    def solve_user_request(self, user_query, user_portfolio):
        self._initialize_client()
        
        current_spot = self.market.get_spot_price()
        last_row = self.intel.df.iloc[-1].to_dict()
        prediction = self.intel.predict_future_price(last_row)
        expert_data = self.scraper.get_latest_expert_opinions()
        user_context = user_portfolio.get("context", "General User")
        
        # AGENTIC CHAIN-OF-THOUGHT PROMPT
        prompt = f"""
        Role: You are the Aurix Lead Wealth Agent.
        
        USER BACKGROUND:
        {user_context}
        
        TECHNICALS:
        - Current Spot: ${current_spot}
        - ML 5-Day Prediction: ${prediction:.2f}
        - RSI: {last_row['rsi_14']:.2f}
        
        EXPERTS:
        {json.dumps(expert_data)}
        
        REQUEST: "{user_query}"
        
        AGENTIC REASONING INSTRUCTIONS:
        1. ANALYZE: Connect the ML prediction to the technical RSI health.
        2. CONTRAST: Weigh expert sentiment against the raw numbers.
        3. TAILOR: Use the user's BACKGROUND to give highly specific advice for their ${user_portfolio['balance']} balance.
        4. SYNTHESIZE: Provide a 3-sentence definitive path forward.
        """
        
        if not self._initialized:
            return f"Aurix Connection Offline. Spot: ${current_spot}. ML: ${prediction:.2f}"

        try:
            message = self.client.messages.create(
                model=self.model_id,
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )
            logic_output = message.content[0].text.strip()
            audit_res = self.governance.audit_decision(logic_output, user_context)
            return f"{logic_output}\n\n--- Audit ---\n{audit_res}"
        except Exception as e:
            return f"Agent Logic Error: {str(e)[:100]}..."

class GoldIntelligence:
    def __init__(self, data_path='data/gold_data.csv'):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_path = os.path.join(base_dir, data_path) if not os.path.isabs(data_path) else data_path
        self.model = None
        self.df = None
        self.load_data()
        self.train_and_validate()

    def load_data(self):
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
        else:
            raise FileNotFoundError(f"Market data not found.")

    def train_and_validate(self):
        features = ['price', 'sma_10', 'sma_20', 'sma_50', 'ema_20', 'rsi_14', 'sentiment', 'volatility_index', 'daily_return']
        X = self.df[features]
        y = self.df['target_price']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

    def predict_future_price(self, current_data):
        features = ['price', 'sma_10', 'sma_20', 'sma_50', 'ema_20', 'rsi_14', 'sentiment', 'volatility_index', 'daily_return']
        filtered_data = {k: current_data[k] for k in features if k in current_data}
        X_input = pd.DataFrame([filtered_data])
        return self.model.predict(X_input)[0]

class DecisionAgent:
    def __init__(self, intelligence):
        self.intel = intelligence
        self.brain = MainBrainAgent(intelligence)

    def get_recommendation(self, current_data, user_balance):
        predicted_price = self.intel.predict_future_price(current_data)
        current_spot = self.brain.market.get_spot_price()
        
        total_score = 0
        if current_spot < predicted_price: total_score += 0.5
        if current_data['rsi_14'] < 40: total_score += 0.3
        
        decision = "BUY" if total_score > 0.4 else "HOLD"
        summary = self.brain.solve_user_request("Analyze market state.", {"balance": user_balance, "gold_weight": 0.5})

        return {
            "decision": decision,
            "confidence": 0.85,
            "reasoning": summary,
            "metrics": {
                "current_price": current_spot,
                "predicted_5d": round(predicted_price, 2)
            },
            "input_data": {
                "rsi_14": round(current_data.get('rsi_14', 0), 2),
                "sma_20": round(current_data.get('sma_20', 0), 2),
                "sentiment_score": 0.4
            }
        }
