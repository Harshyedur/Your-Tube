import express from "express";
import { login, updateprofile, updateplan } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.patch("/updateplan/:id", updateplan);
export default routes;