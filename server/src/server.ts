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

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(cors(corsOptions));
app.use(express.json());

// Routes
import usuarioRoutes from "./routes/usuarioRoutes";

app.use("/api/usuarios", usuarioRoutes);

export default app;
