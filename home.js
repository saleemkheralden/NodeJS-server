const { createServer } = require("http");
const { Server } = require("socket.io");
const pool = require("./sql");


const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://127.0.0.1:8000"
        // origin: 'http://172.20.10.2:8000'
    }
});

const sockets = {}
let task_id = 0;
const s = 'Home server> ';
const port = 3001;

io.on('connection', (socket) => {

    socket.on("new-connection", (userid) => {
        sockets[userid] = socket.id;
    })

    socket.on("save-task", (args, callback) => {
        let sql = "INSERT INTO main_usertodo " +
            "(id, task, finished, user_id, due_date) " +
            "VALUE (" +
            task_id + ", " +
            "'" + args.content + "', " +
            "false, " +
            args.id + ", " +
            "'" + args.date + "'" +
            ")"
        let err_flag = false;
        pool.query(sql, function(err, result) {
            if (err) err_flag = true;
            else {
                console.log(s, "saving task " + result.insertId)
                callback({
                    task_id: result.insertId,
                    flag: err_flag
                })
            }
        })
    })

    socket.on("check-task", (args) => {
        console.log(s, "updating task " + args.task_id)
        let sql = "UPDATE main_usertodo SET finished="+args.checked+" WHERE id="+args.task_id
        let err_flag = false;
        pool.query(sql, function(err, result) {
            if (err) err_flag = true;
        })
    })

    socket.on("delete-task", (args) => {
        if (args.task_id !== '') {
            console.log(s, "deleting task " + args.task_id)
            let sql = "DELETE FROM main_usertodo WHERE id=" + args.task_id
            pool.query(sql, (err, result) => {
                if (err) console.log(err);
            })
        }
    })

    socket.on('get-messages', (args, callback) => {
        let sql = "SELECT *\n" +
            "FROM main_chatlog\n" +
            "WHERE\n" +
            "    (from_user_id=" + args.uid + " AND to_user_id=" + args.other_id + ") OR\n" +
            "    (from_user_id=" + args.other_id + " AND to_user_id=" + args.uid + ")\n" +
            "LIMIT 10;"
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {
                console.log(s, 'getting messages of user', args.uid);
                for (let e of result) e.date = e.date.toLocaleString();
                callback({
                    messages: result,
                });
            }
        })
    })

    socket.on("send-msg", args => {
       console.log(args);
       console.log('sending to', args['to'], sockets[args['to']])
       socket.to(sockets[args['to']]).emit("recv-msg", args);
    });

    socket.on('disconnecting', (arg) => {
        // console.log(arg);
        // console.log(socket.id);
        // console.log("Disconnected");
    })

    socket.on('see-users', () => {
        console.log(sockets);
    })

    console.log(s, 'new connection', socket.id);
});


httpServer.listen(port);
console.log(s, "Server running on port", port);

