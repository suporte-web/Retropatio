import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Loader2, Edit, Trash2, Building2, X, KeyRound } from "lucide-react";
import { RoleBadge } from "@/components/role-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Filial } from "@/shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type UserPermission = {
  id: string;
  userId: string;
  filialId: string;
  createdAt: Date;
  filial: Filial;
};

export default function UsuariosPage() {
  const { toast } = useToast();


  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // EDITAR USUÁRIO
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
  nome: "",
  email: "",
  username: "",
  role: "",
});


  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilialId, setSelectedFilialId] = useState<string>("");

  const [passwordInput, setPasswordInput] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    username: "",
    email: "",
    password: "",
    role: "porteiro",
  });

  const { data: users, isLoading } = useQuery<User[]>({
     queryKey: ["/api/users"],
     queryFn: () => apiRequest("GET", "/api/users").then(res => res.json()),
  });

  const { data: allFiliais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
    queryFn: () => apiRequest("GET", "/api/filiais").then(res => res.json()),
  });

  const filiais = allFiliais ?? [];


  const { data: userPermissions, isLoading: isLoadingPermissions } = useQuery<UserPermission[]>({
    queryKey: ["/api/users", selectedUserId, "permissions"],
    enabled: !!selectedUserId,
    queryFn: () =>
      apiRequest("GET", `/api/users/${selectedUserId}/permissions`).then(res => res.json()),
  });

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário criado", description: "Novo usuário foi adicionado." });

      setFormData({
        nome: "",
        username: "",
        email: "",
        password: "",
        role: "porteiro",
      });

      setShowNewDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    },
  });

