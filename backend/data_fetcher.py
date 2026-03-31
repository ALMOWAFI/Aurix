import pandas as pd
import numpy as np
import yfinance as yf
import os

def fetch_real_gold_data():
    """
    Fetches 5 years of Gold Futures data for better ML training.
    """
    print("Fetching 5 years of market data for Gold (GC=F)...")
    gold = yf.download("GC=F", period="5y", interval="1d")
    
    if isinstance(gold.columns, pd.MultiIndex):
        gold.columns = gold.columns.get_level_values(0)
        
    df = gold[['Close']].copy()
    df.columns = ['price']
    df = df.reset_index()
    
    # More Features for better accuracy
    df['sma_10'] = df['price'].rolling(window=10).mean()
    df['sma_20'] = df['price'].rolling(window=20).mean()
    df['sma_50'] = df['price'].rolling(window=50).mean()
    df['ema_20'] = df['price'].ewm(span=20, adjust=False).mean()
    
    # RSI
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    # Volatility and Daily Return
    df['volatility_index'] = df['price'].rolling(window=10).std()
    df['daily_return'] = df['price'].pct_change()
    
    # Mock sentiment
    df['sentiment'] = np.random.uniform(-0.5, 0.5, len(df))
    
    # Target: Price 5 days in future
    df['target_price'] = df['price'].shift(-5)
    
    df = df.dropna()
    
    data_dir = os.path.join(os.getcwd(), 'data')
    if not os.path.exists(data_dir): os.makedirs(data_dir)
    
    file_path = os.path.join(data_dir, 'gold_data.csv')
    df.to_csv(file_path, index=False)
    print(f"Data saved to {file_path}. Total rows: {len(df)}")

if __name__ == "__main__":
    fetch_real_gold_data()
