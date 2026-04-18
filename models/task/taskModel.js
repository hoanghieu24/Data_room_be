const db = require("../../db");

class Task {
  constructor(
    id,
    task_code,
    title,
    description,
    completed_date,
    assigned_to,
    task_type,
    status,
    priority,
    is_active
  ) {
    this.id = id;
    this.task_code = task_code;
    this.title = title;
    this.description = description;
    this.completed_date = completed_date;
    this.assigned_to = assigned_to;

    // 👉 luôn trả NAME cho FE hiển thị
    this.task_type = task_type;
    this.status = status;
    this.priority = priority;

    this.is_active = is_active;
  }

  /* ================= GET ALL ================= */
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT 
          t.id,
          t.task_code,
          t.title,
          t.description,
          t.completed_date,
          t.assigned_to,
          t.is_active,

          task_type.name AS task_type,
          status.name AS status,
          priority.name AS priority

      FROM tasks AS t
      LEFT JOIN categories AS task_type
          ON t.task_type_id = task_type.id
      LEFT JOIN categories AS status
          ON t.status_id = status.id
      LEFT JOIN categories AS priority
          ON t.priority_id = priority.id
      WHERE t.is_deleted = FALSE;
    `);

    return rows.map(row => new Task(
      row.id,
      row.task_code,
      row.title,
      row.description,
      row.completed_date,
      row.assigned_to,
      row.task_type,
      row.status,
      row.priority,
      row.is_active
    ));
  }

  /* ================= GET BY ID ================= */
  static async getById(id) {
    const [rows] = await db.execute(`
      SELECT 
          t.id,
          t.task_code,
          t.title,
          t.description,
          t.completed_date,
          t.assigned_to,
          t.is_active,

          task_type.name AS task_type,
          status.name AS status,
          priority.name AS priority

      FROM tasks t
      LEFT JOIN categories task_type ON t.task_type_id = task_type.id
      LEFT JOIN categories status ON t.status_id = status.id
      LEFT JOIN categories priority ON t.priority_id = priority.id
      WHERE t.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const row = rows[0];

    return new Task(
      row.id,
      row.task_code,
      row.title,
      row.description,
      row.completed_date,
      row.assigned_to,
      row.task_type,
      row.status,
      row.priority,
      row.is_active
    );
  }

  /* ================= CREATE ================= */
  static async create(data) {
    const {
      title,
      description,
      assigned_to,
      created_by,
      task_type_id,
      status_id,
      priority_id,
      is_active
    } = data;

    if (!assigned_to) {
      throw new Error("Phải có người được giao task");
    }

    const task_code = "TASK-" + Date.now();

    const [result] = await db.execute(`
      INSERT INTO tasks 
      (
        task_code,
        title,
        description,
        assigned_to,
        created_by,
        task_type_id,
        status_id,
        priority_id,
        is_active
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task_code,
      title ?? null,
      description ?? null,
      assigned_to,
      created_by ?? 1,
      task_type_id ?? null,
      status_id ?? null,
      priority_id ?? null,
      is_active ?? 1
    ]);

    // 👉 trả về object FULL luôn
    return await Task.getById(result.insertId);
  }

  /* ================= UPDATE ================= */
  static async update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      "title",
      "description",
      "task_type_id",
      "status_id",
      "priority_id",
      "assigned_to", // 🔥 FIX
      "is_active",
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        let value = data[key];

        if (value === "") value = null;

        if (key === "is_active") {
          value =
            value === true || value === 1 || value === "1"
              ? 1
              : 0;
        }

        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error("Không có dữ liệu để update");
    }

    values.push(id);

    await db.execute(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // 👉 luôn trả về data chuẩn
    return await Task.getById(id);
  }

  /* ================= DELETE ================= */
  static async delete(id) {
    // 👉 soft delete cho an toàn
    await db.execute(
      "UPDATE tasks SET is_deleted = TRUE WHERE id = ?",
      [id]
    );
  }
}

module.exports = Task;