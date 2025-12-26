import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useFilial } from "@/contexts/FilialContext";
import type { Role } from "@/auth/permissions";

type Props = {
  roles?: Role[];
  children: React.ReactNode;
};

export function ProtectedRoute({ roles, children }: Props) {
  const { user, loading } = useAuth();
  const { filialId } = useFilial();

  if (loading) return null;

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!filialId) {
    return <Redirect to="/filial-selection" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}
