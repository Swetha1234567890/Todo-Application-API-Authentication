const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const app = express();
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
app.use(express.json());
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDB();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const getTodoStatusQuery = `SELECT * FROM todo WHERE status = '${status}';`;
      const statusArray = await db.all(getTodoStatusQuery);
      response.send(
        statusArray.map((eachArray) =>
          convertDbObjectToResponseObject(eachArray)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const getTodoPriorityQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
      const priorityArray = await db.all(getTodoPriorityQuery);
      response.send(
        priorityArray.map((eachArray) =>
          convertDbObjectToResponseObject(eachArray)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const getTodoCategoryQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      const categoryArray = await db.all(getTodoCategoryQuery);
      response.send(
        categoryArray.map((eachArray) =>
          convertDbObjectToResponseObject(eachArray)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (search_q !== undefined) {
    const getTodoSearchQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
    const searchArray = await db.all(getTodoSearchQuery);
    response.send(
      searchArray.map((eachArray) => convertDbObjectToResponseObject(eachArray))
    );
  }
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoIdArray = await db.get(getTodoIdQuery);
  response.send(convertDbObjectToResponseObject(todoIdArray));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let dateObj = new Date(date);
  let isDate = isValid(dateObj);
  if (isDate === true) {
    let dates = dateObj.getDate();
    let months = dateObj.getMonth();
    let years = dateObj.getFullYear();
    const dateFormat = format(new Date(years, months, dates), "yyyy-MM-dd");
    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${dateFormat}';`;
    const datesArray = await db.all(getDateQuery);
    response.send(
      datesArray.map((eachArray) => convertDbObjectToResponseObject(eachArray))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let status1 = null;
  let priority1 = null;
  let category1 = null;
  let dueDate1 = null;
  let dateObj = new Date(dueDate);
  const isDateValid = isValid(dateObj);
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    status1 = status;
  } else {
    status1 = undefined;
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    priority1 = priority;
  } else {
    priority1 = undefined;
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    category1 = category;
  } else {
    category1 = undefined;
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isDateValid === true) {
    let year1 = dateObj.getFullYear();
    let month1 = dateObj.getMonth();
    let date1 = dateObj.getDate();
    let formattedDate = format(new Date(year1, month1, date1), "yyyy-MM-dd");
    dueDate1 = formattedDate;
  } else {
    dueDate1 = undefined;
    response.status(400);
    response.send("Invalid Due Date");
  }

  if (
    id !== undefined &&
    todo !== undefined &&
    priority1 !== undefined &&
    status1 !== undefined &&
    category1 !== undefined &&
    dueDate1 !== undefined
  ) {
    const createTodoQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date) 
        VALUES (${id},'${todo}','${priority1}','${status1}','${category1}','${dueDate1}');
    `;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const updateTodoQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const updateTodoQuery = `
            UPDATE todo
            SET priority = '${priority}'
            WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo !== undefined) {
    const updateTodoQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = ${todoId};
        `;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateTodoQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    let dateObj = new Date(dueDate);
    const isDateValid = isValid(dateObj);
    if (isDateValid === true) {
      let date1 = dateObj.getDate();
      let month1 = dateObj.getMonth();
      let year1 = dateObj.getFullYear();
      const formattedDate = format(
        new Date(year1, month1, date1),
        "yyyy-MM-dd"
      );
      const updateTodoQuery = `
            UPDATE todo
            SET due_date = '${formattedDate}'
            WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE 
        FROM todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
