# JMXGenie - REVISED Task List
## Based on Actual Implementation Screenshots

**Project Overview:** Intelligent JMeter script generation tool that converts SAZ/Postman/SOAP files into production-ready JMX with automated correlation detection.

**Key Changes from Original TODO:**
- ✅ Restructured phases to match actual workflow
- ✅ Added missing UI features from screenshots
- ✅ Combined granular tasks into logical feature groups
- ✅ Committed to Electron + React framework
- ✅ Reprioritized based on actual implementation

**Estimated Timeline:** 8-12 weeks for production-ready version

---

## Phase 1: Foundation & Project Setup (Week 1)

### Task 1.1: Project Setup & Tech Stack
- [ ] Create project structure:
  ```
  jmxgenie/
  ├── backend/           # Python parsers and converters
  ├── frontend/          # React + Electron UI
  ├── patterns/          # Correlation pattern library
  ├── tests/            # Unit and integration tests
  └── docs/             # Documentation
  ```
- [ ] **Backend:** Python 3.9+
  - Install: lxml, requests, zipfile, json, re, pandas
- [ ] **Frontend:** Electron + React + TypeScript
  - Setup: electron, react, typescript, tailwindcss
  - UI Library: Ant Design or Material-UI or custom components
- [ ] Configure build tools (webpack, electron-builder)
- [ ] Set up development environment
- [ ] Create README with setup instructions

**Priority:** Critical | **Effort:** 1.5 days

---

### Task 1.2: Main Application Window & Navigation
Based on Screenshot 1 (Left Sidebar)

- [ ] Create Electron main process
- [ ] Build main window shell (1200x800 default size)
- [ ] Implement left sidebar navigation with tabs:
  - **JMXGenie-UI** (main conversion interface)
  - **JMXGenie-Post2JMX-APIs** (Postman converter)
  - **JMXGenie-JMXRefine** (JMX editor/refinement)
  - **JMXGenie-JReport** (reporting features)
- [ ] Setup routing between tabs
- [ ] Style sidebar (dark theme, purple accent - matches screenshots)
- [ ] Add application menu (File, View, Help)

**Priority:** Critical | **Effort:** 2 days

---

## Phase 2: Core Parsers & Basic Conversion (Week 2)

### Task 2.1: SAZ File Parser
- [ ] Create `backend/parsers/saz_parser.py`
- [ ] Implement SAZ extraction (ZIP file handling)
- [ ] Parse Fiddler session files (XML format inside SAZ)
- [ ] Extract for each request:
  - Request: method, URL, headers, body
  - Response: status, headers, body, timing
  - Session metadata
- [ ] Handle different content types (JSON, XML, form-data, multipart)
- [ ] Create intermediate data model (JSON structure)
- [ ] Add error handling for malformed SAZ files
- [ ] Write unit tests with sample SAZ files

**Priority:** Critical | **Effort:** 3 days

---

### Task 2.2: Basic JMX Converter
- [ ] Create `backend/converters/jmx_builder.py`
- [ ] Build basic JMX XML structure using lxml:
  - Test Plan element
  - Thread Group with configurable threads
  - HTTP Request Defaults
  - HTTP Cookie Manager
  - HTTP Header Manager
- [ ] Convert each request to HTTP Sampler
- [ ] Map request headers to Header Manager
- [ ] Handle POST/PUT body data
- [ ] Add basic listeners (View Results Tree)
- [ ] Generate valid JMX that opens in JMeter
- [ ] Test output in JMeter to ensure it runs
- [ ] Write unit tests

**Priority:** Critical | **Effort:** 3 days

---

## Phase 3: Main UI - File Loading & Host Selection (Week 3)

### Task 3.1: File Input & Host Selection Interface
Based on Screenshot 1 (Main Panel)

**File Input Section:**
- [ ] Create file upload component
- [ ] Add "Input File" label with path display
- [ ] Add "Browse" button with file picker dialog
- [ ] Filter file types: `.saz`, `.json` (Postman), `.xml` (SOAP)
- [ ] Display selected filename with full path
- [ ] Add drag-and-drop support for file upload
- [ ] Show loading indicator while parsing

**Host Selection Section:**
- [ ] Parse and extract unique hosts from loaded file
- [ ] Display "Select Hosts to Include (Choose One as Default)" header
- [ ] Add "Select All" and "Deselect All" buttons
- [ ] Build checkbox list of hosts:
  - Show host domain/IP with port (e.g., `demowebshop.tricentis.com:443`)
  - Include special item: `☑ COMMENT` (for transaction markers)
  - Show request count per host (optional)
  - Allow scrolling for long lists
- [ ] Implement selection logic:
  - Select All: checks all boxes
  - Deselect All: unchecks all boxes
  - Individual checkbox toggle
