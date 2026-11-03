import { Component, Suspense, lazy, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { HeroCarFallback } from './HeroCarFallback';
import {
  useMediaQuery,
  usePrefersReducedMotion,
  useSaveData,
  useWebGLSupport,
} from './useHeroCarPreferences';

const HeroCarScene = lazy(() => import('./HeroCarScene'));

type HeroCarVariant = 'catalogo' | 'auth' | 'dashboard';

interface HeroCar3DProps {
  minWidth: number;
  variant: HeroCarVariant;
  className?: string;
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function HeroCar3D({ minWidth, variant, className }: HeroCar3DProps) {
  const wideEnough = useMediaQuery(`(min-width: ${minWidth}px)`);
  const reducedMotion = usePrefersReducedMotion();
  const saveData = useSaveData();
  const webgl = useWebGLSupport();

  if (!wideEnough) return null;

  if (webgl === null || !webgl || saveData) {
    return (
      <div className={cn('relative aspect-[31/18]', className)}>
        <HeroCarFallback />
      </div>
    );
  }

  return (
    <div className={cn('relative aspect-[31/18]', className)}>
      <SceneErrorBoundary fallback={<HeroCarFallback />}>
        <Suspense fallback={<HeroCarFallback />}>
          <HeroCarScene reducedMotion={reducedMotion} variant={variant} />
        </Suspense>
      </SceneErrorBoundary>
    </div>
  );
}
