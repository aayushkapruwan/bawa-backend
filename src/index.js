import dotenv from "dotenv"; //es6
import connectDB from "./db/index.js";
import { app } from "./app.js";
//require('dotenv').config({path:'./env'}) old version
dotenv.config(); //directly loads .env file present in root
/*dotenv.config({
  path: "./env",
}); this is used if .env is not in root directory*/
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR :", error);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`sever is running at port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log(`MONGODB CONNECTION FAILED :: ${error}`);
    process.exit(0);
  });