- [ ] Persist selection state
- [ ] Filter requests based on selected hosts

**Priority:** Critical | **Effort:** 2 days

---

### Task 3.2: Configuration Panel
Based on Screenshot 1 (Configuration Fields)

- [ ] Create configuration form section
- [ ] **Transaction Suffix Input:**
  - Label: "Transaction Suffix:"
  - Text input with placeholder (e.g., `S01_MyTest`)
  - Used to name transaction controllers
- [ ] **Correlation Scan Regex Input:**
  - Label: "Correlation Scan Regex:"
  - Text input with default pattern: `[\w-]{6,}`
  - Tooltip explaining usage
- [ ] **Threads Configuration:**
  - Label: "Threads:"
  - Number input (default: 10)
- [ ] **Ramp-up Configuration:**
  - Label: "Ramp-up (sec):"
  - Number input (default: 1)
- [ ] **Duration Configuration:**
  - Label: "Duration (sec):"
  - Number input (default: 60)
- [ ] **Think Time Configuration:**
  - Checkbox: "Enable Think Time"
  - Number input: "Think Time (ms)" (default: 1000)
  - Disable input when checkbox unchecked
- [ ] Style form (clean, aligned labels)
- [ ] Add validation for numeric inputs
- [ ] Save configuration to preferences

**Priority:** High | **Effort:** 1.5 days

---

### Task 3.3: Action Buttons & Output Display
Based on Screenshot 1 (Bottom Section)

**Action Buttons (Primary Row):**
- [ ] Create button container with grid layout
- [ ] **"Manage Custom Rules"** button → Opens rule management dialog
- [ ] **"Scan for Correlations"** button → Triggers auto-detection
- [ ] **"Rules Correlation"** button → Apply saved rules
- [ ] **"Manual Correlation"** button → Opens manual editor
- [ ] **"Convert to JMX"** button → Generates final JMX (primary action, highlighted)
- [ ] **"Reset"** button → Clears form and selections
- [ ] Style buttons (purple primary, white secondary)
- [ ] Add loading states for async actions
- [ ] Disable buttons when no file loaded

**Output Path Display:**
- [ ] Show output path below buttons
- [ ] Format: "Output will be: [path]/[filename]_grouped.jmx"
- [ ] Auto-generate filename from input file
- [ ] Make path editable (click to change output location)

**Priority:** High | **Effort:** 1.5 days

---

### Task 3.4: Basic Conversion Flow (No Correlations Yet)
- [ ] Wire up "Convert to JMX" button
- [ ] Flow:
  1. Load SAZ file
  2. Select hosts
  3. Configure settings
  4. Click "Convert to JMX"
  5. Generate JMX WITHOUT correlations (basic script)
- [ ] Show success notification with output path
- [ ] Add "Open in JMeter" button (optional)
- [ ] Handle errors gracefully with user-friendly messages
- [ ] Test end-to-end: SAZ → JMX → JMeter runs successfully

**Priority:** Critical | **Effort:** 1 day

**Milestone:** At end of Week 3, you have a working tool that converts SAZ to basic JMX scripts

---

## Phase 4: Correlation Detection Engine (Week 4)

### Task 4.1: Correlation Scanner Backend
- [ ] Create `backend/analyzers/correlation_scanner.py`
- [ ] Build pattern library from Screenshot 5 patterns:
  ```python
  patterns = {
      'session_id': r'(?:JSESSIONID|sessionId)["\s:=]+([a-zA-Z0-9]{32,})',
      'csrf_token': r'(?:csrf|_token|__RequestVerificationToken)["\s:=]+([a-zA-Z0-9_-]{20,})',
      'oauth_token': r'"access_token"\s*:\s*"([^"]+)"',
      'viewstate': r'name="__VIEWSTATE" value="([^"]+)"',
      'aspnet_session': r'ASP\.NET_SessionId=([^;]+)',
      'dynamic_id': r'[\w-]{6,}',  # Configurable from UI
  }
  ```
- [ ] Implement scanning algorithm:
  1. For each response, check against all patterns
  2. Extract matched value
  3. Search for that value in subsequent requests
  4. Build correlation candidate object:
     ```python
     {
       'variable_name': 'C_desktops',
       'raw_value': 'desktops',
       'origin_request': 48,
       'origin_response_snippet': 'href="/desktops">Desktops',
       'regex': r'href="/(.+?)">Desktops',
       'template': '$1$',
       'usage_locations': [
         {'request_id': 53, 'location': 'url', 'context': 'https://...com/desktops'},
         {'request_id': 60, 'location': 'header', 'field': 'Referer', 'context': '...'}
       ],
       'confidence': 0.95
     }
     ```
