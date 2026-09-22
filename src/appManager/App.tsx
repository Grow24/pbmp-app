import { Admin, CustomRoutes, Resource } from 'react-admin'
import { BrowserRouter, Route } from 'react-router'
import { Dashboard } from './dashboard/Dashboard'
import { Layout } from './layout/Layout'
import { Settings } from './pages/Settings'
import { authProvider } from './providers/authProvider'
import { dataProvider } from './providers/dataProvider'
import { i18nProvider } from './providers/i18nProvider'
import albums from './resources/albums'
import comments from './resources/comments'
import photos from './resources/photos'
import posts from './resources/posts'
import todos from './resources/todos'
import users from './resources/users'
import { darkTheme, lightTheme } from './theme/theme'

export function AppManager() {
  return (
    <BrowserRouter basename="/app-manager">
      <Admin
        title="App Manager"
        layout={Layout}
        dashboard={Dashboard}
        dataProvider={dataProvider}
        authProvider={authProvider}
        i18nProvider={i18nProvider}
        theme={lightTheme}
        darkTheme={darkTheme}
        defaultTheme="light"
        requireAuth
      >
        <Resource name="users" {...users} />
        <Resource name="posts" {...posts} />
        <Resource name="comments" {...comments} />
        <Resource name="todos" {...todos} />
        <Resource name="albums" {...albums} />
        <Resource name="photos" {...photos} />
        <CustomRoutes>
          <Route path="/settings" element={<Settings />} />
        </CustomRoutes>
      </Admin>
    </BrowserRouter>
  )
}
