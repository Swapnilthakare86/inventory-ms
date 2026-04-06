const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { verifyToken, isAdmin, isAdminOrStaff } = require('../middleware/auth');
router.get('/', verifyToken, ctrl.getAll);
router.post('/', verifyToken, isAdminOrStaff, ctrl.create);
router.put('/:id', verifyToken, isAdminOrStaff, ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.remove);
module.exports = router;
