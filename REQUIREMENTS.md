# MASTER DEVELOPMENT PROMPT — YADADRI STAY

## 1. Project Overview

Act as a senior full-stack software architect, Android developer, backend engineer, database designer, UI/UX designer and QA engineer.

Build a complete, functional, end-to-end accommodation booking platform called **Yadadri Stay**.

This application is exclusively for pilgrims and visitors travelling to Yadadri Lakshmi Narasimha Swamy Temple, Telangana, India.

The purpose is to connect pilgrims with local lodges and hotels around Yadadri so they can check room availability and reserve accommodation in advance.

The platform must benefit both:
- Pilgrims, who can find and reserve accommodation before arriving.
- Local lodge owners, who can manage online and offline bookings and maintain accurate room availability.

This is similar in concept to OYO, but exclusively focused on accommodation around Yadadri.

**IMPORTANT INSTRUCTIONS:**
- Do not ask me additional questions.
- Do not stop after generating UI designs.
- Do not generate a frontend-only prototype.
- Do not provide pseudocode instead of implementation.
- Implement all frontend, backend, database, authentication, booking and admin functionality.
- Connect all screens to functional APIs.
- Run the application, test the major workflows, fix errors and build the Android APK.
- Prioritize free and open-source technologies.
- Do not introduce paid APIs or subscriptions unless absolutely unavoidable.
- Make sensible technical decisions wherever implementation details are not specified.

---

# 2. Application Architecture

Develop three connected applications.

### A. Customer Android Application
Native Android application for pilgrims.

Technology:
- Kotlin
- Jetpack Compose
- Material 3
- MVVM architecture
- Retrofit for API communication
- Coroutines
- Navigation Compose
- Room for appropriate local caching

### B. Lodge Owner Dashboard
Responsive web application.

Technology:
- React.js
- Vite
- Tailwind CSS
- Node.js API integration

### C. Super Admin Dashboard
Separate administrative web interface.

Technology:
- React.js
- Vite
- Tailwind CSS
- Role-based access control

### Backend

- Node.js
- Express.js
- MongoDB Atlas free tier
- Mongoose
- REST APIs
- JWT authentication
- Role-based authorization
- Secure password hashing
- Input validation
- API error handling

Use a modular, maintainable architecture.

All three applications must communicate with the same backend and database.

---

# 3. User Roles

Implement three separate roles.

## Role 1: Customer

Customers can:
- Register and log in using their mobile number.
- Browse lodges.
- Search available rooms.
- View lodge photographs and videos.
- Compare prices.
- View room categories.
- Check availability by date.
- View Google Maps-compatible locations.
- Book rooms.
- Pay advances through UPI QR.
- Submit transaction references and payment screenshots.
- View booking confirmations.
- Contact lodge owners.
- Contact platform support.
- Request transport assistance.
- View booking history.
- Download booking receipts.
- Cancel bookings.
- Submit reviews after completed stays.

## Role 2: Lodge Owner

Every approved lodge owner gets a separate account.

Owners can:
- Register their lodge.
- Submit lodge details for approval.
- Upload photographs and videos.
- Add room categories.
- Configure room prices.
- Configure room capacities.
- Set total room counts.
- Update date-wise availability.
- Record offline bookings.
- View online bookings.
- View offline bookings.
- Manage their lodge information.
- View advance payments collected by the platform.
- View remaining amounts customers must pay.
- View daily, weekly and monthly booking reports.

Owners must only access their own properties and data.

## Role 3: Super Admin

The super admin has complete platform control.

Features:
- Add, edit, approve, reject and deactivate lodges.
- Manage lodge owner accounts.
- Manage customer accounts.
- View all bookings.
- Manage online and offline bookings.
- Verify UPI payments.
- Manage cancellation and refund requests.
- Manage transport assistance requests.
- View booking and revenue reports.
- Handle customer complaints.
- Moderate customer reviews.
- Configure advance payment percentages.
- Configure booking rules.
- Configure cancellation policies.
- Manage the platform's UPI QR code.
- Maintain activity logs.
- View important platform statistics.

