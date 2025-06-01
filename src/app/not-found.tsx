import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-6">🏸</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
} 