- [ ] Rank correlations by confidence score
- [ ] Filter out false positives (common words, short values)
- [ ] Return sorted list of correlation candidates

**Priority:** Critical | **Effort:** 2.5 days

---

### Task 4.2: Custom Rules Management
Based on Screenshot 1 button and Screenshot 4 "Save as Custom Rule"

- [ ] Create rules library format (JSON):
  ```json
  {
    "rules": [
      {
        "name": "Tricentis Category Extractor",
        "pattern_name": "category_param",
        "regex": "href=\"/(.+?)\">",
        "apply_to": "response",
        "target_field": "body",
        "description": "Extracts category names from links"
      }
    ]
  }
  ```
- [ ] Create "Manage Custom Rules" dialog:
  - List existing rules
  - Add new rule button
  - Edit/Delete existing rules
  - Import/Export rules to JSON file
- [ ] Implement "Save as Custom Rule" feature in correlation editor
- [ ] Apply custom rules during "Rules Correlation" button click
- [ ] Store rules in user preferences directory

**Priority:** Medium | **Effort:** 2 days

---

## Phase 5: Visual Correlation Environment (Week 5)

### Task 5.1: Visual Correlation UI - Main Layout
Based on Screenshot 4 (4-panel layout)

**Create Main Correlation Window:**
- [ ] Open as modal dialog or separate tab
- [ ] Implement 4-panel layout:
  ```
  ┌─────────────────────────────────────────────┐
  │ Visual Correlation Environment              │
  ├──────────────┬──────────────┬───────────────┤
  │ 1. Select    │ 2. Choose    │ 4. View       │
  │ Correlation  │ Origin       │ Details       │
  │ (Tree View)  │ Response     │               │
  │              │              │               │
  │              ├──────────────┤               │
  │              │ 3. Edit,     │               │
  │              │ Validate     │               │
  │              │ Regex        │               │
  ├──────────────┴──────────────┴───────────────┤
  │ [Validate Apply] [Save as Custom Rule]      │
  └─────────────────────────────────────────────┘
  ```
- [ ] Make resizable splitters between panels
- [ ] Add panel headers with step numbers

**Priority:** High | **Effort:** 1.5 days

---

### Task 5.2: Panel 1 - Correlation Tree View
Based on Screenshot 4 (Left Panel)

- [ ] Create hierarchical tree component
- [ ] Display detected correlations with structure:
  ```
  ☑ c_desktops (Raw Value: desktops)
  ☑ c_document (Raw Value: document)
  ☑ c_computers (Raw Value: computers)
    ├─☑ Auto-parametrization
    ├─☑ Usage Locations (1 found)
    └─☐ c_desktops (Raw Value: desktops)
  ```
- [ ] Each item shows:
  - Checkbox for enable/disable
  - Variable name (e.g., `c_computers`)
  - Raw value in parentheses
- [ ] Expandable nodes for details:
  - Auto-parametrization indicator
  - Usage location count with "found" label
- [ ] Allow checkbox toggling
- [ ] Highlight selected correlation
- [ ] Add search/filter functionality

**"Assertions Added (This Session)" Section:**
- [ ] Show list of added assertions below tree
- [ ] Display assertion details

**Priority:** High | **Effort:** 2 days

---

### Task 5.3: Panel 2 - Origin Response Selector
Based on Screenshot 4 (Top-Middle Panel)

**Request List:**
- [ ] Display numbered request list from scan results
- [ ] Format: `#[number]: [URL]`
  ```
  #75: https://demowebshop.tricentis.com/cart
  #61: https://demowebshop.tricentis.com/build-your-cheap-own-compu
  #53: https://demowebshop.tricentis.com/desktops
  #48: https://demowebshop.tricentis.com/computers
  #04: https://demowebshop.tricentis.com/
  ```
- [ ] Highlight selected request (dark background)
- [ ] Show which request is the origin for current correlation
- [ ] Make list scrollable

**Filter Feature:**
- [ ] Add "Filter Requests by Host" input field
- [ ] Add "Apply" button next to filter
- [ ] Implement filtering logic
- [ ] Update list dynamically

**Priority:** High | **Effort:** 1 day

---

### Task 5.4: Panel 3 - Regex Editor & Validator
Based on Screenshot 4 (Bottom-Middle Panel)

**Regex Configuration:**
- [ ] **Variable Name Input:**
  - Label: "Variable Name:"
  - Text input showing variable name (e.g., `c_computers`)
  - Auto-generated from value, editable
- [ ] **Regular Expression Input:**
  - Label: "Regular Expression:"
  - Text input with current regex
  - Show regex visually with syntax highlighting
  - Example: `[\w]*?[Cc]*?Computers` (highlighted button style)
