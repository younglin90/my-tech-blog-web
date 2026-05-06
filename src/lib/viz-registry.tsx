'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

function VizLoading() {
  return (
    <div className="rounded-lg p-4 text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      Loading visualization...
    </div>
  )
}

export const VIZ_COMPONENTS: Record<string, ComponentType> = {
  "AMRQuadtreeRefinement": dynamic(() => import("@/components/post-viz/2026-04-27-amr-quadtree-cell-refinement/AMRQuadtreeRefinement").then((m) => ({ default: m.AMRQuadtreeRefinement })), { ssr: false, loading: VizLoading }),
  "APIMEXAcousticPulse1D": dynamic(() => import("@/components/post-viz/2026-05-03-orlando-bonaventura-ap-imex-nonideal-gas/APIMEXAcousticPulse1D").then((m) => ({ default: m.APIMEXAcousticPulse1D })), { ssr: false, loading: VizLoading }),
  "BFSRecirculation": dynamic(() => import("@/components/post-viz/2026-03-26-openfoam-backward-facing-step/BFSRecirculation").then((m) => ({ default: m.BFSRecirculation })), { ssr: false, loading: VizLoading }),
  "BoundaryCondition": dynamic(() => import("@/components/viz/BoundaryCondition").then((m) => ({ default: m.BoundaryCondition })), { ssr: false, loading: VizLoading }),
  "BurgersShockBirth": dynamic(() => import("@/components/post-viz/2026-05-01-burgers-characteristics-shock-formation/BurgersShockBirth").then((m) => ({ default: m.BurgersShockBirth })), { ssr: false, loading: VizLoading }),
  "CheckerboardPressure": dynamic(() => import("@/components/post-viz/rhie-chow-multiphase/CheckerboardPressure").then((m) => ({ default: m.CheckerboardPressure })), { ssr: false, loading: VizLoading }),
  "DeanSecondaryFlow": dynamic(() => import("@/components/post-viz/2026-03-28-dean-flow-analytical-solution/DeanSecondaryFlow").then((m) => ({ default: m.DeanSecondaryFlow })), { ssr: false, loading: VizLoading }),
  "DGElementBasis": dynamic(() => import("@/components/post-viz/2026-04-20-discontinuous-galerkin-method-cfd/DGElementBasis").then((m) => ({ default: m.DGElementBasis })), { ssr: false, loading: VizLoading }),
  "EikonalFrontPropagation": dynamic(() => import("@/components/post-viz/2026-04-22-wall-distance-eikonal-fast-marching/EikonalFrontPropagation").then((m) => ({ default: m.EikonalFrontPropagation })), { ssr: false, loading: VizLoading }),
  "HeatDiffusionExplicitVsImplicit1D": dynamic(() => import("@/components/post-viz/2026-05-04-implicit-diffusion-thomas-algorithm/HeatDiffusionExplicitVsImplicit1D").then((m) => ({ default: m.HeatDiffusionExplicitVsImplicit1D })), { ssr: false, loading: VizLoading }),
  "KrylovConvergence": dynamic(() => import("@/components/post-viz/2026-04-22-cfd-linear-solvers-krylov/KrylovConvergence").then((m) => ({ default: m.KrylovConvergence })), { ssr: false, loading: VizLoading }),
  "KrylovConvergenceRace": dynamic(() => import("@/components/post-viz/2026-04-22-cfd-linear-solvers-krylov/KrylovConvergenceRace").then((m) => ({ default: m.KrylovConvergenceRace })), { ssr: false, loading: VizLoading }),
  "LawOfTheWallProfile": dynamic(() => import("@/components/post-viz/2026-05-05-reynolds-pipe-transition-turbulence/LawOfTheWallProfile").then((m) => ({ default: m.LawOfTheWallProfile })), { ssr: false, loading: VizLoading }),
  "LimiterAdvection1D": dynamic(() => import("@/components/post-viz/2026-04-24-flux-limiter-tvd-advection/LimiterAdvection1D").then((m) => ({ default: m.LimiterAdvection1D })), { ssr: false, loading: VizLoading }),
  "MachArchitect": dynamic(() => import("@/components/MachArchitect").then((m) => ({ default: m.MachArchitect })), { ssr: false, loading: VizLoading }),
  "MagnusCylinderStreamlines": dynamic(() => import("@/components/post-viz/2026-05-07-circulation-lift-kutta-joukowski/MagnusCylinderStreamlines").then((m) => ({ default: m.MagnusCylinderStreamlines })), { ssr: false, loading: VizLoading }),
  "MultigridVCycleConvergence": dynamic(() => import("@/components/post-viz/2026-05-06-multigrid-v-cycle-poisson-acceleration/MultigridVCycleConvergence").then((m) => ({ default: m.MultigridVCycleConvergence })), { ssr: false, loading: VizLoading }),
  "MUSCLTHINCBVDPicker": dynamic(() => import("@/components/post-viz/2026-05-02-muscl-thinc-bvd-interface-reconstruction/MUSCLTHINCBVDPicker").then((m) => ({ default: m.MUSCLTHINCBVDPicker })), { ssr: false, loading: VizLoading }),
  "NumericalDungeon": dynamic(() => import("@/components/NumericalDungeon").then((m) => ({ default: m.NumericalDungeon })), { ssr: false, loading: VizLoading }),
  "NumericalScheme": dynamic(() => import("@/components/viz/NumericalScheme").then((m) => ({ default: m.NumericalScheme })), { ssr: false, loading: VizLoading }),
  "PINNLossLandscape": dynamic(() => import("@/components/post-viz/2026-03-24-paper-review-pinn-turbulence-modeling/PINNLossLandscape").then((m) => ({ default: m.PINNLossLandscape })), { ssr: false, loading: VizLoading }),
  "PlateauRayleighJet": dynamic(() => import("@/components/post-viz/2026-04-23-plateau-rayleigh-jet-breakup/PlateauRayleighJet").then((m) => ({ default: m.PlateauRayleighJet })), { ssr: false, loading: VizLoading }),
  "PoiseuilleProfile": dynamic(() => import("@/components/post-viz/2026-03-28-poiseuille-flow-analytical-solution/PoiseuilleProfile").then((m) => ({ default: m.PoiseuilleProfile })), { ssr: false, loading: VizLoading }),
  "PressureContour": dynamic(() => import("@/components/viz/PressureContour").then((m) => ({ default: m.PressureContour })), { ssr: false, loading: VizLoading }),
  "QuaternionRotationDemo": dynamic(() => import("@/components/post-viz/2026-04-20-fem-rigid-body-dynamics-quaternion/QuaternionRotationDemo").then((m) => ({ default: m.QuaternionRotationDemo })), { ssr: false, loading: VizLoading }),
  "RankineVortexExplorer": dynamic(() => import("@/components/post-viz/2026-04-28-rankine-vortex-helmholtz/RankineVortexExplorer").then((m) => ({ default: m.RankineVortexExplorer })), { ssr: false, loading: VizLoading }),
  "ReynoldsDyeExperiment": dynamic(() => import("@/components/post-viz/2026-05-05-reynolds-pipe-transition-turbulence/ReynoldsDyeExperiment").then((m) => ({ default: m.ReynoldsDyeExperiment })), { ssr: false, loading: VizLoading }),
  "RiemannFan": dynamic(() => import("@/components/post-viz/riemann-solvers/RiemannFan").then((m) => ({ default: m.RiemannFan })), { ssr: false, loading: VizLoading }),
  "ShallowWaterCasulli1D": dynamic(() => import("@/components/post-viz/2026-04-26-casulli-walters-unstructured-shallow-water/ShallowWaterCasulli1D").then((m) => ({ default: m.ShallowWaterCasulli1D })), { ssr: false, loading: VizLoading }),
  "SimpleResidualHistory": dynamic(() => import("@/components/post-viz/2026-03-27-simpleFoam-pressure-divergence/SimpleResidualHistory").then((m) => ({ default: m.SimpleResidualHistory })), { ssr: false, loading: VizLoading }),
  "SpeedOfSoundMix": dynamic(() => import("@/components/post-viz/compressible-multiphase-intro/SpeedOfSoundMix").then((m) => ({ default: m.SpeedOfSoundMix })), { ssr: false, loading: VizLoading }),
  "SPHKernelShapeExplorer": dynamic(() => import("@/components/post-viz/2026-04-29-sph-meshfree-particle-hydrodynamics/SPHKernelShapeExplorer").then((m) => ({ default: m.SPHKernelShapeExplorer })), { ssr: false, loading: VizLoading }),
  "SPHParticleDrop2D": dynamic(() => import("@/components/post-viz/2026-04-29-sph-meshfree-particle-hydrodynamics/SPHParticleDrop2D").then((m) => ({ default: m.SPHParticleDrop2D })), { ssr: false, loading: VizLoading }),
  "StartingVortexShedding": dynamic(() => import("@/components/post-viz/2026-05-07-circulation-lift-kutta-joukowski/StartingVortexShedding").then((m) => ({ default: m.StartingVortexShedding })), { ssr: false, loading: VizLoading }),
  "StencilCompare": dynamic(() => import("@/components/post-viz/fdm-fem-fvm/StencilCompare").then((m) => ({ default: m.StencilCompare })), { ssr: false, loading: VizLoading }),
  "StreamLine": dynamic(() => import("@/components/viz/StreamLine").then((m) => ({ default: m.StreamLine })), { ssr: false, loading: VizLoading }),
  "TENOvsWENOAdvection1D": dynamic(() => import("@/components/post-viz/2026-04-25-teno-low-dissipation-shock-capturing/TENOvsWENOAdvection1D").then((m) => ({ default: m.TENOvsWENOAdvection1D })), { ssr: false, loading: VizLoading }),
  "VelocityField": dynamic(() => import("@/components/viz/VelocityField").then((m) => ({ default: m.VelocityField })), { ssr: false, loading: VizLoading }),
  "VenturiCavitationFlow": dynamic(() => import("@/components/post-viz/2026-04-30-cavitation-number-vapor-pressure/VenturiCavitationFlow").then((m) => ({ default: m.VenturiCavitationFlow })), { ssr: false, loading: VizLoading }),
  "VOFvsLevelSet": dynamic(() => import("@/components/post-viz/interface-capturing/VOFvsLevelSet").then((m) => ({ default: m.VOFvsLevelSet })), { ssr: false, loading: VizLoading }),
  "VolumeFractionAdvect": dynamic(() => import("@/components/post-viz/five-equation-model/VolumeFractionAdvect").then((m) => ({ default: m.VolumeFractionAdvect })), { ssr: false, loading: VizLoading }),
}
