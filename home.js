const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        // origin: "http://192.168.1.15:8000"
        // origin: 'http://172.20.10.2:8000'
    }
});

const sockets = {}
let task_id = 0;

io.on('connection', (socket) => {

    socket.on("new-connection", (userid) => {
        sockets[userid] = socket.id;
        console.log(sockets);
    })

    socket.on("save-task", (args, callback) => {
        console.log(args);
        callback({
            task_id: task_id++
        })
    })

    socket.on("check-task", (args) => {
        console.log(args)
    })

    socket.on("delete-task", (args) => {
        console.log(args);
    })

    socket.on('disconnected', () => {

    })

    console.log('new connection', socket.id);
});


httpServer.listen(3001);
console.log("Server running...")

