import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./Logo";

export function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo />
        <nav className="nav">
          <NavLink to="/bots" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Bots
          </NavLink>
          <NavLink to="/forms" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Forms
          </NavLink>
          <NavLink
            to="/billing"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Billing
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user?.name?.[0]?.toUpperCase() ?? "?"}</span>
          <span className="sidebar-user">
            <span className="sidebar-user-name">{user?.name}</span>
            <button className="sidebar-user-action" onClick={logout}>
              Sign out
            </button>
          </span>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
