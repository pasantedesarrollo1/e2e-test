# Smoke Route Health Architecture Guide

## Overview
This directory contains the **Smoke Tests** for route health validation across the Wanqara application. 
Unlike the `regression` suites which validate complex business logic, the goal of these tests is purely infrastructural: **Ensure that every critical URL route resolves with a 200 OK and renders its primary component without crashing into an Error Boundary (404/500).**

---

## 1. Architecture: Inline Data-Driven Testing (DDT)

Unlike the Regression suites which utilize a strict **JSON-driven DDT architecture**, the Smoke suite utilizes an **Inline DDT** approach via JavaScript arrays. 

### Why not JSON?
Smoke tests require executing micro-assertions (like verifying a specific header text). By keeping the payload as a native JavaScript array within the `.spec.js` file, we can inject Lambda functions directly into the test config:

```javascript
{ path: "/pos/close-cash-register", assert: (p) => assertTextContains(p, "Cierre de Caja") }
```
Serializing these functions into JSON would require over-engineered parsers. Since smoke tests are meant to be ultra-lightweight and lack combinatorial business rules, the inline JS array is the optimal pattern.

---

## 2. The Legos (Helpers)

The core logic is abstracted in the `harness/` directory:
*   **`smoke-nav.js -> generateSmokeTests`**: The orchestrator loop. It takes the array of routes, wraps each in a Playwright `test()`, authenticates, navigates to the URL, checks that no `/error` URL is hit, and executes the custom assertion.
*   **`smoke-assertions.js`**: Contains reusable, resilient assertions (e.g., `assertTextContains`, `assertMainContains`) to verify that the page successfully rendered its core component.

---

## 3. How to Add a New Route Health Check

To add a new route, simply find the corresponding domain spec (e.g., `finanzas-tesoreria.spec.js`) and add a new object to the array:

```javascript
generateSmokeTests(tenantBaseUrl, [
  // ... existing routes
  { 
    path: "/mi-nueva-ruta", 
    assert: (p) => assertTextContains(p, "Título Esperado") 
  },
]);
```

---

## 4. Execution

To run all route health checks globally to verify system stability (e.g., post-deployment):

```bash
npx playwright test e2e/Wanqara/smoke/route-health/ --grep "@smoke"
```
