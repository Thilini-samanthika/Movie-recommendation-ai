Quality Assurance and System Testing Guide

This folder contains all the test scripts and testing configurations for the AI-Powered Movie Recommendation System.

Directory Structure

tests/
  api/
    postman_collection.json - API test collection for endpoints
    postman_environment.json - Environment configuration for API tests
  system/
    system_integration_test.py - Integration and regression test script
  performance/
    load_test_plan.jmx - JMeter performance test script
    locustfile.py - Locust load test script
  README.md - Testing instructions


1. API Testing with Postman and Newman

The Postman collection tests all major endpoints including authentication, movie search, AI recommendations, and review sentiment analysis.

To test using Postman GUI:
1. Open Postman.
2. Import tests/api/postman_collection.json and tests/api/postman_environment.json.
3. Choose the Local Development Environment.
4. Run the requests individually or use the Collection Runner.

To test automatically from the command line:
First install Newman:
npm install -g newman

Then run the API collection:
newman run tests/api/postman_collection.json -e tests/api/postman_environment.json --reporters cli,json


2. System Integration Testing

The python test script checks communication between microservices and verifies response structures.

To run system integration tests:
Make sure the Python AI service is running on port 8000, then execute:
python tests/system/system_integration_test.py


3. Performance and Load Testing

Option A: Apache JMeter (.jmx)
The load_test_plan.jmx file simulates 50 concurrent users hitting recommendation and sentiment endpoints.

GUI Mode:
jmeter -t tests/performance/load_test_plan.jmx

Command Line Mode:
jmeter -n -t tests/performance/load_test_plan.jmx -l tests/performance/results.jtl -e -o tests/performance/html_report

Option B: Locust Load Testing (locustfile.py)
Locust provides an interactive dashboard to monitor performance metrics.

Install Locust:
pip install locust

Run Locust targeting the AI service:
locust -f tests/performance/locustfile.py --host http://localhost:8000

Open http://localhost:8089 in your browser to set user count and start the load test.


Testing Pass Criteria

API Testing (Newman): 100% assertions passing
System Integration: Status code 200 OK / 201 Created
Performance (JMeter): P95 response time under 300 ms
Performance (Locust): Error rate under 0.5%
