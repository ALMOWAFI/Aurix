import sys
import os
import pandas as pd

# Add the current directory to sys.path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from intelligence import GoldIntelligence, DecisionAgent

def test_system_logic():
    print("--- Starting System Validation ---")
    
    # 1. Initialize Intelligence
    try:
        data_path = 'data/gold_data.csv'
        intel = GoldIntelligence(data_path)
        agent = DecisionAgent(intel)
    except Exception as e:
        print(f"Initialization Failed: {e}")
        return

    # 2. Test Case: Strong Buy Condition (Oversold + Price below SMA)
    oversold_data = {
        'price': 2200.0,
        'sma_10': 2300.0,
        'sma_20': 2350.0,
        'sma_50': 2400.0,
        'ema_20': 2340.0,
        'rsi_14': 25.0, # Very oversold
        'sentiment': 0.1,
        'volatility_index': 10.0,
        'daily_return': -0.02
    }
    
    buy_rec = agent.get_recommendation(oversold_data, 5000)
    print(f"\n[Test: Oversold Market]")
    print(f"Decision: {buy_rec['decision']} | Confidence: {buy_rec['confidence']}")
    print(f"Reasoning: {buy_rec['reasoning']}")

    # 3. Test Case: Strong Sell Condition (Overbought)
    overbought_data = {
        'price': 2700.0,
        'sma_10': 2500.0,
        'sma_20': 2450.0,
        'sma_50': 2400.0,
        'ema_20': 2460.0,
        'rsi_14': 80.0, # Overbought
        'sentiment': -0.2,
        'volatility_index': 15.0,
        'daily_return': 0.03
    }
    
    sell_rec = agent.get_recommendation(overbought_data, 5000)
    print(f"\n[Test: Overbought Market]")
    print(f"Decision: {sell_rec['decision']} | Confidence: {sell_rec['confidence']}")
    print(f"Reasoning: {sell_rec['reasoning']}")

    # 4. Model Accuracy Check
    print(f"\n[Model Health]")
    print(f"Current MAE: ${intel.mae:.2f}")
    if intel.mae < 20:
        print("PASS: Model error is within acceptable fintech limits (<$20).")
    else:
        print("FAIL: Model error is too high. Needs more data or better features.")

if __name__ == "__main__":
    test_system_logic()
