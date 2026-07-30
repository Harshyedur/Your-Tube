import express from "express";
import { createOrder, verifyPayment, getPaymentHistory } from "../controllers/payment.js";

const routes = express.Router();

routes.post("/create-order", createOrder);
routes.post("/verify", verifyPayment);
routes.get("/history/:userid", getPaymentHistory);

export default routes;