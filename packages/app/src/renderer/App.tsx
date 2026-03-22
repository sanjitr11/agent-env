import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import AuthGuard from './components/AuthGuard'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProjectsPage from './pages/ProjectsPage'
import CreateProjectPage from './pages/CreateProjectPage'
import ProjectWorkspacePage from './pages/ProjectWorkspacePage'
import CreateAgentPage from './pages/CreateAgentPage'
import AgentDetailPage from './pages/AgentDetailPage'
import TerminalPage from './pages/TerminalPage'
import EditProjectPage from './pages/EditProjectPage'

export default function App() {
  return (
    <ThemeProvider>
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<AuthGuard />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/projects/:id" element={<ProjectWorkspacePage />} />
            <Route path="/projects/:id/edit" element={<EditProjectPage />} />
            <Route path="/projects/:id/agents/new" element={<CreateAgentPage />} />
            <Route path="/projects/:id/agents/:agentId" element={<AgentDetailPage />} />
            <Route path="/projects/:id/agents/:agentId/terminal" element={<TerminalPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
        <ThemeToggle />
      </>
    </ThemeProvider>
  )
}
