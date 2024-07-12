import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import './room.css';
import { useParams, useSearchParams } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const [remoteUsers, setRemoteUsers] = useState(new Map());
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCalls, setActiveCalls] = useState({});

  const [searchParams] = useSearchParams();
  const { email, roomId } = useParams();



  const handleUserJoined = useCallback(({ emailId, id, admin }) => {
    console.log(`Email ${emailId} joined room`, admin);
    if (admin !== "1") {
      setRemoteUsers(prev => new Map(prev).set(id, { emailId, id }));
    }
  }, []);



  const addRemoteStream = useCallback((userId, stream) => {
    console.log("Adding remote stream", stream);
    setRemoteStreams(prev => new Map(prev).set(userId, stream));
  }, [, setRemoteStreams]);






  const handleCallUser = useCallback(async (userId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      const offer = await peer.getOffer(userId);
      socket.emit("user:call", { to: userId, offer });

      const peerInstance = peer.getPeer(userId);

      console.log(`This is my userID whom i am calling ${userId}`)
      peerInstance.ontrack = (ev) => {
        const remoteStream = ev.streams[0];
        console.log("Received remote stream", remoteStream);
        addRemoteStream(userId, remoteStream);
      };

      stream.getTracks().forEach(track => {
        peerInstance.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error in handleCallUser:", error);
    }
  }, [addRemoteStream]);






  const handleIncomingCall = useCallback(({ from, offer }) => {
    setIncomingCall({ from, offer });
  }, []);





  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const ans = await peer.getAnswer(incomingCall.from, incomingCall.offer);
      socket.emit("call:accepted", { to: incomingCall.from, ans });

      const peerInstance = peer.getPeer(incomingCall.from);
      peerInstance.ontrack = (ev) => {
        const remoteStream = ev.streams[0];
        addRemoteStream(incomingCall.from, remoteStream);
      };

      stream.getTracks().forEach(track => {
        peerInstance.addTrack(track, stream);
      });

      setActiveCalls(prev => ({ ...prev, [incomingCall.from]: true }));
      setIncomingCall(null);
    } catch (error) {
      console.error("Error in acceptCall:", error);
    }
  }, [incomingCall, socket, addRemoteStream]);






  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    await peer.setRemoteDescription(from, ans);
    console.log("Call Accepted!");
    setActiveCalls(prev => ({ ...prev, [from]: true }));
  }, []);




  const handleNegoNeeded = useCallback(async (userId) => {
    const offer = await peer.getOffer(userId);
    socket.emit("peer:nego:needed", { to: userId, offer });
  }, [socket]);





  const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(from, offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);




  const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
    await peer.setRemoteDescription(from, ans);
  }, []);




  const endCall = useCallback((userId) => {
    peer.closeConnection(userId);
    setActiveCalls(prev => {
      const newActiveCalls = { ...prev };
      delete newActiveCalls[userId];
      return newActiveCalls;
    });
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(userId);
      return newStreams;
    });
  }, []);

  const handleUserLeft = useCallback((userId) => {
    setRemoteUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.delete(userId);
      return newUsers;
    });
    endCall(userId);
  }, [endCall]);

  useEffect(() => {
    socket.connect();
    const admin = searchParams.get('isAdmin');

    console.log("empty useEffect")
    socket.emit('check:admin', useSearchParams)

    socket.emit('add:user', { email });
    socket.emit('enter:room', { email, roomId, admin });

    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("user:left", handleUserLeft);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("user:left", handleUserLeft);
    };
  }, [handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
    handleUserLeft,

  ]);

  useEffect(() => {
    remoteUsers.forEach((user, userId) => {
      const peerInstance = peer.getPeer(userId);
      peerInstance.onnegotiationneeded = () => handleNegoNeeded(userId);
    });
  }, [remoteUsers, handleNegoNeeded]);

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
        <h4>{remoteUsers.size > 0 ? `${remoteUsers.size} user(s) in room` : "No one in room"}</h4>
      </header>
      <div className="controls">
        {Array.from(remoteUsers.values()).map(({ id }) => (
          <button
            key={`user-${id}`}
            className="call-button"
            onClick={() => handleCallUser(id)}
            disabled={activeCalls[id]}
          >
            Call User {id}
          </button>
        ))}
        <button className="toggle-button" onClick={toggleAudio}>
          {audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
        </button>
        <button className="toggle-button" onClick={toggleVideo}>
          {videoEnabled ? 'Disable Video' : 'Enable Video'}
        </button>
      </div>
      {incomingCall && (
        <div className="incoming-call">
          <p>Incoming call from {incomingCall.from}</p>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}
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
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <div key={`stream-${userId}`} className="video">
            <h2>Remote Stream ({userId})</h2>
            <ReactPlayer
              className="video-player"
              playing
              muted={false}
              height="200px"
              width="300px"
              url={stream}
            />
            <button className="end-button" onClick={() => endCall(userId)}>End Call</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Room;