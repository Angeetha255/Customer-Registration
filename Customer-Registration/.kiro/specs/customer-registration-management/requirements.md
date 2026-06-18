# Requirements Document

## Introduction

The Customer Registration and Management System is a full-stack web application built with React.js (frontend), Node.js + Express.js (backend), and MongoDB (database). It provides customer self-registration with auto-generated unique Customer IDs, a referral/introducer mechanism, JWT-based authentication, a customer dashboard, and a comprehensive admin panel for managing and reporting on registered customers.

---

## Glossary

- **System**: The Customer Registration and Management System as a whole.
- **Customer**: A registered end-user of the system.
- **Admin**: A privileged user with access to the admin panel and management features.
- **Registration_Form**: The React frontend form used by customers to register.
- **Customer_ID**: A unique, system-generated identifier for each customer in the format "INT" followed by 5 random numeric digits (e.g., INT12345).
- **Introducer_ID**: A Customer_ID belonging to an existing customer who referred the new registrant.
- **Auth_Service**: The backend service responsible for authentication, JWT issuance, and session management.
- **Customer_Service**: The backend service responsible for customer CRUD operations.
- **Admin_Service**: The backend service responsible for admin-specific operations.
- **Dashboard**: The authenticated customer-facing page showing personal account information.
- **Admin_Panel**: The authenticated admin-facing interface for managing all customers.
- **JWT**: JSON Web Token used for stateless authentication.
- **Password_Service**: The backend component responsible for securely hashing and verifying passwords using bcrypt.
- **Validator**: The backend component responsible for validating incoming request data.
- **Notification**: An in-app visual message (success, error, or warning) displayed to the user.
- **Pagination_Service**: The component responsible for paginating large data sets in list views.
- **Export_Service**: The backend component responsible for generating Excel and PDF exports of customer data.
- **Referral_Service**: The backend component responsible for tracking and reporting introducer/referral relationships.

---

## Requirements

### Requirement 1: Customer Registration

**User Story:** As a new user, I want to register an account using a form, so that I can access the system and receive a unique Customer ID.

#### Acceptance Criteria

1. THE Registration_Form SHALL include the following fields: Full Name, Email Address, Phone Number, Password, Confirm Password, and Introducer ID (optional).
2. WHEN a user submits the Registration_Form, THE Validator SHALL verify that Full Name, Email Address, Phone Number, Password, and Confirm Password fields are non-empty before processing.
3. WHEN a user submits the Registration_Form with a Password and Confirm Password that do not match, THE Validator SHALL reject the submission and display a descriptive error message.
4. WHEN a user submits the Registration_Form with an Email Address that already exists in the database, THE Validator SHALL reject the submission and return an error indicating the email is already in use.
5. WHEN a user submits the Registration_Form with an Introducer ID, THE Validator SHALL verify that the provided Introducer ID corresponds to an existing Customer_ID in the database before processing.
6. IF the provided Introducer ID does not correspond to an existing Customer_ID, THEN THE Validator SHALL reject the submission and return a descriptive error message.
7. WHEN all validation checks pass, THE Customer_Service SHALL generate a unique Customer_ID in the format "INT" followed by 5 random numeric digits.
8. WHEN generating a Customer_ID, THE Customer_Service SHALL verify the generated ID does not already exist in the database and regenerate until a unique value is produced.
9. WHEN a valid registration is submitted, THE Password_Service SHALL hash the password using bcrypt before persisting the customer record.
10. WHEN a customer record is successfully created, THE Customer_Service SHALL store Full Name, Email Address, Phone Number, hashed password, Customer_ID, Introducer ID (if provided), and Registration Date in MongoDB.
11. WHEN registration is successful, THE System SHALL display the generated Customer_ID on a success page.

---

### Requirement 2: Customer Authentication

**User Story:** As a registered customer, I want to log in and log out securely, so that I can access my protected dashboard.

#### Acceptance Criteria

