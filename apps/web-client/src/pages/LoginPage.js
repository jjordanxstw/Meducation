import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Login Page with Google OAuth
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '@heroui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../stores/auth.store';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export default function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, setAuth, setLoading } = useAuthStore();
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
            return;
        }
        // Load Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [isAuthenticated, navigate]);
    const initializeGoogleSignIn = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });
            const buttonContainer = document.getElementById('google-signin-button');
            if (buttonContainer) {
                window.google.accounts.id.renderButton(buttonContainer, {
                    theme: 'outline',
                    size: 'large',
                    width: 320,
                    text: 'signin_with',
                    shape: 'rectangular',
                });
            }
        }
    };
    const handleGoogleCallback = async (response) => {
        try {
            setLoading(true);
            // Send token to backend for verification
            const res = await fetch('/api/v1/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${response.credential}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setAuth(data.data.user, data.data.profile, response.credential);
                navigate('/', { replace: true });
            }
            else {
                alert(data.error?.message || 'Login failed');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6", children: _jsx(Card, { className: "w-full max-w-md card-rounded shadow-xl border-0", children: _jsxs(CardBody, { className: "p-6 sm:p-8 lg:p-10", children: [_jsxs("div", { className: "text-center mb-6 sm:mb-8", children: [_jsx("div", { className: "w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl gradient-medical flex items-center justify-center mx-auto mb-4 sm:mb-6 transform hover:scale-105 transition-transform duration-200", children: _jsx("span", { className: "text-white font-bold text-3xl sm:text-4xl", children: "M" }) }), _jsx("h1", { className: "font-heading text-2xl sm:text-3xl font-bold text-medical-gray-900 mb-2", children: "Medical Learning Portal" }), _jsx("p", { className: "text-medical-gray-500 text-base sm:text-lg", children: "Learning system for medical students" })] }), _jsxs("div", { className: "space-y-4 sm:space-y-6", children: [_jsx("div", { className: "bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-4 sm:p-5 border border-blue-100", children: _jsxs("div", { className: "flex items-start gap-2 sm:gap-3", children: [_jsx("div", { className: "text-xl sm:text-2xl flex-shrink-0", children: "\uD83D\uDCCC" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-semibold text-blue-900 mb-1 text-sm sm:text-base", children: "For Medical Students Only" }), _jsx("p", { className: "text-blue-700 text-xs sm:text-sm leading-relaxed break-words", children: "Please sign in with @student.mahidol.ac.th email" })] })] }) }), _jsx("div", { id: "google-signin-button", className: "flex justify-center rounded-xl overflow-hidden w-full" }), _jsx("div", { className: "text-center pt-2", children: _jsxs("button", { type: "button", className: "inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl btn-primary text-sm sm:text-base font-medium w-full sm:w-auto justify-center", onClick: () => {
                                        if (window.google) {
                                            window.google.accounts.id.prompt();
                                        }
                                        else {
                                            alert('Google Sign-In button not found — please wait for script to load or refresh the page');
                                        }
                                    }, children: [_jsx(FcGoogle, { className: "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" }), _jsx("span", { className: "text-white", children: "Sign in with Google" })] }) })] }), _jsxs("p", { className: "text-center text-medical-gray-400 text-xs mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-medical-gray-200 leading-relaxed", children: ["By signing in, you agree to our", ' ', _jsx("a", { href: "#", className: "text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors", children: "Terms of Service" }), ' ', "and", ' ', _jsx("a", { href: "#", className: "text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors", children: "Privacy Policy" })] })] }) }) }));
}
//# sourceMappingURL=LoginPage.js.map