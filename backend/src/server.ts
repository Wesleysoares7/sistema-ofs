import express, { Express } from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import contribuicaoRoutes from "./routes/contribuicoes.js";
import configRoutes from "./routes/config.js";
import { authenticate } from "./middlewares/auth.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.js";
import { limiter, logRequests } from "./middlewares/index.js";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
app.use(limiter);

// Logging
app.use(logRequests);

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/config", configRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/contribuicoes", authenticate, contribuicaoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
});

export default app;
