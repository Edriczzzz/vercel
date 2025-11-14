import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const USER = {
  username: "admin",
  passwordHash: await bcrypt.hash("1234", 10),
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Faltan credenciales" });
    }

    if (username !== USER.username) {
      return res.status(401).json({ message: "Usuario incorrecto" });
    }

    const valid = await bcrypt.compare(password, USER.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { username }, 
      process.env.JWT_SECRET || "secret-default-key", 
      { expiresIn: "1h" }
    );
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};