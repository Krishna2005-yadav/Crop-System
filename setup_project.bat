@echo off
echo ==========================================
echo   Vyron Smart Farming - Quick Setup
echo ==========================================

echo [1/3] Creating Python Virtual Environment...
python -m venv venv
call venv\Scripts\activate

echo [2/3] Installing Backend Dependencies...
pip install -r requirements.txt

echo [3/3] Installing Frontend Dependencies...
cd client
call npm install

echo ==========================================
echo   Setup Complete!
echo ==========================================
echo To run the project:
echo 1. Run 'python app.py' in the root folder.
echo 2. Run 'npm run dev' inside the 'client' folder.
pause
