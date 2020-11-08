const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utility/messages");
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require("./utility/users");

const app = express();

const server = http.createServer(app);

const io = socketio(server);

const botname = "Admin";

//Run when the client connects
io.on("connection", socket => {

    //when roo  is joined
    socket.on("joinRoom", ({
        username,
        room
    }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        //Welcome the current person
        socket.emit("message", formatMessage(botname, "🤖 Welcome to Chat Application"));

        //SHOW when the cliemt joins
        socket.broadcast.to(user.room).emit("message", formatMessage(botname, ` ${user.username} is online now.`));

        //User and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })



    //Listen for the chat message
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    })

    //Show when the client disconnects

    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit("message",
                formatMessage(botname, `${user.username} just gone offline.`));

            //User and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            });

        }



    });
});

//set static folder (Public)
app.use(express.static(path.join(__dirname, "public")));


const PORT = 3000 || process.env.PORT


server.listen(PORT, () => console.log(`Server is Running in Port ${PORT}`));