import axios, { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

type FailuerRequestQueueProps = {
    onSuccess: (token: string)=> void;
    onFailure: (error: AxiosError)=> void;
}

let isRefreshin = false;
let failedRequestQueue: FailuerRequestQueueProps[] = [];

export function setupAPIClient(ctx = undefined) {
let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });
    
    
    
    //recebe 2 parametros...o que fazer se for sucesso e o que fazer se for erro
    api.interceptors.response.use(response=> {
        return response;
    }, (error: AxiosError) => {
        if(error.response?.status === 401){
            if(error.response.data?.code === 'token.expired'){
                //renovar token
                cookies = parseCookies(ctx);
    
                const {'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;
    
                if(!isRefreshin){
                    isRefreshin = true;
    
                    api.post('/refresh', {
                        refreshToken,
                    }).then(response =>{
    
                    const { token } = response.data;
    
                    setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, // maxAge = O tempo que a informacao fica no cookie
                            path: '/' //Quais caminhos do app tem acesso ao cookie? ( o app inteiro )
                    });
    
                    setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, // maxAge = O tempo que a informacao fica no cookie
                            path: '/' //Quais caminhos do app tem acesso ao cookie? ( o app inteiro )
                    });
    
                    api.defaults.headers['Authorization'] = `Bearer ${token}`;
    
                    failedRequestQueue.forEach(request=> request.onSuccess(token));
                    }).catch(error => {
                        failedRequestQueue.forEach(request=> request.onFailure(error));
                        failedRequestQueue = [];
    
                        if(process.browser){
                            signOut();
                        }else{
                            return Promise.reject(new AuthTokenError());
                        }
                    }).finally(() => {
                        isRefreshin = false
                    })
                }
    
                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({
                        onSuccess: (token: string)=> {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`;
                            
                            resolve(api(originalConfig));
                        },
                        onFailure: (error: AxiosError)=> {
                            reject(error);
                        }
                    })
                });
            }else{
                if(process.browser){
                    signOut();
                }
            }
        }
    
        return Promise.reject(error);
    })

    return api;
}