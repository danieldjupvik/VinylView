import { STORAGE_KEYS } from './constants'

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
}

export function getUsername(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USERNAME)
}

export function setUsername(username: string): void {
  localStorage.setItem(STORAGE_KEYS.USERNAME, username)
}

export function removeUsername(): void {
  localStorage.removeItem(STORAGE_KEYS.USERNAME)
}

export function clearAuth(): void {
  removeToken()
  removeUsername()
}
