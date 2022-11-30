import { toast } from "bulma-toast";
import { useCallback, useContext } from "react";
import { UIActionType, UIContext } from "../stores/ui";

interface UIProps {
    isLoading: boolean;
    toggleLoading: (to: boolean) => void;
    showSuccess: (text: string) => void
    showError: (e: any) => void;
};

const showError = (e: any) => {
    if(e) {
        const text = typeof e === 'string'? 
            e
        :
            e.constructor === Array?
                e.map((s, i) => `${1+i}. ${s};`) .join('\n')
            :
                typeof e === 'object'?
                    'data' in e?
                        e.data.message
                    :
                        e.message
                :
                    '';
        
        toast({
            message: `Error${e.constructor === Array? 's:\n': ': '}${text}`,
            type: 'is-danger',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
            position: 'top-center'
        });
    }
};

const showSuccess = (text: string) => {
    toast({
        message: text,
        type: 'is-success',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        position: 'top-center'
    });
}
export const useUI = (): UIProps => {
    const [state, dispatch] = useContext(UIContext);

    const toggleLoading = useCallback((to: boolean) => {
        dispatch({
            type: UIActionType.TOGGLE,
            payload: to
        });
    }, []);
    
    return {
        isLoading: state.isLoading,
        toggleLoading,
        showSuccess,
        showError,
    };
};