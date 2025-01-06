const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');
const UserModel = require("../models/user");
const ProductModel = require("../models/newproduct");
const OrderModel = require("../models/order");

const jwt = require("jsonwebtoken");
const url = require("url");

// Tắt deprecation warning
mongoose.set('useFindAndModify', false);

const urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = {
  //Sign Up new User
  //Render

  getSignUp: function (req, res, next) {
    let message = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render("user/signup", {
      path: "/signup",
      pageTitle: "signup",
      errorMessage: message,
      userr: null,
    });
  },

  postSignUp: function (req, res, next) {
    const { username, password, email, age, phone, address, confirmpassword } =
      req.body;

    const today = new Date();
    var date_format = new Date(today).toDateString("yyyy-MM-dd");
    const created = date_format;
    UserModel.findOne({
      username: username,
    })
      //Render Signup nếu sai
      .then(function (user) {
        if (user) {
          return res.render("user/signup", {
            path: "/signup",
            errorMessage: "Username exists already~!",
            error: console.log("Already"),
            userr: null,
          });
        }
        if (username == "" || password == "") {
          return res.render("user/signup", {
            path: "/signup",
            errorMessage: "Invalid Username or Password",
            error: console.log("Invalid"),
          });
        }
        if (password != confirmpassword) {
          return res.render("user/signup", {
            path: "/signup",
            errorMessage: "Password and Confirmpassword not same",
            error: console.log("Not same"),
          });
        }
        //Mã hóa password với bcrypt
        return bcrypt
          .hash(password, 12)
          .then(function (hashpassword) {
            const userData = new UserModel({
              username: username,
              password: hashpassword,
              email: email,
              age: age,
              phone: phone,
              address: address,
              created: created,
            });
            return userData.save({
              alo: console.log("Save Done"),
            });
          })
          .then(function (result) {
            res.redirect("/login");
          });
      })

      .catch(function (err) {
        res.send("error: " + err);
      });
  },

  //Login User
  getLogin: function (req, res, next) {
    console.log(
      "TCL: process.env.SECRETKEY_TOKEN",
      process.env.SECRETKEY_TOKEN
    );

    let message = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render("user/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: message,
      userr: null,
    });
  },

  postLogin: function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    // Kiểm tra tài khoản admin đặc biệt
    if (username === "loc" && password === "1234567") {
      req.session.isLoggedIn = true;
      req.session.role = "admin";
      req.session.user = {
        username: username,
        role: "admin",
      };
      return req.session.save((err) => {
        return res.redirect("/adminTin");
      });
    }

    // Xử lý đăng nhập thông thường
    UserModel.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return res.render("user/login", {
            path: "/login",
            errorMessage: "Tài khoản không tồn tại",
            userr: null,
          });
        }

        // So sánh password
        bcrypt.compare(password, user.password).then((match) => {
          if (match) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.role = user.role;

            return req.session.save((err) => {
              if (user.role === "admin") {
                return res.redirect("/adminTin");
              }
              return res.redirect("/");
            });
          }

          return res.render("user/login", {
            path: "/login",
            errorMessage: "Mật khẩu không đúng",
            userr: null,
          });
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/login");
      });
  },

  //Logout
  postLogout: function (req, res, next) {
    // huy session khi user dang xuat
    req.session.destroy((err) => {
      console.log(err);
      res.redirect("/");
    });
  },

  //Account
  getAccount: function (req, res, next) {
    res.render("user/account", {});
  },

  //Edit User
  postEditUser: function (req, res, next) {
    const userID = req.body._id;
    const age = req.body.age;
    const phone = req.body.phone;
    console.log("TCL: ", userID);
    UserModel.findById(userID)
      .then(function (user) {
        if (!user) {
          res.render("/login");
        }
        if (req.body.age == "" || req.body.phone == "") {
          return res.render("user/login", {
            path: "/login",
            errorMessage: "Age or Phone is Empty",
            userr: null,
          });
        }

        user.age = age;
        user.phone = phone;
        console.log(user);
        return user.save();
      })

      .then(function (result) {
        console.log("Complete Updated Completed user!");
        req.session.isLoggedIn = false;
        return res.redirect("/");
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },

  //Cart
  getCartPage: function (req, res, next) {
    let message = req.flash("errorMessage");
    let boolError = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    if (boolError.length > 0) {
      boolError = "true";
    } else {
      boolError = "false";
    }
    UserModel.findById(req.session.user._id)
      .then((user) => {
        user
          .populate("cart.items.productId")
          .execPopulate()
          .then((user) => {
            // Filter out cart items with null productId
            let products = user.cart.items.filter(item => item.productId !== null);
            
            // Recalculate sum for valid products
            let sum = products.reduce((total, item) => {
              return total + (item.productId ? item.quantity * parseFloat(item.productId.price) : 0);
            }, 0);

            res.render("product/page-cart", {
              path: "/cart",
              pageTitle: "Your Cart",
              products: products,
              sum: sum,
              errorMessage: message,
              error: boolError,
            });
          });
      })
      .catch((err) => console.log(err));
  },

  //API show cart
  getCart: async function(req, res, next) {
    try {
      const user = await UserModel.findById(req.session.user._id)
        .populate("cart.items.productId");

      console.log("TCL: user.cart.sum", user.cart.sum);
      res.json({
        sumPrice: user.cart.sum,
        products: user.cart.items,
      });
    } catch (err) {
      console.error('Error in getCart:', err);
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi lấy thông tin giỏ hàng'
      });
    }
  },

  //Add Product
  postCart: async function(req, res, next) {
    try {
      // Kiểm tra user đã đăng nhập chưa
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để thêm vào giỏ hàng'
        });
      }

      const productId = req.body.productId;
      const quantity = parseInt(req.body.quantity) || 1;
      
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy thông tin sản phẩm'
        });
      }

      // Kiểm tra sản phẩm tồn tại
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm không tồn tại'
        });
      }

      // Lấy giỏ hàng hiện tại của user
      const user = await UserModel.findById(req.session.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }

      // Reset productNewOrder nếu tồn tại
      if (user.productNewOrder && user.productNewOrder.order) {
        user.productNewOrder.order = [];
      }
      
      // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
      const cartProductIndex = user.cart.items.findIndex(cp => {
        return cp.productId.toString() === productId.toString();
      });

      let newQuantity = quantity;
      const updatedCartItems = [...user.cart.items];

      if (cartProductIndex >= 0) {
        // Nếu sản phẩm đã có trong giỏ, cộng thêm số lượng
        newQuantity = user.cart.items[cartProductIndex].quantity + quantity;
      }

      // Kiểm tra tổng số lượng có vượt quá tồn kho không
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Tổng số lượng (${newQuantity}) vượt quá số lượng trong kho (${product.quantity}). Vui lòng nhập lại.`,
          availableQuantity: product.quantity,
          currentCartQuantity: cartProductIndex >= 0 ? user.cart.items[cartProductIndex].quantity : 0
        });
      }

      // Cập nhật hoặc thêm mới sản phẩm vào giỏ hàng
      if (cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].quantity = newQuantity;
      } else {
        updatedCartItems.push({
          productId: productId,
          quantity: newQuantity
        });
      }

      // Cập nhật giỏ hàng
      user.cart.items = updatedCartItems;

      // Tính tổng giá trị giỏ hàng
      const cartTotal = updatedCartItems.reduce((total, item) => {
        return total + (item.quantity * product.price);
      }, 0);
      user.cart.sum = cartTotal;

      await user.save();

      // Lấy thông tin chi tiết giỏ hàng để trả về
      const populatedUser = await UserModel.findById(user._id)
        .populate({
          path: 'cart.items.productId',
          select: '_id productname price imagePath'
        });

      if (!populatedUser) {
        throw new Error('Không thể lấy thông tin giỏ hàng');
      }

      const cartProducts = populatedUser.cart.items;
      const sumPrice = cartProducts.reduce((total, item) => {
        if (item.productId) {
          return total + (item.quantity * item.productId.price);
        }
        return total;
      }, 0);

      return res.status(200).json({
        success: true,
        message: 'Thêm vào giỏ hàng thành công',
        products: cartProducts,
        sumPrice: sumPrice
      });

    } catch (error) {
      console.error('Error in postCart:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi thêm vào giỏ hàng'
      });
    }
  },

  //Remove Product in Cart
  postRemoveProductCart: async function (req, res, next) {
    try {
      const productID = req.body.productId;
      if (!productID) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      const user = await UserModel.findById(req.session.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const product = await ProductModel.findById(productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await user.removeProductCart(productID, product);
      
      return res.status(200).json({
        success: true,
        message: 'Product removed from cart'
      });
    } catch (err) {
      console.error('Error removing product from cart:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  //Update Cart
  postUpdateCart: async function (req, res, next) {
    try {
      var { productQuantity, productId } = req.body;
      var newQuantityArr = [];
      var productIdArr = [];

      if (typeof productId == "string") {
        newQuantityArr = productQuantity.split(",");
        productIdArr = productId.split(",");
      } else {
        newQuantityArr = productQuantity;
        productIdArr = productId;
      }

      const user = await UserModel.findById(req.session.user._id);
      const products = await ProductModel.find();

      for (let i = 0; i < productIdArr.length; i++) {
        const product = products.find(
          (p) => p._id.toString() === productIdArr[i].toString()
        );
        if (product) {
          const currentQuantityInCart =
            user.cart.items.find(
              (item) => item.productId.toString() === productIdArr[i].toString()
            )?.quantity || 0;
          const totalQuantity =
            currentQuantityInCart + parseInt(newQuantityArr[i]);

          if (totalQuantity > product.quantity) {
            req.flash(
              "errorMessage",
              `Số lượng sản phẩm ${product.productname} không đủ! Chỉ còn ${product.quantity} sản phẩm.`
            );
            return res.redirect("/cart");
          }
        }
      }

      const newUpdateItems = productIdArr.map((id, index) => ({
        ID: id,
        Quantity: newQuantityArr[index],
      }));

      await user.updatedCart(newUpdateItems);
      return res.redirect("/cart");
    } catch (err) {
      console.log(err);
      req.flash("errorMessage");
      return res.redirect("/cart");
    }
  },
  postCheckout: async function (req, res) {
    try {
      const { fullname, mobilenumber, address, selectedProducts, paymentMethod } = req.body;
      
      // Validate required fields
      if (!fullname || !mobilenumber || !address) {
        req.flash('errorMessage', 'Vui lòng điền đầy đủ thông tin giao hàng.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(mobilenumber)) {
        req.flash('errorMessage', 'Số điện thoại không hợp lệ.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      // Validate payment method
      if (!['cod', 'vnpay'].includes(paymentMethod)) {
        req.flash('errorMessage', 'Phương thức thanh toán không hợp lệ.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      if (!selectedProducts) {
        req.flash('errorMessage', 'Không có sản phẩm nào được chọn.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      // Parse selected product IDs
      let selectedProductIds;
      try {
        selectedProductIds = JSON.parse(selectedProducts);
      } catch (error) {
        req.flash('errorMessage', 'Dữ liệu sản phẩm không hợp lệ.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }
      
      if (!Array.isArray(selectedProductIds) || selectedProductIds.length === 0) {
        req.flash('errorMessage', 'Không có sản phẩm nào được chọn.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      // Lấy thông tin user và populate cart
      const user = await UserModel.findById(req.session.user._id)
        .populate('cart.items.productId');

      if (!user) {
        req.flash('errorMessage', 'Không tìm thấy thông tin người dùng.');
        req.flash('error', 'true');
        return res.redirect('/cart');
      }

      // Lọc các sản phẩm được chọn
      const selectedItems = user.cart.items.filter(item => 
        selectedProductIds.includes(item.productId._id.toString())
      );

      // Kiểm tra số lượng tồn kho
      for (const item of selectedItems) {
        const product = await ProductModel.findById(item.productId._id);
        if (!product) {
          req.flash('errorMessage', `Sản phẩm ${item.productId.name} không tồn tại.`);
          req.flash('error', 'true');
          return res.redirect('/cart');
        }
        if (product.quantity < item.quantity) {
          req.flash('errorMessage', `Sản phẩm ${product.name} không đủ số lượng trong kho.`);
          req.flash('error', 'true');
          return res.redirect('/cart');
        }
      }

      // Tính tổng tiền các sản phẩm được chọn
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
        paymentMethod: paymentMethod,
        paymentStatus: 'pending'
      });

      // Lưu đơn hàng
      const savedOrder = await newOrder.save();

      // Nếu thanh toán qua VNPay
      if (paymentMethod === 'vnpay') {
        const vnpayController = require('./vnpay');
        const vnpayResponse = await vnpayController.createPayment({
          body: {
            orderId: savedOrder._id,
            bankCode: '',
            language: 'vn'
          },
          headers: req.headers,
          connection: req.connection,
          socket: req.socket
        });
        
        if (vnpayResponse.code === '00') {
          return res.json({
            success: true,
            data: vnpayResponse.data,
            orderCode: savedOrder.orderId
          });
        } else {
          throw new Error('Không thể tạo URL thanh toán VNPay');
        }
      }

      try {
        // Cập nhật số lượng sản phẩm trong kho
        for (const item of selectedItems) {
          const product = await ProductModel.findById(item.productId._id);
          product.quantity -= item.quantity;
          await product.save();
        }

        // Convert string IDs to ObjectId
        const productObjectIds = selectedProductIds.map(id => new mongoose.Types.ObjectId(id));

        // Cập nhật giỏ hàng bằng findOneAndUpdate
        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: user._id },
          {
            $pull: {
              'cart.items': {
                'productId': { $in: productObjectIds }
              }
            }
          },
          { new: true }
        );

        // Tính lại tổng tiền giỏ hàng
        const cartTotal = await UserModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(user._id) } },
          { $unwind: { path: '$cart.items', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'products',
              localField: 'cart.items.productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$_id',
              total: {
                $sum: {
                  $cond: [
                    { $and: [
                      { $isArray: '$cart.items' },
                      { $gt: [{ $size: '$cart.items' }, 0] }
                    ]},
                    { $multiply: ['$cart.items.quantity', '$product.price'] },
                    0
                  ]
                }
              }
            }
          }
        ]);

        // Cập nhật tổng tiền
        await UserModel.findOneAndUpdate(
          { _id: user._id },
          { 'cart.sum': cartTotal.length > 0 ? cartTotal[0].total : 0 },
          { new: true }
        );
        
        // Trả về response thành công
        return res.json({
          success: true,
          message: 'Đặt hàng thành công!',
          orderCode: savedOrder.orderId
        });
      } catch (error) {
        console.error('Lỗi sau khi lưu đơn hàng:', error);
        // Đơn hàng đã được tạo nhưng xử lý sau gặp lỗi
        // Cập nhật trạng thái đơn hàng thành 'processing' để admin xử lý
        try {
          await OrderModel.findByIdAndUpdate(
            savedOrder._id,
            { status: 'processing' },
            { new: true }
          );
        } catch (err) {
          console.error('Không thể cập nhật trạng thái đơn hàng:', err);
        }
        return res.status(500).json({
          success: false,
          message: `Đơn hàng đã được tạo (Mã: ${savedOrder.orderId}) nhưng có lỗi xảy ra. Chúng tôi sẽ liên hệ với bạn sớm nhất!`
        });
      }
    } catch (err) {
      console.log(err);
      req.flash('errorMessage');
      res.redirect('/');
    }
  },

  getOrders: async function(req, res) {
    try {
      const orders = await OrderModel.find({ userId: req.session.user._id })
        .populate('items.productId')
        .sort({ createdAt: -1 });

      res.render('user/orders', {
        orders: orders,
        pageTitle: 'Đơn hàng của tôi',
        path: '/orders',
        userr: req.session.user
      });
    } catch (err) {
      console.log(err);
      req.flash('errorMessage', 'Không thể tải danh sách đơn hàng.');
      res.redirect('/');
    }
  },

  getOrderDetails: async function(req, res) {
    try {
      const order = await OrderModel.findOne({
        _id: req.params.orderId,
        userId: req.session.user._id
      }).populate('items.productId');

      if (!order) {
        req.flash('errorMessage', 'Không tìm thấy đơn hàng.');
        return res.redirect('/orders');
      }

      res.render('user/order-details', {
        order: order,
        pageTitle: 'Chi tiết đơn hàng',
        path: '/orders',
        userr: req.session.user
      });
    } catch (err) {
      console.log(err);
      req.flash('errorMessage', 'Không thể tải chi tiết đơn hàng.');
      res.redirect('/orders');
    }
  }
};