Create the first super admin through a secure environment-based setup process. Never expose default admin credentials in the public application.

---

# 4. Customer Android Application

## Home Screen

Create a modern, attractive home screen inspired by premium hotel booking applications.

The home screen should combine:
- Yadadri Temple imagery.
- Welcome message.
- Room search functionality.
- Transport assistance.
- Nearby lodge listings.
- Map-based lodge discovery.
- Language selection.

Search form:
- Check-in date.
- Check-out date.
- Number of adults.
- Number of children.
- Number of rooms.
- Search button.

Display nearby lodge cards containing:
- Lodge photograph.
- Lodge name.
- Starting room price.
- Distance from Yadadri Temple.
- AC / Non-AC availability.
- Parking availability.
- Average customer rating.
- Availability status.

## Lodge Search

Implement these filters:

1. Distance from temple — nearest first.
2. Price — low to high.
3. Price — high to low.
4. AC / Non-AC.
5. Vehicle parking availability.
6. Room capacity.
7. Only available lodges.

Search results must be based on the selected check-in and check-out dates.

## Lodge Details Screen

Every lodge must have a detailed profile.

Display:
- Lodge name.
- Full address.
- Google Maps location or OpenStreetMap-compatible location.
- Distance from temple.
- Contact number.
- Multiple photographs.
- Video gallery.
- Room categories.
- Room prices.
- Room capacity.
- AC / Non-AC details.
- Parking facilities.
- Other facilities.
- Customer ratings.
- Customer reviews.
- Availability calendar.

Allow lodge owners to upload multiple photographs and short videos.

Support separate media galleries for individual room categories.

Use a suitable image/video storage solution with a free tier and configurable storage provider. Implement upload limits and compression.

## Room Selection

Support both room-based and person-based selection.

Example:

| Room category | Capacity | Example price |
|---|---:|---:|
| Single room | 1 | ₹400 |
| Double room | 2 | ₹600 |
| Triple room | 3 | ₹800 |
| Family room | 4–5 | ₹1,200 |

These are demonstration values only. Actual prices must be configured by lodge owners.

Customers must be able to:
- Select room category.
- Select number of rooms.
- Enter adults and children.
- View maximum room occupancy.
- View the total price.
- View the required advance payment.
- View the remaining amount.

Prevent customers from exceeding the configured occupancy.

---

# 5. Booking Management System

This is one of the most important modules.

Implement a proper date-wise room inventory system.

## Fixed Check-in and Check-out

Default timings:
- Check-in: 12:00 PM.
- Check-out: 11:00 AM.

Allow super admin to configure the default timings and individual lodge-specific timings.

Customers select dates, not arbitrary check-in times.

Calculate room charges according to the number of nights.

## Date-wise Inventory

Inventory must be maintained separately for every:
- Lodge.
- Room category.
- Date.

Example:

A lodge has 10 AC double rooms.

| Date | Available |
|---|---:|
| October 31 | 4 |
| November 1 | 7 |
| November 2 | 0 |

For a multi-night booking, availability must be checked for every occupied night.

The maximum bookable quantity must never exceed availability on any night.

## Online Booking

Implement this workflow:

1. Customer selects lodge.
2. Customer selects room category.
3. Customer selects dates.
4. Backend verifies availability.
5. System temporarily locks the required room inventory for 10 minutes.
6. Customer sees the platform UPI QR.
7. Customer pays the advance.
8. Customer uploads payment screenshot.
9. Customer enters UPI transaction reference ID.
10. Payment becomes pending verification.
11. Admin verifies the actual bank transaction.
12. Admin approves or rejects the payment.
13. Approved payment converts the reservation into a confirmed booking.
14. Customer receives an in-app confirmation.

