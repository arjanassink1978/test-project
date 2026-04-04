#!/usr/bin/env python3
"""
Generate a combined test and mutation testing report
"""
import xml.etree.ElementTree as ET
import os
import json
from datetime import datetime
from pathlib import Path

def parse_junit_reports():
    """Parse JUnit test reports"""
    test_results = {
        "backend": {"passed": 0, "failed": 0, "skipped": 0, "time": 0},
        "restassured": {"passed": 0, "failed": 0, "skipped": 0, "time": 0},
        "frontend": {"passed": 0, "failed": 0, "skipped": 0, "time": 0},
        "playwright": {"passed": 0, "failed": 0, "skipped": 0, "time": 0},
    }

    # Backend tests (artifacts downloaded as backend-test-results/)
    junit_path = "backend-test-results"
    if os.path.exists(junit_path):
        for file in Path(junit_path).glob("TEST-*.xml"):
            try:
                tree = ET.parse(file)
                root = tree.getroot()
                test_results["backend"]["passed"] += int(root.get("tests", 0)) - int(root.get("failures", 0)) - int(root.get("skipped", 0))
                test_results["backend"]["failed"] += int(root.get("failures", 0))
                test_results["backend"]["skipped"] += int(root.get("skipped", 0))
                test_results["backend"]["time"] += float(root.get("time", 0))
            except:
                pass

    # RestAssured tests (artifacts downloaded as restassured-test-results/)
    junit_path = "restassured-test-results"
    if os.path.exists(junit_path):
        for file in Path(junit_path).glob("TEST-*.xml"):
            try:
                tree = ET.parse(file)
                root = tree.getroot()
                test_results["restassured"]["passed"] += int(root.get("tests", 0)) - int(root.get("failures", 0)) - int(root.get("skipped", 0))
                test_results["restassured"]["failed"] += int(root.get("failures", 0))
                test_results["restassured"]["skipped"] += int(root.get("skipped", 0))
                test_results["restassured"]["time"] += float(root.get("time", 0))
            except:
                pass

    # Frontend Jest tests (artifacts downloaded as frontend-test-results/)
    junit_path = "frontend-test-results"
    if os.path.exists(junit_path):
        for file in Path(junit_path).glob("*.xml"):
            try:
                tree = ET.parse(file)
                root = tree.getroot()
                test_results["frontend"]["passed"] += int(root.get("tests", 0)) - int(root.get("failures", 0)) - int(root.get("skipped", 0))
                test_results["frontend"]["failed"] += int(root.get("failures", 0))
                test_results["frontend"]["skipped"] += int(root.get("skipped", 0))
                test_results["frontend"]["time"] += float(root.get("time", 0))
            except:
                pass

    # Playwright E2E tests (read from test-results/report.json if available)
    playwright_report_path = "playwright-test-results/report.json"
    if os.path.exists(playwright_report_path):
        try:
            with open(playwright_report_path, 'r') as f:
                report = json.load(f)
                test_results["playwright"]["passed"] = report.get("stats", {}).get("expected", 0)
                test_results["playwright"]["failed"] = report.get("stats", {}).get("unexpected", 0)
                test_results["playwright"]["skipped"] = report.get("stats", {}).get("skipped", 0)
                test_results["playwright"]["time"] = report.get("stats", {}).get("duration", 0) / 1000
        except:
            pass

    return test_results

def parse_mutation_reports():
    """Parse PIT mutation testing reports and Stryker frontend reports"""
    mutation_results = {
        "backend": {"killed": 0, "survived": 0, "no_coverage": 0, "coverage": 0},
        "restassured": {"killed": 0, "survived": 0, "no_coverage": 0, "coverage": 0},
        "frontend": {"killed": 0, "survived": 0, "no_coverage": 0, "coverage": 0},
    }

    # Backend mutations
    pit_path = "mutation-results/backend/target/pit-reports/mutations.xml"
    if os.path.exists(pit_path):
        try:
            tree = ET.parse(pit_path)
            root = tree.getroot()
            for mutation in root.findall(".//mutation"):
                status = mutation.get("status")
                if status == "KILLED":
                    mutation_results["backend"]["killed"] += 1
                elif status == "SURVIVED":
                    mutation_results["backend"]["survived"] += 1
                elif status == "NO_COVERAGE":
                    mutation_results["backend"]["no_coverage"] += 1

            total = mutation_results["backend"]["killed"] + mutation_results["backend"]["survived"] + mutation_results["backend"]["no_coverage"]
            if total > 0:
                mutation_results["backend"]["coverage"] = round(
                    (mutation_results["backend"]["killed"] / total) * 100, 1
                )
        except:
            pass

    # RestAssured mutations
    pit_path = "mutation-results/restassured-tests/target/pit-reports/mutations.xml"
    if os.path.exists(pit_path):
        try:
            tree = ET.parse(pit_path)
            root = tree.getroot()
            for mutation in root.findall(".//mutation"):
                status = mutation.get("status")
                if status == "KILLED":
                    mutation_results["restassured"]["killed"] += 1
                elif status == "SURVIVED":
                    mutation_results["restassured"]["survived"] += 1
                elif status == "NO_COVERAGE":
                    mutation_results["restassured"]["no_coverage"] += 1

            total = mutation_results["restassured"]["killed"] + mutation_results["restassured"]["survived"] + mutation_results["restassured"]["no_coverage"]
            if total > 0:
                mutation_results["restassured"]["coverage"] = round(
                    (mutation_results["restassured"]["killed"] / total) * 100, 1
                )
        except:
            pass

    # Frontend mutations (Stryker)
    stryker_path = "mutation-results/frontend/stryker-report.json"
    if os.path.exists(stryker_path):
        try:
            with open(stryker_path, 'r') as f:
                report = json.load(f)
                metrics = report.get("metrics", {})
                # Stryker reports: killed, survived, timeout, no-coverage, ignored, compile-error
                mutation_results["frontend"]["killed"] = metrics.get("killed", 0)
                mutation_results["frontend"]["survived"] = metrics.get("survived", 0) + metrics.get("timeout", 0)
                mutation_results["frontend"]["no_coverage"] = metrics.get("noCoverage", 0)

                total = metrics.get("total", 0)
                if total > 0:
                    mutation_results["frontend"]["coverage"] = metrics.get("mutationScore", 0)
        except:
            pass

    return mutation_results

