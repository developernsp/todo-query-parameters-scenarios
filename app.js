const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusproperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//GET todos info of 4 scenarios API

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusproperties(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE 
                    todo  LIKE "%${search_q}%"
                    AND status = "${status}"
                    AND priority = "${priority}";`;
      break;
    case hasPriorityProperties(request.query):
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE "%${search_q}%"
                    AND priority = "${priority}";`;
      break;
    case hasStatusProperties(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE "%${search_q}%"
                    AND status = "${status}";`;
      break;
    default:
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE "%${search_q}%";`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//GET todo basedOn todoId API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = "${todoId}";`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//POST todo API

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addNewTodoQuery = `
        INSERT INTO
            todo(id, todo, priority, status)
        VALUES(
            ${id},
            "${todo}",
            "${priority}",
            "${status}");`;
  await db.run(addNewTodoQuery);
  response.send("Todo Successfully Added");
});

//DELETE todo API

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteToddQuery = `
        DELETE 
        FROM todo
        WHERE id = "${todoId}";`;
  await db.run(deleteToddQuery);
  response.send("Todo Deleted");
});

//PUT update todos table using 3 different scenarios API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            id = "${todoId}";`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
        UPDATE todo
        SET
            todo = "${todo}",
            priority = "${priority}",
            status = "${status}"
        WHERE 
            id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

module.exports = app;
