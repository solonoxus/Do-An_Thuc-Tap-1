const express = require('express');
const router = express.Router();
const CartController = require('../apicontrollers/cart');
const isAuth = require('../middleware/is-auth');

// Cart API routes
router.get('/api/cart', isAuth, CartController.getCart);
router.post('/api/cart', isAuth, CartController.addToCart);
router.delete('/api/cart/:productId', isAuth, CartController.removeFromCart);
router.put('/api/cart/:productId', isAuth, CartController.updateCartItem);

// Cart view routes
router.get('/cart', isAuth, CartController.getCartPage);
router.post('/cart', isAuth, CartController.postCart);
router.post('/cart/delete-item', isAuth, CartController.postCartDeleteProduct);

module.exports = router;
