const { createServer } = require("https");
const { Server } = require("socket.io");
const {readFileSync} = require("fs");

// const mysql = require("mysql");
const port = 3000;
const s = 'Streaming server> ';
const httpServer = createServer({
    key: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.key'),
    cert: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.crt')
});
const io = new Server(httpServer, {
    cors: {
        // origin: "http://192.168.1.43:8000",
    }
});

io.on("connection", (socket) => {
    socket.on('join-room', (args) => {
        socket.join(args.rid);
        socket.broadcast.to(args.rid).emit('user-connected', args.uid);
        console.log(s, 'new connection', args.rid, args.uid);
    });

    socket.on('test', (arg) => {
        console.log(s + arg);
    });

    console.log(s,'new connection', socket.id);
    // io.emit("welcome-from-server", "hello from server");
    // console.log('sent "hello from server"')
});



httpServer.listen(port);
console.log(s, "running on port", port);
