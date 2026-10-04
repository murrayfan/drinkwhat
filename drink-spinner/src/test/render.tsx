import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Home from '../pages/Home'
import Settings from '../pages/Settings'
import About from '../pages/About'

export function renderApp(path = '/') {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Home /> },
      { path: '/settings', element: <Settings /> },
      { path: '/about', element: <About /> },
    ],
    { initialEntries: [path] },
  )
  return { router, ...render(<RouterProvider router={router} />) }
}
