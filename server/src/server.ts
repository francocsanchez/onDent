import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Connect to MongoDB
import { connectDB } from "./config/mongo";
import { corsOptions } from "./config/cors";

dotenv.config();
connectDB();

const app = express();

app.use(morgan("dev"));

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
import obraSocialRoutes from "./routes/obraSocialRoutes";
import pacienteRoutes from "./routes/pacienteRoutes";
import codigoRoutes from "./routes/codigoRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import atencionRoutes from "./routes/atencionRoutes";

app.use("/api/obras-sociales", obraSocialRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/codigos", codigoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/atenciones", atencionRoutes);

export default app;
