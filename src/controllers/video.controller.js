import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Apiresponse, ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import * as fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const filter = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    filter.user = userId;
  }

  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  }

  const skip = (page - 1) * limit;

  const [videos, total] = await Promise.all([
    Video.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)),
    Video.countDocuments(filter),
  ]);

  res.status(200).json({
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    videos,
  });
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "please give videoId");
  }
  const { title, description, thumbnail } = req.body;
  const video = Video.findOne({ _id: videoId });
  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (thumbnail) {
    video.thumbnail = thumbnail;
  }
  if (!(title || description || thumbnail)) {
    throw new ApiError(400, "please fill the values to be updated");
  }
  const updatedVideo = await video.save();
  if (!updatedVideo) {
    throw new ApiError(
      500,
      "video can't be updated due to some internal error"
    );
  }
  return res
    .status(400)
    .json(new Apiresponse(200, updateVideo, "video updated successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (
    [title, description].some((it) => {
      it?.trim() === "";
    })
  ) {
    throw new ApiError(400, "please enter title and description correctly");
  }
  const videoLocalPath = req.files?.Video.path;
  const thumbnailLocalPath = req.files?.thumbnail.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "please upload the video");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "please upload the thumbnail");
  }
  const videoCloud = await uploadOnCloudinary(videoLocalPath);
  const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoCloud) {
    fs.unlink(thumbnailLocalPath);
  }
  if (!thumbnailCloud) {
    fs.unlink(videoLocalPath);
  }
  const publishedVideo = await Video.create({
    videoFile: videoCloud.url,
    thumbnail: thumbnailCloud.url,
    owner: req.user._id,
    title: title,
    description: description,
    duration: videoCloud.duration,
    views,
    isPublished,
  });
  if (!publishedVideo) {
    throw new ApiError(500, "video not uploaded due to some server error");
  }

  res
    .status(200)
    .json(new ApiResponse(200, publishedVideo, "video uploaded successfullt"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "please pass the videoId");
  }
  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  return res.status(200).json(new ApiResponse(200, video, "video found"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "please send  videoId");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "the given video id is not valid");
  }
  const del = await Video.deleteOne({ _id: videoId });
  if (!del.acknowledged) {
    throw new ApiError(
      500,
      "video can't be deleted due to some internal server error"
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "the requested video is deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "plase enter videoId");
  }
  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    throw new ApiError(400, "plase give a valid video id");
  }
  video.status = !video.status;
  const updatedVideo = await video.save();
  if (!updatedVideo) {
    throw new ApiError(
      500,
      "status can't be updated please try after sometime"
    );
  }
  return res.status(
    200,
    updateVideo,
    `status of video is ${video.status} after updation`
  );
});

const viewCount = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "invalid videoid");
  }
  const video = await Video.findOne({ _id: videoId });
  if (!video) {
    throw new ApiError(400, "video not found");
  }
  video.views = video.views++;
  const updatedVideo = await user.save();

  if (!updatedVideo) {
    throw new ApiError(500, "internal server error");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "view count increased successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  viewCount,
};
