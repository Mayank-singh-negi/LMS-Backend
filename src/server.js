import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Force IPv4 DNS globally — Render free tier blocks IPv6 outbound
dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

// Load .env FIRST, before any other imports
dotenv.config({ path: envPath });

// Now import other modules after .env is loaded
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Import app AFTER dotenv is configured
    const { default: app } = await import("./app.js");
    
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start", error);
    process.exit(1);
  }
};

startServer();

// Keep Render free tier alive — ping every 14 minutes to prevent cold starts
if (process.env.RENDER_EXTERNAL_URL) {
  const PING_URL = process.env.RENDER_EXTERNAL_URL;
  setInterval(async () => {
    try {
      await fetch(PING_URL);
      console.log(`[keep-alive] pinged ${PING_URL}`);
    } catch (e) {
      console.warn("[keep-alive] ping failed:", e.message);
    }
  }, 14 * 60 * 1000); // every 14 minutes
}
