import express from "express";
import { SearchController } from "../controllers/search";

const router = express.Router();

router.get("/search", SearchController)

export default router