export const saveToken = ( token : string ): void => {
    if (!token) {
        console.error("No token provided")
        return
    }
    localStorage.setItem('token', token)
}

export const getToken = (): string | null => {
    return localStorage.getItem('token')
}

export const removeToken = (): void => {
    localStorage.removeItem('token')
}

export const hasToken = (): boolean => {
    return !!localStorage.getItem('token')
}