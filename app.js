require("dotenv").config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

// router connection
const productRoute = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRouters");
const userRouter = require("./routes/userRouter");
const orderRouter = require("./routes/orderRouter");
const globalErrHandler = require("./middleware/globalErrHandler");
app.use(cors());
app.options("*", cors());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

// middle ware
app.use(express.json());
app.use(morgan("tiny"));

// env connection
const api = process.env.API_URL;
const dbLink = process.env.CONNECTION_STRING;

// database connection
mongoose
  .connect(dbLink, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshop",
  })
  .then(() => {
    console.log("DATA BASE IS CONNECT");
  })
  .catch((err) => {
    console.log(err);
  });

// routes
// product router
app.use(`${api}/products`, productRoute);
// category router
app.use(`${api}/categories`, categoryRouter);
// user router
app.use(`${api}/users`, userRouter);
// order router
app.use(`${api}/orders`, orderRouter);

// error handler
app.use(globalErrHandler);

// app Error
app.use("*", (req, res) => {
  res.status(404).json({
    message: `${req.originalUrl} - Router not found`,
  });
});
// listen to server
app.listen(2022, () => {
  // http://localhost:2022/api/v1/products
  console.log(`server is running on http://localhost:2022/api/v1`);
});