- [ ] **Regex Validator:**
  - Test regex against origin response in real-time
  - Show match count
  - Highlight matched text in Panel 4
  - Show error if regex is invalid
- [ ] **Quick Regex Helpers:**
  - Button: "Use Selection" (creates regex from selected text in Panel 4)
  - Regex cheat sheet tooltip/modal
- [ ] **Template Field** (optional, JMeter template):
  - Default: `$1$`
  - Editable for multiple capture groups

**Priority:** High | **Effort:** 2 days

---

### Task 5.5: Panel 4 - Response Viewer with Details
Based on Screenshot 4 (Right Panel)

**Tabs:**
- [ ] **"Origin Response" tab:**
  - Display full request and response
  - Show headers and body
  - Syntax highlighting (JSON/XML/HTML)
  - Highlight matched regex values in yellow
  - Allow text selection
- [ ] **"Usage in Requests" tab:**
  - Show all requests where this value is used
  - Display context (URL, header, body location)
  - Highlight value in context

**Text Selection → Value Feature:**
- [ ] Allow user to select text in response viewer
- [ ] Add button: **"Use Selection as Value"**
- [ ] When clicked:
  - Set selected text as the raw value
  - Auto-generate regex pattern
  - Auto-generate variable name
  - Update Panel 3 fields

**Search Functionality:**
- [ ] Add search bar with Text/Regex/JSONPath toggles
- [ ] Add Find/Prev/Next buttons
- [ ] Show match counter (e.g., 0/0)
- [ ] Highlight all matches

**Priority:** High | **Effort:** 2.5 days

---

### Task 5.6: Validate & Apply Workflow
- [ ] **"Validate Apply" button logic:**
  1. Test regex against all responses
  2. Find all usage locations
  3. Open validation dialog (Screenshot 3)
  4. Show confirmation
  5. Apply correlations to JMX structure
- [ ] **"Save as Custom Rule" button:**
  - Save current correlation as reusable rule
  - Add to rules library
  - Show success message

**Priority:** High | **Effort:** 1.5 days

---

## Phase 6: Manual Correlation Editor (Week 6)

### Task 6.1: Manual Correlation Interface - 3-Panel Layout
Based on Screenshot 2

