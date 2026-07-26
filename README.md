<div align="center">

# 🛡️ KSP Crime Intelligence Nexus

### AI-Powered Crime Analytics & Prediction Platform

Analyze crime trends, visualize hotspots, and predict crime categories using Machine Learning.

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![Machine Learning](https://img.shields.io/badge/Machine-Learning-orange?style=for-the-badge)

</div>

---

# 📖 Overview

**KSP Crime Intelligence Nexus** is a full-stack Machine Learning application that helps analyze crime data through interactive visualizations and predictive analytics.

The platform enables users to:

- Analyze crime trends
- Predict crime categories using Machine Learning
- Visualize crime statistics
- Explore hotspot information through an interactive dashboard

The project combines a modern React frontend with a FastAPI backend to deliver a fast and intuitive user experience.

---

# ✨ Features

## 📊 Crime Analytics Dashboard

- Interactive dashboard
- Crime trend visualization
- Crime distribution charts
- Tactical intelligence interface

---

## 🤖 Crime Prediction

- Machine Learning-based prediction
- FastAPI prediction API
- Instant prediction results
- User-friendly prediction interface

---

## 📈 Data Visualization

- Interactive charts
- Pie charts
- Crime trend analysis
- Statistical insights

---

## 🗺️ Hotspot Visualization

- Karnataka crime map
- Regional crime insights
- Visual hotspot representation

---

## 💻 Modern Frontend

- Responsive UI
- React + Vite
- Clean navigation
- Fast page rendering

---

# 🏗️ System Architecture

```text
                               +----------------------+
                               |      User            |
                               +----------+-----------+
                                          |
                                          |
                              Web Browser (Chrome/Edge)
                                          |
                                          |
                               http://localhost:5173
                                          |
                                          ▼
                    ┌────────────────────────────────────┐
                    │         React + Vite Frontend      │
                    │────────────────────────────────────│
                    │ • Landing Dashboard                │
                    │ • Crime Prediction                 │
                    │ • Analytics Dashboard              │
                    │ • Hotspots Visualization           │
                    │ • Interactive Charts               │
                    └───────────────┬────────────────────┘
                                    │
                          HTTP REST API Requests
                                    │
                                    ▼
                    ┌────────────────────────────────────┐
                    │         FastAPI Backend            │
                    │────────────────────────────────────│
                    │ • Prediction API                  │
                    │ • Input Validation                │
                    │ • Model Inference                 │
                    │ • JSON Response                   │
                    └───────────────┬────────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────────┐
                    │      Machine Learning Model        │
                    │────────────────────────────────────│
                    │ • Trained Classification Model    │
                    │ • Feature Processing              │
                    │ • Crime Prediction                │
                    └───────────────┬────────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────────┐
                    │     Crime Prediction Result        │
                    │────────────────────────────────────│
                    │ • Predicted Crime Category         │
                    │ • Returned to Frontend            │
                    └────────────────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Chart.js

---

## Backend

- Python
- FastAPI

---

## Machine Learning

- Scikit-learn
- Pandas
- NumPy

---

# 📂 Project Structure

```text
KSP-Crime-Intelligence-Nexus
│
├── backend/
│   ├── predict_api.py
│   ├── train_model.py
│   ├── requirements.txt
│   ├── models/
│   └── reports/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── src/
│
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/AllenGayle05/ksp-crime-intelligence-nexus.git

cd ksp-crime-intelligence-nexus
```

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

python predict_api.py
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

Open another terminal.

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 🔄 Application Workflow

```text
             Crime Dataset
                   │
                   ▼
        Data Cleaning & Processing
                   │
                   ▼
        Machine Learning Model
                   │
                   ▼
           FastAPI Backend API
                   │
            HTTP REST Requests
                   │
                   ▼
          React + Vite Frontend
                   │
                   ▼
      Prediction & Analytics Output
```

# 📌 Future Enhancements

- Enhanced crime trend analysis
- Improved prediction accuracy
- Additional dashboard visualizations
- Expanded regional crime insights
- Performance optimization

---

# 👨‍💻 Author

**Allen Gayle**

Final Year B.Tech – Artificial Intelligence & Data Science

GitHub:
https://github.com/AllenGayle05

---

# ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub.
