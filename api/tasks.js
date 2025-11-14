import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

// Middleware de autenticación
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secreto-aqui');
    return decoded;
  } catch (error) {
    return null;
  }
}

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

  // Verificar token
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);

    // GET - Obtener todas las tareas
    if (req.method === 'GET') {
      const [rows] = await connection.execute('SELECT * FROM tasks ORDER BY created_at DESC');
      
      // Convertir status de 0/1 a boolean
      const tasks = rows.map(task => ({
        ...task,
        status: task.status === 1
      }));
      
      return res.status(200).json(tasks);
    }

    // POST - Crear tarea
    if (req.method === 'POST') {
      const { name, deadline, status } = req.body;

      if (!name || !deadline) {
        return res.status(400).json({ message: 'Nombre y fecha límite son requeridos' });
      }

      const [result] = await connection.execute(
        'INSERT INTO tasks (name, deadline, status) VALUES (?, ?, ?)',
        [name, deadline, status ? 1 : 0]
      );

      const [newTask] = await connection.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        ...newTask[0],
        status: newTask[0].status === 1
      });
    }

    // PUT - Actualizar tarea
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { name, deadline, status } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'ID requerido' });
      }

      await connection.execute(
        'UPDATE tasks SET name = ?, deadline = ?, status = ? WHERE id = ?',
        [name, deadline, status ? 1 : 0, id]
      );

      return res.status(200).json({ message: 'Tarea actualizada' });
    }

    // DELETE - Eliminar tarea
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ID requerido' });
      }

      await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);

      return res.status(200).json({ message: 'Tarea eliminada' });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error('Error en tasks:', error);
    return res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}