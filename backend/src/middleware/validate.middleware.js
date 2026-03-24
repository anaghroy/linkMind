import { validationResult } from "express-validator";
import ApiResponse from "../utils/apiResponse.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return res.status(422).json(
      ApiResponse.error("Validation failed", { errors: formatted })
    );
  }
  next();
};