import { request, storeSession } from "./client";
import type { LoginResponseDTO } from "./types";

export async function login(correo: string, password: string): Promise<LoginResponseDTO> {
  const data = await request<LoginResponseDTO>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, password }),
  });
  storeSession(data.token);
  return data;
}
