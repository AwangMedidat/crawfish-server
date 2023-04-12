const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8008;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/update-sensor", (req, res) => {
  res.status(200).send("KITA COBA");
});

app.post("/update-sensor", (req, res) => {
  const data = req.body;
  console.log(data);

  res.status(201).send(data);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
