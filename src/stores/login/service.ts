import { Api } from "@/utils/api";

export const AuthService = {
  login: async (data: any) => {
    const log = await Api.post(`/api/auth/login`, data);
    return log.data;
  },
};
