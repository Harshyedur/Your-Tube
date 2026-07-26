
import express from "express";
import { requestdownload, getuserdownloads } from "../controllers/download.js";

const routes = express.Router();

routes.post("/request", requestdownload);
routes.get("/user/:userid", getuserdownloads);

export default routes;