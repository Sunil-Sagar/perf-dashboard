# JMXGenie - Task List

## Project Overview
Build an intelligent JMeter script generation tool that converts Fiddler SAZ files, Postman collections, and SOAP XML into production-ready JMX files with automated correlation detection, visual editing, and advanced test configuration.

**Estimated Timeline:** 8-12 weeks for production-ready version

---

## Phase 1: Foundation & Core Converters (Week 1-2)

### Task 1.1: Project Setup & Architecture
- [ ] Create project structure (backend/, frontend/, parsers/, converters/, ui/)
- [ ] Set up Python virtual environment
- [ ] Install dependencies (lxml, requests, PyQt6/Electron)
- [ ] Design data model for intermediate format
- [ ] Create JMX template library
- [ ] Set up logging framework
- [ ] Create README with setup instructions

**Priority:** Critical | **Effort:** 1.5 days

---

### Task 1.2: Build SAZ File Parser
- [ ] Research Fiddler SAZ file format (ZIP container)
- [ ] Create `parsers/saz_parser.py` module
- [ ] Extract sessions from SAZ archive
- [ ] Parse request headers, body, method, URL
- [ ] Parse response headers, body, status code
- [ ] Extract timing information
- [ ] Handle different content types (JSON, XML, form-data)
- [ ] Test with various SAZ samples
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 2.5 days

---

### Task 1.3: Create SAZ to JMX Converter
- [ ] Create `converters/saz_to_jmx.py` module
- [ ] Build JMX XML structure using lxml
- [ ] Create Test Plan element
- [ ] Add Thread Group with configurable threads
- [ ] Convert each SAZ request to HTTP Sampler
- [ ] Map headers to Header Manager
- [ ] Handle POST/PUT body data
- [ ] Add default listeners (View Results Tree)
- [ ] Generate valid JMX output
- [ ] Test with JMeter to ensure it runs
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 3 days

---

### Task 1.4: Build Postman Collection Parser
- [ ] Research Postman Collection v2.1 format (JSON)
- [ ] Create `parsers/postman_parser.py` module
- [ ] Parse collection metadata
- [ ] Extract folders and request hierarchy
- [ ] Parse request details (method, URL, headers, body)
- [ ] Handle Postman variables ({{var}})
- [ ] Parse pre-request scripts (basic support)
- [ ] Parse authentication settings
- [ ] Test with various Postman collections
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 2 days

---

### Task 1.5: Create Postman to JMX Converter
- [ ] Create `converters/postman_to_jmx.py` module
- [ ] Convert Postman requests to HTTP Samplers
- [ ] Map Postman variables to JMeter User Defined Variables
- [ ] Handle Postman folders as Transaction Controllers
- [ ] Convert authentication to JMeter auth managers
- [ ] Map Postman tests to JMeter assertions (basic)
- [ ] Add CSV Data Set Config for data files
- [ ] Generate valid JMX output
- [ ] Test with JMeter
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 3 days

---

### Task 1.6: Implement SOAP XML Handler
- [ ] Create `parsers/soap_parser.py` module
- [ ] Parse SOAP envelope structure
- [ ] Extract SOAP action/namespace
- [ ] Handle WSDL references
- [ ] Create SOAP HTTP Sampler in JMX
- [ ] Add proper SOAP headers
- [ ] Support SOAP 1.1 and 1.2
- [ ] Test with sample SOAP requests
- [ ] Write unit tests

**Priority:** High | **Effort:** 1.5 days

---

## Phase 2: Correlation Engine (Week 3-4)

### Task 2.1: Build Correlation Scanner
- [ ] Create `analyzers/correlation_scanner.py` module
- [ ] Scan request/response pairs for dynamic values
- [ ] Identify patterns (UUIDs, tokens, session IDs, CSRFs)
- [ ] Track value flow (response → subsequent request)
- [ ] Build correlation candidate list
- [ ] Rank candidates by confidence
- [ ] Generate regex patterns automatically
- [ ] Test with various scenarios
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 3 days

---

### Task 2.2: Create Correlation Pattern Library
- [ ] Create `patterns/correlation_patterns.json`
- [ ] Add common patterns:
  - [ ] Session IDs (JSESSIONID, PHPSESSID, ASP.NET_SessionId)
  - [ ] CSRF tokens
  - [ ] OAuth tokens (access_token, refresh_token)
  - [ ] JWT tokens
  - [ ] ViewState (.NET)
  - [ ] GUID/UUID patterns
  - [ ] Timestamps
  - [ ] Nonces
- [ ] Document each pattern with examples
- [ ] Make patterns configurable
- [ ] Support custom pattern addition

**Priority:** High | **Effort:** 2 days

---

