const express = require('express');
const router = express.Router();
const vnpayController = require('../apicontrollers/vnpay');
const isAuth = require('../middleware/is-auth');

router.post('/create_payment_url', isAuth, vnpayController.createPayment);
router.get('/vnpay_return', vnpayController.vnpayReturn);

module.exports = router;