IMPORTANT INVENTORY RULES:

- Use atomic inventory updates to prevent simultaneous overbooking.
- Never rely only on frontend availability checks.
- Use MongoDB transactions where supported or another reliable atomic reservation design.
- Expire abandoned payment sessions after 10 minutes.
- If a customer has submitted payment evidence within the permitted time, keep the inventory reserved while admin verification is pending, subject to an explicit verification timeout and admin escalation process.
- Never release inventory for a submitted, unverified payment without resolving the payment state.
- Reject duplicate transaction reference IDs.
- Maintain payment and booking audit logs.
- Restore inventory when a booking is cancelled or expires, where appropriate.

## Offline Booking

Lodge owners must be able to record direct walk-in reservations.

Required fields:
- Booking type: Offline.
- Room category.
- Number of rooms.
- Check-in date.
- Check-out date.
- Customer name.
- Customer contact number.

When an offline booking is saved:
- Automatically reduce room availability.
- Update inventory for every occupied night.
- Prevent online customers from booking the same inventory.
- Store the offline booking record.
- Allow owners to view and edit permitted booking details.

Online and offline bookings must share the same inventory system.

---

# 6. Payment System — No Paid Payment Gateway

Do NOT integrate Razorpay, Stripe or another paid payment gateway for the initial version.

Use manual UPI QR payments.

## Payment Workflow

1. Customer selects a room.
2. System calculates total room charges.
3. Admin-configured advance percentage is applied.
4. Customer sees the platform's UPI QR code.
5. Customer scans the QR through Google Pay, PhonePe or another UPI application.
6. Customer makes the payment.
7. Customer uploads a screenshot.
8. Customer enters the transaction reference ID.
9. Admin verifies the payment in the actual bank account.
10. Admin approves or rejects the transaction.
11. Approved payment confirms the booking.

The UPI QR code must be configurable by the super admin.

Store:
- Booking ID.
- Customer ID.
- Lodge ID.
- Total amount.
- Advance amount.
- Remaining amount.
- Transaction reference ID.
- Payment screenshot URL.
- Payment status.
- Verification timestamp.
- Admin who verified the payment.

Payment statuses:
- Awaiting payment.
- Payment submitted.
- Pending verification.
- Verified.
- Rejected.
- Refund pending.
- Refunded.

Do not automatically trust uploaded screenshots.

Display a clear warning that payment is confirmed only after admin verification.

## Payment Distribution

All online advance payments go to the platform's configured business UPI account.

The platform maintains lodge-wise advance payment records.

Create settlement records showing:
- Lodge owner.
- Booking.
- Advance received.
- Settlement amount.
- Settlement status.
- Settlement date.

Do not implement automatic bank transfers.

The platform admin handles settlements manually.

The remaining room balance is paid directly by the customer to the lodge during check-in.

No platform commission, subscription or convenience fee initially.

---

# 7. Cancellation Policy

Initial policy:

- Advance payments are non-refundable when customers voluntarily cancel.
- Cancellation policy must be displayed before payment.
- Customer can request cancellation through My Bookings.
- Admin can process cancellation.
- Inventory must be restored correctly.

Important exception:

If the lodge cancels a confirmed booking or cannot provide the reserved room, provide a full-refund workflow for the customer.

Allow super admin to manage exceptional refund cases.

---

# 8. Lodge Owner Dashboard

Create a responsive dashboard with:

### Dashboard Overview
- Total room categories.
- Total rooms.
- Today's arrivals.
- Upcoming reservations.
- Available rooms.
- Occupied rooms.
- Pending payment verification.
- Online booking count.
- Offline booking count.

### Room Management

Owners can:
- Create room categories.
- Edit room categories.
- Upload room photographs.
- Set room prices.
- Set room capacity.
- Set total room counts.
- Manage AC / Non-AC details.
- Manage date-wise availability.

### Pricing Rules

