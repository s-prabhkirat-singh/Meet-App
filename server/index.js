const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: '*',
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {

  console.log(`Socket Connected`, socket.id);

 
  socket.on("create:room", (data) => 
    {
        const { email } = data;
        console.log(`Email ${email} has socket id ${socket.id}`);

        // const meetLink = `${data.email}+${socket.id}-${new Date().getTime()}`
        const meetLink  = "abc"

        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        io.to(meetLink).emit("user:joined", { email, id: socket.id });
        socket.join(meetLink);
        
        io.to(socket.id).emit("room:join", {email,meetLink});
  });
  socket.on("add:user", (data) =>{
    const {email} = data;

    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    console.log(email)

  })







  socket.on("enter:room", (to,from)=>{  
    const {email} = to;
   
    console.log(socket.id)
    io.to("abc").emit("user:joined", { emailId:email, id: socket.id });


    
    
    io.to(to).emit("video:on", { from: socket.id,to });

  })
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
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

  socket.on('join-meet-link', (meetLink) => {
    console.log('Join meet link received on server: ', meetLink)

    const maxUsersPerRoom =  3

    const users = socketidToEmailMap.get(meetLink) || []

    if (users.length >= maxUsersPerRoom) {
        io.to(socket.id).emit('room-full', meetLink)
        return
    }

    socket.join(meetLink)

    users.push(socket.id)
    socketidToEmailMap.set(meetLink, [...new Set(users)])

    socket.to(meetLink).emit('user-joined', socket.id)
})
});