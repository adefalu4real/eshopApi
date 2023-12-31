const express = require("express");
const { Category } = require("../model/Category");
const { Product } = require("../model/Product");
const isLogin = require("../middleware/isLogin");
const isAdmin = require("../middleware/isAdmin");
const multer = require("multer");
const { Error, default: mongoose } = require("mongoose");
const router = express.Router();

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadErr = new Error("Invalid image type");
    if (isValid) {
      uploadErr = null;
    }
    cb(uploadErr, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOption = multer({ storage: storage });

// post method
router.post(
  "/",
  uploadOption.single("image"),
  isLogin,
  isAdmin,
  async (req, res) => {
    let file = req.file;
    if (!file) {
      res.status(404).send("Product image is required");
    }
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    const {
      name,
      description,
      image,
      images,
      richDescription,
      brand,
      price,
      category,
      countInStock,
      rating,
      isFeature,
      dateCreated,
    } = req.body;

    // check for existence of a category
    const categoryFind = await Category.findById(category);
    if (!categoryFind) {
      res.status(404).send("Invalid category");
    }
    const productFound = await Product.findOne({ name });
    if (productFound) {
      res.status(404).send(`${name} Product already exist`);
    }

    let product = new Product({
      name,
      description,
      image: `${basePath}${fileName}`,
      images,
      richDescription,
      brand,
      price,
      category,
      countInStock,
      rating,
      isFeature,
      dateCreated,
    });
    product = await product.save();

    if (!product) {
      res.status(400).json({ success: false });
    }
    res.send(product);
  }
);

// get all product
router.get("/", async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }
  const productList = await Product.find(filter)
    .populate("category")
    .select("name price");
  if (!productList) {
    res.status(404).json({ success: false });
  }
  res.send(productList);
});

// Get single product
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404).send("The product with ID is not found");
  }
  res.send(product);
});

// update categories
router.put("/:id", async (req, res) => {
  const {
    name,
    description,
    image,
    images,
    richDescription,
    brand,
    price,
    category,
    countInStock,
    rating,
    isFeature,
    dateCreated,
  } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      image,
      images,
      richDescription,
      brand,
      price,
      category,
      countInStock,
      rating,
      isFeature,
      dateCreated,
    },
    { new: true }
  );
  if (!product) {
    res.status(404).send("The product with ID is not found");
  }
  res.send(product);
});

//  Delete category
router.delete("/:id", isLogin, isAdmin, async (req, res) => {
  const product = await Product.findByIdAndRemove(req.params.id);
  if (!product) {
    res.status(404).send("The product with ID is not found");
  }
  res.send("Product deleted successfully");
});

// get count product
router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) {
    res.status(404).json({ success: false });
  }
  res.send({
    count: productCount,
  });
});

// get count product
router.get("/get/feature", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const productFeature = await Product.find({ isFeature: false }).limit(+count);
  if (!productFeature) {
    res.status(400).json({ success: false });
  }
  res.send({
    count: productFeature,
  });
});

router.put(
  "/images/:id",
  uploadOption.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }
    const files = req.files;
    let imagesPath = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads`;
    if (files) {
      files.map((file) => {
        imagesPath.push(`${basePath}${file.fileName}`);
      });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPath,
      },
      { new: true }
    );
    if (!product) {
      res.status(404).send("the product with Id is not found");
    }
    res.send(product);
  }
);

module.exports = router;