If an owner changes the room price:
- Existing confirmed bookings must retain the original price.
- The new price applies only to new bookings.
- Store a price snapshot in every booking.

### Offline Booking Management

Owners must record complete offline booking details.

### Financial Dashboard

Display:
- Online booking details.
- Offline booking details.
- Advance amounts collected by the platform.
- Remaining balances payable by customers.
- Daily reports.
- Weekly reports.
- Monthly reports.

Clearly distinguish actual money received from expected amounts.

---

# 9. Super Admin Dashboard

Build a professional admin dashboard with a sidebar.

Modules:

1. Overview.
2. Lodge Management.
3. Lodge Owner Management.
4. Customer Management.
5. Booking Management.
6. Payment Verification.
7. Refund Management.
8. Transport Assistance.
9. Customer Reviews.
10. Complaints and Support.
11. Revenue and Booking Reports.
12. Platform Settings.
13. Activity Logs.

## Lodge Approval

Owners submit lodge registrations.

Admin can:
- Review details.
- Review photographs.
- Verify contact information.
- Verify location.
- Approve.
- Reject with reason.
- Deactivate.

Only approved and active lodges appear in customer searches.

## Payment Verification

Display pending payments with:
- Booking ID.
- Customer.
- Lodge.
- Amount.
- Transaction ID.
- Screenshot.
- Submission time.

Provide Approve and Reject actions.

Require confirmation before approving a payment.

## Reports

Generate:
- Daily bookings.
- Weekly bookings.
- Monthly bookings.
- Online bookings.
- Offline bookings.
- Lodge-wise booking statistics.
- Payment verification reports.
- Advance collection reports.
- Refund reports.

Allow CSV export.

---

# 10. Transport Assistance

IMPORTANT: This is NOT a ride-hailing application.

Do not create driver accounts, driver registration, live vehicle tracking or an in-app driver marketplace.

Transport is centrally managed by the platform's own team.

Customers can:
- Open Transport Assistance.
- Select Auto or Car.
- Enter the number of passengers.
- Enter their lodge or pickup location.
- Enter their destination.
- Enter their preferred travel time.
- Call the platform support team.

Display a prominent Call Our Team button.

The team will speak with the customer and manually arrange a vehicle through locally available transport providers.

The admin dashboard should store and manage transport assistance requests.

No automatic driver assignment.

---

# 11. WhatsApp and Notifications

Do not integrate paid WhatsApp Business API automation.

Implement:

- In-app booking confirmations.
- Booking ID generation.
- WhatsApp sharing using Android's native share intent or WhatsApp deep links.
- Pre-filled confirmation message.
- Manual WhatsApp communication.

Example message:

"Your Yadadri Stay booking has been submitted.

Booking ID: YS20260001
Lodge: Sri Lakshmi Lodge
Room: AC Double
Check-in: 31 October
Check-out: 1 November
Advance: ₹200

Payment verification status: Pending.

Thank you for choosing Yadadri Stay."

Only display confirmed status after admin verification.

Implement local or in-app reminders where practical.

Do not depend on paid SMS services.

---

# 12. Ratings and Reviews

Only customers with completed bookings can submit reviews.

Features:
- 1–5 star rating.
- Written review.
- Optional photographs.
- Average lodge rating.
- Review history.
- Admin moderation.
- One review per completed booking.

---

# 13. Customer My Bookings

Create a dedicated My Bookings section.

Display:
- Upcoming reservations.
- Booking ID.
- Lodge name.
- Room category.
- Number of rooms.
- Check-in and check-out.
- Total charges.
- Advance paid.
- Remaining balance.
- Payment status.
- Lodge contact number.
- Maps directions.
- Cancellation option.
- Previous booking history.
- Downloadable PDF receipt.

---

# 14. Maps and Location

The application is specifically for Yadadri Temple surroundings.

Every lodge must have latitude and longitude.

Display:
- Lodge location.
- Distance from temple.
- Directions.
- Nearby lodge markers.

