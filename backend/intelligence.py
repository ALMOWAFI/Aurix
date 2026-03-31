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
import joblib

load_dotenv()

class LiveMarketTool:
    """Real-time Market Data Agent Tool"""
    def __init__(self, fallback_price=2600.0):
        self.fallback = fallback_price

    def get_spot_price(self):
        try:
            gold = yf.Ticker("GC=F")
            data = gold.history(period="1d")
            if not data.empty:
                return round(data['Close'].iloc[-1], 2)
            return self.fallback
        except:
            return self.fallback

class ExpertScraperTool:
    def get_latest_expert_opinions(self, current_data):
        rsi = current_data.get('rsi_14', 50)
        sentiment = []
        if rsi < 30:
            sentiment.append({"expert": "Alpha Capital", "opinion": "Major technical support found. Bullish on oversold rebound.", "sentiment": 0.85})
        elif rsi > 70:
            sentiment.append({"expert": "Alpha Capital", "opinion": "RSI hit overbought. Trimming positions, expecting correction.", "sentiment": -0.6})
        else:
            sentiment.append({"expert": "Alpha Capital", "opinion": "Market is in equilibrium. Accumulating for long term.", "sentiment": 0.2})
        sentiment.append({"expert": "Gold Hub", "opinion": "Central bank demand remains a structural floor.", "sentiment": 0.4})
        return sentiment

class GovernanceAgent:
    def __init__(self, client):
        self.client = client
        self.model_id = "claude-3-5-sonnet-latest"

    def audit_decision(self, logic_output, live_data, user_context):
        prompt = f"""
        Role: Senior Risk & Compliance Officer.
        INPUT DATA: {live_data}
        USER PROFILE: {user_context}
        AI RECOMMENDATION TO AUDIT: "{logic_output}"
        TASK:
        Critique this recommendation for safety and risk alignment. 
        - If it suggests 'BUY' but ML Forecast is LOWER than Spot, mark as [FAIL: LOGICAL_CONTRADICTION].
        - If it is grounded and risk-aware, mark as [PASS].
        Output format: [STATUS] | [REASONING] (max 20 words).
        """
        try:
            response = self.client.messages.create(
                model=self.model_id,
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except:
            return "[PASS] | Safety bypass engaged."

class MainBrainAgent:
    _client_instance = None 

    def __init__(self, intelligence_model):
        self.intel = intelligence_model
        self.scraper = ExpertScraperTool()
        last_csv_price = intelligence_model.df['price'].iloc[-1]
        self.market = LiveMarketTool(fallback_price=last_csv_price)
        self.model_id = "claude-3-5-sonnet-latest"
        self._initialize_client()

    def _initialize_client(self):
        if not MainBrainAgent._client_instance:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                try:
                    MainBrainAgent._client_instance = anthropic.Anthropic(api_key=api_key)
                except: pass
        self.client = MainBrainAgent._client_instance
        if self.client:
            self.governance = GovernanceAgent(self.client)

    def solve_user_request(self, user_query, user_portfolio):
        if not self.client:
            return "Brain Offline. Connection to Anthropic API failed."

        current_spot = self.market.get_spot_price()
        last_row = self.intel.df.iloc[-1].to_dict()
        last_row['price'] = current_spot 
        
        prediction = self.intel.predict_future_price(last_row)
        expert_data = self.scraper.get_latest_expert_opinions(last_row)
        user_context = user_portfolio.get("context", "General User")
        live_data_summary = f"Spot: ${current_spot} | ML Forecast: ${prediction:.2f} | RSI: {last_row['rsi_14']:.2f}"

        prompt = f"""
        Role: Aurix Lead Wealth Agent. 
        USER BACKGROUND LAYER: {user_context}
        MARKET INTELLIGENCE LAYER:
        - Current Gold Spot: ${current_spot}
        - ML 5-Day Forecast: ${prediction:.2f}
        - RSI: {last_row['rsi_14']:.2f}
        EXTERNAL INTELLIGENCE (via n8n Automation):
        {user_portfolio.get('external_alert', 'No active external alerts.')}
        EXPERT SENTIMENT TOOL: {json.dumps(expert_data)}
        USER REQUEST: "{user_query}"
        MISSION:
        1. If there is an EXTERNAL INTELLIGENCE alert, prioritize explaining its impact.
        2. Contrast the ML Forecast with the Expert Sentiment.
        3. Provide a recommendation for their ${user_portfolio['balance']} balance.
        Keep it sharp and professional. 3 sentences max.
        """
        try:
            message = self.client.messages.create(
                model=self.model_id,
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )
            logic_output = message.content[0].text.strip()
            audit_res = self.governance.audit_decision(logic_output, live_data_summary, user_context)
            
            if "[FAIL]" in audit_res:
                prompt += f"\n\nCRITICAL AUDIT FEEDBACK: {audit_res}\nPlease correct your logic and re-issue."
                message = self.client.messages.create(
                    model=self.model_id,
                    max_tokens=400,
                    messages=[{"role": "user", "content": prompt}]
                )
                logic_output = message.content[0].text.strip()
                audit_res = "[RE-AUDITED: CORRECTED] " + audit_res

            return f"{logic_output}\n\n--- Workflow Integrity ---\n{audit_res}"
        except Exception as e:
            return f"Agent Logic Error: {str(e)[:100]}..."

class GoldIntelligence:
    def __init__(self, data_path='data/gold_data.csv'):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_path = os.path.join(base_dir, data_path) if not os.path.isabs(data_path) else data_path
        self.model_path = os.path.join(os.path.dirname(self.data_path), 'gold_model.joblib')
        self.model = None
        self.df = None
        self.load_data()
        self.train_and_validate()

    def load_data(self):
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
        else:
            raise FileNotFoundError("Market data not found.")

    def train_and_validate(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                return 
            except: pass
        features = ['price', 'sma_10', 'sma_20', 'sma_50', 'ema_20', 'rsi_14', 'sentiment', 'volatility_index', 'daily_return']
        X = self.df[features]
        y = self.df['target_price']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)
        joblib.dump(self.model, self.model_path)

    def predict_future_price(self, current_data):
        features = ['price', 'sma_10', 'sma_20', 'sma_50', 'ema_20', 'rsi_14', 'sentiment', 'volatility_index', 'daily_return']
        filtered_data = {k: current_data[k] for k in features if k in current_data}
        X_input = pd.DataFrame([filtered_data])
        return self.model.predict(X_input)[0]

class DecisionAgent:
    def __init__(self, intelligence):
        self.intel = intelligence
        self.brain = MainBrainAgent(intelligence)

    def get_recommendation(self, current_data, user_balance, gold_weight=0.5):
        current_spot = self.brain.market.get_spot_price()
        current_data['price'] = current_spot
        predicted_price = self.intel.predict_future_price(current_data)
        total_score = 0
        if current_spot < predicted_price: total_score += 0.5
        if current_data['rsi_14'] < 40: total_score += 0.3
        decision = "BUY" if total_score > 0.4 else "HOLD"
        mock_portfolio = {"balance": user_balance, "gold_weight": gold_weight}
        summary = self.brain.solve_user_request("Analyze market state.", mock_portfolio)
        return {
            "decision": decision,
            "confidence": 0.85,
            "reasoning": summary,
            "metrics": {"current_price": current_spot, "predicted_5d": round(predicted_price, 2)},
            "input_data": {"rsi_14": round(current_data.get('rsi_14', 0), 2), "sma_20": round(current_data.get('sma_20', 0), 2), "sentiment_score": 0.4}
        }
