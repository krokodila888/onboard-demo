import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Error boundary that catches runtime errors in its child tree.
 * Displays a friendly recovery UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production this would go to an error-reporting service
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[320px] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
            <div className="bg-red-50 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Произошла ошибка
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {import.meta.env.DEV && this.state.error?.message
                ? this.state.error.message
                : 'Неожиданная ошибка в компоненте. Попробуйте обновить страницу.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                Попробовать снова
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Обновить страницу
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
