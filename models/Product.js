const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String, required: true }
});

module.exports = mongoose.model("Product", productSchema);
