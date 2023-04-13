const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8008;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/update-sensor", (req, res) => {
  res.status(200).send("KITA COBA");
});

app.post("/update-sensor", (req, res) => {
  const { temperature, ph, ppm, buzzer_state } = req.body;
  console.log(req.body, '>>>> HASIL IOT');

  res.status(201).send(data);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
