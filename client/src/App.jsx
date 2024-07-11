import { useState } from 'react'
import {Route,Routes} from 'react-router-dom'

// import './App.css'
import Lobby from './screens/Lobby'
import Room from './screens/Room'
import Join from './screens/Join'

function App() {
  const [count, setCount] = useState(0)



  return (
  <>
    <Routes>
      <Route path='/' element={<Lobby/>}/>
      <Route path='/room/:roomId/:email' element={<Room/>}/>
    
    </Routes>
  </>
  )
}

export default App
