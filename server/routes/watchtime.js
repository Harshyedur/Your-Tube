import express from "express";
import { trackWatchTime, getWatchTimeStatus } from "../controllers/watchtime.js";

const routes = express.Router();

routes.post("/track", trackWatchTime);
routes.get("/status/:userid", getWatchTimeStatus);

export default routes;