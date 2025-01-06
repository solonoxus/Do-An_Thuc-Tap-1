const Cart = require('../models/cart');
const Product = require('../models/newproduct');

// Middleware to ensure user identification
const getUserId = (req) => {
    // Try multiple ways to get user ID
    return (req.user?._id || req.session?.user?._id);
};

exports.getCart = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
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
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
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
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const productId = req.params.productId;
        const cart = await Cart.findOne({ userId });
        
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
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = await Cart.findOne({ userId });
        
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
        const userId = getUserId(req);
        if (!userId) {
            return res.redirect('/login');
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
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
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
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
        // Log toàn bộ thông tin để debug
        console.log('Delete Product Request:', {
            body: req.body, 
            session: req.session, 
            user: req.user
        });

        // Xác định user ID từ nhiều nguồn
        const userId = 
            (req.user && req.user._id) || 
            (req.session.user && req.session.user._id);

        const productId = req.body.productId;

        // Kiểm tra tính hợp lệ của dữ liệu
        if (!userId) {
            console.error('Unauthorized: No user ID found');
            return res.status(401).json({ 
                success: false, 
                error: 'Bạn cần đăng nhập để thực hiện thao tác này' 
            });
        }

        if (!productId) {
            console.error('Bad Request: No product ID');
            return res.status(400).json({ 
                success: false, 
                error: 'Thiếu ID sản phẩm' 
            });
        }

        // Tìm giỏ hàng và nạp thông tin sản phẩm
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            model: 'NewProduct'
        });
        
        if (!cart) {
            console.error('Cart Not Found:', userId);
            return res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy giỏ hàng' 
            });
        }

        // Log chi tiết các mục trong giỏ hàng
        console.log('Cart Items Before Delete:', cart.items.map(item => ({
            productId: item.productId._id.toString(),
            productName: item.productId.name,
            quantity: item.quantity
        })));

        // Tìm và xóa sản phẩm
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => 
            item.productId._id.toString() !== productId
        );

        // Kiểm tra xem sản phẩm có được xóa không
        if (cart.items.length === initialLength) {
            console.error('Product Not Found in Cart:', productId);
            return res.status(404).json({ 
                success: false, 
                error: 'Sản phẩm không tồn tại trong giỏ hàng' 
            });
        }

        // Tính toán lại tổng giá trị
        cart.sum = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.price);
        }, 0);

        // Lưu giỏ hàng
        await cart.save();
        
        console.log('Product Deleted Successfully:', productId);
        return res.json({ 
            success: true, 
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            cart: {
                items: cart.items,
                sum: cart.sum
            }
        });
    } catch (error) {
        console.error('Lỗi xóa sản phẩm khỏi giỏ hàng:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Đã xảy ra lỗi khi xóa sản phẩm',
            details: error.message
        });
    }
};
