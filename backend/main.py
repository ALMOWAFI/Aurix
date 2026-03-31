from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import sys
import uvicorn
import json
from typing import Optional

# Add the current directory to the path so Docker finds 'intelligence.py'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from intelligence import GoldIntelligence, DecisionAgent
except ImportError:
    from .intelligence import GoldIntelligence, DecisionAgent

# Absolute pathing fix
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "gold_data.csv")
USER_PROFILE_PATH = os.path.join(BASE_DIR, "user_profile.json")

# n8n External Context Bridge (Non-disruptive layer)
N8N_DATA = {"context": "No external automation alerts.", "updated_at": None}

app = FastAPI(title="Aurix Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    name: str
    goal: str
    risk: str
    balance: float
    gold_weight: float
    background: Optional[str] = ""

# Global instances
intel = None
advisor = None

def get_intel():
    global intel, advisor
    if intel is None:
        intel = GoldIntelligence(DATA_PATH)
        advisor = DecisionAgent(intel)
    return intel, advisor

@app.post("/api/external/n8n-bridge")
async def n8n_bridge(payload: dict):
    global N8N_DATA
    # Lightweight memory update
    N8N_DATA["context"] = payload.get("message", "Routine market scan.")
    N8N_DATA["updated_at"] = payload.get("timestamp")
    return {"status": "Aurix Bridge Active", "received": True}

@app.post("/onboarding")
def save_profile(profile: UserProfile):
    try:
        with open(USER_PROFILE_PATH, 'w') as f:
            json.dump(profile.dict(), f)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profile")
def get_profile():
    if os.path.exists(USER_PROFILE_PATH):
        try:
            with open(USER_PROFILE_PATH, 'r') as f:
                return json.load(f)
        except: return None
    return None

@app.get("/market-data")
def get_market_data(limit: int = 30):
    i, _ = get_intel()
    data = i.df.tail(limit).to_dict(orient="records")
    return data

@app.get("/recommendation")
def get_recommendation(user_balance: float = 5000.0, gold_weight: float = 0.5):
    i, a = get_intel()
    last_row = i.df.iloc[-1].to_dict()
    return a.get_recommendation(last_row, user_balance, gold_weight)

@app.get("/chat")
def chat(message: str, balance: float = 5000.0, gold_weight: float = 0.5):
    try:
        _, a = get_intel()
        
        profile_context = "General User"
        if os.path.exists(USER_PROFILE_PATH):
            try:
                with open(USER_PROFILE_PATH, 'r') as f:
                    p = json.load(f)
                    profile_context = f"User Name: {p['name']}. Goal: {p['goal']}. Risk: {p['risk']}."
            except: pass
        
        # Merge portfolio context with n8n alerts
        user_portfolio = {
            "balance": balance, 
            "gold_weight": gold_weight, 
            "context": profile_context,
            "external_alert": N8N_DATA["context"]
        }
        
        response = a.brain.solve_user_request(message, user_portfolio)
        return {"response": response}
    except Exception as e:
        return {"response": f"The Brain is recalibrating. ({e})"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
