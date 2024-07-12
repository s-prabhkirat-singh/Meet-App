const { Server } = require("socket.io");


const io = new Server(8000, {
  cors: '*',
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {

  console.log(`Socket Connected`, socket.id);


  socket.on("create:room", (data) => {
    const { email } = data;
    console.log(`Email ${email} has socket id ${socket.id}`);

    const meetLink =Date.now().toString(36);
 
    socket.join(meetLink);

    io.to(socket.id).emit("room:join", { email, meetLink });
  
  });


  socket.on("add:user", (data) => {
    const { email } = data;

    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    console.log(`${email} mapped with the socket id ${socket.id}`)

  })



  socket.on("enter:room", (to, from) => {
    const { email, roomId,admin } = to;

    console.log(socket.id,1111)
    io.to(roomId).emit("user:joined", { emailId: email, id: socket.id,admin });
   




    io.to(roomId).emit("video:on", { from: socket.id, to });

  })




  socket.on("user:call", ({ to, offer }) => {
    console.log("user:call", offer);
    io.to(to).emit("incomming:call", { from: socket.id, offer, id:socket.id });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

 
});