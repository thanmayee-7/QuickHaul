const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('./middleware/auth');
const authController = require('./controllers/authController');
const vehicleController = require('./controllers/vehicleController');
const bookingController = require('./controllers/bookingController');
const driverController = require('./controllers/driverController');
const adminController = require('./controllers/adminController');
const supportController = require('./controllers/supportController');
const paymentController = require('./controllers/paymentController');
const reviewController = require('./controllers/reviewController');
const notificationController = require('./controllers/notificationController');

// 1. Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);

// 2. Vehicle categories and fare estimation
router.get('/vehicles/categories', vehicleController.getCategories);
router.post('/vehicles/estimate', vehicleController.estimateFare);

// 3. Bookings routes
router.post('/bookings', authenticate, bookingController.createBooking);
router.get('/bookings/my-customer', authenticate, bookingController.getCustomerBookings);
router.get('/bookings/my-driver', authenticate, requireRole('driver'), bookingController.getDriverBookings);
router.get('/bookings/:id', authenticate, bookingController.getBookingById);
router.get('/bookings/:id/tracking', authenticate, bookingController.getTracking);
router.put('/bookings/:id/accept', authenticate, requireRole('driver'), bookingController.acceptBooking);
router.put('/bookings/:id/status', authenticate, requireRole('driver', 'admin'), bookingController.updateTripStatus);
router.put('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);

// 4. Driver specific routes
router.put('/driver/availability', authenticate, requireRole('driver'), driverController.toggleOnline);
router.put('/driver/location', authenticate, requireRole('driver'), driverController.updateLocation);
router.put('/driver/documents', authenticate, requireRole('driver'), driverController.updateDocuments);
router.get('/driver/earnings', authenticate, requireRole('driver'), driverController.getEarningsDashboard);
router.post('/driver/payout', authenticate, requireRole('driver'), driverController.requestPayout);

// 5. Admin routes
router.get('/admin/stats', authenticate, requireRole('admin'), adminController.getDashboardStats);
router.get('/admin/drivers', authenticate, requireRole('admin'), adminController.getDrivers);
router.put('/admin/drivers/:id/verify', authenticate, requireRole('admin'), adminController.verifyDriver);
router.get('/admin/bookings', authenticate, requireRole('admin'), adminController.getBookings);
router.get('/admin/users', authenticate, requireRole('admin'), adminController.getUsers);
router.put('/admin/users/:id/status', authenticate, requireRole('admin'), adminController.toggleUserStatus);
router.get('/admin/transactions', authenticate, requireRole('admin'), adminController.getTransactions);
router.put('/admin/categories/:id/pricing', authenticate, requireRole('admin'), adminController.updateCategoryPricing);

// 6. Support & dispute desk
router.post('/support/tickets', authenticate, supportController.createTicket);
router.get('/support/my-tickets', authenticate, supportController.getUserTickets);
router.get('/support/all-tickets', authenticate, requireRole('admin'), supportController.getAllTickets);
router.put('/support/tickets/:id', authenticate, requireRole('admin'), supportController.updateTicket);

// 7. Payments
router.post('/payments/process', authenticate, paymentController.processPayment);
router.get('/payments/history', authenticate, paymentController.getTransactions);

// 8. Reviews
router.post('/reviews', authenticate, reviewController.addReview);
router.get('/reviews/driver/:driverId', reviewController.getDriverReviews);

// 9. Notifications
router.get('/notifications', authenticate, notificationController.getNotifications);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
