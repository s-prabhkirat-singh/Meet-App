import React, { useEffect, useCallback, useState,  } from "react";

import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useNavigate, useParams } from "react-router-dom";


function Join() {
    const {roomId} = useParams() 
    const navigate = useNavigate()

    const socket = useSocket();
    const joinMeeting = () => { 
        console.log('Joining Meeting Link')
        socket.emit('join-meet-link', roomId)
          navigate(`/room/${roomId}/Auth=true`)
        

        setJoined(true)
    }
  return (
  <>
  <button onClick={joinMeeting}>join</button></>
  )
}

export default Join