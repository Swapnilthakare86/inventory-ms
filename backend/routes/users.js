const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');
router.get('/', verifyToken, isAdmin, ctrl.getAll);
router.post('/', verifyToken, isAdmin, ctrl.create);
router.delete('/:id', verifyToken, isAdmin, ctrl.remove);
router.put('/profile', verifyToken, ctrl.updateProfile);
router.put('/change-password', verifyToken, ctrl.changePassword);
module.exports = router;