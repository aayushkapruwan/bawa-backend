import mongoose, { isValidObjectId } from "mongoose";

import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Apiresponse, ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {

  const { channelId } = req.params;
  const userId = req.user._id;
  if (!channelId || !userId) {
    throw new ApiError(400, "invalid request");
  }
  const doc = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });
  if (!doc) {
    const createdSub = await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, createdSub, "user got subscriber to channel"));
  }
  const deltedValid = await Subscription.deleteOne({ _id: doc._id });

  return res
    .status(400)
    .json(new ApiResponse(400, {}, "channel got unsubscribed"));
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
    if(!channelId){
    throw new ApiError("400","channeid not found")
  }
  const subscribers = await subscription.aggregate([
    {
      $match: {
        channel:  mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "Subscriptions",
        localField: "channelId",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $lookup: {
              from: "User",
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriberObject",
            },
            $addFields: {
              subscriber: {
                $first: "$subscriber",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!subscribers) {
    throw new ApiError(400, "something went wrong");
  }
  return res
    .status(200)
    .json(new Apiresponse(subscribers[0]), "subscribers fetched successfully");
});


const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
