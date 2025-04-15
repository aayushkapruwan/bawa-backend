import { asyncHandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/apiresponse.js";
export const userController = asyncHandler(async function (req, res, next) {
  res.status(200).json({
    message: "kaam ho gaya",
  });
});
export const registerUser = asyncHandler(async function (req, res, next) {
  //get user details from postman
  //validation-not empty
  //check user already exit or not
  //check for images,avatar->upload in cloudinary,avatar
  //create user object-create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res
  const { fullName, email, userName, password } = await req.body;
  if (
    [fullName, email, userName, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new Apierror(400, "All field are required");
  }
  const existedUser =await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new Apierror(409, "user already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath ;
  if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
     coverImageLocalPath=req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new Apierror(400, "avatar file required");
  }
  const avatar = await cloudinaryUpload(avatarLocalPath);
  const coverImage = await cloudinaryUpload(coverImageLocalPath);
  if (!avatar) {
    throw new Apierror(400, "avatar file required");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new Apierror(500, "Something went wrong while registering the error");
  }
  return res
    .status(201)
    .json(new Apiresponse(200, createdUser, "User registered successfully"));
});
