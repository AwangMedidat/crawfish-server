const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const port = 8008;
let dataSensor = {
  temperature: "",
  ph: "",
  ppm: "",
  buzzer_state: "",
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.get("/update-sensor", (req, res) => {
  res.status(200).send("KITA COBA");
});

app.post("/update-sensor", (req, res) => {
  const { temperature, ph, ppm, buzzer_state } = req.body;
  // console.log(req.body, '>>>> HASIL IOT');
  // console.log(req.headers);
  dataSensor.temperature = req.body.temperature;
  dataSensor.ppm = req.body.ppm;
  dataSensor.ph = req.body.ph;
  dataSensor.buzzer_state = req.body.buzzer_state;
  io.emit("sensor data", dataSensor);
  res.status(201).send(req.body);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