Prefer OpenStreetMap-based mapping or free-compatible map solutions.

Google Maps can be opened through an external map link without requiring a paid Google Maps API integration.

Avoid paid map dependencies.

---

# 15. Languages

Support two languages initially:

1. English.
2. Telugu.

Implement proper localization.

All important text must be translated:
- Home screen.
- Search.
- Room categories.
- Booking process.
- Payment instructions.
- Cancellation policy.
- Notifications.
- Customer support.

Provide a language selector.

Use Telugu Unicode fonts correctly.

---

# 16. UI/UX Design Requirements

Create a polished, modern Android application.

Design inspiration:
- OYO.
- MakeMyTrip.
- Booking.com.

However, the design must be original.

Visual direction:
- Clean and professional.
- Temple-inspired identity.
- White/light backgrounds.
- Warm saffron or muted orange accents.
- Deep maroon or dark brown secondary accents.
- Rounded cards.
- Clear typography.
- High-quality image galleries.
- Simple navigation.
- Large touch targets.
- Easy-to-understand booking flow.

The application should be usable by older pilgrims who may not be very familiar with technology.

Avoid unnecessary animations and complicated screens.

Create:
- Splash screen.
- Onboarding.
- Login and registration.
- Home.
- Search results.
- Lodge details.
- Room selection.
- Booking checkout.
- UPI payment.
- Payment verification status.
- Booking confirmation.
- My Bookings.
- Transport Assistance.
- Reviews.
- Profile.
- Settings.

Use proper loading states, empty states and error messages.

---

# 17. Zero-Cost Technology Requirements

The project should prioritize free tools and free tiers.

Suggested services:

| Requirement | Technology |
|---|---|
| Android | Kotlin |
| Backend | Node.js + Express |
| Database | MongoDB Atlas free tier |
| Admin UI | React |
| Owner UI | React |
| Image storage | Cloudinary free tier or configurable alternative |
| Authentication | JWT + password hashing |
| Maps | OpenStreetMap |
| Payment | UPI QR |
| WhatsApp | Native sharing |
| Android build | Gradle |
| Version control | Git + GitHub |
| API testing | Postman |

Important cost constraints:

- Avoid paid OTP providers. Use mobile-number registration with password/PIN authentication for the zero-cost MVP. Do not falsely claim that SMS OTP is free.
- Avoid paid payment gateways.
- Avoid paid WhatsApp automation.
- Avoid mandatory Google Maps API billing.
- Avoid mandatory paid hosting.
- Do not hardcode service credentials.
- Support environment variables and configurable service providers.
- Document limitations of free-tier storage, hosting and bandwidth.
- The app must allow the backend URL to be configured for local testing and deployment.

The application must not pretend to be production-hosted just because the APK has been generated.

---

# 18. Database Design

Create proper MongoDB schemas and relationships for:

1. Users.
2. Customers.
3. LodgeOwners.
4. Lodges.
5. RoomCategories.
6. RoomInventory.
7. Bookings.
8. OfflineBookings.
9. Payments.
10. PaymentScreenshots.
11. Settlements.
12. Reviews.
13. TransportRequests.
14. Complaints.
15. Notifications.
16. AdminSettings.
17. ActivityLogs.

Use indexes for:
- Lodge search.
- Room availability.
- Booking IDs.
- User phone numbers.
- Payment transaction IDs.
- Lodge and room-category combinations.

Implement appropriate unique constraints and validation.

Do not store passwords in plain text.

Do not expose private payment screenshots publicly.

---

# 19. Backend API Requirements

Create properly organized REST APIs.

Example modules:

- /api/auth
- /api/users
- /api/lodges
- /api/owners
- /api/rooms
- /api/inventory
- /api/bookings
- /api/offline-bookings
- /api/payments
- /api/settlements
- /api/reviews
- /api/transport
- /api/complaints
- /api/admin
- /api/reports
- /api/settings

