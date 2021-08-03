import Router from 'next/router';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../services/apiClient';
import { destroyCookie, parseCookies, setCookie } from 'nookies';

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    signOut(): void;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];

};

export const AuthContext = createContext({} as AuthContextData);

let authChannel:BroadcastChannel;

export function signOut(){
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');
    authChannel.postMessage('signOut');

    Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps){
    const [user, setUser] = useState({} as User);
    const isAuthenticated = !!user; //Se exister vem true e se nao vem false

    useEffect(()=> {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = (message) =>{
            switch(message.data){
                case 'signOut':
                    signOut();
                    break;
                default:
                    break;
            }
        }
    },[])
    

    useEffect(()=> {
        const { 'nextauth.token': token, 'nextauth.refreshToken': refreshToken } = parseCookies();
        
        if(token){
            api.get('/me').then(response=>{
                const { email, permissions, roles } = response.data;

                setUser({ email, permissions, roles });
            }).catch(error => {
                signOut();
            })
        }
    
    }, [])

    async function signIn({ email, password }: SignInCredentials){
       try {
            const response = await api.post("sessions", { 
                email, 
                password
            });
            
            const { token, refreshToken, permissions, roles } = response.data;
            
            /*recebe 4 parametros (
                ' 1 contexto do token...se a usado do lado do browser deve passar undefined',
                ' 2 nome do cookie',
                ' 3 o token em si',
                ' 4 opcoes adicionais token')*/
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // maxAge = O tempo que a informacao fica no cookie
                path: '/' //Quais caminhos do app tem acesso ao cookie? ( o app inteiro )
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // maxAge = O tempo que a informacao fica no cookie
                path: '/' //Quais caminhos do app tem acesso ao cookie? ( o app inteiro )
            });


            setUser({
                email, 
                permissions,
                roles
            });

            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            Router.push("/dashboard");
       } catch (error) {
           console.log(error);
       }
    }
    return(
        <AuthContext.Provider value={{
            signIn,
            signOut,
            isAuthenticated,
            user,
        }}>
            {children}
        </AuthContext.Provider>
    )
}