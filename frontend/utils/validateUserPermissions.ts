type User = {
    permissions: string[];
    roles: string[];
}

type ValidateUserPermissionsParams = {
    user: User;
    permissions?: string[];
    roles?: string[];
}

export function validateUserPermissions({ 
    user,
    permissions, 
    roles
 }: ValidateUserPermissionsParams){



    if(permissions?.length > 0){
        const hasAllPermissions = permissions.every(permission =>{ //so retorna true se todas as funçoes derem true
            return user.permissions?.includes(permission); // verifica se o usuario tem a permissao para executar o que ele tentou
        })

        if(!hasAllPermissions){
            return false;
        }
    }

    if(roles?.length > 0){
        const hasAllRoles = roles.some(role =>{ //so retorna true se uma das funçoes derem true
            return user.roles.includes(role); // verifica se o usuario tem a role para executar o que ele tentou
        })

        if(!hasAllRoles){
            return false;
        }
    }

    return true;
}