1. WHEN a customer submits valid login credentials (email and password), THE Auth_Service SHALL issue a signed JWT with the Customer_ID and role embedded in the payload.
2. WHEN a customer submits login credentials with an email that does not exist, THE Auth_Service SHALL return an error message without disclosing which field is incorrect.
3. WHEN a customer submits a login with an incorrect password, THE Auth_Service SHALL return an error message without disclosing which field is incorrect.
4. THE Auth_Service SHALL set JWT expiry to a defined, non-zero duration.
5. WHEN a customer requests a protected route without a valid JWT, THE Auth_Service SHALL reject the request with a 401 Unauthorized response.
6. WHEN a customer logs out, THE System SHALL invalidate the active session token on the client side and redirect the customer to the login page.
7. WHILE a customer is authenticated, THE System SHALL protect all Dashboard routes from unauthenticated access.

---

### Requirement 3: Customer Dashboard

**User Story:** As a logged-in customer, I want to view my account details on a dashboard, so that I can see my registration information including my Customer ID.

#### Acceptance Criteria

1. WHEN an authenticated customer accesses the Dashboard, THE Dashboard SHALL display the Customer_ID, Full Name, Email Address, Phone Number, Registration Date, and Introducer ID (if the customer provided one during registration).
2. THE Dashboard SHALL be accessible only to authenticated customers with a valid JWT.
3. WHEN an unauthenticated user attempts to access the Dashboard, THE System SHALL redirect the user to the login page.

---

### Requirement 4: Customer Profile Update

**User Story:** As a logged-in customer, I want to update my profile information, so that I can keep my details current.

#### Acceptance Criteria

1. WHEN an authenticated customer submits a profile update with valid data, THE Customer_Service SHALL update Full Name, Phone Number, and Email Address in the database.
2. WHEN an authenticated customer submits a profile update with an Email Address already used by another customer, THE Validator SHALL reject the update and return a descriptive error message.
3. WHEN a profile update is successful, THE System SHALL display a success Notification to the customer.
4. IF a profile update fails due to a server error, THEN THE System SHALL display an error Notification and preserve the customer's existing data.

---

### Requirement 5: Forgot Password

**User Story:** As a customer, I want to reset my forgotten password, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a customer submits a Forgot Password request with a registered email, THE Auth_Service SHALL send a password reset link to that email address.
2. WHEN a customer submits a Forgot Password request with an email that does not exist in the database, THE Auth_Service SHALL return a response that does not confirm or deny whether the email is registered.
3. WHEN a customer follows the reset link and submits a new password, THE Password_Service SHALL hash the new password using bcrypt and update the stored credential.
4. WHEN a password reset link has already been used, THE Auth_Service SHALL reject further use of that link and display an appropriate error message.
5. WHEN a password reset link expires, THE Auth_Service SHALL reject it and prompt the customer to request a new reset link.

---

### Requirement 6: Admin Authentication

**User Story:** As an admin, I want to log in to the admin panel with separate credentials, so that I can manage the system securely.

#### Acceptance Criteria

1. WHEN an admin submits valid admin credentials, THE Auth_Service SHALL issue a JWT with the Admin role embedded in the payload.
2. WHEN a non-admin user attempts to access an Admin_Panel route with a customer JWT, THE Auth_Service SHALL reject the request with a 403 Forbidden response.
3. WHEN an unauthenticated user attempts to access an Admin_Panel route, THE Auth_Service SHALL reject the request with a 401 Unauthorized response.
4. THE System SHALL maintain separate login pages for Admin and Customer roles.

---

### Requirement 7: Admin Customer Management

**User Story:** As an admin, I want to view, search, edit, and delete customer records, so that I can manage the customer base effectively.

#### Acceptance Criteria

1. WHEN an authenticated admin accesses the customer list, THE Admin_Service SHALL return all registered customer records with Pagination_Service applied.
2. WHEN an authenticated admin submits a search query with a Customer_ID, Introducer_ID, Name, Email, or Phone Number, THE Admin_Service SHALL return all customer records that match the search criteria.
3. WHEN an authenticated admin submits an edit request for a customer record with valid data, THE Customer_Service SHALL update the specified customer record in the database.
4. WHEN an authenticated admin submits a delete request for a customer record, THE Admin_Service SHALL permanently remove the customer record from the database.
5. WHEN customer records are listed, THE Admin_Service SHALL support sorting by Registration Date in both ascending and descending order.
6. WHEN an authenticated admin requests a customer list page, THE Pagination_Service SHALL return a defined number of records per page along with the total record count and current page number.

