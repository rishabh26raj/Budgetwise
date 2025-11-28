import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "DatasetFinalCSV.csv")

class MLEngine:
    def __init__(self):
        self.model = None
        self.le_month = LabelEncoder()
        self.is_trained = False
        self.load_model()

    def load_data(self):
        if not os.path.exists(DATA_PATH):
            print("Dataset not found!")
            return None
        df = pd.read_csv(DATA_PATH)
        return df

    def preprocess(self, df):
        # Calculate Total Expense
        # InitialExpense is sum of Grocery, Rent, Transport
        # Total = InitialExpense + AmountOfProduct (Other Expense)
        # Note: Some rows might have negative Remaining_Balance, meaning they spent more.
        # We just want the Total Expense.
        
        df['Total_Expense'] = df['InitialExpense'] + df['AmountOfProduct']
        
        # Encode Month
        month_map = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        df['Month_Num'] = df['Month'].map(month_map)
        
        return df

    def train(self):
        df = self.load_data()
        if df is None:
            return

        df = self.preprocess(df)
        
        # Features: Month_Num, Monthly_Budget
        # Target: Total_Expense
        X = df[['Month_Num', 'Monthly_Budget']]
        y = df['Total_Expense']
        
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        
        self.is_trained = True
        self.save_model()
        print("Model trained and saved.")

    def save_model(self):
        joblib.dump(self.model, MODEL_PATH)

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.is_trained = True
        else:
            print("Model not found, training new one...")
            self.train()

    def predict_next_month(self, budget, current_month):
        if not self.is_trained:
            return 0.0
        
        # Predict for next month
        next_month = (current_month % 12) + 1
        
        # Simple prediction based on budget and next month seasonality
        prediction = self.model.predict([[next_month, budget]])[0]
        return prediction

    def get_insights(self, expenses):
        # Simple rule-based insights
        insights = []
        if not expenses:
            return ["Add more expenses to get AI insights."]
        
        total_spent = sum(e.amount for e in expenses)
        categories = {}
        for e in expenses:
            categories[e.category] = categories.get(e.category, 0) + e.amount
            
        # Check for high spending categories (>30%)
        for cat, amount in categories.items():
            if amount > total_spent * 0.3:
                insights.append(f"You are spending a lot on {cat} ({int((amount/total_spent)*100)}% of total).")
                
        return insights

    def detect_anomalies(self, expenses):
        if len(expenses) < 5:
            return []
            
        from sklearn.ensemble import IsolationForest
        import numpy as np
        
        data = np.array([e.amount for e in expenses]).reshape(-1, 1)
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(data)
        
        anomalies = []
        for i, pred in enumerate(preds):
            if pred == -1:
                anomalies.append(f"Unusual expense detected: {expenses[i].title} - ₹{expenses[i].amount}")
                
        return anomalies

ml_engine = MLEngine()
