const express = require("express");
const stripe = require("../services/stripe");
const Transaction = require("../models/transaction");
const { sendEmail } = require("../services/mail");

const router = express.Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Idempotency check
      const exists = await Transaction.findOne({
        stripeSessionId: session.id,
      });
      if (exists) return res.json({ received: true });

      const tx = await Transaction.create({
        stripeSessionId: session.id,
        name: `${session.metadata.firstName || ""} ${session.metadata.lastName || ""}`.trim(),
        email: session.metadata.email,
        amount: session.amount_total / 100,
        currency: session.currency,
        packageName: session.metadata.packageName,
        status: "paid",
      });

      // Email to user
      await sendEmail({
        to: tx.email,
        subject: "Payment received – thank you!",
        html: `
          <p>Thank you for your support.</p>
          <p><b>Amount:</b> €${tx.amount}</p>
          <p><b>Package:</b> ${tx.packageName}</p>
        `,
      });
    }

    res.json({ received: true });
  }
);

module.exports = router;
