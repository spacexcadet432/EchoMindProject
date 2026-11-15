import { Router } from "express";
import { getReflectionThreadHandler, postReflectionHandler } from "./reflection";

const router = Router();

router.post("/api/reflection", (req, res) => {
  postReflectionHandler(req, res);
});

router.get("/api/reflection/thread", (req, res) => {
  getReflectionThreadHandler(req, res);
});

export default router;

