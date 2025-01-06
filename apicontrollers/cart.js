const Cart = require('../models/cart');
const Product = require('../models/newproduct');

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart) {
            return res.json({ items: [] });
        }
        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            cart = new Cart({
                userId: req.user._id,
                items: []
            });
        }

        const existingItemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: productId,
                quantity: quantity
            });
        }

        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );

        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(item => 
            item.productId.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCartPage = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        res.render('product/page-cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            cart: cart || { items: [] }
        });
    } catch (error) {
        console.error('Get cart page error:', error);
        res.status(500).render('error', {
            error: error,
            message: 'Could not load cart'
        });
    }
};

exports.postCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            cart = new Cart({
                userId: req.user._id,
                items: []
            });
        }

        const existingItemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            cart.items.push({
                productId: productId,
                quantity: parseInt(quantity)
            });
        }

        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Post cart error:', error);
        res.status(500).render('error', {
            error: error,
            message: 'Could not add to cart'
        });
    }
};

exports.postCartDeleteProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            return res.redirect('/cart');
        }

        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );

        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Delete from cart error:', error);
        res.status(500).render('error', {
            error: error,
            message: 'Could not delete from cart'
        });
    }
};
