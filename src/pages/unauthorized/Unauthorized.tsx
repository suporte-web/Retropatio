export default function Unauthorized() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600">Acesso negado</h1>
      <p className="mt-4 text-gray-700">
        Você não tem permissão para acessar esta área.
      </p>
    </div>
  );
}