### Task 2.3: Build Visual Correlation Editor UI
- [ ] Design UI layout (3-panel: request list, origin response, target request)
- [ ] Create request list view with search/filter
- [ ] Display raw request/response with syntax highlighting
- [ ] Implement text selection for correlation value
- [ ] Show regex builder panel
- [ ] Add extractor configuration fields:
  - [ ] Variable name
  - [ ] Regular expression
  - [ ] Template
  - [ ] Match number
  - [ ] Default value
- [ ] Preview extracted values in real-time
- [ ] Apply correlation to selected requests
- [ ] Show correlation summary

**Priority:** Critical | **Effort:** 4 days

---

### Task 2.4: Implement Regex Validator
- [ ] Create regex testing component
- [ ] Show sample text from response
- [ ] Highlight regex matches
- [ ] Display capture groups
- [ ] Show match count
- [ ] Validate regex syntax
- [ ] Provide regex hints/suggestions
- [ ] Add regex cheat sheet reference

**Priority:** High | **Effort:** 1.5 days

---

### Task 2.5: Add Manual Correlation Editor
- [ ] Create manual correlation workflow
- [ ] Select origin response
- [ ] Highlight/select dynamic value
- [ ] Choose target requests to apply to
- [ ] Auto-generate regex or allow custom
- [ ] Add JMeter Regular Expression Extractor to origin
- [ ] Replace hardcoded value with variable in targets
- [ ] Validate correlation works
- [ ] Save correlation rules

**Priority:** High | **Effort:** 2 days

---

## Phase 3: Advanced Features (Week 5-6)

### Task 3.1: Build Transaction Grouping Logic
- [ ] Create `analyzers/transaction_grouper.py` module
- [ ] Group requests by domain/host
- [ ] Group requests by URL pattern (same endpoint)
- [ ] Group requests by time proximity
- [ ] Allow manual grouping via UI
- [ ] Generate descriptive transaction names
- [ ] Test grouping algorithms

**Priority:** High | **Effort:** 1.5 days

---

### Task 3.2: Add COMMENT Marker Insertion
- [ ] Add JMeter COMMENT elements to JMX
- [ ] Insert COMMENT before each transaction group
- [ ] Label with transaction name
- [ ] Use for dashboard transaction identification
- [ ] Make COMMENT text configurable
- [ ] Test in JMeter

**Priority:** Medium | **Effort:** 0.5 days

---

### Task 3.3: Implement OAuth Token Handler
- [ ] Create `auth/oauth_handler.py` module
- [ ] Detect OAuth token requests
- [ ] Identify token endpoint
- [ ] Extract access_token and refresh_token
- [ ] Add OAuth2 Token Manager to JMX
- [ ] Configure token extraction logic
- [ ] Add token refresh logic
- [ ] Test with OAuth 2.0 flows
- [ ] Support client credentials, password grant

**Priority:** High | **Effort:** 3 days

---

### Task 3.4: Add Stepping Thread Groups
- [ ] Replace basic Thread Group with Stepping Thread Group
- [ ] Configure ramp-up steps
- [ ] Add hold time for each step
- [ ] Configure ramp-down
- [ ] Make parameters configurable via UI
- [ ] Require jp@gc Plugins installation detection
- [ ] Test in JMeter with plugin

**Priority:** Medium | **Effort:** 1 day

---

### Task 3.5: Build JMX Domain Scanner
- [ ] Create `analyzers/domain_scanner.py` module
- [ ] Extract all unique hosts from requests
- [ ] Display host list with request count
- [ ] Allow host selection/deselection
- [ ] Filter out unwanted domains (CDN, analytics, ads)
- [ ] Update JMX to include only selected hosts
- [ ] Add blacklist/whitelist functionality

**Priority:** High | **Effort:** 1.5 days

---

### Task 3.6: Create Assertion Builder
- [ ] Create UI for adding assertions
- [ ] Support Response Assertion types:
  - [ ] Contains
  - [ ] Matches (regex)
  - [ ] Equals
  - [ ] Substring
- [ ] Support JSON Assertion
- [ ] Support XPath Assertion
- [ ] Support Duration Assertion
- [ ] Add assertions to samplers in JMX
- [ ] Preview assertion results

**Priority:** Medium | **Effort:** 2 days

---

### Task 3.7: Add Custom Rule Management
- [ ] Create UI for managing correlation rules
- [ ] Save rules to library (JSON/YAML)
- [ ] Edit existing rules
- [ ] Import/export rule sets
- [ ] Apply saved rules to new conversions
- [ ] Share rules across team
- [ ] Version control support

**Priority:** Medium | **Effort:** 1.5 days

---

