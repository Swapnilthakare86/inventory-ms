const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { verifyToken, isAdmin, isAdminOrStaff } = require('../middleware/auth');
router.get('/', verifyToken, isAdminOrStaff, ctrl.getAll);
router.get('/my', verifyToken, ctrl.getMyOrders);
router.post('/', verifyToken, ctrl.placeOrder);
router.patch('/:id/status', verifyToken, isAdminOrStaff, ctrl.updateStatus);
module.exports = router;
