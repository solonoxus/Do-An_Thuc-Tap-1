const bodyParser = require("body-parser");

//Model
const UserModel = require("../models/user");
const NewProductModel = require("../models/newproduct");
const ProductModel = require("../models/newproduct");
const OrderModel = require("../models/order");

module.exports = {
  //Admin
  getIndex: function (req, res, next) {
    // Đảm bảo trả về một Promise
    return Promise.resolve()
      .then(() => {
        // Logic xử lý của bạn ở đây
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err.message });
      });
  },
  //Admin
  getAdmin: function (req, res, next) {
    OrderModel.find()
      .then((orders) => {
        res.render("admin/adminmanager", {
          path: "/admin",
          orders: orders
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).render("error", {
          error: err,
          message: "Đã xảy ra lỗi khi tải dữ liệu",
        });
      });
  },
  //Manager Users
  getManagerUsers: function (req, res, next) {
    req.session.isManager = false;
    var count = 0;

    UserModel.find()
      .then((user) => {
        var data = user.filter((i) => i.productNewOrder.order.length > 0);
        return res.render("admin/list-user", {
          path: "/admin/list-user",
          count: count,
          listusers: user,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).render("error", {
          error: err,
          message: "Đã xảy ra lỗi khi tải dữ liệu người dùng",
        });
      });
  },

  //Update USer
  getUpdate: function (req, res, next) {
    const userID = req.params._id;
    console.log("TCL: ", userID);
    UserModel.findById(userID)
      .then(function (user) {
        if (!user) {
          return res.redicter("/adminTin");
        }
        res.render("admin/updateusers", {
          user: user,
          alo: console.log(user.username),
        });
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },

  postUpdateUser: function (req, res, next) {
    const userID = req.body._id;
    const username = req.body.username;
    const age = req.body.age;
    const phone = req.body.phone;
    const role = req.body.role;
    const email = req.body.email;
    const address = req.body.address;
    const created = req.body.created;
    console.log("TCL: ", req.body._id);
    console.log("TCL: ", username);
    UserModel.findById(userID)
      .then(function (user) {
        user.username = username;
        user.age = age;
        user.phone = phone;
        user.role = role;
        user.email = email;
        user.address = address;
        user.created = created;
        return user.save();
      })
      .then(function (result) {
        console.log("Complete Updated Completed user!");
        res.redirect("/adminTin");
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },

  //Remove
  getRemoveUser: function (req, res, next) {
    const userID = req.params._id;
    console.log("ALOALO: " + userID);
    UserModel.deleteOne({
      _id: userID,
    })
      .then(function (result) {
        console.log("Complete Delete Completed user!");
        res.redirect("/adminTin/managerusers");
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },

  // Product Management
  getListProducts: async function (req, res, next) {
    try {
      const category = req.query.category || "all";
      let products;

      if (category === "all") {
        // Lấy tất cả sản phẩm
        products = await NewProductModel.find();
      } else {
        // Xử lý đặc biệt cho Apple Watch vì có thể được lưu với nhiều cách viết khác nhau
        let searchPattern;
        if (category === "applewatch") {
          searchPattern = /(apple watch|applewatch|watch)/i;
        } else {
          searchPattern = new RegExp(category, "i");
        }

        products = await NewProductModel.find({
          category: { $regex: searchPattern },
        });

        // Log để debug
        console.log("Category:", category);
        console.log("Search Pattern:", searchPattern);
        console.log("Products found:", products.length);
      }

      res.render("admin/list-product", {
        path: "/admin/list-product",
        products: products,
        currentCategory: category,
        categories: ["all", "iphone", "macbook", "applewatch", "airpod"],
      });
    } catch (err) {
      console.error("Error in getListProducts:", err);
      res.status(500).render("error", {
        error: err,
        message: "Đã xảy ra lỗi khi tải danh sách sản phẩm",
      });
    }
  },
  getAddProduct: function (req, res, next) {
    res.render("admin/add-product", {
      path: "/admin/add-product",
      categories: ["iphone", "macbook", "applewatch", "airpod"],
    });
  },
  postAddProduct: function (req, res, next) {
    const { name, price, description, category, image } = req.body;

    const product = new ProductModel({
      name: name,
      price: price,
      description: description,
      category: category,
      image: image,
    });

    product.save()
      .then((result) => {
        res.redirect("/adminTin/managerproducts");
      })
      .catch((err) => {
        console.log(err);
        res.status(500).render("error", {
          error: err,
          message: "Đã xảy ra lỗi khi thêm sản phẩm",
        });
      });
  },
  getUpdateProduct: async function (req, res, next) {
    try {
      const productId = req.params._id;
      const product = await NewProductModel.findById(productId);
      
      if (!product) {
        return res.redirect('/adminTin/managerproducts');
      }

      res.render('admin/update-product', {
        path: '/admin/update-product',
        airpods: product // Đổi tên biến để phù hợp với view
      });
    } catch (err) {
      console.error('Error in getUpdateProduct:', err);
      res.status(500).render('error', {
        error: err,
        message: 'Đã xảy ra lỗi khi tải thông tin sản phẩm'
      });
    }
  },

  postUpdateProduct: async function (req, res, next) {
    try {
      const {
        _id,
        productname,
        price,
        description,
        category,
        quantity,
        imagePath
      } = req.body;

      const product = await NewProductModel.findById(_id);
      
      if (!product) {
        return res.redirect('/adminTin/managerproducts');
      }

      // Cập nhật thông tin sản phẩm
      product.productname = productname;
      product.price = price;
      product.description = description;
      product.category = category;
      product.quantity = quantity;
      product.imagePath = imagePath;

      await product.save();
      res.redirect('/adminTin/managerproducts');
    } catch (err) {
      console.error('Error in postUpdateProduct:', err);
      res.status(500).render('error', {
        error: err,
        message: 'Đã xảy ra lỗi khi cập nhật sản phẩm'
      });
    }
  },
  getRemoveProduct: function (req, res, next) {
    const productId = req.params._id;

    ProductModel.findByIdAndRemove(productId)
      .then(() => {
        res.redirect("/adminTin/managerproducts");
      })
      .catch((err) => {
        console.log(err);
        res.status(500).render("error", {
          error: err,
          message: "Đã xảy ra lỗi khi xóa sản phẩm",
        });
      });
  },
  /*List iPhone*/
  getListiPhone: function (req, res, next) {
    req.session.isManager = false;
    var count = 0;
    NewProductModel.find()
      .then((products) => {
        var data = products.filter((i) => i.category == "iPhone");
        console.log(data);
        res.render("admin/list-product", {
          path: "/admin/list-product",
          count: count,
          kind: "iphone",
          listproducts: data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  //-------------------------------------------------------------------
  //List Macbook
  getListMacbook: function (req, res, next) {
    req.session.isManager = false;
    var count = 0;
    NewProductModel.find()
      .then((products) => {
        var data = products.filter((i) => i.category.toLowerCase().replace(/\s/g, '') == "macbook");
        console.log(data);
        res.render("admin/list-product", {
          path: "/admin/list-product",
          count: count,
          kind: "macbook",
          listproducts: data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  //-------------------------------------------------------------------
  //List Apple Watch
  getListAppleWatch: function (req, res, next) {
    req.session.isManager = false;
    var count = 0;
    NewProductModel.find()
      .then((products) => {
        var data = products.filter((i) => i.category.toLowerCase().replace(/\s/g, '') == "applewatch");
        console.log(data);
        res.render("admin/list-product", {
          path: "/admin/list-product",
          count: count,
          kind: "applewatch",
          listproducts: data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  //-------------------------------------------------------------------
  //List Airpod
  getListAirpod: function (req, res, next) {
    req.session.isManager = false;
    var count = 0;
    NewProductModel.find()
      .then((products) => {
        var data = products.filter((i) => i.category == "AirPods");
        console.log("alo ", data);
        res.render("admin/list-product", {
          path: "/admin/list-product",
          count: count,
          kind: "airpods",
          listproducts: data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  getRemoveNewProduct: function (req, res, next) {
    const newproductID = req.params._id;
    console.log("Product ID: " + newproductID);
    req.session.isManager = false;
    NewProductModel.deleteOne({
      _id: newproductID,
    })
      .then(function (result) {
        console.log("Complete Delete Product!");
        res.redirect("/adminTin/managerproducts");
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },
  getUpdateNewProduct: function (req, res, next) {
    const newproductID = req.params._id;
    console.log("TCL: ", newproductID);
    NewProductModel.findById(newproductID)
      .then(function (newproduct) {
        if (!newproduct) {
          return res.redicter("/adminTin");
        }
        res.render("admin/update-product", {
          airpods: newproduct,
          alo: console.log(newproduct.productname),
        });
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },
  postUpdateNewProduct: function (req, res, next) {
    const newproductID = req.body._id;
    const newproductname = req.body.productname;
    const imagePath = req.body.imagePath;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const quantity = req.body.quantity;
    const created = req.body.created;
    console.log("TCL: ", newproductID);
    NewProductModel.findById(newproductID)
      .then(function (newproduct) {
        newproduct.productname = newproductname;
        newproduct.imagePath = imagePath;
        newproduct.description = description;
        newproduct.price = price;
        newproduct.quantity = quantity;
        newproduct.category = category;
        newproduct.created = created;
        return newproduct.save();
      })
      .then(function (result) {
        console.log("Complete Updated Completed Product!");
        res.redirect("/adminTin/managerproducts");
      })
      .catch(function (err) {
        console.log("TCL: ", err);
      });
  },
  getManagerOrder: function(req, res, next) {
    OrderModel.find()
      .then(orders => {
        res.render("admin/list-order", {
          listorder: orders,
          path: "/admin/list-order"
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).render("error", {
          error: err,
          message: "Đã xảy ra lỗi khi tải danh sách đơn hàng"
        });
      });
  },
  completeOrder: async function(req, res, next) {
    try {
      const orderId = req.params.orderId;
       console.log("OrderID received:", orderId);
      const order = await OrderModel.findById(orderId);
      console.log("Order found:", order ? "Yes" : "No");
  
      if (!order) {
        req.flash('error', 'Không tìm thấy đơn hàng');
        return res.redirect('/adminTin');
      }
  
      // Cập nhật trạng thái đơn hàng
      order.status = 'completed';
      await order.save();
  
      // Cập nhật số lượng sản phẩm
      const orderItems = order.items;
      for(let item of orderItems) {
        const product = await ProductModel.findById(item.productId);
        if(product) {
          product.quantity -= item.quantity;
          await product.save();
          console.log("Order marked as completed");
        }
      }
  
      req.flash('success', 'Đơn hàng đã được hoàn thành');
      res.redirect('/adminTin');
    } catch (err) {
      console.log(err);
      console.log("Error in completeOrder:", err);
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/adminTin'); 
    }
  },
  updateOrderStatus: function(req, res, next) {
    const { orderId, status } = req.body;
    
    OrderModel.findByIdAndUpdate(orderId, { status }, { new: true })
        .then(updatedOrder => {
            if (!updatedOrder) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ 
                message: 'Order status updated successfully', 
                order: updatedOrder 
            });
        })
        .catch(err => {
            console.error('Error updating order status:', err);
            res.status(500).json({ 
                message: 'Error updating order status', 
                error: err.message 
            });
        });
  },
  deleteOrder: function(req, res, next) {
    const orderId = req.params.orderId;
    
    OrderModel.findByIdAndDelete(orderId)
        .then(deletedOrder => {
            if (!deletedOrder) {
                return res.status(404).json({ 
                    message: 'Không tìm thấy đơn hàng để xóa',
                    success: false 
                });
            }
            
            // Optional: Log deletion for audit purposes
            console.log(`Đã xóa đơn hàng: ${orderId}`);
            
            res.json({ 
                message: 'Xóa đơn hàng thành công', 
                success: true,
                deletedOrder: deletedOrder 
            });
        })
        .catch(err => {
            console.error('Lỗi khi xóa đơn hàng:', err);
            res.status(500).json({ 
                message: 'Có lỗi xảy ra khi xóa đơn hàng', 
                success: false,
                error: err.message 
            });
        });
  },
};
