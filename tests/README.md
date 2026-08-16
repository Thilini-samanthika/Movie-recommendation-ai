#  Quality Assurance (QA) & System Testing Documentation

This directory contains the complete automated testing infrastructure engineered for the **AI-Powered Personalized Movie Recommendation System**, created under the **QA, DevOps & Research Engineer** role responsibilities.

---

##  Directory Overview

```
tests/
├── api/
│   ├── postman_collection.json      # Comprehensive API Test Collection
│   └── postman_environment.json     # Dynamic API Test Environment Config
├── system/
│   └── system_integration_test.py   # E2E Integration & Automated Regression Suite
├── performance/
│   ├── load_test_plan.jmx           # Apache JMeter Load & Stress Test Plan
│   └── locustfile.py                # Locust Python-based Performance Test Script
└── README.md                        # QA Documentation & Test Execution Instructions
```

---

##  1. API Testing with Postman & Newman CLI

The API collection covers authentication, movie querying, AI recommendation generation, and sentiment analysis.

### Interactive Execution (Postman App)
1. Launch **Postman**.
2. Click **Import** and select `tests/api/postman_collection.json` and `tests/api/postman_environment.json`.
3. Select the **Local Development Environment**.
4. Run individual endpoints or execute the entire collection via **Collection Runner**.

### Automated Execution (Newman CLI)
To execute API test suites headlessly in terminal or CI/CD pipelines:

```bash
# Install Newman globally (if not installed)
npm install -g newman

# Run API Collection against Local Environment
newman run tests/api/postman_collection.json -e tests/api/postman_environment.json --reporters cli,json
```

---

##  2. System & Integration Automated Testing

Automated end-to-end integration tests validate communication between microservices and enforce API contract assertions.

### Execution Instructions

```bash
# Ensure Python AI service is running on port 8000
python tests/system/system_integration_test.py
```

---

##  3. Performance & Load Testing

### Option A: Apache JMeter (`.jmx`)
The `load_test_plan.jmx` simulates 50 concurrent virtual users executing recommendation and sentiment endpoints.

#### GUI Mode:
```bash
jmeter -t tests/performance/load_test_plan.jmx
```

#### Headless CLI Mode (Recommended for Benchmarking):
```bash
jmeter -n -t tests/performance/load_test_plan.jmx -l tests/performance/results.jtl -e -o tests/performance/html_report
```

---

### Option B: Locust Load Testing (`locustfile.py`)
Locust provides real-time interactive performance monitoring.

```bash
# Install Locust
pip install locust

# Launch Locust web UI targeting AI Service
locust -f tests/performance/locustfile.py --host http://localhost:8000
```
Open browser at `http://localhost:8089` to configure virtual users, spawn rates, and monitor real-time RPS / percentile latency graphs.

---

##  Test Pass Criteria & Quality Gates

| Test Suite | Metric / Threshold | Pass Condition |
|------------|-------------------|----------------|
| **API Testing (Newman)** | Assertion Pass Rate | **100%** |
| **System Integration** | HTTP Status Codes | **200 OK / 201 Created** |
| **Performance (JMeter)** | P95 Response Time | **< 300 ms** |
| **Performance (Locust)** | Error Rate under Load | **< 0.5%** |