---

### Requirement 8: Admin Dashboard and Statistics

**User Story:** As an admin, I want to see registration statistics on the admin dashboard, so that I can monitor customer growth.

#### Acceptance Criteria

1. WHEN an authenticated admin accesses the Admin_Panel dashboard, THE Admin_Service SHALL return the total count of all registered customers.
2. WHEN an authenticated admin accesses the Admin_Panel dashboard, THE Admin_Service SHALL return the count of customers who registered on the current calendar day.
3. WHEN an authenticated admin accesses the Admin_Panel dashboard, THE Admin_Service SHALL return the most recently registered customers as a list, limited to a defined maximum count.
4. WHEN an authenticated admin accesses the Admin_Panel dashboard, THE Admin_Service SHALL return customer registration counts grouped by a defined time period (e.g., daily, monthly) for use in growth charts.

---

### Requirement 9: Export Customer Data

**User Story:** As an admin, I want to export customer data to Excel or PDF, so that I can use the data for reporting outside the system.

#### Acceptance Criteria

1. WHEN an authenticated admin requests an Excel export, THE Export_Service SHALL generate and return a valid .xlsx file containing all customer records with column headers matching the customer data fields.
2. WHEN an authenticated admin requests a PDF export, THE Export_Service SHALL generate and return a valid .pdf file containing all customer records formatted in a tabular layout.
3. WHEN an export is triggered, THE System SHALL display a loading indicator until the file is ready for download.
4. IF an export fails due to a server error, THEN THE Export_Service SHALL return an error response and THE System SHALL display an error Notification to the admin.

---

### Requirement 10: Referral Tracking

**User Story:** As an admin, I want to view referral relationships between customers using Introducer IDs, so that I can track how customers are referring others.

#### Acceptance Criteria

1. WHEN an authenticated admin queries referral data for a specific Customer_ID, THE Referral_Service SHALL return all customers whose Introducer_ID matches the queried Customer_ID.
2. THE Referral_Service SHALL store the Introducer_ID as a reference to the introducer's Customer_ID in the customer record.
3. WHEN a customer completes registration with a valid Introducer_ID, THE Referral_Service SHALL record the referral relationship in the database.

---

### Requirement 11: Role-Based Access Control

**User Story:** As a system operator, I want all routes and features to be protected by role-based access control, so that customers cannot access admin features and vice versa.

#### Acceptance Criteria

1. THE System SHALL assign one of two roles to every authenticated user: "customer" or "admin".
2. WHEN a request is made to a customer-only route with an admin JWT, THE Auth_Service SHALL reject the request with a 403 Forbidden response.
3. WHEN a request is made to an admin-only route with a customer JWT, THE Auth_Service SHALL reject the request with a 403 Forbidden response.
4. THE Auth_Service SHALL embed the user role in the JWT payload and validate it on every protected route request.

---

### Requirement 12: UI and User Experience

**User Story:** As a user, I want a responsive and intuitive interface with clear feedback, so that I can navigate the system easily on any device.

#### Acceptance Criteria

1. THE System SHALL render correctly on viewport widths from 320px to 2560px without horizontal scrolling or content overflow.
2. WHEN a form is submitted with invalid data, THE Registration_Form SHALL display inline validation error messages adjacent to the invalid fields before the request is sent to the backend.
3. WHEN a backend operation is in progress, THE System SHALL display a loading indicator to the user.
4. WHEN a backend operation completes successfully, THE System SHALL display a success Notification.
5. IF a backend operation fails, THEN THE System SHALL display an error Notification with a descriptive message.
6. THE System SHALL include a sidebar navigation component visible on all authenticated pages for both Customer and Admin roles.
