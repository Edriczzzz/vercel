import pool from "../db.js";

export const getTasks = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tasks");
    
    // Convertir status de 0/1 a false/true
    const tasks = rows.map(task => ({
      ...task,
      status: task.status === 1
    }));
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ?", 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    const task = { ...rows[0], status: rows[0].status === 1 };
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { name, deadline, status } = req.body;
    
    const [result] = await pool.query(
      "INSERT INTO tasks (name, deadline, status) VALUES (?, ?, ?)",
      [name, deadline, status ? 1 : 0]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      deadline,
      status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { name, deadline, status } = req.body;
    
    await pool.query(
      "UPDATE tasks SET name = ?, deadline = ?, status = ? WHERE id = ?",
      [name, deadline, status ? 1 : 0, req.params.id]
    );
    
    res.json({ message: "Tarea actualizada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ message: "Tarea eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};