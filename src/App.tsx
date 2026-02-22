import { Navigate, Route, Routes } from 'react-router-dom'
import { BoardPage } from './pages/BoardPage'

function App() {
  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default App
