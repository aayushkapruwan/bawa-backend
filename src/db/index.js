import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async function () {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    if (connectionInstance) {
      console.log(
        `\n MONGODB CONNECTED !! DBHOST: ${connectionInstance.connection.host}`
      );
    }
  } catch (error) {
    console.log("MONGODB Connection Failed", error);
    process.exit(1);
  }
};
export default connectDB;
