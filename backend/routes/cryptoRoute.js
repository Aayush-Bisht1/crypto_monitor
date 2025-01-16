import express from "express";
import axios from "axios";
import Redis from "../redis.js";
import pool from "../db.js";

const router = express.Router();
const CRYPTO_IDS = [
  "bitcoin",
  "ethereum",
  "xrp",
  "tether",
  "bnb",
  "solana",
  "cardano",
  "dogecoin",
  "stellar",
  "ripple",
  "litecoin",
  "avalanche",
  "polkadot",
  "ethereum-classic",
  "cosmos",
  "solana",
  "tron",
  "tezos",
  "usds",
  "monero",
  "coinbase",
  "filecoin",
  "near",
  "kaspa",
];
const CACHE_DURATION = 300; // 5 minutes

router.get("/prices", async (req, res) => {
  try {
    const redis = await Redis.getInstance();
    const cachedData = await redis.get("crypto_prices");

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: CRYPTO_IDS.join(","),
          vs_currencies: "usd",
          include_24hr_change: true,
          include_last_updated_at: true,
        },
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
      }
    );

    await redis.setEx(
      "crypto_prices",
      CACHE_DURATION,
      JSON.stringify(response.data)
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const cryptoEntries = Object.entries(response.data);
      const queryPromises = cryptoEntries.map(([symbol, data]) => {
        const { usd, usd_24h_change, last_updated_at } = data;
        return client.query(
          `INSERT INTO crypto_prices (symbol, price_usd, price_change_24h, last_updated_at)
             VALUES ($1, $2, $3, to_timestamp($4))`,
          [symbol, usd, usd_24h_change, last_updated_at]
        );
      });
      await Promise.all(queryPromises);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.json(response.data);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return res.status(500).json({ error: "Failed to fetch prices" });
  }
});

export default router;
