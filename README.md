# Vyron Smart Farming Assistant 🌾

An agricultural platform designed to help farmers grow smarter. This project integrates a Flask backend with a React (Vite + Tailwind CSS) frontend to provide real-time crop disease detection and data-driven crop recommendations.

## 🚀 Features

- **Disease Detection**: Instantly identify crop diseases (e.g., Corn Common Rust, Potato Blight) using deep learning models.
- **Crop Recommendation**: Get personalized suggestions for the best crops to plant based on soil NPK values, pH, and climate data.
- **Admin Dashboard**: Manage users, monitor platform usage statistics, and handle account moderation.
- **User Dashboard**: Track your personal history of detections and recommendations.
- **Modern UI/UX**: Premium dark/light mode support with smooth transitions and responsive design.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

---

## 🏁 Quick Start (Setup & Run)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd FinalYear
```

### 2. Backend Setup (Flask)
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python app.py
```
*The backend will run on `http://127.0.0.1:5000`.*

### 3. Frontend Setup (React)
Open a **new terminal** and navigate to the `client` directory:
```bash
cd client

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## 📁 Project Structure

- `app.py`: Main Flask application handling API routes and model inference.
- `database.db`: SQLite database for user accounts and history.
- `model.pkl`: Pre-trained model for crop recommendations.
- `trained_plant_disease_model.keras`: Deep learning model for disease detection.
- `client/`: React frontend source code.
- `static/uploads/`: Directory where user profile and crop images are stored.

---

## 🛡️ Admin Access
The first user registered or specific users marked as `is_admin = 1` in the database can access the `/admin` panel to view platform-wide analytics.

---

## 📝 License
This project is for educational purposes as part of the Final Year project.
