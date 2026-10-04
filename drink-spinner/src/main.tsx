import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home'
import Settings from './pages/Settings'
import About from './pages/About'
import './index.css'

const router = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/settings', element: <Settings /> },
    { path: '/about', element: <About /> },
  ],
  // 與 vite.config.ts 的 base 一致，支援部署在子路徑
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
