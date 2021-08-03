import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRGuest<P>(fn: GetServerSideProps<P>){
  
  return async(ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => { 
    //como o getServerSideProps é backend, deve-se enviar o contexto no primeiro parametro
    const cookies = parseCookies(ctx);

    if(cookies['nextauth.token']){
      return { 
        redirect: {
          destination: '/dashboard',
          permanent: false,
        }
      }
    }

    return await fn(ctx);
  }
  
}