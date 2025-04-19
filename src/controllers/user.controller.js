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
  const { fullName, email, userName, password } = req.body;
  if (
    [fullName, email, userName, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new Apierror(400, "All field are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new Apierror(409, "user already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
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
const generateAccessTokenRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Apierror(
      500,
      "something went wrong while generating access token and refresh token"
    );
  }
};
export const loginUser = asyncHandler(async function (req, res, next) {
  const { userName, email, password } = req.body;

  if (!userName && !email) {
    return new Apierror(
      400,
      "please enter the credentials (username or email)"
    );
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (!user) {
    return new Apierror(404, "user with provided credentials not found");
  }
  const validUser = await user.isPasswordCorrect(password);
  if (!validUser) {
    return new Apierror(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new Apiresponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});
export const logOut = asyncHandler(async function (req, res, next) {
  const options = {
    httpOnly: true,
    secure: true,
  };
  User.findByIdAndUpdate(
    req.user._id,// this will came frm the verifyjwtmiddleware
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessToken, options)
    .clearCookie("refreshToken", refreshToken, options)
    .json(new Apiresponse(200, {}, "user logged out successfully"));
});
