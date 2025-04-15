import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const cloudinaryUpload = async function (localFilePath) {
  try {
    if (!localFilePath) {
      throw new error("file path do not exist");
    }
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    if (uploadResult) {
      console.log(
        "file is uploaded on cloudinary with url :",
        uploadResult.url
      );
      fs.unlinkSync(localFilePath); // if uploaded then also remove from local
      return uploadResult;
    }
  } catch (error) {
    console.log("new error occured", error);
    fs.unlinkSync(localFilePath); //will remove local file if upload failed
  }
};
export { cloudinaryUpload };
