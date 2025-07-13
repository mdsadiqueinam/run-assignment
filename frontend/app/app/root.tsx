import {
  isRouteErrorResponse,
  Links,
  Meta,
  Navigate,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning={true}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta() {
  return [
    { title: "Ruh Care" },
    { name: "description", content: "Main app routing" },
  ];
}

export default function App() {
  // --- Hooks (equivalent to Vue's composables) ---
  const location = useLocation();
  const { session } = useCurrentSession();

  // --- Handlers ---
  // None currently

  // --- Lifecycle hooks & related ---
  // Additional lifecycle effects can be added here

  // Define unsecured paths
  const unsecuredPaths = ["/signin", "/signup", "/login"];

  // Check if current path is unsecured
  const isUnsecuredPath = unsecuredPaths.includes(location.pathname);

  // If user is not authenticated and trying to access a secured route
  if (!session && !isUnsecuredPath) {
    return <Navigate to="/signin" replace />;
  }

  // If user is authenticated and trying to access unsecured routes, redirect to home
  if (session && isUnsecuredPath) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      {/* Unsecured pages */}
      {isUnsecuredPath ? (
        <Outlet />
      ) : (
        /* Secured app pages */
        <>
          <SignedInSetup />
          <ToastContainer />
          <Outlet />
        </>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
