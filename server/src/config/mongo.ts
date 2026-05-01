import "colors";
import mongoose from "mongoose";
import { getRequiredEnv } from "../helpers/env";

export const connectDB = async () => {
  try {
    const mongoUri = getRequiredEnv("DATABASE_MONGO");

    const connection = await mongoose.connect(mongoUri);
    const { host, port, name } = connection.connection;

    console.log("────────────────────────────────────────".gray);
    console.log("🧠 MongoDB connected successfully".green.bold);
    console.log(`📍 Host : ${host}`.magenta);
    console.log(`🔌 Port : ${port}`.magenta);
    console.log(`📦 DB   : ${name}`.cyan);
    console.log("────────────────────────────────────────".gray);
  } catch (error) {
    console.log("❌ MongoDB connection error".red.bold);
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};
