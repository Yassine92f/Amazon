# Feature Distribution — 4 Developers

> Branch model: `main` → `develop` → `feature/<name>`
> All PRs target `develop`. Merge to `main` for releases only.

---

## Dev 1 — `feature/auth`

### Authentication & User Management

**Backend (Clean Architecture):**

| Layer          | Files                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | `entities/User.ts`, `repositories/IUserRepository.ts`, `services/IAuthService.ts`                                                                        |
| Application    | `use-cases/RegisterUser.ts`, `LoginUser.ts`, `RefreshToken.ts`, `ForgotPassword.ts`, `ResetPassword.ts`, `UpdateProfile.ts`, `ManageAddresses.ts`        |
| Infrastructure | `models/UserModel.ts`, `repositories/MongoUserRepository.ts`, `services/JwtService.ts`, `services/EmailService.ts`                                       |
| Interfaces     | `controllers/AuthController.ts`, `controllers/UserController.ts`, `middlewares/auth.ts`, `middlewares/authorize.ts`, `routes/auth.ts`, `routes/users.ts` |

**Frontend:**

- Zustand auth store (`client/src/store/authStore.ts`)
- Axios client with JWT interceptors (`client/src/lib/api.ts`)
- Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Pages: `/account`, `/account/addresses`, `/account/preferences`
- Components: `LoginForm`, `RegisterForm`, `AccountSidebar`, `AddressForm`

**Shared types used:**

```
User, UserRole, UserStatus, UserPreferences, UserSummary, Address
RegisterRequest, LoginRequest, AuthResponse
RefreshTokenRequest, ChangePasswordRequest
ForgotPasswordRequest, ResetPasswordRequest
UpdateProfileRequest, UpdatePreferencesRequest
AddAddressRequest, UpdateAddressRequest
```

**Acceptance criteria:**

- [ ] Register with email/password, receive JWT pair
- [ ] Login returns access token (15min) + refresh token (7d)
- [ ] Refresh token rotation (old token invalidated on use)
- [ ] Protected routes return 401 without valid token
- [ ] RBAC middleware blocks unauthorized roles
- [ ] Password reset via email link
- [ ] User can update profile, manage addresses, set preferences
- [ ] Passwords hashed with bcrypt (min 12 rounds)

---

## Dev 2 — `feature/products`

### Product Catalog & Categories

**Backend (Clean Architecture):**

| Layer          | Files                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain         | `entities/Product.ts`, `entities/Category.ts`, `repositories/IProductRepository.ts`, `repositories/ICategoryRepository.ts`                                               |
| Application    | `use-cases/CreateProduct.ts`, `UpdateProduct.ts`, `SearchProducts.ts`, `GetProduct.ts`, `ManageCategories.ts`                                                            |
| Infrastructure | `models/ProductModel.ts`, `models/CategoryModel.ts`, `repositories/MongoProductRepository.ts`, `repositories/MongoCategoryRepository.ts`, `cache/ProductCacheService.ts` |
| Interfaces     | `controllers/ProductController.ts`, `controllers/CategoryController.ts`, `routes/products.ts`, `routes/categories.ts`                                                    |

**Frontend:**

- Pages: `/products/[slug]`, `/categories/[slug]`, `/search`
- Components: `ProductDetail`, `ProductGrid`, `SearchResults`, `FiltersSidebar`, `CategoryGrid`, `Breadcrumbs`
- API hooks: `useProducts`, `useProduct`, `useCategories`, `useSearch`

**Shared types used:**

```
Product, ProductVariant, ProductSummary, ProductSearchFilters
Category, CategoryWithCount
CreateProductRequest, UpdateProductRequest
PaginatedResponse<ProductSummary>
```

**Acceptance criteria:**