def generate_html_report(tests, mutations):
    """Generate HTML report"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Calculate totals
    total_tests = sum(t["passed"] + t["failed"] + t["skipped"] for t in tests.values())
    total_passed = sum(t["passed"] for t in tests.values())
    total_failed = sum(t["failed"] for t in tests.values())

    # For mutation scoring, exclude frontend (Stryker returns percentage directly)
    backend_mutations = mutations.get("backend", {})
    restassured_mutations = mutations.get("restassured", {})
    frontend_mutations = mutations.get("frontend", {})

    backend_total = backend_mutations.get("killed", 0) + backend_mutations.get("survived", 0)
    restassured_total = restassured_mutations.get("killed", 0) + restassured_mutations.get("survived", 0)

    backend_killed = backend_mutations.get("killed", 0)
    restassured_killed = restassured_mutations.get("killed", 0)

    total_mutations = backend_total + restassured_total
    total_killed = backend_killed + restassured_killed

    backend_score = round((backend_killed / backend_total * 100), 1) if backend_total > 0 else 0
    restassured_score = round((restassured_killed / restassured_total * 100), 1) if restassured_total > 0 else 0
    frontend_score = frontend_mutations.get("coverage", 0)

    overall_mutation = round((total_killed / total_mutations * 100), 1) if total_mutations > 0 else 0

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test & Mutation Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        .header p {{
            opacity: 0.9;
            font-size: 1.1em;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }}
        .metric-card {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #667eea;
        }}
        .metric-card h3 {{
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }}
        .metric-value {{
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }}
        .metric-card.success {{ border-left-color: #10b981; }}
        .metric-card.success .metric-value {{ color: #10b981; }}
        .metric-card.warning {{ border-left-color: #f59e0b; }}
        .metric-card.warning .metric-value {{ color: #f59e0b; }}
        .section {{
            padding: 40px;
            border-bottom: 1px solid #e5e7eb;
        }}
        .section:last-child {{ border-bottom: none; }}
        .section h2 {{
            font-size: 1.8em;
            color: #333;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #667eea;
        }}
        .test-module {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }}
        .test-module h3 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
        }}
        .test-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }}
        .stat {{
            background: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            font-size: 0.95em;
        }}
        .stat-value {{
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .stat-label {{
            color: #666;
            font-size: 0.85em;
        }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .skipped {{ color: #f59e0b; }}
        .charts {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }}
        .chart-container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .chart-container h4 {{
            text-align: center;
            color: #333;
            margin-bottom: 20px;
        }}
        canvas {{ max-height: 300px; }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-top: 10px;
        }}
        .badge.pass {{ background: #d1fae5; color: #047857; }}
        .badge.fail {{ background: #fee2e2; color: #991b1b; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test & Mutation Report</h1>
            <p>Techchamps Test Project - Issue #1</p>
        </div>

        <div class="metrics">
            <div class="metric-card success">
                <h3>Overall Mutation Score</h3>
                <div class="metric-value">{overall_mutation}%</div>
                <span class="badge {'pass' if overall_mutation >= 80 else 'fail'}">
                    {'✅ Target Met' if overall_mutation >= 80 else '⚠️ Below Target'}
                </span>
            </div>
            <div class="metric-card success">
                <h3>Total Tests</h3>
                <div class="metric-value">{total_tests}</div>
                <span class="badge pass">✅ {total_passed} Passed</span>
            </div>
            <div class="metric-card {'success' if total_failed == 0 else 'warning'}">
                <h3>Test Failures</h3>
                <div class="metric-value">{total_failed}</div>
                <span class="badge {'pass' if total_failed == 0 else 'fail'}">{'✅ None' if total_failed == 0 else '❌ ' + str(total_failed)}</span>
            </div>
            <div class="metric-card">
                <h3>Mutations Killed</h3>
                <div class="metric-value">{total_killed}/{total_mutations}</div>
                <span class="badge pass">{round(total_killed/total_mutations*100, 1) if total_mutations > 0 else 0}% Coverage</span>
            </div>
        </div>

        <div class="section">
            <h2>📊 Test Results by Module</h2>
"""

    for module, stats in tests.items():
        total = stats["passed"] + stats["failed"] + stats["skipped"]
        pass_rate = round((stats["passed"] / total * 100), 1) if total > 0 else 0

        html += f"""
            <div class="test-module">
                <h3>{module.capitalize()}</h3>
                <div class="test-stats">
                    <div class="stat">
                        <div class="stat-value passed">{stats['passed']}</div>
                        <div class="stat-label">Passed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value failed">{stats['failed']}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value skipped">{stats['skipped']}</div>
                        <div class="stat-label">Skipped</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #667eea;">{pass_rate}%</div>
                        <div class="stat-label">Pass Rate</div>
                    </div>
                </div>
            </div>
"""

    html += """
        </div>

        <div class="section">
            <h2>🎭 E2E Test Results</h2>
"""

    if "playwright" in tests and tests["playwright"]["passed"] + tests["playwright"]["failed"] > 0:
        playwright = tests["playwright"]
        total_e2e = playwright["passed"] + playwright["failed"] + playwright["skipped"]
        e2e_rate = round((playwright["passed"] / total_e2e * 100), 1) if total_e2e > 0 else 0

        html += f"""
            <div class="test-module">
                <h3>Playwright E2E Tests</h3>
                <div class="test-stats">
                    <div class="stat">
                        <div class="stat-value passed">{playwright['passed']}</div>
                        <div class="stat-label">Passed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value failed">{playwright['failed']}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value skipped">{playwright['skipped']}</div>
                        <div class="stat-label">Skipped</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #667eea;">{e2e_rate}%</div>
                        <div class="stat-label">Pass Rate</div>
                    </div>
                </div>
            </div>
"""
    else:
        html += """
            <div class="test-module">
                <p style="color: #666;">No E2E test results available</p>
            </div>
"""

    html += """
        </div>

        <div class="section">
            <h2>🧬 Mutation Testing Results</h2>
"""

    for module, stats in mutations.items():
        html += f"""
            <div class="test-module">
                <h3>{module.capitalize()}</h3>
                <div class="test-stats">
                    <div class="stat">
                        <div class="stat-value" style="color: #10b981;">{stats['killed']}</div>
                        <div class="stat-label">Killed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #ef4444;">{stats['survived']}</div>
                        <div class="stat-label">Survived</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #f59e0b;">{stats['no_coverage']}</div>
                        <div class="stat-label">No Coverage</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: #667eea;">{stats['coverage']}%</div>
                        <div class="stat-label">Coverage</div>
                    </div>
                </div>
            </div>
"""

    html += f"""
        </div>

        <div class="section">
            <h2>📈 Summary</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <p style="color: #666; line-height: 1.8;">
                    <strong>Unit Tests:</strong> {total_passed}/{total_tests} tests passed ({round(total_passed/total_tests*100, 1) if total_tests > 0 else 0}%)<br>
                    <strong>Backend Mutation Score:</strong> {backend_score}% <span class="badge {'pass' if backend_score >= 80 else 'fail'}">{'✅' if backend_score >= 80 else '❌'}</span><br>
                    <strong>Integration Mutation Score:</strong> {restassured_score}% <span class="badge {'pass' if restassured_score >= 80 else 'fail'}">{'✅' if restassured_score >= 80 else '❌'}</span><br>
                    <strong>Frontend Mutation Score:</strong> {frontend_score}% <span class="badge {'pass' if frontend_score >= 80 else 'fail'}">{'✅' if frontend_score >= 80 else '❌'}</span><br>
                    <strong>Status:</strong> {'✅ All quality gates passed' if backend_score >= 80 and restassured_score >= 80 and frontend_score >= 80 and total_failed == 0 else '⚠️ Review required'}<br>
                    <strong>Generated:</strong> {timestamp}
                </p>
            </div>
        </div>

        <div class="footer">
            <p>Techchamps Test Project | GitLab CI/CD Pipeline | Generated on {timestamp}</p>
        </div>
    </div>
</body>
</html>
"""

    return html

if __name__ == "__main__":
    print("📊 Generating test report...")
    print(f"📁 Current directory: {os.getcwd()}")
    print(f"📁 Available directories: {os.listdir('.')}")

    tests = parse_junit_reports()
    mutations = parse_mutation_reports()

    print(f"✅ Tests parsed: {tests}")
    print(f"✅ Mutations parsed: {mutations}")

    html = generate_html_report(tests, mutations)

    os.makedirs("target", exist_ok=True)
    with open("target/test-report.html", "w") as f:
        f.write(html)

    print("✅ Report generated: target/test-report.html")
