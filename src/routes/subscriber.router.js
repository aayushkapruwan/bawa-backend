import {toggleSubscription,getUserChannelSubscribers,getSubscribedChannels} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
const router= Router();
router.post("/subscribeToggle/:channelId",verifyJWT,toggleSubscription);
router.get("/subscribers/:channelId",getUserChannelSubscribers);
router.get("/channels/:subscriberId",getSubscribedChannels);
export default router;