**Create Manual Correlation Window:**
- [ ] Open as modal dialog or separate window
- [ ] Implement 3-panel layout:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ Manual Correlation Editor                                    │
  ├──────────────┬──────────────────┬──────────────────────────┤
  │ 1. Select a  │ Raw Request      │ 3. Inspect Response,     │
  │ Filtered     │                  │ Find Usages &            │
  │ Request      │                  │ Add Assertions           │
  │              │                  │                          │
  │              │                  │                          │
  │              │                  │                          │
  └──────────────┴──────────────────┴──────────────────────────┘
  │ Correlations  Assertions Added in This Session             │
  └─────────────────────────────────────────────────────────────┘
  ```

**Priority:** High | **Effort:** 1.5 days

---

### Task 6.2: Panel 1 - Filtered Request List
Based on Screenshot 2 (Left Panel)

- [ ] Display scrollable request list with format:
  ```
  #02: GET http://COMMENT/Launch
  #04: GET https://demowebshop.tricentis.com/
  #44: GET http://COMMENT/ClickOnComputers
  #48: GET https://demowebshop.tricentis.com/computers
  ```
- [ ] Show request number, method, and URL
- [ ] Highlight COMMENT entries (transaction markers) differently
- [ ] Color code by method (GET=blue, POST=green)
- [ ] Make selectable (click to view in middle/right panels)
- [ ] Add search/filter capability
- [ ] Load from selected hosts only

**Priority:** High | **Effort:** 1 day

---

### Task 6.3: Panel 2 - Raw Request Viewer with Toggles
Based on Screenshot 2 (Middle Panel)

**Toggle Buttons:**
- [ ] Add tabs: **Text | Regex | JSONPath**
- [ ] **Text mode:** Plain text display, searchable
- [ ] **Regex mode:** Enable regex search
- [ ] **JSONPath mode:** Enable JSONPath queries (for JSON responses)

**Request Display:**
- [ ] Show full raw request
  ```
  GET https://demowebshop.tricentis.com/desktops HTTP/1.1
  Accept: text/html,application/xhtml+xml...
  Host: demowebshop.tricentis.com
  Referer: https://demowebshop.tricentis.com/computers
  ...
  ```
- [ ] Syntax highlighting
- [ ] Allow text selection
- [ ] Highlight search matches
- [ ] Make scrollable for long requests

**Priority:** High | **Effort:** 1.5 days

---

### Task 6.4: Panel 3 - Response Viewer with Context Menu
Based on Screenshot 2 (Right Panel)

**Response Display:**
- [ ] Show full response headers and body
- [ ] HTML/JSON/XML syntax highlighting
- [ ] Example from screenshot:
  ```html
  HTTP/1.1 200 OK
  Cache-Control: private
  Content-Length: 34921
  Content-Type: text/html; charset=utf-8
  ...
  
  <!DOCTYPE html>
  <html>
  <head>
    <title>Demo Web Shop</title>
  ```
- [ ] Allow text selection

**Context Menu (Right-Click):**
- [ ] Standard: Undo, Redo, Cut, Copy, Paste, Delete, Select All
- [ ] **Custom: "Correlate Selected Text"** ← KEY FEATURE
  - When clicked, opens correlation dialog
  - Pre-fills with selected value
  - Auto-finds usage locations
- [ ] **Custom: "Add Response Assertion"**
  - Opens assertion builder
  - Pre-fills with selected text to verify

**Priority:** Critical | **Effort:** 2 days

---

### Task 6.5: "Correlate Selected Text" Workflow
Based on Screenshots 2 & 3

**When user right-clicks and selects "Correlate Selected Text":**

1. [ ] **Capture Selection:**
   - Get selected text (e.g., "desktops")
   - Get origin request/response context

2. [ ] **Find Usage Locations:**
   - Search all subsequent requests for this value
   - Check: URLs, headers, request bodies
   - Build usage list

3. [ ] **Open Validation Dialog (Screenshot 3):**

**Left Panel:**
- [ ] Show header: "Candidate Usages for Correlation"
- [ ] Display:
  ```
  Value to replace: desktops
  Replacing with: ${C_desktops}
  ```
- [ ] Show "Select All / Deselect All" toggle
- [ ] List all found usages with checkboxes:
  ```
  ☑ #53 in URL: https://demowebshop.tricentis.com/desktops
  ☑ #60 in Header: Referer: https://demowebshop.tricentis.com/addproducttocart/...
  ☑ #61 in Header: Referer: https://demowebshop.tricentis.com/build-your-cheap-own-compu
  ```
- [ ] Pre-check all by default
- [ ] Allow individual toggle

**Right Panel - Request Viewer:**
- [ ] Show full request for selected usage
- [ ] **Highlight value in yellow** (as shown in screenshot)
- [ ] Add search bar with Text/Regex/JSONPath toggle
- [ ] Add Find/Prev/Next buttons with match counter (0/0)
- [ ] Update when different usage is selected from left panel

4. [ ] **Action Buttons:**
   - [ ] "Cancel" - closes dialog, no changes
   - [ ] "Apply to Selected Requests" - creates correlation:
     - Adds RegEx Extractor to origin request
     - Replaces value with `${variable}` in checked requests
     - Updates internal data model
     - Closes dialog

5. [ ] **Confirmation:**
   - Show success message
   - Update "Correlations Added in This Session" section

**Priority:** Critical | **Effort:** 3 days

---

### Task 6.6: Assertions Builder
Based on Screenshot 2 context menu

**When user clicks "Add Response Assertion":**
- [ ] Open assertion dialog
- [ ] Pre-fill with selected text
- [ ] Configure assertion type:
  - Response Assertion (contains/equals/substring/regex)
  - JSON Assertion (JSONPath)
  - XPath Assertion
  - Duration Assertion
- [ ] Set parameters:
  - Field to test (body/headers/code/message)
  - Pattern matching (contains, matches, equals, substring)
  - Patterns to test (editable text area)
- [ ] Apply to current request
- [ ] Show in "Assertions Added in This Session" list

**Priority:** Medium | **Effort:** 1.5 days

---

### Task 6.7: Session Tracking Panel (Bottom)
Based on Screenshot 2 (Bottom section)

- [ ] Create collapsible bottom panel
- [ ] **"Correlations Assertions Added in This Session" header**
- [ ] Display list of added items:
  ```
  Assertion for Req #04: "Demo Web Shop..."
  Correlation: c_desktops (desktops) → Req #53, #60, #61
  ```
- [ ] Show summary of changes
- [ ] Allow removal (undo correlation/assertion)
- [ ] Clear when conversion is complete

**Priority:** Medium | **Effort:** 1 day

---

## Phase 7: Additional Converters (Week 7)

### Task 7.1: Postman Collection Parser
Based on sidebar navigation "JMXGenie-Post2JMX-APIs"

- [ ] Create separate tab for Postman conversion
- [ ] Build UI similar to main UI:
  - File upload for `.json` (Postman Collection v2.1)
  - Configuration options
  - Convert button
- [ ] Create `backend/parsers/postman_parser.py`
- [ ] Parse Postman collection JSON:
  - Collection metadata
  - Folder hierarchy
  - Request details (method, URL, headers, body, auth)
  - Variables ({{var}})
  - Pre-request scripts (basic support)
  - Tests (convert to JMeter assertions)
- [ ] Create `backend/converters/postman_to_jmx.py`
- [ ] Convert to JMX:
  - Map requests to HTTP Samplers
  - Map Postman variables to JMeter User Defined Variables
  - Convert folders to Transaction Controllers
  - Map authentication to JMeter auth managers
- [ ] Test with various Postman collections
- [ ] Write unit tests

**Priority:** Medium | **Effort:** 3 days

---

### Task 7.2: SOAP XML Handler
- [ ] Add SOAP upload option to main UI or separate tab
- [ ] Create `backend/parsers/soap_parser.py`
- [ ] Parse SOAP envelope structure
- [ ] Extract SOAP action, namespace, WSDL
- [ ] Create SOAP HTTP Sampler in JMX
- [ ] Add proper SOAP headers (SOAPAction, Content-Type)
- [ ] Support SOAP 1.1 and 1.2
- [ ] Test with sample SOAP requests
- [ ] Write unit tests

**Priority:** Low | **Effort:** 1.5 days

---

## Phase 8: JMX Generation & Refinement (Week 8)

### Task 8.1: Complete JMX Builder with Correlations
Building on Task 2.2, now add correlation support

- [ ] Integrate correlation data into JMX generation
- [ ] For each correlation, add Regular Expression Extractor:
  ```xml
  <RegexExtractor>
    <stringProp name="RegexExtractor.refname">C_desktops</stringProp>
    <stringProp name="RegexExtractor.regex">href="/(.+?)">Desktops</stringProp>
    <stringProp name="RegexExtractor.template">$1$</stringProp>
    <stringProp name="RegexExtractor.match_number">1</stringProp>
    <stringProp name="RegexExtractor.default">C_desktops_NOT_FOUND</stringProp>
    <stringProp name="TestElement.comments">Original Value: desktops</stringProp>
  </RegexExtractor>
  ```
- [ ] Place extractor as child of origin request sampler
- [ ] Replace hardcoded values with variables in target requests:
  ```
  Original: https://example.com/desktops
  Modified: https://example.com/${C_desktops}
  ```
- [ ] Add User Defined Variables section for configurable values
- [ ] Add Transaction Controllers based on COMMENT markers
- [ ] Name transactions using configured suffix (e.g., S01_MyTest_T001_Launch)
- [ ] Add Think Time controllers if enabled:
  ```xml
  <ConstantTimer>
    <stringProp name="ConstantTimer.delay">1000</stringProp>
  </ConstantTimer>
  ```
- [ ] Configure Thread Group with user settings (threads, ramp-up, duration)
- [ ] Add HTTP Request Defaults (common server, port)
- [ ] Add HTTP Cookie Manager (automatic)
- [ ] Add CSV Data Set Config if variables need external data
- [ ] Add listeners:
  - View Results Tree
  - Aggregate Report (optional)
- [ ] Validate generated XML structure
- [ ] Test in JMeter to ensure script runs

**Priority:** Critical | **Effort:** 3 days

---

### Task 8.2: Transaction Grouping Logic
Based on Screenshot 1 (COMMENT markers) and Screenshot 5 (Transaction Controllers)

- [ ] Identify COMMENT markers in SAZ file
  - Format: `GET http://COMMENT/[transaction_name]`
  - Example: `#02: GET http://COMMENT/Launch`
