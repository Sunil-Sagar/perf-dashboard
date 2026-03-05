"""
Performance Dashboard Backend API — Vercel Serverless Entry Point
Stateless Flask app: parses files in-memory via tempfile, no persistent storage needed.
"""

import sys
import os
# Make sure parsers/ and analyzers/ (siblings of this file) are importable
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile

from parsers.jtl_parser import JTLParser
from analyzers.metrics_calculator import MetricsCalculator

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB


def _parse_upload(file, interval: float):
    """Helper: save uploaded file to a temp path, parse, clean up, return metrics."""
    file_ext = os.path.splitext(file.filename)[1].lower()
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=file_ext)
    try:
        os.close(tmp_fd)
        file.save(tmp_path)
        parser = JTLParser(tmp_path)
        df = parser.parse()
        calculator = MetricsCalculator(df)
        metrics = calculator.get_all_metrics(interval_seconds=interval)
        summary = parser.get_summary()
        metrics['summary'] = summary
        return metrics, summary, file_ext
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'performance-dashboard-backend',
        'version': '1.0.0'
    })


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload and parse a JMeter result file.
    Accepts: multipart/form-data with 'file' + optional 'interval' (seconds).
    Returns: metrics JSON.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty filename'}), 400

    allowed_extensions = {'.jtl', '.csv', '.log', '.json'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        return jsonify({
            'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
        }), 400

    try:
        interval = float(request.form.get('interval', 1.0))
        metrics, _summary, _ext = _parse_upload(file, interval)
        return jsonify({
            'message': 'File parsed successfully',
            'filename': file.filename,
            'status': 'parsed',
            'metrics': metrics
        }), 200
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/parse', methods=['POST'])
def parse_results():
    """
    Re-parse with a new interval.
    Accepts multipart/form-data with 'file' + 'interval' (stateless, used by frontend).
    Also accepts legacy JSON {filename, interval} for local-only backward compatibility.
    """
    # ── Stateless multipart mode (Vercel + local) ──────────────────────────
    if 'file' in request.files:
        file = request.files['file']
        interval = float(request.form.get('interval', 1.0))

        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = {'.jtl', '.csv', '.log', '.json'}
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type'}), 400

        try:
            metrics, summary, _ext = _parse_upload(file, interval)
            return jsonify({
                'status': 'success',
                'filename': file.filename,
                'summary': summary,
                'metrics': metrics
            }), 200
        except Exception as e:
            return jsonify({'error': f'Parsing failed: {str(e)}'}), 500

    # ── Legacy JSON mode (local dev only) ─────────────────────────────────
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'No file provided and no filename in body'}), 400

    filename = data['filename']
    interval = float(data.get('interval', 1.0))

    # Search common upload folders (local dev)
    for folder in ['/tmp/uploads', 'uploads']:
        filepath = os.path.join(folder, filename)
        if os.path.exists(filepath):
            break
    else:
        return jsonify({'error': f'File not found: {filename}'}), 404

    try:
        parser = JTLParser(filepath)
        df = parser.parse()
        calculator = MetricsCalculator(df)
        metrics = calculator.get_all_metrics(interval_seconds=interval)
        summary = parser.get_summary()
        metrics['summary'] = summary
        return jsonify({
            'status': 'success',
            'filename': filename,
            'summary': summary,
            'metrics': metrics
        }), 200
    except Exception as e:
        return jsonify({'error': f'Parsing failed: {str(e)}'}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify({'error': 'Not implemented'}), 501
