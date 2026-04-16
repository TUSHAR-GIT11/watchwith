import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark"

const ThemeContext = createContext<{
    theme: Theme;
    toggleTheme: () => void
}>({ theme: "light", toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light")

    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme
        if (saved) setTheme(saved)
    }, [])

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light"
        setTheme(next)
        localStorage.setItem("theme", next)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }} >
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = ()=> useContext(ThemeContext)