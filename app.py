from flask import Flask, request, render_template, redirect, flash, session, jsonify
import numpy as np
import sqlite3
import pickle
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import datetime
import calendar

app = Flask(__name__)
app.secret_key = 'vyron_secret_key'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Load models
model = pickle.load(open('model.pkl', 'rb'))
mx = pickle.load(open('minmaxscaler.pkl', 'rb'))
sc = pickle.load(open('standscaler.pkl', 'rb'))

# Crop dictionary
crop_dict = {
    1: "Rice", 2: "Maize", 3: "Chickpea", 4: "Kidneybeans", 5: "Pigeonpeas",
    6: "Mothbeans", 7: "Mungbean", 8: "Blackgram", 9: "Lentil",
    10: "Pomegranate", 11: "Banana", 12: "Mango", 13: "Grapes", 14: "Watermelon",
    15: "Muskmelon", 16: "Apple", 17: "Orange", 18: "Papaya", 19: "Coconut",
    20: "Cotton", 21: "Jute", 22: "Coffee"
}


# USER AUTH SYSTEM

def init_db():
    with sqlite3.connect('database.db') as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            banned_until TEXT,
            ban_reason TEXT,
            profile_picture TEXT,
            is_admin BOOLEAN DEFAULT 0
        )''')
        # Log of crop recommendations
        conn.execute('''CREATE TABLE IF NOT EXISTS recommendation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            crop TEXT,
            nitrogen REAL,
            phosphorus REAL,
            potassium REAL,
            temperature REAL,
            ph REAL,
            created_at TEXT DEFAULT (datetime('now'))
        )''')
        # Detection logs for storing plant disease detection results
        conn.execute('''CREATE TABLE IF NOT EXISTS detection_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plant_name TEXT,
            disease TEXT,
            confidence REAL,
            image_url TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )''')
        
        # Add ban columns if they don't exist (for existing databases)
        try:
            conn.execute('ALTER TABLE users ADD COLUMN banned_until TEXT')
        except:
            pass 
        try:
            conn.execute('ALTER TABLE users ADD COLUMN ban_reason TEXT')
        except:
            pass  
        try:
            conn.execute('ALTER TABLE users ADD COLUMN profile_picture TEXT')
        except:
            pass
        try:
            conn.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0')
            # Set user ID 2 as admin default
            conn.execute('UPDATE users SET is_admin = 1 WHERE id = 2')
        except:
            pass  

init_db()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized', 'authenticated': False}), 401
            flash('Please log in to access this page.', 'danger')
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized', 'authenticated': False}), 401
            flash('Please log in to access this page.', 'danger')
            return redirect('/login')
        
        # Check if user is admin
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT is_admin FROM users WHERE id = ?", (session['user_id'],)).fetchone()
            if not user or not user[0]:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Admin privileges required'}), 403
                flash('Access denied. Admin privileges required.', 'danger')
                return redirect('/')

        return f(*args, **kwargs)
    return decorated_function

# Cache control decorator
def no_cache(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        rv = f(*args, **kwargs)
        response = app.make_response(rv)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    return decorated_function

@app.route('/')
@no_cache
def home():
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    return render_template("home.html", user=user)

@app.route('/index')
@no_cache
def index():
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    # allow result passed via query string after redirect
    result = request.args.get('result')
    return render_template("index.html", user=user, result=result)

@app.route('/dashboard')
@login_required
@no_cache
def dashboard():
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT id, email, username, profile_picture FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    return render_template("dashboard.html", user=user)

@app.route('/signup', methods=['GET', 'POST'])
@no_cache
def signup():
    # If already logged in, avoid showing signup
    if request.method == 'GET' and 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        email = request.form['email']
        username = request.form['username']
        password = generate_password_hash(request.form['password'])

        try:
            with sqlite3.connect('database.db') as conn:
                conn.execute("INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
                         (email, username, password))
            flash("Signup successful. Please log in.", "success")
            return redirect('/login')
        except sqlite3.IntegrityError:
            flash("Email or username already exists.", "danger")
            return redirect('/signup')

    return render_template("signup.html")

@app.route('/login', methods=['GET', 'POST'])
@no_cache
def login():
    # If user is already authenticated and tries to access login page (e.g., via back button),
    # redirect them to home page to avoid showing login again.
    if request.method == 'GET' and 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user and check_password_hash(user[3], password):
            # Check if user is banned
            if user[4]:  # banned_until column
                if user[4] == '9999-12-31':
                    flash("Your account has been permanently banned.", "danger")
                    return redirect('/login')
                else:
                    # Check if temporary ban is still active
                    with sqlite3.connect('database.db') as conn:
                        ban_check = conn.execute("""
                            SELECT CASE 
                                WHEN banned_until > datetime('now') THEN 1 
                                ELSE 0 
                            END as still_banned 
                            FROM users WHERE id = ?
                        """, (user[0],)).fetchone()
                        
                        if ban_check and ban_check[0]:
                            flash(f"Your account is temporarily banned until {user[4]}. Reason: {user[5] or 'No reason provided'}", "danger")
                            return redirect('/login')
                        else:
                            # Ban has expired, clear it
                            conn.execute("UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?", (user[0],))
            
            # Store user info in session
            session.permanent = True
            session['user_id'] = user[0]
            session['email'] = user[1]
            session['username'] = user[2]
            flash("Login successful!", "success")
            return redirect('/dashboard')
        else:
            flash("Invalid credentials", "danger")
            return redirect('/login')

    return render_template("login.html")

@app.route('/logout')
def logout():
    # Clear session
    session.clear()
    flash("Logged out successfully.", "info")
    
    # Create response with cache control headers
    response = redirect('/login')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/profile')
@login_required
@no_cache
def profile():
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT id, email, username, profile_picture FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    return render_template("profile.html", user=user)

@app.route('/update-username', methods=['POST'])
@login_required
def update_username():
    """Update user's username"""
    if 'user_id' not in session:
        return redirect('/login')
    
    new_username = request.form.get('new_username', '').strip()
    password = request.form.get('password', '')
    
    if not new_username or not password:
        flash('Please provide both new username and password.', 'warning')
        return redirect('/profile')
    
    with sqlite3.connect('database.db') as conn:
        # Verify password first
        user = conn.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if not user or not check_password_hash(user[3], password):
            flash('Incorrect password.', 'danger')
            return redirect('/profile')
        
        # Check if username already exists
        existing_user = conn.execute("SELECT id FROM users WHERE username = ? AND id != ?", (new_username, session['user_id'])).fetchone()
        if existing_user:
            flash('Username already exists. Please choose another one.', 'danger')
            return redirect('/profile')
        
        # Update username
        conn.execute("UPDATE users SET username = ? WHERE id = ?", (new_username, session['user_id']))
        session['username'] = new_username
        flash('Username updated successfully!', 'success')
    
    return redirect('/profile')

@app.route('/update-password', methods=['POST'])
@login_required
def update_password():
    """Update user's password"""
    if 'user_id' not in session:
        return redirect('/login')
    
    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    if not current_password or not new_password or not confirm_password:
        flash('Please fill in all password fields.', 'warning')
        return redirect('/profile')
    
    if new_password != confirm_password:
        flash('New passwords do not match.', 'danger')
        return redirect('/profile')
    
    if len(new_password) < 6:
        flash('New password must be at least 6 characters long.', 'warning')
        return redirect('/profile')
    
    with sqlite3.connect('database.db') as conn:
        # Verify current password
        user = conn.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if not user or not check_password_hash(user[3], current_password):
            flash('Current password is incorrect.', 'danger')
            return redirect('/profile')
        
        # Update password
        new_password_hash = generate_password_hash(new_password)
        conn.execute("UPDATE users SET password = ? WHERE id = ?", (new_password_hash, session['user_id']))
        flash('Password updated successfully!', 'success')
    
    return redirect('/profile')

@app.route('/upload-profile-picture', methods=['POST'])
@login_required
def upload_profile_picture():
    """Upload or update user's profile picture"""
    if 'user_id' not in session:
        return redirect('/login')
    
    if 'profile_picture' not in request.files:
        flash('No file selected.', 'warning')
        return redirect('/profile')
    
    file = request.files['profile_picture']
    if file.filename == '':
        flash('No file selected.', 'warning')
        return redirect('/profile')
    
    # Check file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not file.filename.lower().rsplit('.', 1)[1] in allowed_extensions:
        flash('Only PNG, JPG, JPEG, and GIF files are allowed.', 'danger')
        return redirect('/profile')
    
    # Check file size (max 5MB)
    if len(file.read()) > 5 * 1024 * 1024:
        flash('File size must be less than 5MB.', 'danger')
        return redirect('/profile')
    
    # Reset file pointer
    file.seek(0)
    
    # Generate unique filename
    import os
    import uuid
    filename = f"profile_{session['user_id']}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
    
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)
    
    # Update database with relative path
    relative_path = f"uploads/{filename}"
    
    with sqlite3.connect('database.db') as conn:
        # Delete old profile picture if exists
        old_picture = conn.execute("SELECT profile_picture FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if old_picture and old_picture[0]:
            old_file_path = os.path.join(os.path.dirname(__file__), 'static', old_picture[0])
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Update with new picture
        conn.execute("UPDATE users SET profile_picture = ? WHERE id = ?", (relative_path, session['user_id']))
    
    flash('Profile picture updated successfully!', 'success')
    return redirect('/profile')

@app.route('/delete-profile-picture', methods=['POST'])
@login_required
def delete_profile_picture():
    """Delete user's profile picture"""
    if 'user_id' not in session:
        return redirect('/login')
    
    with sqlite3.connect('database.db') as conn:
        # Get current profile picture
        user = conn.execute("SELECT profile_picture FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if user and user[0]:
            # Delete file from filesystem
            import os
            file_path = os.path.join(os.path.dirname(__file__), 'static', user[0])
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Remove from database
            conn.execute("UPDATE users SET profile_picture = NULL WHERE id = ?", (session['user_id'],))
            flash('Profile picture deleted successfully!', 'success')
        else:
            flash('No profile picture to delete.', 'info')
    
    return redirect('/profile')

@app.route('/delete-account', methods=['POST'])
def delete_account():
    if 'user_id' not in session:
        flash("Please log in to delete your account.", "warning")
        return redirect('/profile')
    
    password = request.form['password']
    with sqlite3.connect('database.db') as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if user and check_password_hash(user[3], password):
            conn.execute("DELETE FROM users WHERE id = ?", (session['user_id'],))
            session.clear()
            flash("Account deleted successfully.", "success")
            
            # Create response with cache control headers
            response = redirect('/signup')
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            return response
        else:
            flash("Incorrect password. Account not deleted.", "danger")
            return redirect('/profile')

@app.route('/forgot')
def forgot():
    return render_template("forgot.html")

@app.route('/reset', methods=['GET', 'POST'])
def reset():
    if request.method == 'POST':
        email = request.form['email']
        new_password = request.form['new_password']
        confirm_password = request.form.get('confirm_password', '') 

        if new_password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect('/reset')

        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

            if not user:
                flash("Email not found.", "danger")
                return redirect('/reset')

            conn.execute("UPDATE users SET password = ? WHERE email = ?",
                     (generate_password_hash(new_password), email))
            flash("Password reset successful.", "success")
            return redirect('/login')

    return render_template("reset.html")

@app.route('/chatbot')
@login_required
@no_cache
def chatbot():
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    return render_template("chatbot.html", user=user)

@app.route('/check-auth')
def check_auth():
    """Check if user is authenticated - used for back button prevention"""
    if 'user_id' in session:
        return {'authenticated': True}
    return {'authenticated': False}

# API AUTH ROUTES
# ----------------

@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    
    if not email or not username or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)

    try:
        with sqlite3.connect('database.db') as conn:
            conn.execute("INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
                     (email, username, hashed_password))
        return jsonify({'success': True, 'message': 'Signup successful'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email or username already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    try:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user and check_password_hash(user[3], password):
            # Check if user is banned
            if user[4]:  # banned_until column
                if user[4] == '9999-12-31':
                    return jsonify({'error': 'Your account has been permanently banned.'}), 403
                else:
                    # Check if temporary ban is still active
                    with sqlite3.connect('database.db') as conn:
                        ban_check = conn.execute("""
                            SELECT CASE 
                                WHEN banned_until > datetime('now') THEN 1 
                                ELSE 0 
                            END as still_banned 
                            FROM users WHERE id = ?
                        """, (user[0],)).fetchone()
                        
                        if ban_check and ban_check[0]:
                            return jsonify({'error': f"Your account is temporarily banned until {user[4]}. Reason: {user[5] or 'No reason provided'}"}), 403
                        else:
                            # Ban has expired, clear it
                            conn.execute("UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?", (user[0],))
            
            # Store user info in session
            session.permanent = True
            session['user_id'] = user[0]
            session['email'] = user[1]
            session['username'] = user[2]
            
            # Check for profile picture
            profile_picture = None
            # Need to check if column exists in tuple (it was added via migration in init_db)
            if len(user) > 6:
                profile_picture = user[6]
            
            return jsonify({
                'success': True, 
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'username': user[2],
                    'profile_picture': profile_picture,
                    'is_admin': bool(user[7]) if len(user) > 7 else False
                }
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})


# ADMIN ROUTES

@app.route('/admin')
@admin_required
@no_cache
def admin_panel():
    """Admin panel to manage users"""
    with sqlite3.connect('database.db') as conn:
        # Get all users with their details
        users = conn.execute("""
            SELECT id, email, username, password, 
                   CASE 
                       WHEN banned_until IS NULL THEN 'Active'
                       WHEN banned_until > datetime('now') THEN 'Temporarily Banned'
                       ELSE 'Permanently Banned'
                   END as status,
                   banned_until, ban_reason
            FROM users 
            ORDER BY id
        """).fetchall()
    return render_template("admin.html", users=users)

@app.route('/admin/ban-user', methods=['POST'])
@admin_required
def ban_user():
    """Ban a user temporarily or permanently"""
    user_id = request.form.get('user_id')
    ban_type = request.form.get('ban_type')  
    ban_duration = request.form.get('ban_duration')  
    ban_reason = request.form.get('ban_reason', 'No reason provided')
    
    with sqlite3.connect('database.db') as conn:
        if ban_type == 'temp':
            # Calculate ban until date
            ban_until = f"datetime('now', '+{ban_duration} days')"
            conn.execute("""
                UPDATE users 
                SET banned_until = ?, ban_reason = ? 
                WHERE id = ?
            """, (ban_until, ban_reason, user_id))
            flash(f'User temporarily banned for {ban_duration} days', 'warning')
        else:
            # Permanent ban
            conn.execute("""
                UPDATE users 
                SET banned_until = '9999-12-31', ban_reason = ? 
                WHERE id = ?
            """, (ban_reason, user_id))
            flash('User permanently banned', 'danger')
    
    return redirect('/admin')

@app.route('/admin/unban-user', methods=['POST'])
@admin_required
def unban_user():
    """Unban a user"""
    user_id = request.form.get('user_id')
    
    with sqlite3.connect('database.db') as conn:
        conn.execute("""
            UPDATE users 
            SET banned_until = NULL, ban_reason = NULL 
            WHERE id = ?
        """, (user_id,))
        flash('User unbanned successfully', 'success')
    
    return redirect('/admin')

@app.route('/admin/delete-user', methods=['POST'])
@admin_required
def admin_delete_user():
    """Delete a user account"""
    user_id = request.form.get('user_id')
    
    with sqlite3.connect('database.db') as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        flash('User account deleted successfully', 'success')
    
# CROP PREDICTION
# ----------------
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    # If accessed via GET, redirect to the form page
    if request.method == 'GET':
        return redirect('/index')
    
    try:
        N = float(request.form['Nitrogen'])
        P = float(request.form['Phosphorus'])  
        K = float(request.form['Potassium'])
        temp = float(request.form['Temperature'])
        ph = float(request.form['pH'])

        # Input validation for realistic agricultural ranges
        validation_errors = []
        
        # Nitrogen: typical range 0-300 kg/ha (most crops need 0-200)
        if N < 0 or N > 300:
            validation_errors.append("Nitrogen should be between 0-300 kg/ha")
        
        # Phosphorus: typical range 0-150 kg/ha (most crops need 5-100)
        if P < 0 or P > 150:
            validation_errors.append("Phosphorus should be between 0-150 kg/ha")
        
        # Potassium: typical range 0-300 kg/ha (most crops need 5-250)
        if K < 0 or K > 300:
            validation_errors.append("Potassium should be between 0-300 kg/ha")
        
        # Temperature: realistic range for crop growth -10°C to 50°C
        if temp < -10 or temp > 50:
            validation_errors.append("Temperature should be between -10°C to 50°C")
        
        # pH: soil pH range 3.5 to 9.5 (most crops prefer 6.0-7.5)
        if ph < 3.5 or ph > 9.5:
            validation_errors.append("pH should be between 3.5-9.5")

        # If validation errors exist, return them to the user
        if validation_errors:
            user_ctx = None
            if 'user_id' in session:
                with sqlite3.connect('database.db') as conn:
                    user_ctx = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
            
            # Create error message with all validation issues
            error_msg = "Invalid input values detected:<br><br>"
            for i, error in enumerate(validation_errors, 1):
                error_msg += f"{i}. {error}<br>"
            error_msg += "<br>Please enter realistic agricultural values for accurate crop recommendations."
            
            return render_template("index.html", validation_errors=validation_errors, user=user_ctx)

        feature = np.array([N, P, K, temp, ph]).reshape(1, -1)
        mx_feature = mx.transform(feature)
        sc_feature = sc.transform(mx_feature)

        prediction = model.predict(sc_feature)[0]
        crop = crop_dict.get(prediction, "Unknown")

        # Log the recommendation event
        try:
            with sqlite3.connect('database.db') as conn:
                conn.execute(
                    """
                    INSERT INTO recommendation_logs (user_id, crop, nitrogen, phosphorus, potassium, temperature, ph)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session.get('user_id'),
                        crop,
                        N, P, K, temp, ph
                    ),
                )
        except Exception as log_err:
            # Do not fail the user flow if logging has issues
            print(f"Recommendation log insert failed: {log_err}")

        # Fetch user for navbar/auth-sensitive template logic
        user_ctx = None
        if 'user_id' in session:
            with sqlite3.connect('database.db') as conn:
                user_ctx = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()

        result = f"{crop} is the best crop to be cultivated right there."
        # Render directly instead of redirect to avoid potential issues
        return render_template("index.html", result=result, user=user_ctx)

    except Exception as e:
        # Fetch user for navbar/auth-sensitive template logic even on error
        user_ctx = None
        if 'user_id' in session:
            with sqlite3.connect('database.db') as conn:
                user_ctx = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        return render_template("index.html", result=f"Error: {str(e)}", user=user_ctx)


# PLANT DISEASE PREDICTION

import tensorflow as tf
import numpy as np
import os
from PIL import Image
import io

# Load the plant disease model
def load_disease_model():
    try:
        print("Attempting to load disease model...")
        
        
        try:
            model = tf.keras.models.load_model("trained_plant_disease_model.keras")
            print("Successfully loaded .keras model")
            return model
        except:
            print("Failed to load .keras model, trying .h5 version...")
            try:
                model = tf.keras.models.load_model("plant_disease_model.h5")
                print("Successfully loaded .h5 model")
                return model
            except Exception as e:
                print(f"Failed to load .h5 model: {e}")
        
        print("No model files found or all failed to load")
        return None
        
    except Exception as e:
        print(f"Error in load_disease_model: {e}")
        return None

# Class names for plant diseases
DISEASE_CLASSES = [
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy'
]

# Detailed disease information
DISEASE_DETAILS = {
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
        'plant': 'Corn (Maize)',
        'status': 'Diseased Leaf',
        'name': 'Gray Leaf Spot',
        'symptoms': 'Small, rectangular brown to gray lesions on leaves. Lesions run parallel to leaf veins.',
        'treatment': 'Use resistant hybrids. Rotate with non-host crops. Apply fungicides if disease pressure is high.'
    },
    'Corn_(maize)___Common_rust_': {
        'plant': 'Corn (Maize)',
        'status': 'Diseased Leaf',
        'name': 'Common Rust',
        'symptoms': 'Reddish-brown pustules on leaves and stems. Pustules rupture the leaf epidermis.',
        'treatment': 'Plant resistant varieties. Apply fungicide early if infection is severe. Avoid overhead watering.'
    },
    'Corn_(maize)___Northern_Leaf_Blight': {
        'plant': 'Corn (Maize)',
        'status': 'Diseased Leaf',
        'name': 'Northern Leaf Blight',
        'symptoms': 'Long, cigar-shaped grayish-green to tan lesions. Lesions may coalesce and kill entire leaves.',
        'treatment': 'Plant resistant hybrids. Manage crop residue. Apply fungicides during critical growth stages.'
    },
    'Corn_(maize)___healthy': {
        'plant': 'Corn (Maize)',
        'status': 'Healthy Leaf',
        'name': 'Healthy',
        'symptoms': 'No disease symptoms observed. Leaves are vibrant green and intact.',
        'treatment': 'Continue good agricultural practices. Monitor for future threats.'
    },
    'Potato___Early_blight': {
        'plant': 'Potato',
        'status': 'Diseased Leaf',
        'name': 'Early Blight',
        'symptoms': 'Dark brown spots with concentric rings (target spots) on older leaves. Leaves may yellow and die.',
        'treatment': 'Apply fungicides (chlorothalonil, mancozeb). Improve air circulation. Rotate crops.'
    },
    'Potato___Late_blight': {
        'plant': 'Potato',
        'status': 'Diseased Leaf',
        'name': 'Late Blight',
        'symptoms': 'Water-soaked lesions that turn brown/black. White fungal growth on leaf undersides in humid weather.',
        'treatment': 'Destroy infected plants immediately. Apply fungicides (metalaxyl, mefenoxam). Avoid wet foliage.'
    },
    'Potato___healthy': {
        'plant': 'Potato',
        'status': 'Healthy Leaf',
        'name': 'Healthy',
        'symptoms': 'No disease symptoms observed. Plant appears vigorous.',
        'treatment': 'Maintain regular watering and fertilization schedule.'
    }
}

@app.route('/test', methods=['GET'])
def test_endpoint():
    return {'success': True, 'message': 'Flask server is working!'}

@app.route('/test-model', methods=['GET'])
def test_model_loading():
    try:
        print("Testing model loading...")
        model = load_disease_model()
        if model is not None:
            return {'success': True, 'message': 'Model loaded successfully', 'model_summary': str(model.summary())}
        else:
            return {'success': False, 'message': 'Failed to load model'}
    except Exception as e:
        return {'success': False, 'message': f'Error testing model: {str(e)}'}

@app.route('/test-upload', methods=['POST'])
def test_image_upload():
    try:
        print("Testing image upload...")
        if 'image' not in request.files:
            return {'success': False, 'error': 'No image file provided'}
        
        file = request.files['image']
        if file.filename == '':
            return {'success': False, 'error': 'No image file selected'}
        
        
        return {
            'success': True,
            'filename': file.filename,
            'content_type': file.content_type,
            'file_size': len(file.read()),
            'message': 'Image upload test successful'
        }
        
    except Exception as e:
        print(f"Image upload test error: {e}")
        return {'success': False, 'error': f'Upload test failed: {str(e)}'}

@app.route('/predict-disease', methods=['POST'])
def predict_disease():
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return {'success': False, 'error': 'No image file provided'}
        
        file = request.files['image']
        if file.filename == '':
            return {'success': False, 'error': 'No image file selected'}
        
        # Load the disease model
        model = load_disease_model()
        if model is None:
            return {'success': False, 'error': 'Disease model not available'}
        
        # Debug: Check model input shape
        print(f"Model input shape: {model.input_shape}")
        print(f"Model output shape: {model.output_shape}")
        
        # Process the image using TensorFlow preprocessing
        print("Processing image with TensorFlow preprocessing...")
        
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        file.save(temp_path)
        
        # Use TensorFlow preprocessing (matching Streamlit app)
        image = tf.keras.preprocessing.image.load_img(temp_path, target_size=(128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])  # convert single image to batch
        
        print(f"Image array shape: {input_arr.shape}")
        print(f"Image array dtype: {input_arr.dtype}")
        print(f"Image array min/max: {input_arr.min()}/{input_arr.max()}")
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Make prediction
        print("Making prediction...")
        predictions = model.predict(input_arr)
        print(f"Raw predictions shape: {predictions.shape}")
        print(f"Raw predictions: {predictions}")
        
        # Debug: Check if predictions are all the same
        unique_predictions = np.unique(predictions)
        print(f"Unique prediction values: {unique_predictions}")
        print(f"Are all predictions identical? {len(unique_predictions) == 1}")
        
        predicted_class_index = np.argmax(predictions)
        confidence = float(np.max(predictions) * 100)
        
        # Get predicted class name
        predicted_class = DISEASE_CLASSES[predicted_class_index]
        
        # Confidence threshold validation
        MIN_CONFIDENCE_THRESHOLD = 60.0  # Minimum confidence for reliable prediction
        
        # Check if confidence is too low
        if confidence < MIN_CONFIDENCE_THRESHOLD:
            print(f"⚠️ Low confidence prediction: {confidence:.1f}% (threshold: {MIN_CONFIDENCE_THRESHOLD}%)")
            
            # Get top 3 predictions for analysis
            top_3_indices = np.argsort(predictions[0])[-3:][::-1]
            print("Top 3 predictions:")
            for i, idx in enumerate(top_3_indices):
                prob = predictions[0][idx] * 100
                print(f"  {i+1}. {DISEASE_CLASSES[idx]}: {prob:.1f}%")
        
        # Additional validation for potato diseases (common confusion)
        if 'Potato' in predicted_class:
            potato_early_idx = 4  # Potato___Early_blight
            potato_late_idx = 5   # Potato___Late_blight
            
            early_prob = predictions[0][potato_early_idx] * 100
            late_prob = predictions[0][potato_late_idx] * 100
            
            print(f"Potato disease analysis:")
            print(f"  Early blight: {early_prob:.1f}%")
            print(f"  Late blight: {late_prob:.1f}%")
            print(f"  Difference: {abs(early_prob - late_prob):.1f}%")
            
            # If the difference is small, flag as uncertain
            if abs(early_prob - late_prob) < 15.0:
                print(f"⚠️ Uncertain potato disease classification - small difference between early/late blight")
        
        # Debug: Print all prediction probabilities
        print(f"All prediction probabilities: {[float(p) for p in predictions[0]]}")
        print(f"Predicted class index: {int(predicted_class_index)}")
        print(f"Predicted class: {predicted_class}")
        print(f"Confidence: {float(confidence):.2f}%")
        
        # Debug: Check if this is always the same prediction
        print(f"Model file being used: {'trained_plant_disease_model.keras' if os.path.exists('trained_plant_disease_model.keras') else 'plant_disease_model.h5'}")
        
        # Get all class probabilities for debugging
        all_probabilities = {}
        for i, prob in enumerate(predictions[0]):
            all_probabilities[DISEASE_CLASSES[i]] = float(prob * 100)
        

        
        # Save the uploaded image (optional)
        upload_folder = 'static/uploads'
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # Generate unique filename
        import uuid
        filename = f"crop_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(upload_folder, filename)
        
        # Convert TensorFlow image to PIL for saving
        pil_image = tf.keras.preprocessing.image.array_to_img(input_arr[0])
        pil_image.save(filepath)
        
        return {
            'success': True,
            'prediction': predicted_class,
            'confidence': float(confidence),  
            'image_path': f'/static/uploads/{filename}',
            'all_probabilities': all_probabilities,
            'disease_details': DISEASE_DETAILS.get(predicted_class, {
                'plant': 'Unknown',
                'status': 'Unknown',
                'name': predicted_class.replace('_', ' '),
                'symptoms': 'No specific info available.',
                'treatment': 'Consult an expert.'
            }),
            'confidence_level': 'high' if confidence >= 80 else 'medium' if confidence >= 60 else 'low',
            'debug_info': {
                'predicted_index': int(predicted_class_index), 
                'all_predictions': [float(p) for p in predictions[0].tolist()]
            }
        }
        
    except Exception as e:
        print(f"Disease prediction error: {e}")
        return {'success': False, 'error': f'Prediction failed: {str(e)}'}

@app.route('/test-model-prediction', methods=['GET'])
def test_model_prediction():
    try:
        print("Testing model prediction with random input...")
        model = load_disease_model()
        if model is None:
            return {'success': False, 'message': 'Failed to load model'}
        
        # Test with random input
        test_input = np.random.random((1, 128, 128, 3))
        print(f"Test input shape: {test_input.shape}")
        print(f"Test input range: {test_input.min():.3f} to {test_input.max():.3f}")
        
        predictions = model.predict(test_input)
        print(f"Test predictions shape: {predictions.shape}")
        print(f"Test predictions: {predictions}")
        
        # Check if predictions vary
        unique_predictions = np.unique(predictions)
        print(f"Unique test prediction values: {unique_predictions}")
        print(f"Are test predictions identical? {len(unique_predictions) == 1}")
        
        predicted_class_index = np.argmax(predictions)
        confidence = float(np.max(predictions) * 100)
        predicted_class = DISEASE_CLASSES[predicted_class_index]
        
        return {
            'success': True,
            'message': 'Model prediction test completed',
            'test_predictions': predictions.tolist(),
            'predicted_class': predicted_class,
            'confidence': confidence,
            'unique_predictions': unique_predictions.tolist(),
            'predictions_vary': len(unique_predictions) > 1
        }
        
    except Exception as e:
        print(f"Model prediction test error: {e}")
        return {'success': False, 'error': f'Test failed: {str(e)}'}

# --------------------------
# PLANT AI DASHBOARD (separate page)
# --------------------------
@app.route('/plant-dashboard')
@login_required
@no_cache
def plant_dashboard():
    """Modern, responsive dashboard page for Plant Disease Detection & Crop Recommendation.
    This is a separate page and does not modify existing UIs.
    """
    # Fetch logged-in user (id, email, username, profile_picture)
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute(
                "SELECT id, email, username, profile_picture FROM users WHERE id = ?",
                (session['user_id'],)
            ).fetchone()

    # Build last 12 months keys and labels (e.g., '2025-01', label 'Jan')
    now = datetime.datetime.now()
    month_keys = []  # e.g., '2025-01'
    month_labels = []  # e.g., 'Jan'
    y, m = now.year, now.month
    for i in range(11, -1, -1):
        yy = y
        mm = m - i
        while mm <= 0:
            mm += 12
            yy -= 1
        month_keys.append(f"{yy:04d}-{mm:02d}")
        month_labels.append(calendar.month_abbr[mm])

    # Recommendation metrics from logs
    crop_recommendations = 0
    recs_by_month = {k: 0 for k in month_keys}
    with sqlite3.connect('database.db') as conn:
        # Total recommendations
        cur = conn.execute("SELECT COUNT(*) FROM recommendation_logs")
        row = cur.fetchone()
        crop_recommendations = row[0] if row and row[0] is not None else 0

        # Count per month for last 12 months
        cur = conn.execute(
            """
            SELECT strftime('%Y-%m', created_at) as ym, COUNT(*)
            FROM recommendation_logs
            GROUP BY ym
            """
        )
        for ym, cnt in cur.fetchall():
            if ym in recs_by_month:
                recs_by_month[ym] = cnt

    recs_per_month = [recs_by_month[k] for k in month_keys]

    # Rec growth = change between last month and previous month in percent
    last_month_cnt = recs_per_month[-1] if len(recs_per_month) >= 1 else 0
    prev_month_cnt = recs_per_month[-2] if len(recs_per_month) >= 2 else 0
    if prev_month_cnt == 0:
        rec_growth = 100 if last_month_cnt > 0 else 0
    else:
        rec_growth = int(round((last_month_cnt - prev_month_cnt) * 100 / prev_month_cnt))

    # Other KPIs remain placeholders for now; can be wired to real data later
    total_analyses = crop_recommendations  # treat as total processed recommendations for now
    healthy_crops = 0
    detected_diseases = 0
    analyses_growth = rec_growth
    healthy_growth = 0
    disease_change = 0

    # Chart placeholders for diseases until logs are added for detections
    diseases_per_month = [0 for _ in month_keys]
    
    # Recent detections table (sample data)
    recent_detections = [
        { 'plant_name': 'Corn',   'disease': 'Northern Leaf Blight', 'confidence': 92.4, 'date': '2025-09-28' },
        { 'plant_name': 'Potato', 'disease': 'Early Blight',          'confidence': 88.1, 'date': '2025-09-26' },
        { 'plant_name': 'Corn',   'disease': 'Common Rust',           'confidence': 81.6, 'date': '2025-09-24' },
        { 'plant_name': 'Corn',   'disease': 'Gray Leaf Spot',        'confidence': 84.9, 'date': '2025-09-18' },
    ]

    return render_template(
        'plant_dashboard.html',
        user=user,
        total_analyses=total_analyses,
        healthy_crops=healthy_crops,
        detected_diseases=detected_diseases,
        crop_recommendations=crop_recommendations,
        analyses_growth=analyses_growth,
        healthy_growth=healthy_growth,
        disease_change=disease_change,
        rec_growth=rec_growth,
        months=month_labels,
        diseases_per_month=diseases_per_month,
        recs_per_month=recs_per_month,
        recent_detections=recent_detections
    )


# --- API endpoints for frontend to store/retrieve data ---
@app.route('/api/detections', methods=['POST'])
def api_post_detection():
    """Accepts JSON: { plant_name, disease, confidence, image_url }
    Stores the detection for the logged-in user (if any) or user_id NULL.
    """
    data = request.get_json() or {}
    plant = data.get('plant_name')
    disease = data.get('disease')
    confidence = float(data.get('confidence') or 0)
    image_url = data.get('image_url')
    user_id = session.get('user_id')

    if not plant or disease is None:
        return { 'error': 'Missing fields' }, 400

    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO detection_logs (user_id, plant_name, disease, confidence, image_url) VALUES (?,?,?,?,?)",
                (user_id, plant, disease, confidence, image_url)
            )
            detection_id = cur.lastrowid
        return { 'success': True, 'detection_id': detection_id }
    except Exception as e:
        return { 'error': str(e) }, 500


@app.route('/api/detections', methods=['GET'])
def api_get_detections():
    """Returns detections for the logged-in user (or all if admin)."""
    user_id = session.get('user_id')
    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            if user_id == 2:  # admin: return all
                cur.execute("SELECT id, user_id, plant_name, disease, confidence, image_url, created_at FROM detection_logs ORDER BY created_at DESC")
            else:
                cur.execute("SELECT id, user_id, plant_name, disease, confidence, image_url, created_at FROM detection_logs WHERE user_id=? ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        results = [dict(id=r[0], user_id=r[1], plant_name=r[2], disease=r[3], confidence=r[4], image_url=r[5], created_at=r[6]) for r in rows]
        return { 'detections': results }
    except Exception as e:
        return { 'error': str(e) }, 500


@app.route('/api/detections/<int:detection_id>', methods=['DELETE'])
def api_delete_detection(detection_id):
    """Delete a specific detection log entry."""
    user_id = session.get('user_id')
    
    if not user_id:
        return { 'error': 'Authentication required' }, 401
    
    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            
            # Check if the detection exists and belongs to the user (or user is admin)
            if user_id == 2:  # admin can delete any detection
                cur.execute("SELECT id, image_url FROM detection_logs WHERE id = ?", (detection_id,))
            else:
                cur.execute("SELECT id, image_url FROM detection_logs WHERE id = ? AND user_id = ?", (detection_id, user_id))
            
            detection = cur.fetchone()
            
            if not detection:
                return { 'error': 'Detection not found or access denied' }, 404
            
            # Delete the associated image file if it exists
            if detection[1]:  # image_url exists
                import os
                image_path = os.path.join('static', detection[1].lstrip('/static/'))
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                        print(f"Deleted image file: {image_path}")
                    except Exception as e:
                        print(f"Warning: Could not delete image file {image_path}: {e}")
            
            # Delete the detection log entry
            cur.execute("DELETE FROM detection_logs WHERE id = ?", (detection_id,))
            
        return { 'success': True, 'message': 'Detection deleted successfully' }
    except Exception as e:
        return { 'error': str(e) }, 500


@app.route('/api/recommendations', methods=['GET'])
def api_get_recommendations():
    """Returns crop recommendations for the logged-in user (or all if admin)."""
    user_id = session.get('user_id')
    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            if user_id == 2:  # admin: return all
                cur.execute("SELECT id, user_id, crop, nitrogen, phosphorus, potassium, temperature, ph, created_at FROM recommendation_logs ORDER BY created_at DESC")
            else:
                cur.execute("SELECT id, user_id, crop, nitrogen, phosphorus, potassium, temperature, ph, created_at FROM recommendation_logs WHERE user_id=? ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        results = [dict(id=r[0], user_id=r[1], crop=r[2], nitrogen=r[3], phosphorus=r[4], potassium=r[5], temperature=r[6], ph=r[7], created_at=r[8]) for r in rows]
        return { 'recommendations': results }
    except Exception as e:
        return { 'error': str(e) }, 500

@app.route('/api/recommendation', methods=['POST'])
def api_post_recommendation():
    """Accepts JSON: { crop, nitrogen, phosphorus, potassium, temperature, ph }
    Stores recommendation event and returns the recommended crop (simple model used).
    """
    data = request.get_json() or {}
    N = float(data.get('nitrogen') or 0)
    P = float(data.get('phosphorus') or 0)
    K = float(data.get('potassium') or 0)
    T = float(data.get('temperature') or 0)
    ph = float(data.get('ph') or 7)
    user_id = session.get('user_id')

    # Simple rule-based recommendation (same logic as frontend but canonicalized)
    crop = 'Wheat'
    if N>120 and ph>6 and T>28:
        crop='Sugarcane'
    elif ph<5.5:
        crop='Rice'
    elif P>60:
        crop='Potato'

    try:
        with sqlite3.connect('database.db') as conn:
            conn.execute(
                "INSERT INTO recommendation_logs (user_id, crop, nitrogen, phosphorus, potassium, temperature, ph) VALUES (?,?,?,?,?,?,?)",
                (user_id, crop, N, P, K, T, ph)
            )
        return { 'recommended': crop }
    except Exception as e:
        return { 'error': str(e) }, 500


@app.route('/api/dashboard-data', methods=['GET'])
def api_dashboard_data():
    """Returns aggregated numbers and chart data for the current user (or admin sees all)."""
    user_id = session.get('user_id')
    now = datetime.datetime.now()
    month_keys = []
    for i in range(11, -1, -1):
        dt = now - datetime.timedelta(days=30*i)
        month_keys.append(dt.strftime('%Y-%m'))

    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            # KPIs
            if user_id == 2:
                cur.execute('SELECT COUNT(*) FROM detection_logs')
                total_detections = cur.fetchone()[0] or 0
                cur.execute('SELECT COUNT(*) FROM recommendation_logs')
                total_recs = cur.fetchone()[0] or 0
            else:
                cur.execute('SELECT COUNT(*) FROM detection_logs WHERE user_id=?', (user_id,))
                total_detections = cur.fetchone()[0] or 0
                cur.execute('SELECT COUNT(*) FROM recommendation_logs WHERE user_id=?', (user_id,))
                total_recs = cur.fetchone()[0] or 0

            # Disease distribution
            cur.execute('SELECT disease, COUNT(*) FROM detection_logs GROUP BY disease')
            dist = cur.fetchall()

            # Recommendations per month
            recs_by_month = []
            for mk in month_keys:
                like = mk + '%'
                if user_id == 2:
                    cur.execute("SELECT COUNT(*) FROM recommendation_logs WHERE strftime('%Y-%m', created_at)=?", (mk,))
                else:
                    cur.execute("SELECT COUNT(*) FROM recommendation_logs WHERE user_id=? AND strftime('%Y-%m', created_at)=?", (user_id, mk))
                recs_by_month.append(cur.fetchone()[0] or 0)

            # Recent 5 detections
            if user_id == 2:
                cur.execute("SELECT id, user_id, plant_name, disease, confidence, image_url, created_at FROM detection_logs ORDER BY created_at DESC LIMIT 5")
            else:
                cur.execute("SELECT id, user_id, plant_name, disease, confidence, image_url, created_at FROM detection_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 5", (user_id,))
            recent_rows = cur.fetchall()
            recent_detections = [dict(id=r[0], user_id=r[1], plant_name=r[2], disease=r[3], confidence=r[4], image_url=r[5], created_at=r[6]) for r in recent_rows]

        return {
            'total_detections': total_detections,
            'total_recs': total_recs,
            'disease_distribution': [{ 'disease': r[0], 'count': r[1] } for r in dist],
            'recs_by_month': recs_by_month,
            'months': month_keys,
            'recent_detections': recent_detections
        }
    except Exception as e:
        return { 'error': str(e) }, 500

# --- Auth & Profile Management APIs ---

@app.route('/api/auth/me', methods=['GET'])
@no_cache
def api_auth_me():
    """Returns the current logged-in user's information."""
    user_id = session.get('user_id')
    if not user_id:
        return {'authenticated': False}, 200
    
    try:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute(
                "SELECT id, email, username, profile_picture, is_admin FROM users WHERE id = ?",
                (user_id,)
            ).fetchone()
            
        if not user:
            return {'authenticated': False}, 200
            
        return {
            'authenticated': True,
            'user': {
                'id': user[0],
                'email': user[1],
                'username': user[2],
                'profile_picture': user[3],
                'is_admin': bool(user[4])
            }
        }
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/auth/profile', methods=['PUT'])
@login_required
def api_update_profile():
    """Updates the user's username and profile picture."""
    data = request.get_json() or {}
    username = data.get('username')
    profile_picture = data.get('profile_picture')
    user_id = session.get('user_id')
    
    if not username:
        return {'error': 'Username is required'}, 400
        
    try:
        with sqlite3.connect('database.db') as conn:
            # Check if username is taken by another user
            existing = conn.execute(
                "SELECT id FROM users WHERE username = ? AND id != ?",
                (username, user_id)
            ).fetchone()
            
            if existing:
                return {'error': 'Username already taken'}, 409
                
            conn.execute(
                "UPDATE users SET username = ?, profile_picture = ? WHERE id = ?",
                (username, profile_picture, user_id)
            )
        return {'success': True, 'message': 'Profile updated successfully'}
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/auth/update-profile-picture', methods=['POST'])
@login_required
def api_update_profile_picture():
    """API to upload/update user's profile picture"""
    user_id = session.get('user_id')
    
    if 'profile_picture' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'error': 'Only PNG, JPG, JPEG, and GIF files are allowed'}), 400
    
    # Check file size (max 5MB)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    
    if size > 5 * 1024 * 1024:
        return jsonify({'error': 'File size must be less than 5MB'}), 400
    
    try:
        # Generate unique filename
        import uuid
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Relative path for DB/Frontend
        relative_path = f"/static/uploads/{filename}"
        
        with sqlite3.connect('database.db') as conn:
            # Delete old profile picture if exists
            old_picture = conn.execute("SELECT profile_picture FROM users WHERE id = ?", (user_id,)).fetchone()
            if old_picture and old_picture[0] and old_picture[0].startswith('/static/uploads/'):
                 # clean up old file logic can be here, ensuring we don't delete default avatars if any
                 pass

            # Update with new picture
            conn.execute("UPDATE users SET profile_picture = ? WHERE id = ?", (relative_path, user_id))
            
        return jsonify({'success': True, 'profile_picture': relative_path, 'message': 'Profile picture updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/password', methods=['PUT'])
@login_required
def api_change_password():
    """Changes the user's password after verifying the current one."""
    data = request.get_json() or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    user_id = session.get('user_id')
    
    if not current_password or not new_password:
        return {'error': 'Current and new passwords are required'}, 400
        
    try:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute("SELECT password FROM users WHERE id = ?", (user_id,)).fetchone()
            
            if not user or not check_password_hash(user[0], current_password):
                return {'error': 'Incorrect current password'}, 401
                
            hashed_new_password = generate_password_hash(new_password)
            conn.execute("UPDATE users SET password = ? WHERE id = ?", (hashed_new_password, user_id))
            
        return {'success': True, 'message': 'Password changed successfully'}
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/auth/account', methods=['DELETE'])
@login_required
def api_delete_account():
    """Permanently deletes the user's account and all associated logs."""
    user_id = session.get('user_id')
    
    try:
        with sqlite3.connect('database.db') as conn:
            # Delete detection logs and their images first
            cur = conn.execute("SELECT image_url FROM detection_logs WHERE user_id = ?", (user_id,))
            for row in cur.fetchall():
                if row[0]:
                    image_path = os.path.join('static', row[0].lstrip('/static/'))
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                        except:
                            pass
            
            conn.execute("DELETE FROM detection_logs WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM recommendation_logs WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
        session.clear()
        return {'success': True, 'message': 'Account deleted successfully'}
    except Exception as e:
        return {'error': str(e)}, 500

# --- Admin APIs ---

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
@no_cache
def api_admin_stats():
    """Returns platform-wide statistics for the admin dashboard."""
    try:
        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            
            # Key Metrics
            total_users = cur.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            total_detections = cur.execute("SELECT COUNT(*) FROM detection_logs").fetchone()[0]
            total_recommendations = cur.execute("SELECT COUNT(*) FROM recommendation_logs").fetchone()[0]
            
            # Disease Distribution (Most/Least Predicted)
            cur.execute("SELECT disease, COUNT(*) as c FROM detection_logs GROUP BY disease ORDER BY c DESC")
            disease_stats = [{'name': row[0], 'count': row[1]} for row in cur.fetchall()]
            
            # Crop Recommendation Distribution
            cur.execute("SELECT crop, COUNT(*) as c FROM recommendation_logs GROUP BY crop ORDER BY c DESC")
            crop_stats = [{'name': row[0], 'count': row[1]} for row in cur.fetchall()]
            
            # Monthly Activity (Last 6 months)
            month_stats = []
            now = datetime.datetime.now()
            for i in range(5, -1, -1):
                dt = now - datetime.timedelta(days=30*i)
                month_str = dt.strftime('%Y-%m')
                det_count = cur.execute("SELECT COUNT(*) FROM detection_logs WHERE strftime('%Y-%m', created_at) = ?", (month_str,)).fetchone()[0]
                rec_count = cur.execute("SELECT COUNT(*) FROM recommendation_logs WHERE strftime('%Y-%m', created_at) = ?", (month_str,)).fetchone()[0]
                month_stats.append({
                    'month': dt.strftime('%b'),
                    'detections': det_count,
                    'recommendations': rec_count
                })

        return {
            'total_users': total_users,
            'total_detections': total_detections,
            'total_recommendations': total_recommendations,
            'disease_stats': disease_stats,
            'crop_stats': crop_stats,
            'activity_stats': month_stats
        }
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/admin/users', methods=['GET'])
@admin_required
@no_cache
def api_admin_users():
    """Returns a list of all users with activity summaries."""
    try:
        with sqlite3.connect('database.db') as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    u.id, u.username, u.email, u.is_admin, u.banned_until, u.ban_reason,
                    (SELECT COUNT(*) FROM detection_logs WHERE user_id = u.id) as detection_count,
                    (SELECT COUNT(*) FROM recommendation_logs WHERE user_id = u.id) as recommendation_count
                FROM users u
                ORDER BY u.id DESC
            """
            users = [dict(row) for row in cursor.execute(query).fetchall()]
            
        return {'users': users}
    except Exception as e:
        print(f"Error fetching users: {e}")
        return {'error': str(e)}, 500

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def api_admin_update_user_status(user_id):
    """Updates user ban status."""
    data = request.get_json() or {}
    action = data.get('action') # 'ban', 'unban', 'permanent_ban'
    reason = data.get('reason', '')
    
    if not action:
        return {'error': 'Action is required'}, 400
        
    try:
        with sqlite3.connect('database.db') as conn:
            if action == 'unban':
                conn.execute("UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?", (user_id,))
            elif action == 'ban':
                # varying ban duration could be passed, defaulting to 7 days for now if simplistic
                # Or parsing duration from request. strict requirement says "temp ban"
                duration_days = data.get('duration_days', 7)
                banned_until = (datetime.datetime.now() + datetime.timedelta(days=duration_days)).isoformat()
                conn.execute("UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?", (banned_until, reason, user_id))
            elif action == 'permanent_ban':
                 # Using a far future date for permanent ban
                banned_until = (datetime.datetime.now() + datetime.timedelta(days=36500)).isoformat()
                conn.execute("UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?", (banned_until, reason, user_id))
            else:
                return {'error': 'Invalid action'}, 400
                
        return {'success': True}
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_user(user_id):
    """Admin deletes a user account."""
    if user_id == session.get('user_id'):
        return {'error': 'Cannot self-delete via this endpoint'}, 400
        
    try:
        with sqlite3.connect('database.db') as conn:
             # Delete detection logs and their images first
            cur = conn.execute("SELECT image_url FROM detection_logs WHERE user_id = ?", (user_id,))
            for row in cur.fetchall():
                if row[0]:
                    image_path = os.path.join('static', row[0].lstrip('/static/'))
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                        except:
                            pass
            
            conn.execute("DELETE FROM detection_logs WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM recommendation_logs WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
        return {'success': True}
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/dashboard_complete')
@login_required
@no_cache
def dashboard_complete():
    """Route for dashboard_complete.html template"""
    # Fetch logged-in user (id, email, username, profile_picture)
    user = None
    if 'user_id' in session:
        with sqlite3.connect('database.db') as conn:
            user = conn.execute(
                "SELECT id, email, username, profile_picture FROM users WHERE id = ?",
                (session['user_id'],)
            ).fetchone()

    return render_template('dashboard_complete.html', user=user)

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
