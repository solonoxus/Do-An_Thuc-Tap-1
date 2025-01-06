const express = require('express');
const router = express.Router();
const CartController = require('../apicontrollers/cart');
const isAuth = require('../middleware/is-auth');

// Middleware để parse JSON và log thông tin
const parseJsonBody = (req, res, next) => {
    // Đảm bảo body được parse đúng
    if (req.headers['content-type'] === 'application/json') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
                console.log('Request Body:', req.body);
                console.log('Request Session:', req.session);
                next();
            } catch (error) {
                console.error('JSON Parse Error:', error);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid JSON' 
                });
            }
        });
    } else {
        console.log('Request Body:', req.body);
        console.log('Request Session:', req.session);
        next();
    }
};

// Cart API routes
router.get('/api/cart', isAuth, CartController.getCart);
router.post('/api/cart', isAuth, CartController.addToCart);
router.delete('/api/cart/:productId', isAuth, CartController.removeFromCart);
router.put('/api/cart/:productId', isAuth, CartController.updateCartItem);

// Cart view routes
router.get('/cart', isAuth, CartController.getCartPage);
router.post('/cart', isAuth, CartController.postCart);

// Ensure this route matches the client-side request
router.post('/cart/delete-item', isAuth, (req, res, next) => {
    console.log('Delete Item Route Hit - Body:', req.body);
    console.log('Delete Item Route Hit - Session:', req.session);
    next();
}, parseJsonBody, CartController.postCartDeleteProduct);

module.exports = router;
