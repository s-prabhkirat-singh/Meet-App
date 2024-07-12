import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { SocketProvider } from './context/SocketProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(

    <BrowserRouter>
        <SocketProvider>
            <App />
        </SocketProvider>
    </BrowserRouter>

)
