from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# Configure upload folder and allowed file extensions
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Route for the intro page with login modal
@app.route('/')
def intro():
    # If logged in, redirect to the dashboard
    if session.get('logged_in'):
        return redirect(url_for('folor_dashboard'))
    return render_template('intro.html')

# Login route
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    if username == 'test' and password == 'test':
        session['logged_in'] = True
        flash('Login successful! Redirecting to the dashboard.', 'success')
        return redirect(url_for('folor_dashboard'))
    else:
        flash('Invalid credentials. Please try again.', 'error')
        return redirect(url_for('intro'))

# Dashboard route
@app.route('/folor_dashboard')
def folor_dashboard():
    if not session.get('logged_in'):
        flash("Please log in to view the dashboard.", 'error')
        return redirect(url_for('intro'))
    
    job_folders = []
    for folder_name in os.listdir(app.config['UPLOAD_FOLDER']):
        job_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
        trades = []
        bid_count = 0  # Initialize bid count
        if os.path.isdir(job_path):
            for trade_name in os.listdir(job_path):
                trade_path = os.path.join(job_path, trade_name)
                if os.path.isdir(trade_path):
                    bid_files = [f for f in os.listdir(trade_path) if f.endswith(('.pdf', '.doc', '.docx'))]
                    bid_count += len(bid_files)  # Count the bids for this trade
                    trades.append({
                        "trade": trade_name,
                        "files": bid_files
                    })
            job_folders.append({
                "job_id": folder_name.split('_')[0],  # Extract job ID from folder name
                "job_name": folder_name.split('_')[1], # Extract job name from folder name
                "address": folder_name.split('_')[2],  # Extract address from folder name
                "trades": trades,
                "bid_count": bid_count  # Include bid count
            })
    
    return render_template('Folor_Dashboard.html', job_folders=job_folders)

# Route for downloading files
@app.route('/download/<path:filepath>')
def download_file(filepath):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filepath, as_attachment=True)

# Route to handle form submission
@app.route('/submit_bid', methods=['POST'])
def submit_bid():
    subcontractor_name = request.form.get('subcontractorName')
    job_name = request.form.get('jobName')
    bid_number = request.form.get('bidNumber')
    address = request.form.get('address')
    trade = request.form.get('trade')
    file = request.files.get('fileUpload')

    if not all([subcontractor_name, job_name, bid_number, address, trade, file]):
        flash("All fields are required, including the file.")
        return redirect(url_for('subcontractor_form'))

    job_folder = os.path.join(app.config['UPLOAD_FOLDER'], f"{bid_number}_{job_name}_{address.replace(' ', '_')}", trade)
    os.makedirs(job_folder, exist_ok=True)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(job_folder, filename))

    with open(os.path.join(job_folder, "bid_summary.txt"), "w") as f:
        f.write(f"Subcontractor: {subcontractor_name}\n")
        f.write(f"Job Name: {job_name}\n")
        f.write(f"Bid Number: {bid_number}\n")
        f.write(f"Address: {address}\n")
        f.write(f"Trade: {trade}\n")
        f.write(f"Uploaded File: {filename}\n")

    flash("Thank you for your submission. Your bid has been successfully submitted!")
    return redirect(url_for('folor_dashboard'))

# Route for job details (specific job view)
@app.route('/job/<job_id>')
def job_detail(job_id):
    job_folders = [folder for folder in os.listdir(app.config['UPLOAD_FOLDER']) if folder.startswith(job_id)]
    if not job_folders:
        flash("Job not found", 'error')
        return redirect(url_for('folor_dashboard'))

    folder_name = job_folders[0]
    job_path = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
    trades = []
    for trade_name in os.listdir(job_path):
        trade_path = os.path.join(job_path, trade_name)
        if os.path.isdir(trade_path):
            files = [f for f in os.listdir(trade_path) if f.endswith(('.pdf', '.doc', '.docx'))]
            trades.append({
                "trade": trade_name,
                "files": files
            })

    return render_template('job_detail.html', job_id=job_id, job_name=folder_name.split('_')[1], address=folder_name.split('_')[2], trades=trades)

# Logout route
@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('intro'))

if __name__ == '__main__':
    app.run(debug=True)
