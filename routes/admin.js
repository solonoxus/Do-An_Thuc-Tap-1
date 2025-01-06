const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cors = require("cors");
const AdminController = require("../apicontrollers/admin");

const isAuthAdmin=require('../middleware/is-auth-admin')
const isAuth=require('../middleware/is-auth')


router.use(cors());



router.get("/adminTin",isAuth,isAuthAdmin, AdminController.getAdmin);

//Manager User
router.get("/adminTin/managerusers",isAuth,isAuthAdmin, AdminController.getManagerUsers);
router.get("/adminTin/managerusers/update/:_id",isAuth,isAuthAdmin, AdminController.getUpdate);
router.post("/adminTin/managerusers/update",isAuth,isAuthAdmin, AdminController.postUpdateUser);
router.get("/adminTin/managerusers/delete/:_id",isAuth,isAuthAdmin, AdminController.getRemoveUser);

//Manager Products - Main route for all product management
router.get("/adminTin/managerproducts",isAuth,isAuthAdmin, AdminController.getListProducts);
router.get("/adminTin/managerproducts/add",isAuth,isAuthAdmin, AdminController.getAddProduct);
router.post("/adminTin/managerproducts/add",isAuth,isAuthAdmin, AdminController.postAddProduct);
router.get("/adminTin/managerproducts/update/:_id",isAuth,isAuthAdmin, AdminController.getUpdateProduct);
router.post("/adminTin/managerproducts/update",isAuth,isAuthAdmin, AdminController.postUpdateProduct);
router.get("/adminTin/managerproducts/delete/:_id",isAuth,isAuthAdmin, AdminController.getRemoveProduct);

// Order Status Update
router.post("/adminTin/managerorder/status", isAuth, isAuthAdmin, AdminController.updateOrderStatus);

// Order Delete
router.delete("/adminTin/managerorder/delete/:orderId", isAuth, isAuthAdmin, AdminController.deleteOrder);

module.exports = router;
