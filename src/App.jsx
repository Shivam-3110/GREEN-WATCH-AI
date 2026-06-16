import AppRoutes from './routes/AppRoutes'
import { NotificationProvider } from './contexts/NotificationContext'
import NotificationPopup from './components/ui/NotificationPopup'

function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
      <NotificationPopup />
    </NotificationProvider>
  )
}

export default App