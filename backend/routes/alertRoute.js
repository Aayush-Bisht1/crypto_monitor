import express from "express";
import nodemailer from "nodemailer";
import cron from "node-cron";
import pool from "../db.js";

const router = express.Router();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function getCurrentPrice(symbol) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
      {
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
      }
    );
    const data = await response.json();
    return data[symbol]?.usd || null;
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
}
async function sendPriceAlert(
  email,
  symbol,
  targetPrice,
  currentPrice,
  isAboveTarget
) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: `Price Alert for ${symbol}`,
    text: `Price Alert for ${symbol}!
               Target Price: ${targetPrice}
               Current Price: ${currentPrice}
               Status: Price is ${isAboveTarget ? "above" : "below"} target`,
  };

  return transporter.sendMail(mailOptions);
}

// Function to check alerts and send notifications
async function checkAndNotifyAlerts() {
  try {
    // Get all active alerts
    const alerts = await pool.query(
      `SELECT * FROM price_alerts 
             WHERE is_active = true 
             AND last_notification_time < NOW() - INTERVAL '1 hour'` // Prevent spam by limiting to once per hour
    );

    for (const alert of alerts.rows) {
      const currentPrice = await getCurrentPrice(alert.symbol);
      const shouldNotify = alert.is_above
        ? currentPrice > alert.target_price
        : currentPrice < alert.target_price;

      if (shouldNotify) {
        await sendPriceAlert(
          alert.email,
          alert.symbol,
          alert.target_price,
          currentPrice,
          alert.is_above
        );

        // Update last notification time
        await pool.query(
          `UPDATE price_alerts 
                     SET last_notification_time = NOW(),
                         last_checked_price = $1
                     WHERE id = $2`,
          [currentPrice, alert.id]
        );
      }
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }
}

// Schedule price checking every 5 minutes
cron.schedule("*/5 * * * *", checkAndNotifyAlerts);

// Route to create new alert
router.post("/create", async (req, res) => {
  try {
    const { email, symbol, targetPrice, isAbove } = req.body;
    if (!email || !symbol || !targetPrice || isAbove === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get current price
    const currentPrice = await getCurrentPrice(symbol);

    // Store alert in database
    const result = await pool.query(
      `INSERT INTO price_alerts (
                email, 
                symbol, 
                target_price, 
                is_above, 
                current_price,
                is_active,
                last_notification_time,
                last_checked_price
             )
             VALUES ($1, $2, $3, $4, $5, true, NOW(), $5)
             RETURNING *`,
      [email, symbol, targetPrice, isAbove, currentPrice]
    );

    // Check immediately if alert should be sent
    const shouldAlert = isAbove
      ? currentPrice > targetPrice
      : currentPrice < targetPrice;

    if (shouldAlert) {
      await sendPriceAlert(email, symbol, targetPrice, currentPrice, isAbove);
    }

    return res.json({
      ...result.rows[0],
      alertSent: shouldAlert,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return res.status(500).json({ error: "Failed to create price alert" });
  }
});

// Route to deactivate alert
router.delete("/alerts/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE price_alerts 
             SET is_active = false 
             WHERE id = $1 
             RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error deactivating alert:", error);
    return res.status(500).json({ error: "Failed to deactivate alert" });
  }
});

export default router;
