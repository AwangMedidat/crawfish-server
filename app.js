const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const salt = 10;
const port = 8008;
let dataSensor = {
  temperature: "",
  ph: "",
  ppm: "",
  buzzer_state: "",
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "crawfish",
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not authenticated" });
  } else {
    jwt.verify(token, "jwt-key", (err, decoded) => {
      if (err) {
        return res.json({ Error: "Token is incorrect" });
      } else {
        req.id = decoded.id;
        req.email = decoded.email;
        req.name = decoded.name;
        next();
      }
    });
  }
};

app.get("/", verifyUser, (req, res) => {
  const data = {
    id: req.id,
    name: req.name,
    email: req.email,
  };
  return res.json({ Status: "Success", data });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

app.post("/post-sensor", (req, res) => {
  const { temperature, ph, ppm, kolam_id } = req.body;

  const sql =
    "INSERT INTO sensor (`temperature`,`ph`,`ppm`,`kolam_id`) VALUES (?)";
  const values = [+temperature, +ph, +ppm, +kolam_id];
  db.query(sql, [values], (err, result) => {
    // if (err) return res.json({ Error: "Inserting data Error in server" });
    return res.json({ Status: "Success Post Sensor", data: result, err: err });
  });

  // console.log(hasil, "ini hasil query");

  // res.status(201).send(req.body);
});

app.post("/update-sensor", (req, res) => {
  // console.log(req.body, '>>>> HASIL IOT');
  // console.log(req.headers);
  // const sql1 = "SELECT * FROM sensor WHERE kolam_id = ?";
  // db.query(sql1, [+req.body.kolam_id], (err, data) => {
  //   if (err) return res.json({ Error: "Search Kolam Error in server" });
  //   if (data.length > 0) {
  //     const sql =
  //       "UPDATE sensor SET `temperature`=?, `ph`=?, `ppm`=? WHERE kolam_id = ?";
  //     db.query(
  //       sql,
  //       [req.body.temperature, req.body.ph, req.body.ppm, req.body.kolam_id],
  //       (err, result) => {
  //         if (err) return res.json({ Error: "Updating data Error in server" });
  //         // return res.json({ Status: "Success" });
  //       }
  //     );
  //   } else {
  //     const sql =
  //       "INSERT INTO sensor (`temperature`,`ph`,`ppm`,`kolam_id`) VALUES (?)";
  //     const values = [
  //       +req.body.temperature,
  //       +req.body.ph,
  //       +req.body.ppm,
  //       +req.body.kolam_id,
  //     ];
  //     db.query(sql, [values], (err, result) => {
  //       if (err) return res.json({ Error: "Inserting data Error in server" });
  //       // return res.json({ Status: "Success" });
  //     });
  //   }
  //   return res.json({ Status: "Success", data });
  // });

  dataSensor.temperature = +req.body.temperature;
  dataSensor.ppm = +req.body.ppm;
  dataSensor.ph = +req.body.ph;
  dataSensor.buzzer_state = +req.body.buzzer_state;
  io.emit("sensor data", dataSensor);
  console.log("sudah terkirim");
  res.status(201).send(req.body);
});

app.post("/signup", (req, res) => {
  const sql = "INSERT INTO user (`email`,`password`,`username`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
    if (err) return res.json({ Error: "Error for hashing password" });
    const values = [req.body.email, hash, req.body.username];
    db.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inserting data Error in server" });
      return res.json({ Status: "Success" });
    });
  });
});

app.post("/signin", (req, res) => {
  const sql = "SELECT * FROM user WHERE email = ?";

  db.query(sql, [req.body.email], (err, data) => {
    console.log(err, "<<< error");
    if (err) return res.json({ Error: "Login Error in server" });
    if (data.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        data[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "Password compare error" });
          if (response) {
            const name = data[0].username;
            const id = data[0].id;
            const email = data[0].email;
            const token = jwt.sign({ id, name, email }, "jwt-key", {
              expiresIn: "1h",
            });
            res.cookie("token", token);
            return res.json({ Status: "Success" });
          } else {
            return res.json({ Error: "Password not matched" });
          }
        }
      );
    } else {
      return res.json({ Error: "No email existed" });
    }
    // return res.json({ Status: "Success" });
  });
});

app.post("/add-kolam", (req, res) => {
  const sql =
    "INSERT INTO kolam (`nama_kolam`,`jumlah_lobster`,`user_id`) VALUES (?)";
  const values = [
    req.body.nama_kolam,
    +req.body.jumlah_lobster,
    req.body.user_id,
  ];
  db.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: "Inserting data Error in server" });
    return res.json({ Status: "Success" });
  });
});

app.get("/kolam/:user", (req, res) => {
  const sql = "SELECT * FROM kolam WHERE user_id = ?";

  db.query(sql, [+req.params.user], (err, data) => {
    if (err) return res.json({ Error: "Search Kolam Error in server" });
    return res.json({ Status: "Success", data });
  });
});

app.get("/kolamId/:id", (req, res) => {
  const sql = "SELECT * FROM kolam WHERE id = ?";

  db.query(sql, [+req.params.id], (err, data) => {
    if (err) return res.json({ Error: "Search Kolam By ID Error in server" });
    return res.json({ Status: "Success", data });
  });
});

app.get("/history/:kolamId", (req, res) => {
  const sql = "SELECT * FROM sensor WHERE kolam_id = ? ORDER BY id DESC";

  db.query(sql, [+req.params.kolamId], (err, data) => {
    if (err) return res.json({ Error: "History Kolam Error in server" });
    return res.json({ Status: "Success", data });
  });
});

io.on("connection", (socket) => {
  console.log("a user connected !");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
