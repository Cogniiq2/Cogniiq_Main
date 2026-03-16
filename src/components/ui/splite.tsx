import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <div className="w-full h-full" style={{ contain: 'strict' }}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full border-2 border-gray-200"
              style={{ borderTopColor: '#0ea5e9', animation: 'spin 0.9s linear infinite' }}
            />
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  )
}
