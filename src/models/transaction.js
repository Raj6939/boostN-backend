const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    stripeSessionId: { type: String, unique: true },
    name: String,
    email: String,
    amount: Number,
    currency: String,
    packageName: String,
    status: { type: String, enum: ["paid", "failed"], default: "paid" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
