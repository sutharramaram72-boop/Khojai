import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock AI Earning Logic
  app.post("/api/earn", (req, res) => {
    const { userId, action } = req.body;
    res.json({ success: true, reward: 0.05, message: `Earned 0.05 for ${action}` });
  });

  // Mock Payment Logic
  app.post("/api/pay", (req, res) => {
    const { userId, amount, productId } = req.body;
    // In a real app, this would integrate with Razorpay/Stripe
    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
      res.json({ success: true, transactionId: `TXN_${Date.now()}`, message: "Payment successful!" });
    } else {
      res.status(400).json({ success: false, message: "Payment failed. Please try again." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