- [ ] CRUD products (seller-only for create/update/delete)
- [ ] Product variants (size, color) with independent stock & price
- [ ] Category tree (parent → children) with slugs
- [ ] Full-text search with filters (price range, brand, rating, in-stock)
- [ ] Pagination with configurable sort (price, rating, newest)
- [ ] Redis cache on popular queries (invalidate on product update)
- [ ] Product detail page with image gallery, variants selector, reviews summary
- [ ] SEO: dynamic metadata from product data

---

## Dev 3 — `feature/cart-orders`

### Cart, Checkout, Orders & Stripe Payment

**Backend (Clean Architecture):**

| Layer          | Files                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | `entities/Cart.ts`, `entities/Order.ts`, `entities/Wishlist.ts`, `repositories/ICartRepository.ts`, `repositories/IOrderRepository.ts`, `services/IPaymentService.ts`                                                        |
| Application    | `use-cases/ManageCart.ts`, `CreateOrder.ts`, `ProcessPayment.ts`, `UpdateOrderStatus.ts`, `ApplyCoupon.ts`, `ManageWishlist.ts`                                                                                              |
| Infrastructure | `models/OrderModel.ts`, `models/WishlistModel.ts`, `repositories/RedisCartRepository.ts`, `repositories/MongoOrderRepository.ts`, `services/StripePaymentService.ts`                                                         |
| Interfaces     | `controllers/CartController.ts`, `controllers/OrderController.ts`, `controllers/PaymentController.ts`, `controllers/WishlistController.ts`, `routes/cart.ts`, `routes/orders.ts`, `routes/payments.ts`, `routes/wishlist.ts` |

**Frontend:**

- Pages: `/cart`, `/checkout`, `/checkout/success`, `/orders`, `/orders/[id]`, `/wishlist`
- Components: `CartDrawer`, `CartItem`, `CheckoutForm`, `PaymentForm` (Stripe Elements), `OrderTimeline`, `WishlistGrid`
- Zustand stores: `cartStore.ts`, `wishlistStore.ts`

**Shared types used:**

```
Cart, CartItem, AddToCartRequest, UpdateCartItemRequest
Order, OrderItem, OrderStatus, OrderSummary, DeliveryType
CreateOrderRequest, UpdateOrderStatusRequest
Payment, PaymentStatus, PaymentMethod
CreatePaymentIntentRequest, CreatePaymentIntentResponse
ConfirmPaymentRequest, RefundRequest, StripeWebhookEvent
Wishlist, WishlistItem
ApplyCouponRequest, CouponValidation
```

**Acceptance criteria:**

- [ ] Cart stored in Redis (guest) or MongoDB (authenticated)
- [ ] Add/update/remove items with real-time stock validation
- [ ] Checkout: address selection, delivery type, coupon code
- [ ] Stripe PaymentIntent flow (create → confirm → webhook)
- [ ] Webhook handles `payment_intent.succeeded`, `charge.refunded`
- [ ] Order created only after successful payment
- [ ] Order status lifecycle: pending → confirmed → processing → shipped → delivered
- [ ] Order history with filters (status, date range)
- [ ] Wishlist add/remove with heart toggle on ProductCard
- [ ] Coupon validation (percentage or fixed discount)

---

## Dev 4 — `feature/seller-admin`

### Seller Dashboard, Admin Panel & Real-Time

**Backend (Clean Architecture):**

| Layer          | Files                                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain         | `entities/Review.ts`, `entities/Notification.ts`, `entities/Conversation.ts`, `repositories/IReviewRepository.ts`, `repositories/INotificationRepository.ts`                                                                                                                                                                   |
| Application    | `use-cases/CreateReview.ts`, `RespondToReview.ts`, `GetSellerDashboard.ts`, `GetAdminDashboard.ts`, `ManageUsers.ts`, `VerifySeller.ts`, `SendNotification.ts`, `ManageMessages.ts`                                                                                                                                            |
| Infrastructure | `models/ReviewModel.ts`, `models/NotificationModel.ts`, `models/ConversationModel.ts`, `models/MessageModel.ts`, `repositories/Mongo*.ts`                                                                                                                                                                                      |
| Interfaces     | `controllers/ReviewController.ts`, `controllers/SellerController.ts`, `controllers/AdminController.ts`, `controllers/NotificationController.ts`, `controllers/MessageController.ts`, `routes/reviews.ts`, `routes/seller.ts`, `routes/admin.ts`, `routes/notifications.ts`, `routes/messages.ts`, `websocket/SocketHandler.ts` |

