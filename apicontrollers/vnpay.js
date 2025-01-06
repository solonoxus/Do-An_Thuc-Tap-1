const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const config = require('../config/vnpay');
const OrderModel = require('../models/order');
const UserModel = require('../models/user');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = {
    createPayment: async function(req, res) {
        try {
            const { fullname, mobilenumber, address, selectedProducts, paymentMethod } = req.body;
            
            // Validate required fields
            if (!fullname || !mobilenumber || !address || !selectedProducts) {
                return res.status(400).json({error: 'Thiếu thông tin thanh toán'});
            }

            // Lấy thông tin user và giỏ hàng
            const user = await UserModel.findById(req.session.user._id)
                .populate('cart.items.productId');

            if (!user) {
                return res.status(404).json({error: 'Không tìm thấy thông tin người dùng'});
            }

            // Parse selected products
            const selectedProductIds = JSON.parse(selectedProducts);
            const selectedItems = user.cart.items.filter(item => 
                selectedProductIds.includes(item.productId._id.toString())
            );

            // Tính tổng tiền
            const total = selectedItems.reduce((sum, item) => {
                return sum + (item.productId.price * item.quantity);
            }, 0);

            // Tạo đơn hàng mới
            const orderItems = selectedItems.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            }));

            const newOrder = new OrderModel({
                userId: user._id,
                items: orderItems,
                fullname,
                mobilenumber,
                address,
                totalAmount: total,
                status: 'pending',
                paymentMethod: 'vnpay',
                paymentStatus: 'pending'
            });

            const savedOrder = await newOrder.save();

            // Tạo URL thanh toán VNPay
            let date = new Date();
            let createDate = moment(date).format('YYYYMMDDHHmmss');
            let orderId = moment(date).format('DDHHmmss');
            
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = config.vnp_TmnCode;
            vnp_Params['vnp_Locale'] = 'vn';
            vnp_Params['vnp_CurrCode'] = 'VND';
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + savedOrder._id;
            vnp_Params['vnp_OrderType'] = 'other';
            vnp_Params['vnp_Amount'] = total * 100;
            vnp_Params['vnp_ReturnUrl'] = config.vnp_ReturnUrl;
            vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress;
            vnp_Params['vnp_CreateDate'] = createDate;

            vnp_Params = sortObject(vnp_Params);

            let signData = querystring.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
            let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
            vnp_Params['vnp_SecureHash'] = signed;

            let vnpUrl = config.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

            // Lưu orderId vào đơn hàng
            savedOrder.orderId = orderId;
            await savedOrder.save();

            // Chuyển hướng đến trang thanh toán VNPay
            res.redirect(vnpUrl);
        } catch (error) {
            console.error('VNPay payment error:', error);
            res.status(500).json({error: 'Có lỗi xảy ra khi tạo thanh toán'});
        }
    },

    vnpayReturn: async function(req, res) {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];
            
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
            let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

            if(secureHash === signed){
                const orderId = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];

                // Tìm và cập nhật trạng thái đơn hàng
                const order = await OrderModel.findOne({ orderId: orderId });
                if(order){
                    if(rspCode === '00') {
                        order.paymentStatus = 'completed';
                        order.status = 'processing';
                    } else {
                        order.paymentStatus = 'failed';
                        order.status = 'cancelled';
                    }
                    await order.save();

                    if(rspCode === '00') {
                        // Xóa sản phẩm đã mua khỏi giỏ hàng
                        const user = await UserModel.findById(order.userId);
                        if(user) {
                            const productIds = order.items.map(item => item.productId);
                            user.cart.items = user.cart.items.filter(item => 
                                !productIds.includes(item.productId.toString())
                            );
                            await user.save();
                        }
                    }
                }

                // Chuyển hướng về trang kết quả phù hợp
                if(rspCode === '00') {
                    res.redirect('/cart?vnp_ResponseCode=00');
                } else {
                    res.redirect('/cart?vnp_ResponseCode=error');
                }
            } else {
                res.redirect('/cart?vnp_ResponseCode=error');
            }
        } catch(error) {
            console.error('VNPay return error:', error);
            res.redirect('/cart?vnp_ResponseCode=error');
        }
    }
};
