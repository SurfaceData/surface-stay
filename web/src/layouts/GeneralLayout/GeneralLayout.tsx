import { Link, routes } from '@redwoodjs/router'
import { useEffect } from 'react'
import { themeChange } from 'theme-change'

import { useAuth } from 'src/auth'
type GeneralLayoutProps = {
  children?: React.ReactNode
}

const GeneralLayout = ({ children }: GeneralLayoutProps) => {
  const { isAuthenticated } = useAuth()
  useEffect(() => {
    themeChange(false)
  }, [])

  return (
    <>
      <header className="navbar">
        <div className="flex-1">
          <Link className="norma-case btn btn-ghost text-xl" to={routes.home()}>
            KT Villa
          </Link>
        </div>
        <nav className="flex-none">
          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <Link className="link" to={routes.login()}>
              Login
            </Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}

const AccountMenu = () => {
  const { currentUser, hasRole, logOut } = useAuth()
  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="avatar btn btn-circle btn-ghost">
        <div className="w-10 rounded-full">
          <img src={currentUser.profileImageUrl} />
        </div>
      </label>

      <ul
        tabIndex={0}
        className="menu dropdown-content rounded-box menu-sm z-[1] mt-3 w-52 bg-base-100 p-2 shadow"
      >
        <li>
          <Link to={routes.home()}>Home</Link>
        </li>
        <li>
          <Link to={routes.me()}>My Page</Link>
        </li>
        <li>
          <Link to={routes.about()}>About</Link>
        </li>
        {hasRole('admin') && (
          <>
            <div className="divider" />
            <li>
              <Link to={routes.adminReviewBookings()}>Review</Link>
            </li>
            <li>
              <Link to={routes.adminStableItems()}>Manage Item</Link>
            </li>
            <li>
              <Link to={routes.generateImage()}>Test Images</Link>
            </li>
          </>
        )}
        <div className="divider" />
        <li>
          <a onClick={logOut}>Signout</a>
        </li>
      </ul>
    </div>
  )
}

export default GeneralLayout
