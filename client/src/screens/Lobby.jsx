import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

import './lobby.css'

const Lobby = () => {
  const [email, setEmail] = useState("");
  const [meetLink, setMeetLink] = useState("")




  const socket = useSocket();
  const navigate = useNavigate();



  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      
      socket.emit("create:room", {email, meetLink})
      
    },
    [email, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, meetLink } = data;
      console.log("hey trher")
      console.log(email)
      console.log(meetLink)
     
      setMeetLink(meetLink)
      
      navigate(`/room/${meetLink}/${email}?isAdmin=1`);
     
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("user:joined", () =>{
      console.log(`User Joined Called`)
    });
    
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [ handleJoinRoom]);

  return (
    <div className="lobby">
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">Create Room</button>
      </form>
    </div>
  );
};

export default Lobby;