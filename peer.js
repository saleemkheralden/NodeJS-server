const { readFileSync } = require("fs");
const { PeerServer } = require("peer");

const peerServer = PeerServer({
    port: 3002,
    ssl: {
        key: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.key'),
        cert: readFileSync('/home/saleem/Desktop/Web/venv/lib/python3.10/site-packages/sslserver/certs/development.crt')
    }
})


// TODO: add functions and console logs

