require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const paymentRoutes = require("./routes/payments");
const webhookRoutes = require("./routes/webhook");

const app = express();
connectDB();

app.use(cors());

// Webhook must come BEFORE json parser
app.use("/api/webhook", webhookRoutes);

app.use(express.json());
app.use("/api/payments", paymentRoutes);

app.get("/", (_, res) => res.send("Backend running"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
