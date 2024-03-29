const { readFileSync } = require("fs");
const { createServer } = require("https");
const { Server } = require("socket.io");
const pool = require("./sql");


const httpServer = createServer({
    key: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.key'),
    cert: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.crt')
});
const io = new Server(httpServer, {
    cors: {
        // origin: '*'
        // origin: "https://192.168.1.18:8000"
        // origin: "http://127.0.0.1:8000"
        // origin: 'http://172.20.10.2:8000'
    }
});

const userid_sockets = {}
const sockets_userid = {}

let task_id = 0;
const s = 'Home server> ';
const port = 3001;

// const users = {}

// const users = {
//                  userid: {
//                              friends: [ ids ]
//                          }
//               }


io.on('connection', (socket) => {

    socket.on("new-connection", (userid) => {
        userid_sockets[userid] = socket.id;
        sockets_userid[socket.id] = userid;


        let sql = "SELECT user1_id, user2_id FROM index_friendslist " +
            "WHERE user1_id=" + userid + " OR user2_id=" + userid;
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {
                for (let e of result) {
                    let friend_socketid = userid_sockets[e.user1_id == userid ? e.user2_id : e.user1_id];
                    socket.to(friend_socketid).emit("friend-connected", {id: userid})
                }
            }
        });
    });

    socket.on("save-task", (args, callback) => {
        let sql = "INSERT INTO index_usertodo " +
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
        let sql = "UPDATE index_usertodo SET finished="+args.checked+" WHERE id="+args.task_id
        let err_flag = false;
        pool.query(sql, function(err, result) {
            if (err) err_flag = true;
        })
    })

    socket.on("delete-task", (args) => {
        if (args.task_id !== '') {
            console.log(s, "deleting task " + args.task_id)
            let sql = "DELETE FROM index_usertodo WHERE id=" + args.task_id
            pool.query(sql, (err, result) => {
                if (err) console.log(err);
            })
        }
    })

    socket.on('get-messages', (args, callback) => {
        let sql = "SELECT *\n" +
            "FROM index_chatlog\n" +
            "WHERE\n" +
            "    (from_user_id=" + args.uid + " AND to_user_id=" + args.other_id + ") OR\n" +
            "    (from_user_id=" + args.other_id + " AND to_user_id=" + args.uid + ")\n" +
            "ORDER BY DATE DESC\n" +
            "LIMIT 100;"

        // console.log(sql);
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {
                console.log(s, 'getting messages of users', args.uid, args.other_id);
                for (let e of result) e.date = e.date.toLocaleString();
                callback({
                    messages: result,
                });
            }
        })
    })

    socket.on("send-msg", args => {
       // console.log(args);
       let sql = "INSERT INTO index_chatlog (message, date, from_user_id, to_user_id) " +
           "VALUES ('" +
           args['content'] + "', '" +
           args['date'] + "', " +
           args['from'] + ", " +
           args['to'] + ")";

       // console.log(sql);
       pool.query(sql, (err, result) => {
          if (err) console.log(err);
          else {

          }
       });

       if (userid_sockets[args['to']]) {
           console.log('sending to', args['to'], userid_sockets[args['to']]);
           socket.to(userid_sockets[args['to']]).emit("recv-msg", args);
       }

    });

    socket.on('read-messages', args => {
        // console.log(args);
        let sql = "UPDATE index_chatlog\n" +
            "SET index_chatlog.read=true\n" +
            "WHERE from_user_id=" + args.other_id + " AND to_user_id=" + args.uid + ";";

        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {}
        })
    })

    socket.on("accept-user", (args) => {
        console.log(args);
        let sql = "UPDATE index_friendslist \n" +
            "SET status='-' \n" +
            "WHERE user1_id=" + args['user1'] + " AND  user2_id=" + args['user2'];
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {}
        })
    })

    socket.on("reject-user", (args) => {
        let sql = "DELETE FROM index_friendslist \n" +
            "WHERE user1_id=" + args['user1'] + " AND  user2_id=" + args['user2'];
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {}
        })
    })

    socket.on('check-online', (args, callback) => {
        callback({
            "online": userid_sockets[args.id] !== undefined
        })
    })

    function friend_offline_away(args, emit_status) {
        let userid = args['userid'];
        let sql = "SELECT user1_id, user2_id FROM index_friendslist " +
            "WHERE user1_id=" + userid + " OR user2_id=" + userid;
        pool.query(sql, (err, result) => {
            if (err) console.log(err);
            else {
                for (let e of result) {
                    let friend_socketid = userid_sockets[e.user1_id == userid ? e.user2_id : e.user1_id];
                    socket.to(friend_socketid).emit(emit_status, {id: userid})
                }
            }
        });
    }

    socket.on('user-disconnected', args => {
        // let userid = sockets_userid[socket.id];


        console.log("user-disconnected");

        friend_offline_away(args, "friend-disconnected");

        delete userid_sockets[sockets_userid[socket.id]]
        delete sockets_userid[socket.id]
    })

    socket.on('user-away', args => {
        console.log('user-away', args);
        friend_offline_away(args, "friend-away");
    })

    socket.on('disconnecting', (arg) => {
        console.log(s, socket.id, "Disconnected", arg);
    })

    socket.on('see-users', () => {
        console.log(userid_sockets);
        console.log(sockets_userid);
    })

    socket.on('count-users', () => {
        console.log(userid_sockets.length);
    })

    socket.on('ping', () => {
        console.log('ping');
    })

    console.log(s, 'new connection', socket.id);
});


httpServer.listen(port);
console.log(s, "Server running on port", port);

