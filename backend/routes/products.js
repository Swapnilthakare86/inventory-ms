const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');
router.get('/', verifyToken, ctrl.getAll);
router.post('/', verifyToken, isAdmin, ctrl.create);
router.put('/:id', verifyToken, isAdmin, ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.remove);
module.exports = router;