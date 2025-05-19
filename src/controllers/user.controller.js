import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import * as fs from "fs";
import mongoose from "mongoose";

export const registerUser = asyncHandler(async function (req, res, next) {
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
  console.log(email);

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
    req.user._id, // this will came frm the verifyjwtmiddleware
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new Apiresponse(200, {}, "user logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async function (req, res, next) {
  //access
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new Apierror(401, "unauthorised request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new Apierror(401, "invalid refresh token");
    }
    // if (incomingRefreshToken !== user?.refreshToken) {
    //   throw new Apierror(401, "refresh token expired or used");
    // }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { newRefreshToken, accessToken } =
      await generateAccessTokenRefreshToken(user._id);
    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new Apiresponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new Apierror(400, error?.message || "invalid refresh token");
  }
});
export const updatePassword = asyncHandler(async function (req, res, next) {
  const { oldPassword, newPassword } = req.body;
  const userMiddleware = req.user;
  if (!userMiddleware) {
    throw new Apierror(401, "user don't exist");
  }
  const user = await User.findById(userMiddleware?._id);
  const passwordValid = await user.isPasswordCorrect(oldPassword);
  if (!passwordValid) {
    throw new Apierror(401, "password not matched");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new Apiresponse(200, {}, "password changed successfully"));
});
export const getCurrentUser = asyncHandler(async function (req, res, next) {
  const user = req.user;
  res.status(200).json(new Apiresponse(200, user, "user send successfully"));
});
export const updateAccountDetails = asyncHandler(
  async function (req, res, next) {
    const { fullName, email } = req.body;
    if (!(fullName || email)) {
      throw new Apierror(401, "enter the complete information");
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-refreshToken -password");
    return res
      .status(200)
      .json(new Apiresponse(200, user, "account updated successfully"));
  }
);
export const updateAvatarImage = asyncHandler(async function (req, res, next) {
  const { avatarLocalPath } = req.file?.path;
  if (!avatarLocalPath) {
    throw new Apierror(401, "Avatar is missigng");
  }
  const avatar = await cloudinaryUpload(avatarLocalPath);
  if (!avatar.url) {
    fs.unlink(avatarLocalPath);
    throw new Apierror(400, "error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  res.status(200).json(200, user, "avatar updated successfully");
});
export const updateCoverImage = asyncHandler(async function (req, res, next) {
  const { coverImageLocalPath } = req.file?.path;
  if (!coverImageLocalPath) {
    throw new Apierror(401, "Avatar is missigng");
  }
  const coverImage = await cloudinaryUpload(coverImageLocalPath);
  if (!coverImage.url) {
    fs.unlink(coverImageLocalPath);
    throw new Apierror(400, "error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  res.status(200).json(200, user, "coverImage updated successfully");
});
export const getCurrentChannelProfile = asyncHandler(
  async function (req, res, next) {
    const userName = req.params;
    if (!userName.trim()) {
      throw new Apierror(401, "userName is not complete");
    }
    const channel = User.aggregate([
      {
        $match: {
          userName: userName?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subsciptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subsciptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          subscibedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          userName: 1,
          subscribersCount: 1,
          subscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);
    if (!channel?.length) {
      throw new ApiError(404, "channel does not exists");
    }

    return res
      .status(200)
      .json(
        new Apiresponse(200, channel[0], "user channel fetched successfully")
      );
  }
);
export const userWatchHistory = asyncHandler(async function (req, res, next) {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!user) {
    throw new Apierror(401, "user not fetched");
  }
  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        user[0].watchHistory,
        "watchHistory fetched successfully"
      )
    );
});
