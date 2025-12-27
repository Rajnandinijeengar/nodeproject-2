const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Carts = require("./models/Carts");
const User = require("./models/User");
const Contact = require("./models/Contact");
const Order = require("./models/Order");


const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for product images
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/img'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/img"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});


// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// =======================
// Routes
// =======================

// Show category page (list + add/edit)
app.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    console.log(categories);
    //fddgdgdgd
res.render("index", { categories });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add new category
app.post("/category/add", async (req, res) => {
  try {
    await Category.create({ name: req.body.name });
    res.redirect("/category");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/category", async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("category", { categories, editCategory: null });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// Edit category form
app.get("/category/edit/:id", async (req, res) => {
  try {
    const categories = await Category.find();
    const editCategory = await Category.findById(req.params.id);
    res.render("editCategory", { categories, editCategory });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update category
app.post("/category/update/:id", async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { name: req.body.name });
    res.redirect("/category");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete category
app.get("/category/delete/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/category");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/products", async (req, res) => {
  const categories = await Category.find();
  const products = await Product.find().populate("category");

  res.render("Products", {
    categories,
    products,
    editProduct: null  // MUST pass null if not editing
  });
});


app.post("/products/add", upload.single("image"), async (req, res) => {
  const filename = req.file ? req.file.filename : null;
  await Product.create({
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    description: req.body.description,
    image: filename
  });
  res.redirect("/products");
});


// Edit Product form
app.get("/products/edit/:id", async (req, res) => {
  const categories = await Category.find();
  const products = await Product.find().populate("category");
  const editProduct = await Product.findById(req.params.id);

  res.render("Products", {
    categories,
    products,
    editProduct  // pass the product to edit
  });
});


// Update Product
app.post("/product/update/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    description: req.body.description
  };
  if (req.file) updateData.image = req.file.filename;
  await Product.findByIdAndUpdate(req.params.id, updateData);
  res.redirect("/Product");
});

// Delete Product
app.get("/product/delete/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/Product");
});
// Show add product form (and list)
app.get("/products", async (req, res) => {
  const categories = await Category.find();
  const products = await Product.find().populate("category");
  res.render("Products", { categories, products, editProduct: null });
});

// Edit product
app.get("/products/edit/:id", async (req, res) => {
  const categories = await Category.find();
  const products = await Product.find().populate("category");
  const editProduct = await Product.findById(req.params.id);
  res.render("Products", { categories, products, editProduct });
});

app.get("/cart", async (req, res) => {
  const cartItems = await Carts.find().populate("productId");
  const total = cartItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);

  const categories = ["Electronics", "Clothing", "Books", "Home Appliances"];

  res.render("cart", { cartItems, total, categories });
});


// Edit quantity in cart
app.post("/cart/update/:id", async (req, res) => {
  try {
    await Carts.findByIdAndUpdate(req.params.id, { quantity: req.body.quantity });
    res.redirect("/cart");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 1️⃣ Show Add Profile Form
app.get("/addProfile", (req, res) => {
  const categories = ["Electronics", "Clothing", "Books", "Home Appliances"];
  res.render("addProfile", { user: null, categories });
});



// 2️⃣ Insert Profile Data
app.post("/profile/add", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = new User({ name, email, phone, address });
    await user.save();
    res.redirect("/profile/list");
  } catch (err) {
    res.send(err.message);
  }
});

// 3️⃣ Show All Profiles
app.get("/profile/list", async (req, res) => {
  const users = await User.find();
  res.render("listProfile", { users });
});

// 4️⃣ Edit Profile Form
app.get("/profile/edit/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render("addProfile", { user }); // same form for edit
});

// 5️⃣ Update Profile
app.post("/profile/edit/:id", async (req, res) => {
  const { name, email, phone, address } = req.body;
  await User.findByIdAndUpdate(req.params.id, { name, email, phone, address });
  res.redirect("/profile/list");
});

// 6️⃣ Delete Profile
app.get("/profile/delete/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/profile/list");
});


/// contact ////
app.get("/contact", (req, res) => {
  const categories = ["Electronics", "Clothing", "Shoes", "Books", "Beauty"];
  res.render("contact", { categories }); // passing categories to ejs
});app.get("/", (req, res) => {
  const categories = ["Electronics", "Clothing", "Shoes", "Books", "Beauty"];
  res.render("contact", { categories }); // passing categories to ejs
});

// Handle form submission
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  await Contact.create({ name, email, message });
  res.redirect("/contacts");
});

// Show all contacts
app.get("/contacts", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contacts", { contacts });
});

// Edit contact page
app.get("/edit/:id", async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  res.render("editContact", { contact });
});

// Update contact
app.post("/edit/:id", async (req, res) => {
  const { name, email, message } = req.body;
  await Contact.findByIdAndUpdate(req.params.id, { name, email, message });
  res.redirect("/contacts");
});

// Delete contact
app.get("/delete/:id", async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.redirect("/contacts");
});


/// about-us ///
// About Us Page
app.get("/about", (req, res) => {
  const teamMembers = [
    { name: "Sanjana Jeengar", role: "Founder & CEO" },
    { name: "Rahul Sharma", role: "Operations Manager" },
    { name: "Priya Verma", role: "Customer Support" },
  ];

  res.render("about", { teamMembers });
});


//// orders ////
app.get("/orders", async (req, res) => {
  // In real app -> req.user.username from login session
  const currentUser = "Sanjana";

  const allOrders = await Order.find();
  const myOrders = await Order.find({ user: currentUser });

  res.render("orders", { allOrders, myOrders, currentUser });
});

// Add a sample order (for testing quickly)
app.get("/add-order", async (req, res) => {
  await Order.create({
    user: "Sanjana",
    product: "Laptop",
    quantity: 1,
    status: "Shipped"
  });
  res.redirect("/orders");
});

  // ===== Routes =====

// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

// Handle Login
app.post("/login", async (req, res) => {
  const { Username, password } = req.body;
  const user = await User.findOne({ Username, password });
  if (user) {
    res.redirect("/users"); // redirect to data show page
  } else {
    res.send("Invalid email or password");
  }
});

// Data Show Page - Users List with Edit/Delete
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.render("users", { users });
});

// Edit User Page
app.get("/users/edit/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render("editUser", { user });
});

// Handle Update User
app.post("/users/edit/:id", async (req, res) => {
  const { name, Username, password } = req.body;
  await User.findByIdAndUpdate(req.params.id, { name, Username, password });
  res.redirect("/users");
});

// Delete User
app.get("/users/delete/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/users");
});


// Define the port
const PORT = process.env.PORT || 4000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
