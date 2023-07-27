const express = require("express");
const { Order } = require("../model/Order");
const { OrderItem } = require("../model/OrderItem");
const isAdmin = require("../middleware/isAdmin");
const isLogin = require("../middleware/isLogin");
const getTokenFromHeader = require("../helper/getTokenFromHeader");
const router = express.Router();

// get method
router.get("/", isAdmin, isLogin, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });
  if (!orderList) {
    res.status(404).json({ success: false });
  }

  res.send(orderList);
});

// post method
router.post("/", async (req, res) => {
  const {
    orderItems,
    shippingAddress1,
    shippingAddress2,
    city,
    country,
    zip,
    phone,
    status,
    totalPrice,
    user,
  } = req.body;
  const orderItemsIds = Promise.all(
    orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );
  const orderItemsResold = await orderItemsIds;

  const totalPrices = await Promise.all(
    orderItemsResold.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalSum = orderItem.product.price * orderItem.quantity;
      return totalSum;
    })
  );
  const totalSum = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsResold,
    shippingAddress1,
    shippingAddress2,
    city,
    country,
    zip,
    phone,
    status,
    totalPrice: totalSum,
    user,
  });
  order = await order.save();
  if (!order) {
    res.status(404).send("order cannot send. ");
  }
  res.send(order);
});

// get single order
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order) {
    res.status(404).send("The order with ID is not found");
  }
  res.send(order);
});

// get single order by single user
router.get("/get/singleOrder/:userId", isAdmin, isLogin, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userId })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });
  if (!userOrderList) {
    res.status(404).json({ success: false });
  }

  res.send(userOrderList);
});

// update Order
router.put("/:id", isLogin, isAdmin, async (req, res) => {
  const {
    orderItems,
    shippingAddress1,
    shippingAddress2,
    city,
    country,
    zip,
    phone,
    status,
    totalPrice,
    user,
  } = req.body;

  const orderFound = await Order.findOne({ status });
  if (orderFound) {
    res.status(404).send(`${status} order already exist`);
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderItems,
      shippingAddress1,
      shippingAddress2,
      city,
      country,
      zip,
      phone,
      status,
      totalPrice,
      user,
    },
    { new: true }
  );
  if (!order) {
    res.status(404).send("The order with ID is not found");
  }
  res.send(order);
});

//  Delete order
router.delete("/:id", isLogin, isAdmin, async (req, res) => {
  const order = await Order.findByIdAndRemove(req.params.id);
  if (!order) {
    res.status(404).send("The order with ID is not found");
  }
  res.send("order deleted successfully");
});

// get count order
router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) {
    res.status(404).json({ success: false });
  }
  res.send({
    orderCount: orderCount,
  });
});

module.exports = router;
