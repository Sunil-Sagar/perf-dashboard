# Performance Dashboard

A comprehensive performance testing analysis tool that processes JMeter, K6, and Gatling results to provide actionable insights.

## Features

- **Multi-Tool Support**: JMeter (JTL), K6 (JSON), Gatling (simulation logs)
- **Interactive Visualizations**: Response time trends, throughput, error rates
- **SLA Validation**: Automated checks against defined performance criteria
- **Anomaly Detection**: AI-powered identification of performance issues
- **Multi-File Comparison**: Compare results across test runs
- **Export Capabilities**: HTML, JSON, CSV formats
- **CI/CD Integration**: CLI mode for automated pipeline checks

## Tech Stack

### Backend
- Python 3.9+
- Flask (REST API)
- Pandas (data processing)
- NumPy (statistical calculations)

### Frontend
- Electron (desktop wrapper)
- React + TypeScript
- Recharts/Plotly (visualizations)
- Ant Design / Tailwind CSS

## Project Structure

```
performance-dashboard/
├── backend/              # Python backend services
│   ├── parsers/         # Result file parsers (JTL, K6, Gatling)
│   ├── analyzers/       # Metrics calculation & analysis
│   ├── api/             # Flask REST API endpoints
│   └── tests/           # Unit tests
├── frontend/            # Electron + React frontend
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page-level components
│   │   ├── utils/       # Helper functions
│   │   └── styles/      # CSS/styling
│   ├── electron/        # Electron main process
│   └── tests/           # Frontend tests
├── docs/                # Documentation
└── sample-data/         # Sample test result files

```

## Getting Started

### Prerequisites
- Python 3.9 or higher
- Node.js 16+ and npm
- Git

### Installation

```bash
# Clone the repository
cd performance-dashboard

# Set up backend
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt

# Set up frontend
cd ../frontend
npm install

# Run the application
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Development Timeline

- **Weeks 1-2**: Foundation (parsers, basic metrics, simple UI)
- **Weeks 3-4**: Core features (charts, SLA checks, multi-file)
- **Weeks 5-6**: Advanced features (anomaly detection, recommendations)
- **Weeks 7-8**: Polish, testing, documentation, deployment

## License

MIT License - built for performance testing teams

## Author

Built with AI assistance - February 2026
