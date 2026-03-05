"""
Performance Dashboard Backend API
Flask application serving REST endpoints for performance analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from parsers.jtl_parser import JTLParser
from analyzers.metrics_calculator import MetricsCalculator

app = Flask(__name__)
CORS(app)  # Enable CORS for Electron frontend

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'performance-dashboard-backend',
        'version': '0.1.0'
    })


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload and parse performance test result file
    Supports: JTL (JMeter), JSON (K6), LOG (Gatling)
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # Validate file extension
    allowed_extensions = {'.jtl', '.csv', '.log', '.json'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return jsonify({
            'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
        }), 400
    
    try:
        # Save file to upload folder
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Get file size for confirmation
        file_size = os.path.getsize(filepath)
        
        # Get optional interval parameter (default 1.0 seconds)
        interval = float(request.form.get('interval', 1.0))
        
        # Automatically parse the file if it's a JTL or CSV
        metrics = None
        if file_ext in {'.jtl', '.csv'}:
            try:
                parser = JTLParser(filepath)
                df = parser.parse()
                calculator = MetricsCalculator(df)
                metrics = calculator.get_all_metrics(interval_seconds=interval)
                summary = parser.get_summary()
                metrics['summary'] = summary
            except Exception as parse_error:
                print(f"WARNING: Parsing error: {parse_error}")
                # Continue without metrics - file is still uploaded
        
        response_data = {
            'message': 'File uploaded successfully',
            'filename': file.filename,
            'size': file_size,
            'path': filepath,
            'status': 'uploaded'
        }
        
        if metrics:
            response_data['metrics'] = metrics
            response_data['status'] = 'parsed'
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Upload failed: {str(e)}'
        }), 500


@app.route('/api/parse', methods=['POST'])
def parse_results():
    """
    Parse uploaded result file and return metrics
    Expects JSON: {"filename": "sample.jtl"}
    """
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({'error': 'filename required in request body'}), 400
    
    filename = data['filename']
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Get optional interval parameter (default 1.0 seconds)
    interval = float(data.get('interval', 1.0))
    
    try:
        # Parse the file
        parser = JTLParser(filepath)
        df = parser.parse()
        
        # Calculate metrics
        calculator = MetricsCalculator(df)
        metrics = calculator.get_all_metrics(interval_seconds=interval)
        summary = parser.get_summary()
        metrics['summary'] = summary  # embed summary inside metrics, consistent with /api/upload
        
        return jsonify({
            'status': 'success',
            'filename': filename,
            'summary': summary,
            'metrics': metrics
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Parsing failed: {str(e)}'
        }), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """
    Get calculated performance metrics
    """
    # TODO: Implement metrics calculation
    return jsonify({
        'error': 'Not yet implemented'
    }), 501


if __name__ == '__main__':
    print("Performance Dashboard Backend starting...")
    print("API available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    app.run(debug=True, port=5000, host='0.0.0.0')
