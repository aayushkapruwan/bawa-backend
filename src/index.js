import dotenv from "dotenv"
import connectDB from "./db/index.js";
//require('dotenv').config({path:'./env'}) old version
dotenv.config({
    path:'./env'
})
connectDB();




















// import mongoose from "mongoose";
// import { ayushkapruwanDb } from "./constants";
// import express from "express"
// const app=express();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${ayushkapruwanDb}`);
//     app.on("error",()=>{
//         console.log("Error:",error);
//         throw error;
        
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`app is listenign on port ${process.env.PORT}`);
        
//     })
//   } catch (error) {
//     console.log("ERROR:", error);
//     throw error;
//   }
// })();
