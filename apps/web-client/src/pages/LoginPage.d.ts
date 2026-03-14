/**
 * Login Page with Google OAuth
 */
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: {
                            credential: string;
                        }) => void;
                    }) => void;
                    renderButton: (element: HTMLElement, config: object) => void;
                    prompt: () => void;
                };
            };
        };
    }
}
export default function LoginPage(): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LoginPage.d.ts.map