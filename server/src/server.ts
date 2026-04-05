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

app.use((req, _res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Routes
import pacienteRoute from "./routes/pacienteRoute";
import obraSocialRouter from "./routes/obraSocialRoute";
import codigoRoute from "./routes/codigoRoute";

app.use("/api/obras-sociales", obraSocialRouter);
app.use("/api/pacientes", pacienteRoute);
app.use("/api/codigos", codigoRoute);

export default app;