- [ ] Create Transaction Controller for each COMMENT group:
  ```xml
  <TransactionController>
    <stringProp name="TransactionController.name">S01_MyTest_T001_Launch</stringProp>
    <boolProp name="TransactionController.includeTimers">false</boolProp>
  </TransactionController>
  ```
- [ ] Group all requests between this COMMENT and next COMMENT under this controller
- [ ] Apply transaction suffix from config (e.g., S01_MyTest)
- [ ] Number transactions sequentially (T001, T002, T003...)
- [ ] Handle case where no COMMENTs exist (create single transaction for all)

**Priority:** High | **Effort:** 1.5 days

---

### Task 8.3: JMXRefine Tab (Optional Enhancement)
Based on sidebar "JMXGenie-JMXRefine"

- [ ] Create tab for post-processing JMX files
- [ ] Features:
  - Open existing JMX file
  - View/edit test plan tree
  - Add/remove elements
  - Validate JMX structure
  - Fix common issues
- [ ] Basic JMX editor functionality

**Priority:** Low (Post-MVP) | **Effort:** 4 days

---

### Task 8.4: JReport Tab (Optional Enhancement)
Based on sidebar "JMXGenie-JReport"

- [ ] Create reporting tab
- [ ] Convert JTL results to HTML reports
- [ ] Basic report template with charts
- [ ] Export report functionality

