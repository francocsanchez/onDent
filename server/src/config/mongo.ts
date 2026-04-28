import "colors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.DATABASE_MONGO?.trim();

    if (!mongoUri) {
      throw new Error("DATABASE_MONGO no definida");
    }

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
    console.error(error);
    process.exit(1);
  }
};