### Task 3.8: Build Request Viewer/Inspector
- [ ] Create detailed request inspector panel
- [ ] Display formatted request (headers, body)
- [ ] Display formatted response (headers, body)
- [ ] Add syntax highlighting (JSON, XML, HTML)
- [ ] Show request metadata (size, timing)
- [ ] Add search within request/response
- [ ] Support multiple view formats (raw, formatted, hex)

**Priority:** Medium | **Effort:** 2 days

---

## Phase 4: Additional Tools (Week 7)

### Task 4.1: Add JTL to HTML Converter
- [ ] Create `converters/jtl_to_html.py` module
- [ ] Parse JTL/CSV results
- [ ] Generate basic HTML report template
- [ ] Add summary statistics table
- [ ] Add charts (if using Plotly/Matplotlib)
- [ ] Style report with CSS
- [ ] Support custom branding
- [ ] Test with various JTL files

**Priority:** Low | **Effort:** 2 days

---

## Phase 5: Testing, Polish & Deployment (Week 8)

### Task 5.1: Create Unit Tests
- [ ] Write tests for SAZ parser
- [ ] Write tests for Postman parser
- [ ] Write tests for all converters
- [ ] Write tests for correlation scanner
- [ ] Write tests for transaction grouper
- [ ] Mock file I/O operations
- [ ] Achieve >75% code coverage
- [ ] Set up pytest configuration

**Priority:** High | **Effort:** 3 days

---

### Task 5.2: Test with Real SAZ Files
- [ ] Collect diverse SAZ samples:
  - [ ] E-commerce applications
  - [ ] Banking applications
  - [ ] REST APIs
  - [ ] SOAP services
  - [ ] OAuth flows
- [ ] Test conversion quality
- [ ] Validate generated JMX in JMeter
- [ ] Fix edge cases and bugs
- [ ] Document known limitations

**Priority:** Critical | **Effort:** 3 days

---

### Task 5.3: Write Documentation
- [ ] Create user guide:
  - [ ] How to capture SAZ files
  - [ ] How to export Postman collections
  - [ ] How to use JMXGenie UI
  - [ ] How to handle correlations
  - [ ] How to configure thread groups
- [ ] Document supported features
- [ ] Create video tutorials
- [ ] Add troubleshooting guide
- [ ] Document architecture for developers
- [ ] Create API documentation

**Priority:** High | **Effort:** 3 days

---

### Task 5.4: Deploy MVP for Testing
- [ ] Package application (standalone executable)
- [ ] Create installer for Windows/Mac/Linux
- [ ] Test on different platforms
- [ ] Perform end-to-end testing
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Create demo environment
- [ ] Plan v2 features

**Priority:** Critical | **Effort:** 2 days

---

## Optional Enhancements (Post-MVP)

### Future Features
- [ ] Add HAR file support (browser network exports)
- [ ] Add cURL command converter
- [ ] Integrate with Charles Proxy
- [ ] Add Swagger/OpenAPI to JMX converter
- [ ] Build cloud-based conversion service
- [ ] Add collaborative features (share scripts)
- [ ] AI-powered correlation suggestions (ML model)
- [ ] Generate test data from responses
- [ ] Add performance test best practices validator
- [ ] Integration with JMeter cloud services (BlazeMeter, etc.)
- [ ] Support parameterization wizard
- [ ] Add script optimization analyzer
- [ ] Build JMX diff/merge tool
- [ ] Add version control integration

---

## Technical Considerations

### Dependencies
- **Python:** 3.9+
- **Core Libraries:**
  - lxml (XML/JMX manipulation)
  - requests (HTTP utilities)
  - zipfile (SAZ extraction)
  - json (Postman parsing)
  - re (regex handling)
- **UI Framework:**
  - PyQt6 (desktop app) OR
  - Electron + React (web-based desktop app)
- **Testing:**
  - pytest
  - pytest-cov

### JMX Structure Reference
- Test Plan
  - Thread Group / Stepping Thread Group
    - HTTP Request Defaults
    - HTTP Cookie Manager
    - HTTP Header Manager
    - HTTP Authorization Manager
    - User Defined Variables
    - CSV Data Set Config
    - Loop Controller / Transaction Controller
      - HTTP Sampler
        - Regular Expression Extractor
        - JSON Extractor
        - Response Assertion
    - View Results Tree
    - Aggregate Report

---

## Priority Legend
- **Critical:** Must have for MVP
- **High:** Important for user value
- **Medium:** Nice to have
- **Low:** Post-MVP feature

## Effort Legend
- 0.5 days = 4 hours
- 1 day = 8 hours
- 1.5 days = 12 hours
- 2 days = 16 hours
- 3 days = 24 hours
- 4 days = 32 hours