**Priority:** Low (Post-MVP) | **Effort:** 2 days

---

## Phase 9: Testing, Polish & Deployment (Week 9-10)

### Task 9.1: End-to-End Testing
- [ ] Test complete workflow:
  1. Load SAZ file
  2. Select hosts
  3. Configure settings
  4. Scan correlations
  5. Review/edit correlations
  6. Manual correlation workflow
  7. Generate JMX
  8. Open in JMeter
  9. Run test successfully
- [ ] Test with diverse SAZ samples:
  - E-commerce applications
  - Banking/financial apps
  - REST APIs
  - SOAP services
  - OAuth flows
  - .NET applications (ViewState)
- [ ] Document known issues and workarounds
- [ ] Fix critical bugs

**Priority:** Critical | **Effort:** 4 days

---

### Task 9.2: Unit & Integration Tests
- [ ] Write tests for SAZ parser
- [ ] Write tests for Postman parser
- [ ] Write tests for all converters
- [ ] Write tests for correlation scanner
- [ ] Write tests for JMX builder
- [ ] Mock file I/O operations
- [ ] Achieve >75% code coverage
- [ ] Set up pytest configuration
- [ ] Add CI/CD testing (GitHub Actions/Azure Pipelines)

**Priority:** High | **Effort:** 3 days

---

### Task 9.3: UI/UX Polish
- [ ] Refine color scheme (purple accents, dark sidebar)
- [ ] Add loading indicators for all async operations
- [ ] Add progress bars for file parsing and conversion
- [ ] Improve error messages (user-friendly, actionable)
- [ ] Add tooltips for all configuration fields
- [ ] Add keyboard shortcuts:
  - Ctrl+O: Open file
  - Ctrl+S: Save/Convert
  - Ctrl+R: Reset
- [ ] Add dark/light theme toggle (optional)
- [ ] Add help documentation in-app (? icons)
- [ ] Smooth animations and transitions
- [ ] Test on different screen sizes

**Priority:** Medium | **Effort:** 2 days

---

### Task 9.4: Documentation
- [ ] **User Guide:**
  - How to capture SAZ files with Fiddler
  - How to export Postman collections
  - Step-by-step conversion walkthrough
  - How to use correlation features
  - How to configure test settings
  - Troubleshooting common issues
- [ ] **Video Tutorials:**
  - 5-minute quickstart video
  - 15-minute deep dive on correlations
  - Real-world example walkthrough
- [ ] **Developer Documentation:**
  - Architecture overview
  - Code structure
  - How to add new parsers
  - How to add new correlation patterns
  - Contributing guidelines
- [ ] **README:**
  - Installation instructions
  - Quick start guide
  - Features list
  - Screenshots
  - System requirements

**Priority:** High | **Effort:** 3 days

---

### Task 9.5: Packaging & Distribution
- [ ] Package application with electron-builder
- [ ] Create installers:
  - Windows: `.exe` installer (NSIS)
  - macOS: `.dmg` package
  - Linux: `.AppImage` or `.deb`
- [ ] Code signing (optional for internal use)
- [ ] Create portable version (no installation)
- [ ] Test installation on clean machines
- [ ] Create release notes
- [ ] Version numbering (e.g., v1.0.0)
- [ ] Setup update mechanism (optional)

**Priority:** Critical | **Effort:** 2 days

---

### Task 9.6: Deployment & Training
- [ ] Deploy to internal file share or artifact repository
- [ ] Create demo environment with sample SAZ files
- [ ] Conduct training sessions with performance team
- [ ] Gather user feedback
- [ ] Create feedback collection mechanism
- [ ] Plan v1.1 features based on feedback

**Priority:** High | **Effort:** 2 days

---

## Optional Enhancements (Post-MVP / v2.0)

### Performance & Scale
- [ ] Handle very large SAZ files (>100MB) with streaming
- [ ] Parallel processing for faster parsing
- [ ] Optimize correlation scanning for 1000+ requests
- [ ] Add progress indicators with percentage

### Advanced Correlation Features
- [ ] ML-based correlation detection (pattern learning)
- [ ] Confidence scoring improvements
- [ ] Automatic correlation validation (test extraction)
- [ ] Correlation conflict detection and resolution

### Additional Converters
- [ ] HAR file support (browser network exports)
- [ ] cURL command converter
- [ ] Charles Proxy session converter
- [ ] Swagger/OpenAPI to JMX
- [ ] Playwright/Selenium recordings to JMX

