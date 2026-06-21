from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Signalist AI Service Running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        user_input = data.get("stock", "").strip().lower()

        symbol_map = {
            "apple": "AAPL",
            "tesla": "TSLA",
            "microsoft": "MSFT",
            "nvidia": "NVDA",
            "google": "GOOGL",
            "alphabet": "GOOGL",
            "meta": "META",
            "facebook": "META",
            "jp morgan": "JPM",
            "jpmorgan": "JPM",
            "jpm": "JPM",
            "amazon": "AMZN",
            "netflix": "NFLX",

            "reliance": "RELIANCE.NS",
            "ril": "RELIANCE.NS",
            "tcs": "TCS.NS",
            "infosys": "INFY.NS",
            "infy": "INFY.NS",
            "hdfc bank": "HDFCBANK.NS",
            "hdfcbank": "HDFCBANK.NS",
            "sbi": "SBIN.NS",
            "state bank of india": "SBIN.NS",
            "itc": "ITC.NS",
            "adani enterprises": "ADANIENT.NS",
            "adani": "ADANIENT.NS"
        }

        stock = symbol_map.get(user_input, user_input.upper())

        if not stock:
            return jsonify({"message": "Stock symbol required"}), 400

        ticker = yf.Ticker(stock)
        hist = ticker.history(period="3mo")

        if hist.empty:
            return jsonify({"message": "No stock data found"}), 404

        closes = hist["Close"].values
        last_price = float(closes[-1])

        avg7 = float(np.mean(closes[-7:]))
        avg30 = float(np.mean(closes[-30:]))

        if avg7 > avg30:
            signal = "BUY"
            confidence = 85
            reason = "Bullish trend detected."
        elif avg7 < avg30:
            signal = "SELL"
            confidence = 80
            reason = "Bearish trend detected."
        else:
            signal = "HOLD"
            confidence = 70
            reason = "Neutral market trend."

        candles = []
        recent = hist.tail(7)

        for date, row in recent.iterrows():
            candles.append({
                "x": date.strftime("%Y-%m-%d"),
                "y": [
                    round(float(row["Open"]), 2),
                    round(float(row["High"]), 2),
                    round(float(row["Low"]), 2),
                    round(float(row["Close"]), 2)
                ]
            })

        news_titles = []

        try:
            news = ticker.news

            for item in news[:5]:
                if "title" in item:
                    news_titles.append(item["title"])

        except:
            pass

        sentiment_score = 0

        for title in news_titles:
            sentiment_score += TextBlob(title).sentiment.polarity

        if sentiment_score > 0:
            sentiment = "Positive"
        elif sentiment_score < 0:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        return jsonify({
            "stock": stock,
            "price": round(last_price, 2),
            "signal": signal,
            "confidence": confidence,
            "reason": reason,
            "candles": candles,
            "sentiment": sentiment,
            "news": news_titles
        })

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500

if __name__ == "__main__":
   app.run(host="0.0.0.0", port=7000)