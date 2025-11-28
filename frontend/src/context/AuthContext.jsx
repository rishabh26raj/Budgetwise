import { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Get token and set it in localStorage for api.js to pick up (or use interceptor)
                const token = await currentUser.getIdToken();
                localStorage.setItem('token', token);

                // Optionally fetch extra user data from backend if needed
                // const res = await api.get('/auth/user');
                // setUser({ ...currentUser, ...res.data });
                setUser(currentUser);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const token = await result.user.getIdToken();
        localStorage.setItem('token', token);
        return result;
    };

    const signup = (username, email, password) => {
        // Firebase Auth doesn't store username by default, so we might want to update profile
        // or send it to backend. For now, just create user.
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
