import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import './room.css';
import { useNavigate, useParams } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const navigate = useNavigate()
  const {email} = useParams() ;
  const handleUserJoined = useCallback(({ emailId, id }) => {
    
    console.log(`Email ${emailId} joined room`);
    setRemoteSocketId(id);
    
    
  }, []);


 
  

  const handleCallUser = useCallback(async () => {
    console.log(`Email ${1} joined room`);
    
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setCallActive(true);
  }, [remoteSocketId, socket]);



  const turnVideoOn = useCallback(async () => {
    // console.log(`Email ${2} joined room`);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    
    setMyStream(stream);
  }, [myStream]);

  useEffect(() => {
   
    turnVideoOn(); // Initialize the local stream when the component mounts
  }, [turnVideoOn]);
useEffect(() => {
  socket.emit('new:user', {remoteSocketId})
  


  
}, [remoteSocketId])

  useEffect(() => {
    
    socket.on('video:on', turnVideoOn);

    return () => {
      socket.off('video:on', turnVideoOn);
    };
  }, [socket, turnVideoOn]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      setCallActive(true);
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
   
    socket.emit('add:user', {email})
    socket.emit('enter:room',{email})
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams[0];
      setRemoteStream(remoteStream);
    });
  }, []);

  

  const endCall = useCallback(() => {
    peer.peer.close();
    setCallActive(false);
    setRemoteSocketId(null);
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const toggleAudio = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  }, [myStream, audioEnabled]);

  const toggleVideo = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  }, [myStream, videoEnabled]);

  return (
    <div className="room">
      <header className="room-header">
        <h1>Video Chat Room</h1>
        <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      </header>
      <div className="controls">
        {remoteSocketId && !callActive && (
          <button className="call-button" onClick={handleCallUser}>Call</button>
        )}
        <button className="toggle-button" onClick={toggleAudio}>
          {audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
        </button>
        <button className="toggle-button" onClick={toggleVideo}>
          {videoEnabled ? 'Disable Video' : 'Enable Video'}
        </button>
        {callActive && (
          <>
            <button className="stream-button" onClick={sendStreams}>Send Stream</button>
            <button className="end-button" onClick={endCall}>End Call</button>
          </>
        )}
      </div>
      <div className="video-container">
        {myStream && (
          <div className="video">
            <h2>My Stream</h2>
            <ReactPlayer
              className="video-player"
              playing={videoEnabled}
              muted
              height="200px"
              width="300px"
              url={myStream}
            />
          </div>
        )}
        {remoteStream && (
          <div className="video">
            <h2>Remote Stream</h2>
            <ReactPlayer
              className="video-player"
              playing
              muted={false}
              height="200px"
              width="300px"
              url={remoteStream}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
