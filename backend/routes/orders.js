const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');
router.get('/', verifyToken, isAdmin, ctrl.getAll);
router.get('/my', verifyToken, ctrl.getMyOrders);
router.post('/', verifyToken, ctrl.placeOrder);
router.patch('/:id/status', verifyToken, ctrl.updateStatus);
module.exports = router;