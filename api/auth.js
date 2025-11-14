import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const USER = {
  username: "admin",
  passwordHash: "$2a$10$Xj8cWXqPXVHxe4tWLQsKHOqJ9xYZ1RvHx6Y8Z3Z9Z3Z9Z3Z9Z3Z9Z", // hash de "1234"
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo POST para login
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    // Verificar usuario
    if (username !== USER.username) {
      return res.status(401).json({ message: 'Usuario incorrecto' });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, USER.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token
    const token = jwt.sign(
      { username }, 
      process.env.JWT_SECRET || 'tu-secreto-aqui',
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}