Implement:
- Authentication middleware.
- Authorization middleware.
- Input validation.
- Secure file uploads.
- Error handling.
- Pagination.
- Search and filters.
- Rate limiting.
- Logging.
- API documentation.

---

# 20. Security Requirements

Implement:

- JWT authentication.
- Password hashing with bcrypt or Argon2.
- Role-based authorization.
- Secure admin access.
- Owner-level data isolation.
- File type validation.
- Upload size limits.
- Rate limiting.
- Input sanitization.
- Secure environment configuration.
- Duplicate payment reference detection.
- Audit logs.
- Protection against booking race conditions.
- No secrets committed to GitHub.

Do not trust client-side calculations for prices or availability.

All important calculations and booking validations must happen on the backend.

---

# 21. Testing Requirements

Before delivering the project, test the following workflows.

### Customer tests
- Registration.
- Login.
- Lodge browsing.
- Search filters.
- Date selection.
- Room selection.
- Advance calculation.
- QR payment display.
- Payment screenshot submission.
- Booking status.
- Booking history.
- Cancellation.
- Receipt download.

### Lodge owner tests
- Registration.
- Lodge submission.
- Admin approval.
- Room category creation.
- Price modification.
- Availability updates.
- Offline booking.
- Online booking visibility.
- Financial reports.

### Admin tests
- Login.
- Lodge approval.
- Owner management.
- Payment verification.
- Booking management.
- Cancellation.
- Refund processing.
- Reports.
- Review moderation.

### Critical concurrency tests
- Two customers trying to reserve the last room.
- Offline booking during an online payment attempt.
- Multiple room categories.
- Multi-night booking.
- Expired temporary reservation.
- Pending payment verification.
- Duplicate payment transaction ID.

Fix all critical bugs before generating the final APK.

---

# 22. Final Deliverables

This is the most important instruction.

I do not want only source code explanations.

I want the completed application and downloadable build artifacts.

Generate:

1. Complete Android Studio project.
2. Complete Node.js backend source.
3. Complete React Super Admin dashboard.
4. Complete React Lodge Owner dashboard.
5. MongoDB database schemas and setup scripts.
6. Environment variable example file.
7. API documentation.
8. README with installation instructions.
9. Test results.
10. A working Android APK.

### APK Requirements

Build a debug APK that can be installed directly on an Android device.

If possible, also prepare a release APK with instructions for signing it using my own keystore.

The APK must contain the actual implemented customer application, not screenshots or a web mockup.

Configure the API base URL so the Android application can communicate with the deployed backend.

If backend hosting is not available, provide instructions to configure and deploy it separately.

### Final output structure

Provide a downloadable project ZIP containing:

YadadriStay/
- android-app/
- backend/
- admin-dashboard/
- owner-dashboard/
- database/
- documentation/
- tests/
- README.md
- .env.example

Also provide the standalone APK separately.

### Final acceptance criteria

The project is complete only when:

- The Android application builds successfully.
- The APK can be installed.
- Customers can register and log in.
- Lodge owners can register and submit properties.
- Admin can approve lodges.
- Approved lodges appear in the customer app.
- Owners can manage room categories and availability.
- Customers can search available rooms.
- Online and offline bookings use shared inventory.
- UPI QR payment submission works.
- Admin payment verification works.
- Booking confirmation works.
- The dashboards communicate with the same backend.
- The major workflows have been tested.

If any external service requires credentials, provide a clear setup guide and a working configuration screen or environment variable.

Do not fabricate test success or claim that external services are connected when they are not.

**FINAL INSTRUCTION:**

Build the entire Yadadri Stay platform end-to-end in one development task. Make reasonable assumptions, implement the full system, execute tests, fix build errors, generate the APK, package the source code and provide downloadable deliverables.

Do not stop to ask me questions. Start implementation immediately.

can i paste this and will it build?