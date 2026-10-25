
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    // 1. Read the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check whether the token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // 3. Extract the token
    const token = authHeader.split(" ")[1];

    // 4. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Store the user ID for the next handler
    req.userId = decoded.userId;

    // 6. Allow the request to continue
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

export default verifyToken;