// Ativar / Desativar usuário
const toggleUserStatusMutation = useMutation({
  mutationFn: async ({ userId, ativo }: { userId: string; ativo: boolean }) => {
    const res = await apiRequest("PATCH", `/api/users/${userId}/ativo`, { ativo });
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    toast({ title: "Status atualizado", description: "O status do usuário foi alterado." });
  },
});


  // Excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário removido", description: "O usuário foi excluído do sistema." });
    },
  });

  // Alterar senha
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, novaSenha }: { userId: string; novaSenha: string }) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/senha`, { novaSenha });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Senha atualizada", description: "Senha alterada com sucesso." });
      setShowPasswordDialog(false);
      setPasswordInput("");
    },
  });

  // Adicionar permissão
  const addPermissionMutation = useMutation({
    mutationFn: async ({ userId, filialId }: { userId: string; filialId: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/permissions`, { filialId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUserId, "permissions"] });
      toast({ title: "Permissão adicionada", description: "Filial adicionada ao usuário." });
      setSelectedFilialId("");
    },
  });

  // Remover permissão
  const removePermissionMutation = useMutation({
    
    mutationFn: async (permissionId: string) => {
      await apiRequest("DELETE", `/api/users/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUserId, "permissions"] });
      toast({ title: "Permissão removida", description: "A filial foi removida." });
    },
  });

  // Editar usuário (PUT)
  const updateUserMutation = useMutation({
  mutationFn: async ({ userId, data }: { userId: string; data: typeof editFormData }) => {
    const res = await apiRequest("PUT", `/api/users/${userId}`, data);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    toast({ title: "Usuário atualizado", description: "As informações foram salvas." });
    setShowEditDialog(false);
  },
  onError: (error: Error) => {
    toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
  },
});


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const filteredUsers = users?.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosAtivos = users?.filter((u) => u.ativo).length || 0;
  const usuariosInativos = users?.filter((u) => !u.ativo).length || 0;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-novo-usuario">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usuários</CardDescription>
            <CardTitle className="text-3xl">{users?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{usuariosAtivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Inativos</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{usuariosInativos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar usuários..."
            data-testid="input-search-usuarios"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>{filteredUsers?.length || 0} usuários encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`user-${user.username}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.username}</span>
                      <RoleBadge role={user.role} />
                      {user.ativo ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                        >
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                        >
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email} • @{user.username}
                    </div>
                  </div>

                  <div className="flex gap-2">
                      {/* Editar Usuário */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setEditFormData({
                          nome: user.nome ?? "",
                          email: user.email,
                          username: user.username,
                          role: user.role,
                          });
                            setShowEditDialog(true);
                          }}
                          >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                        </Button>

                    {/* Gerenciar Filiais */}
                      <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setShowPermissionsDialog(true);
                      }}
                      data-testid={`button-permissions-${user.username}`}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Filiais
                    </Button>

                    {/* Ativar / Desativar */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggleUserStatusMutation.mutate({ userId: user.id, ativo: !user.ativo })
                      }
                      disabled={toggleUserStatusMutation.isPending}
                      data-testid={`button-toggle-${user.username}`}
                    >
                      {user.ativo ? "Desativar" : "Ativar"}
                    </Button>

                    {/* Alterar Senha */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setPasswordInput("");
                        setShowPasswordDialog(true);
                      }}
                      data-testid={`button-password-${user.username}`}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Senha
                    </Button>

                    {/* Excluir usuário */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      disabled={deleteUserMutation.isPending}
                      data-testid={`button-delete-${user.username}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
          {/* Dialog Editar Usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações do usuário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={editFormData.nome}
                onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuário *</Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Perfil *</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porteiro">Porteiro</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>

            <Button
              onClick={() => {
                if (!selectedUserId) return;
                updateUserMutation.mutate({
                  userId: selectedUserId,
                  data: editFormData,
                });
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Usuário */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                data-testid="input-nome"
                placeholder="João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                placeholder="joao@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                data-testid="input-username"
                placeholder="joao.silva"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as (typeof formData)["role"] })
                }
              >
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porteiro">Porteiro</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                data-testid="button-criar-usuario"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Permissões */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Filiais do Usuário</DialogTitle>
            <DialogDescription>
              Adicione ou remova filiais às quais o usuário tem acesso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Adicionar Nova Permissão */}
            <div className="space-y-2">
              <Label>Adicionar Filial</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedFilialId}
                  onValueChange={setSelectedFilialId}
                >
                  <SelectTrigger data-testid="select-filial">
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais
                      ?.filter(
                        (f) =>
                          !userPermissions?.some((p) => p.filialId === f.id),
                      )
                      ?.map((filial) => (
                        <SelectItem key={filial.id} value={filial.id}>
                          {filial.nome} ({filial.codigo})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    selectedUserId &&
                    selectedFilialId &&
                    addPermissionMutation.mutate({
                      userId: selectedUserId,
                      filialId: selectedFilialId,
                    })
                  }
                  disabled={!selectedFilialId || addPermissionMutation.isPending}
                  data-testid="button-add-permission"
                >
                  {addPermissionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Lista de Permissões Atuais */}
            <div className="space-y-2">
              <Label>Filiais com Acesso</Label>
              {isLoadingPermissions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userPermissions && userPermissions.length > 0 ? (
                <div className="space-y-2">
                  {userPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`permission-${permission.filial.codigo}`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {permission.filial.nome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Código: {permission.filial.codigo}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          removePermissionMutation.mutate(permission.id)
                        }
                        disabled={removePermissionMutation.isPending}
                        data-testid={`button-remove-permission-${permission.filial.codigo}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhuma filial atribuída
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPermissionsDialog(false);
                setSelectedUserId(null);
                setSelectedFilialId("");
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Usuário</DialogTitle>
            <DialogDescription>
              Defina a nova senha para o usuário selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <Input
              id="nova-senha"
              type="password"
              placeholder="Digite a nova senha"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordInput("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedUserId || !passwordInput) return;
                updatePasswordMutation.mutate({
                  userId: selectedUserId,
                  novaSenha: passwordInput,
                });
              }}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

