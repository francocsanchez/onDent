import { CorsOptions } from "cors";

const isProduction = process.env.NODE_ENV === "production";

function getAllowedOrigins() {
  const configuredOrigin = process.env.FRONTEND_URL?.trim();

  if (configuredOrigin) {
    return [configuredOrigin];
  }

  if (!isProduction) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
  }

  return [];
}

export const corsOptions: CorsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (!isProduction) {
        console.warn(
          `[CORS] Origin rechazado: ${origin}. Origenes permitidos: ${allowedOrigins.join(", ") || "ninguno configurado"}`,
        );
      }
      callback(new Error("Not allowed by CORS"));
    }
  },
};
