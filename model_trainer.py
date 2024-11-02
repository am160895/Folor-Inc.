import os
import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

# Paths
DATA_FILE = 'data/submission_data.csv'  # Sample data location
MODEL_FILE = 'models/recommendation_model.pkl'  # Where to save the model

def load_data():
    """Load and preprocess the submission data."""
    # Check if data file exists
    if not os.path.exists(DATA_FILE):
        print("Data file not found. Ensure submission data exists in", DATA_FILE)
        return None
    
    # Load data into a DataFrame
    data = pd.read_csv(DATA_FILE)
    print("Data loaded successfully.")
    return data

def train_recommendation_model(data):
    """
    Train a simple content-based recommendation model using TF-IDF and cosine similarity.
    This model is designed to suggest trades based on text description similarity.
    """
    # Check if required column exists
    if 'trade_description' not in data.columns:
        print("Missing 'trade_description' column in data. Ensure data has this column.")
        return None
    
    # Vectorize the text descriptions
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(data['trade_description'])
    
    # Calculate cosine similarity matrix
    similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
    print("Model training complete.")
    return similarity_matrix

def save_model(model):
    """Save the trained model to a file."""
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(model, f)
    print(f"Model saved to {MODEL_FILE}")

def retrain_model():
    """Load data, train model, and save it to file."""
    print(f"Starting model retraining at {datetime.now()}")
    
    # Step 1: Load data
    data = load_data()
    if data is None:
        return
    
    # Step 2: Train recommendation model
    model = train_recommendation_model(data)
    if model is None:
        return
    
    # Step 3: Save model to file
    save_model(model)
    print("Retraining complete.")

if __name__ == '__main__':
    retrain_model()

import pickle
from flask import Flask

app = Flask(__name__)

# Load model at startup
with open('models/recommendation_model.pkl', 'rb') as f:
    recommendation_model = pickle.load(f)

@app.route('/recommend_trade', methods=['POST'])
def recommend_trade():
    # Implement recommendation logic using `recommendation_model`
    pass
