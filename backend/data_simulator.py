import pandas as pd
import numpy as np
import datetime
import os

def generate_gold_data(days=365):
    """
    Simulates gold prices with volatility and sentiment.
    """
    np.random.seed(42)
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    dates = [start_date + datetime.timedelta(days=i) for i in range(days)]
    
    # Base price (e.g., $2000 per ounce)
    prices = [2000.0]
    volatility = 0.005 # 0.5% daily volatility
    
    for i in range(1, days):
        change = prices[-1] * volatility * np.random.randn()
        prices.append(prices[-1] + change)
    
    df = pd.DataFrame({'date': dates, 'price': prices})
    
    # Technical Indicators
    df['sma_20'] = df['price'].rolling(window=20).mean()
    df['sma_50'] = df['price'].rolling(window=50).mean()
    
    # Simple RSI calculation
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    # Simulate Sentiment (-1 to 1)
    # Usually sentiment leads price slightly or follows trends
    df['sentiment'] = np.random.uniform(-1, 1, days)
    # Add some trend to sentiment
    df['sentiment'] = df['sentiment'].rolling(window=5).mean().fillna(0)
    
    # Volatility Index (VIX-like)
    df['volatility_index'] = df['price'].rolling(window=10).std()
    
    # Target variable: Price in 5 days (for regression)
    df['target_price'] = df['price'].shift(-5)
    
    return df.dropna()

if __name__ == "__main__":
    data_dir = os.path.join(os.getcwd(), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    df = generate_gold_data()
    file_path = os.path.join(data_dir, 'gold_data.csv')
    df.to_csv(file_path, index=False)
    print(f"Data generated and saved to {file_path}")
    print(df.tail())