**Frontend:**

- Pages: `/seller/dashboard`, `/seller/products`, `/seller/orders`, `/seller/reviews`
- Pages: `/admin/dashboard`, `/admin/users`, `/admin/sellers`, `/admin/orders`
- Pages: `/products/[slug]#reviews` (review form), `/messages`
- Components: `SellerDashboard`, `SalesChart`, `AdminUserTable`, `ReviewCard`, `ReviewForm`, `SellerResponseForm`, `ChatWindow`, `NotificationDropdown`
- Real-time: Socket.io client integration for notifications & messages

**Shared types used:**

```
SellerProfile, SellerSummary, SellerDashboardStats
UpdateSellerProfileRequest, RegisterSellerRequest, VerifySellerRequest
AdminDashboardStats, AdminUserSearchParams, UpdateUserStatusRequest
Review, CreateReviewRequest, SellerReviewResponse
Notification, NotificationType, NotificationPayload
Message, Conversation, MessagePayload, SendMessagePayload
ServerToClientEvents, ClientToServerEvents
OrderStatusPayload, CartUpdatedPayload, PriceDropPayload
```

**Acceptance criteria:**

- [ ] Seller dashboard: revenue, orders, top products, rating (SellerDashboardStats)
- [ ] Seller can manage their products (list, edit, deactivate)
- [ ] Seller can view & respond to reviews
- [ ] Seller registration flow with admin verification
- [ ] Admin dashboard: platform KPIs, revenue, user growth (AdminDashboardStats)
- [ ] Admin can search/filter users, suspend/activate accounts
- [ ] Admin can verify/reject seller applications
- [ ] Real-time notifications via Socket.io (order updates, new reviews, messages)
- [ ] Buyer-seller messaging with conversation threads
- [ ] Price drop notifications for wishlisted products

---

## Dependencies & Recommended Order

```
Week 1-2:  feature/auth ─────────────────► (blocking — everyone needs auth)
              │
Week 2-3:    ├── feature/products ────────► (can start once auth middleware is done)
              │
Week 3-4:    ├── feature/cart-orders ─────► (needs products API for cart items)
              │
Week 3-5:    └── feature/seller-admin ────► (needs products + orders for dashboards)
```

### Parallel work strategy

| Week | Dev 1          | Dev 2                   | Dev 3                | Dev 4                  |
| ---- | -------------- | ----------------------- | -------------------- | ---------------------- |
| 1    | Auth backend   | Product domain + models | Cart domain + models | Review domain + models |
| 2    | Auth frontend  | Product API + search    | Stripe integration   | Socket.io setup        |
| 3    | Profile pages  | Product pages           | Checkout flow        | Seller dashboard       |
| 4    | Polish + tests | Category pages          | Order tracking       | Admin panel            |
| 5    | Code review    | Code review             | Code review          | Messaging + notifs     |

### Integration points

- **Auth middleware** → shared as soon as available (Dev 2, 3, 4 depend on it)
- **Product API** → Dev 3 needs `GET /api/products/:id` for cart validation
- **Order API** → Dev 4 needs order data for seller dashboard
- **Socket.io server** → Dev 4 sets up, Dev 3 emits order events through it

### Conventions reminder

- Branch from `develop`, PR back to `develop`
- Commit format: `type: description` (`feat`, `fix`, `chore`, `refactor`, `test`, `docs`)
- All code in English, all types from `@ecommerce/shared`
- Clean Architecture: domain has ZERO external deps
- Run `pnpm lint && pnpm build` before pushing
