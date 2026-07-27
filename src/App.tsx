import Camera from './Components/Camera'

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">portrait-diary</h1>
        <p className="mt-2 text-gray-600">Take a photo with a 3-second countdown</p>
      </div>
      <Camera />
    </main>
  )
}

export default App
