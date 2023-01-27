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


let rooms = {}
let users = {}

io.on("connection", (socket) => {
    socket.on('join-room', (args) => {
        socket.join(args['rid']);

        if (rooms[args['rid']] !== undefined) {
            rooms[args['rid']].push(args['peer_id']);
        } else {
            rooms[args['rid']] = [args['peer_id']];
        }

        users[socket.id] = {
            'peer id': args['peer_id'],
            'room id': args['rid']
        };

        console.log(socket.id, users[socket.id]);
        console.log('rooms', rooms);


        socket.broadcast.to(args['rid']).emit('user-connected', args['peer_id']);
        console.log(s, 'new connection', args['rid'], args['peer_id']);
    });

    socket.on('test', (arg) => {
        console.log(s + arg);
    });

    socket.on('rooms', () => {
        console.log(rooms);
    })

    socket.on('users', () => {
        console.log(users);
    })

    socket.on('users in room', (args, callback) => {
        callback({
            ids: rooms[args.rid],
        })
    })

    socket.on('disconnecting', (arg) => {
        // console.log(arg);

        console.log(socket.id, users[socket.id]);
        console.log('rooms', rooms);
        // console.log('arg', arg);
        if (users[socket.id] !== undefined) {
            let room = rooms[users[socket.id]['room id']];
            room.splice(room.indexOf(users[socket.id]['peer id']), 1);
            socket.broadcast.to(users[socket.id]['room id'])
                .emit('user-disconnected', users[socket.id]['peer id']);
        }
        console.log(s, socket.id, "Disconnected");
    })


    console.log(s,'new connection', socket.id);
});



httpServer.listen(port);
console.log(s, "running on port", port);