### Collaboration Features
- [ ] Cloud-based conversion service
- [ ] Share correlation rules across team (central repository)
- [ ] Version control integration (Git)
- [ ] Collaborative script editing
- [ ] Comments and annotations on correlations

### JMeter Integration
- [ ] Launch JMeter directly from JMXGenie
- [ ] Live preview (show what JMX will look like)
- [ ] JMX diff tool (compare versions)
- [ ] JMX merge tool (combine scripts)
- [ ] Script optimization analyzer (detect bad practices)

### Additional Features
- [ ] Parametrization wizard (CSV data generation)
- [ ] Test data generator from responses
- [ ] API mock server generation
- [ ] Performance test planner (calculate thread counts)
- [ ] Integration with JMeter cloud services (BlazeMeter, Flood.io)

---

## Technology Stack Summary

### Backend (Python)
```
Python 3.9+
- lxml: JMX XML manipulation
- requests: HTTP utilities
- zipfile: SAZ extraction
- json: Postman parsing, JSON handling
- re: Regex operations
- pandas: Data analysis (optional)
- pytest: Testing
```

### Frontend (JavaScript/TypeScript)
```
Electron: Desktop application framework
React 18+: UI library
TypeScript: Type safety
Tailwind CSS / Ant Design: Styling/Components
electron-builder: Packaging
```

### Development Tools
```
VS Code: IDE
Git: Version control
ESLint/Prettier: Code formatting
pytest: Python testing
Jest/React Testing Library: JS testing
```

---

## Success Metrics

### Functionality
- [ ] Successfully parse 95%+ of SAZ files
- [ ] Detect 80%+ of correlations automatically
- [ ] Generate runnable JMX in <15 seconds
- [ ] JMX scripts run in JMeter without errors 90%+ of time

### Performance
- [ ] Parse 100-request SAZ file in <5 seconds
- [ ] Scan correlations in <10 seconds
- [ ] Generate JMX in <5 seconds
- [ ] UI remains responsive (no freezing)

### User Experience
- [ ] Complete conversion workflow in <15 minutes
- [ ] User feedback: "Saves 40%+ of script creation time"
- [ ] Less than 5% of scripts require manual fixes
- [ ] Training time: <30 minutes for new users

---

## Risk Mitigation

### Technical Risks
- **SAZ format variations:** Test with diverse Fiddler versions
- **Complex correlations:** Provide manual override for edge cases
- **Large files:** Implement streaming and progress indication
- **JMX validation:** Test generated scripts extensively in JMeter

### User Adoption Risks
- **Learning curve:** Create excellent documentation and training
- **Change resistance:** Show time savings with side-by-side comparison
- **Trust issues:** Be transparent about what's automated vs manual
- **Support needs:** Create troubleshooting guide and FAQ

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1-2 | Week 1-2 | Project setup, SAZ parser, basic JMX converter |
| Phase 3 | Week 3 | Main UI, host selection, basic conversion working |
| Phase 4 | Week 4 | Correlation scanner, custom rules |
| Phase 5 | Week 5 | Visual correlation environment (4-panel UI) |
| Phase 6 | Week 6 | Manual correlation editor (3-panel UI) |
| Phase 7 | Week 7 | Postman converter, SOAP handler |
| Phase 8 | Week 8 | Complete JMX generation with all features |
| Phase 9-10 | Week 9-10 | Testing, documentation, packaging, deployment |

**Total: 10 weeks (2.5 months) for production-ready MVP**

With 6 months available, you have **ample buffer** for:
- Additional polish and features
- Thorough testing and bug fixes
- User training and feedback incorporation
- v1.1 improvements

---

## Key Differences from Original TODO

### What Changed:
1. ✅ **Restructured phases** to build working prototype earlier (basic conversion by Week 3)
2. ✅ **Added missing UI elements** from screenshots (host selection, config panel, action buttons)
3. ✅ **Combined granular tasks** (correlation features now grouped logically)
4. ✅ **Committed to tech stack** (Electron + React, not "OR PyQt6")
5. ✅ **Detailed UI specifications** based on actual screenshots (4-panel visual editor, 3-panel manual editor)
6. ✅ **Added workflow tasks** (correlate selected text, validate & apply)
7. ✅ **Reprioritized features** (moved OAuth, assertions, stepping threads to lower priority/optional)
8. ✅ **Added session tracking** (show correlations/assertions added in current session)
9. ✅ **More realistic effort estimates** for complex UI components

### What Stayed the Same:
- Core parsers (SAZ, Postman, SOAP)
- Correlation detection engine
- JMX generation logic
- Testing and documentation phases

---

**This revised TODO is based directly on the actual implementation shown in screenshots. Follow this plan to build a tool that matches the proven, working JMXGenie concept.**

Ready to start building? 🚀
