import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-red-50 text-red-900">
                    <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl border border-red-200">
                        <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                        <p className="mb-4">The application crashed with the following error:</p>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono mb-4 text-red-700">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <div className="text-xs text-gray-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
