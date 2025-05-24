import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Apierror } from "../utils/ApiError.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;
  if (!channelId || !userId) {
    throw new Apierror(400, "invalid request");
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
      .json(new Apiresponse(200, createdSub, "user got subscriber to channel"));
  }
  const deltedValid = await Subscription.deleteOne({ _id: doc._id });

  return res
    .status(200)
    .json(new Apiresponse(200, {}, "channel got unsubscribed"));
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new Apierror("400", "channeid not found");
  }
  const subscribers = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriberObject",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              subscriberObject: {
                $first: "$subscriberObject",
              },
            },
          },
          {
            $project: {
              _id: 0,
              subscriber: 1,
              subscriberObject: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        subscribers: 1,
      },
    },
  ]);
  if (!subscribers) {
    throw new Apierror(400, "something went wrong");
  }
  console.log(
    new Apiresponse(200, subscribers, "Subscribers fetched successfully")
  );
  return res
    .status(200)
    .json(
      new Apiresponse(200, subscribers[0], "Subscribers fetched successfully")
    );
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new Apierror("200", "subscriberId not valid");
  }
  const subscribedChannels = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "channelDetails",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              channelDetails: {
                $first: "$channelDetails",
              },
            },
          },
          {
            $project: {
              channelDetails: 1,
              channel: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribedChannels: 1,
        _id: 0,
      },
    },
  ]);
  if (!subscribedChannels) {
    throw new Apierror(200, "subscribedChannels not exist");
  }
  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        subscribedChannels,
        "subscribed channels fetched successfully"
      )
    );
});
