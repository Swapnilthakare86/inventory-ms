# Inventory Management System - UAT Test Cases

## Document Info

- Project: Inventory Management System
- Scope: Frontend, backend-integrated user workflows, role-based access, reporting, and profile management
- Test Type: User Acceptance Testing (UAT)
- Environment: UAT / Staging
- Roles Covered: Admin, Staff, User

## Test Data Setup

- At least 1 `admin` account exists
- At least 1 `staff` account exists
- At least 1 `user` account exists
- Categories and suppliers are available for product creation
- At least 3 products exist:
  - one with healthy stock
  - one with low stock (`1-5`)
  - one out of stock (`0`)
- SMTP is configured for forgot-password testing
- Image upload storage is configured for product image testing

## UAT Status Values

- `Pass`
- `Fail`
- `Blocked`
- `Not Run`

## UAT Test Cases

| Test ID | Module | Role | Test Scenario | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-001 | Authentication | User | Login with valid credentials | User account exists | Open login page, enter valid email/password, click login | User logs in successfully and lands on authorized area | Run |
| UAT-002 | Authentication | User | Login with invalid password | User account exists | Enter valid email and wrong password, click login | Error message is shown and login is blocked | Run |
| UAT-003 | Authentication | User | Register new account | Registration enabled | Open register page, fill required fields, submit form | Account is created successfully and user can log in |  Run |
| UAT-004 | Authentication | User | Register with duplicate email | Existing account uses email | Open register page, use existing email, submit | Registration is blocked with duplicate email message | Run |
| UAT-005 | Authentication | User | Forgot password request | SMTP configured, user exists | Open forgot password page, enter registered email, submit | Reset link confirmation is shown and email is sent | Run |
| UAT-006 | Authentication | User | Reset password with valid token | Reset link received | Open reset password URL, enter valid new password, submit | Password is updated successfully and user can log in with new password | Run |
| UAT-007 | Authentication | User | Reset password with invalid or expired token | Invalid or expired token available | Open reset password page with bad token, submit new password | Reset is blocked with invalid/expired token message | Run |
| UAT-008 | Authorization | Admin | Admin can access admin routes | Admin logged in | Navigate to admin dashboard, users, suppliers, categories, orders | All admin pages open successfully | Run |
| UAT-009 | Authorization | Staff | Staff cannot access admin-only pages | Staff logged in | Try to open admin users, suppliers, categories pages | Access is blocked or redirected | Run |
| UAT-010 | Authorization | User | User cannot access staff/admin pages | User logged in | Try to open admin or staff URLs manually | Access is blocked or redirected | Run |
| UAT-011 | Session | Any | Logout clears active session | User logged in | Click logout | Session is cleared and app returns to login page | Run |
| UAT-012 | Session | Any | Expired/invalid token forces login | Browser has invalid token | Refresh app or perform API action | User is redirected to login and local session is cleared | Run |
| UAT-013 | Dashboard | Admin | Admin dashboard loads KPIs and charts | Admin logged in, data exists | Open dashboard | KPI cards, order/revenue chart, stock chart, top products, order summary, recent orders are displayed | Run |
| UAT-014 | Dashboard | Staff | Staff dashboard loads operational summary | Staff logged in | Open dashboard | Dashboard loads with charts, low-stock info, and order summary | Run |
| UAT-015 | Dashboard | Admin/Staff | Date filter updates dashboard values | Orders exist across dates | Switch between Today, This Week, This Month, All | Dashboard cards and charts update according to selected date range | Run |
| UAT-016 | Dashboard | Admin/Staff | Low stock alert is shown when applicable | At least one product has stock <= 5 | Open dashboard | Low-stock alert appears with correct count |  Run |
| UAT-017 | Products | Admin | Create product with valid data | Categories and suppliers exist | Open products, click Add Product, fill required fields, submit | Product is created and visible in product list | Run |
| UAT-018 | Products | Admin/Staff | Edit product details | Existing product exists | Open edit product modal, change values, submit | Product data is updated in the list | Run |
| UAT-019 | Products | Admin/Staff | Delete product | Existing product exists | Click delete on product, confirm action | Product is deleted from list | Run |
| UAT-020 | Products | Admin/Staff | Upload product image | Upload storage configured | Create or edit product, upload supported image file | Image uploads successfully  | Run |
| UAT-021 | Products | Admin/Staff | Product form required field validation | Open add/edit product modal | Leave mandatory fields empty and submit | Form blocks submission and required validation is shown |  Run |
| UAT-022 | Products | Admin/Staff | Search product by name or supplier | Products available | Enter search text in product search | Matching products are filtered correctly | Run |
| UAT-023 | Products | Admin/Staff | Filter products by category | Multiple categories available | Select category filter | Only products from chosen category are shown | Run |
| UAT-024 | Products | Admin/Staff | Filter products by stock status | Products with low/out/healthy stock exist | Apply Low Stock and Out of Stock filters | Product list updates correctly for selected stock condition | Run |
| UAT-025 | Products | Admin/Staff | Export product list to CSV | Filtered products available | Click Export CSV in products page | CSV file downloads with filtered product data | Run |
| UAT-026 | Categories | Admin | Create category | Admin logged in | Add new category with name and description | Category is created successfully | Run |
| UAT-027 | Categories | Admin | Update category | Existing category exists | Edit category and save | Category details are updated | Run |
| UAT-028 | Categories | Admin | Delete category | Existing category exists | Delete category and confirm | Category is removed successfully |  Run |
| UAT-029 | Suppliers | Admin | Create supplier | Admin logged in | Add supplier with valid details | Supplier is created successfully | Run |
| UAT-030 | Suppliers | Admin | Update supplier | Existing supplier exists | Edit supplier and save | Supplier details are updated | Run |
| UAT-031 | Suppliers | Admin | Delete supplier | Existing supplier exists | Delete supplier and confirm | Supplier is removed successfully |  Run |
| UAT-032 | Users | Admin | View user list | Admin logged in | Open Users page | User list loads with name, email, role, address |  Run |
| UAT-033 | Users | Admin | Create new user with valid details | Admin logged in | Click Add User, fill valid values, submit | New user is created successfully |  Run |
| UAT-034 | Users | Admin | Validate create-user form | Admin logged in | Leave fields empty or enter invalid values, submit | Validation messages appear for required fields, email, password, and minimum lengths |  Run |
| UAT-035 | Users | Admin | Delete user | Non-critical user account exists | Delete user and confirm | User is deleted successfully |  Run |
| UAT-036 | Orders | User | Place order with sufficient stock | User logged in, product stock available | Open products, choose product, place order with valid quantity | Order is created and stock is reduced |  Run |
| UAT-037 | Orders | User | Prevent order when stock is insufficient | Product stock lower than requested quantity | Attempt to place order with quantity greater than stock | Order is blocked with stock-related error |  Run |
| UAT-038 | Orders | User | View own orders only | User has orders | Open My Orders page | User sees only their own orders |  Run |
| UAT-039 | Orders | User | Cancel own order in placed state | User has order with status `placed` | Open own orders, cancel placed order | Order status becomes cancelled and stock is restored |  Run |
| UAT-040 | Orders | User | Prevent cancellation of received order | User has order with status `received` | Attempt to cancel received order | Cancellation is blocked with proper message |  Run |
| UAT-041 | Orders | Admin/Staff | View all orders | Admin or staff logged in | Open orders page | Full order list is displayed with customer, product, quantity, total, date, status |  Run |
| UAT-042 | Orders | Admin/Staff | Mark placed order as received | Order exists with status `placed` | Click receive action and confirm | Order status changes to received | Run |
| UAT-043 | Orders | Admin/Staff | Cancel order from orders page | Order exists and is not already cancelled | Click cancel action and confirm | Order status becomes cancelled and stock is restored where applicable |  Run |
| UAT-044 | Orders | Admin/Staff | Filter orders by status | Orders of mixed statuses exist | Apply status filters | Only matching status orders are shown |  Run |
| UAT-045 | Orders | Admin/Staff | Filter orders by date range | Orders exist across multiple dates | Apply Today, This Week, This Month, All Time filters | Order list and revenue summary update correctly |  Run |
| UAT-046 | Orders | Admin/Staff | View order details modal | Orders exist | Click or tap an order row | Order details modal opens with complete order information | Not Run |
| UAT-047 | Orders | Admin/Staff | Export orders to CSV | Filtered orders available | Click Export CSV on orders page | CSV file downloads with current filtered order data | Not Run |
| UAT-048 | Profile | Any logged-in role | Update profile name and address | Logged in | Open profile page, update name/address, save | Profile updates successfully |  Run |
| UAT-049 | Profile | Any logged-in role | Validate profile name rules | Logged in | Enter very short name or numeric characters and save | Validation blocks invalid name values |  Run |
| UAT-050 | Profile | Any logged-in role | Change password with valid data | Logged in, current password known | Enter current password, strong new password, confirm it, submit | Password changes successfully and user is logged out afterward |  Run |
| UAT-051 | Profile | Any logged-in role | Prevent password change when current password is wrong | Logged in | Enter wrong current password and submit | Password change is blocked with error message |  Run |
| UAT-052 | Profile | Any logged-in role | Prevent password change for weak password | Logged in | Enter weak new password and submit | Validation blocks submission with strength guidance |  Run |
| UAT-053 | Profile | Any logged-in role | Prevent password change when confirmation does not match | Logged in | Enter mismatched new/confirm passwords and submit | Validation blocks submission with mismatch message |  Run |
| UAT-054 | Reporting | Admin/Staff | Reporting service health reachable | Services are running | Call/open health endpoint or page integration | Reporting microservice responds successfully |  Run |
| UAT-055 | Reporting | Admin/Staff | Charts endpoint returns data | Orders/products exist | Trigger chart data consumption or API validation | Chart datasets are returned successfully |  Run |
| UAT-056 | Reporting | Admin/Staff | Orders export endpoint returns CSV | Orders exist | Trigger orders export from reporting service/API | CSV response downloads successfully |  Run |
| UAT-057 | Reporting | Admin/Staff | Stock export endpoint returns CSV | Products exist | Trigger stock export from reporting service/API | CSV response downloads successfully |  Run |



