import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PermissionKey } from "../auth/permissions";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredPermission?: PermissionKey;
  path: string;
  exact?: boolean;
}

export function ProtectedRoute({
  component: Component,
  requiredPermission,
  ...rest
}: ProtectedRouteProps) {
  const { user, permissions } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!user) {
          return <Redirect to="/login" />;
        }

        if (requiredPermission && !permissions[requiredPermission]) {
          return <Redirect to="/unauthorized" />;
        }

        return <Component {...props} />;
      }}
    />
  );
}
