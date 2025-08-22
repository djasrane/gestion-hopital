// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // Vérifier si l'en-tête Authorization existe
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Aucun token fourni",
        code: "NO_TOKEN",
      });
    }

    // Le token doit être sous la forme : Bearer <token>
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Format de token invalide. Utiliser 'Bearer <token>'",
        code: "INVALID_FORMAT",
      });
    }

    const token = parts[1];

    // Debug (à enlever en prod)
    console.log("Token reçu:", token);
    console.log("JWT_SECRET utilisé:", process.env.JWT_SECRET);

    // Vérification du token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Erreur de vérification JWT:", err.message);
        return res.status(401).json({
          success: false,
          error: "Token d'authentification invalide ou expiré",
          code: "INVALID_TOKEN",
        });
      }

      // On attache les infos décodées à la requête
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Erreur serveur middleware JWT:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la vérification du token",
      code: "SERVER_ERROR",
    });
  }
};
