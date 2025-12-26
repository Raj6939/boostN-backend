const express = require("express");
const stripe = require("../services/stripe");

const router = express.Router();

// Backend-controlled pricing
const SPONSOR_PACKAGES = {
  bronze: { name: "Bronze Sponsorship", amount: 250 },
  silver: { name: "Silver Sponsorship", amount: 500 },
  gold: { name: "Gold Sponsorship", amount: 1000 },
};

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { type, packageId, amount, customer, message } = req.body;

    let finalAmount;
    let productName;

    if (type === "sponsorship") {
      const pkg = SPONSOR_PACKAGES[packageId];
      if (!pkg) return res.status(400).json({ error: "Invalid package" });

      finalAmount = pkg.amount;
      productName = pkg.name;
    }

    if (type === "donation") {
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid donation amount" });
      }
      finalAmount = amount;
      productName = "Donation";
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: finalAmount * 100,
            product_data: { name: productName },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type,
        packageId: packageId || null,
        packageName: productName,
        company: customer.company || null,
        firstName: customer.firstName || null,
        lastName: customer.lastName || customer.name || null,
        email: customer.email,
        phone: customer.phone || null,
        message: message || null,
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
});

module.exports = router;
