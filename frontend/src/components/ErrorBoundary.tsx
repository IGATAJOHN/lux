import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            We encountered an unexpected error. Please try again.
                        </p>
                        {this.state.error && (
                            <pre className="text-xs text-left bg-secondary p-4 rounded-lg mb-6 overflow-auto">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button variant="gold" onClick={this.handleReset}>
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
