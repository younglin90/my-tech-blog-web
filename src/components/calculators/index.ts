import type { ReactElement } from 'react'
import { BoundaryLayerCalculator } from '@/components/calculators/BoundaryLayer'
import { CFLCalculator } from '@/components/calculators/CFL'
import { FannoCalculator } from '@/components/calculators/Fanno'
import { IsentropicCalculator } from '@/components/calculators/Isentropic'
import { KolmogorovCalculator } from '@/components/calculators/Kolmogorov'
import { LesResolutionPlannerCalculator } from '@/components/calculators/LesResolutionPlanner'
import { MachCalculator } from '@/components/calculators/Mach'
import { MassFluxBalanceVisualizerCalculator } from '@/components/calculators/MassFluxBalanceVisualizer'
import { MeshQualityVisualizerCalculator } from '@/components/calculators/MeshQualityVisualizer'
import { NaturalConvectionRegimeVisualizerCalculator } from '@/components/calculators/NaturalConvectionRegimeVisualizer'
import { NormalShockCalculator } from '@/components/calculators/NormalShock'
import { NusseltCalculator } from '@/components/calculators/Nusselt'
import { NozzleAreaMachVisualizerCalculator } from '@/components/calculators/NozzleAreaMachVisualizer'
import { ObliqueShockCalculator } from '@/components/calculators/ObliqueShock'
import { PrandtlCalculator } from '@/components/calculators/Prandtl'
import { RayleighCalculator } from '@/components/calculators/Rayleigh'
import { ResidualConvergenceAnalyzerCalculator } from '@/components/calculators/ResidualConvergenceAnalyzer'
import { ReynoldsCalculator } from '@/components/calculators/Reynolds'
import { StandardAtmosphereVisualizerCalculator } from '@/components/calculators/StandardAtmosphereVisualizer'
import { StokesCalculator } from '@/components/calculators/Stokes'
import { TimeStepBudgetVisualizerCalculator } from '@/components/calculators/TimeStepBudgetVisualizer'
import { TurbulenceInletVisualizerCalculator } from '@/components/calculators/TurbulenceInletVisualizer'
import { TurbulenceIntensityCalculator } from '@/components/calculators/TurbulenceIntensity'
import { UnderRelaxationPlannerCalculator } from '@/components/calculators/UnderRelaxationPlanner'
import { VortexSheddingStreetVisualizerCalculator } from '@/components/calculators/VortexSheddingStreetVisualizer'
import { ChokedMassFlowCalculator } from '@/components/calculators/ChokedMassFlow'
import { FroudeCalculator } from '@/components/calculators/Froude'
import { PecletCalculator } from '@/components/calculators/Peclet'
import { SchmidtCalculator } from '@/components/calculators/Schmidt'
import { ShockPolarVisualizerCalculator } from '@/components/calculators/ShockPolarVisualizer'
import { KnudsenCalculator } from '@/components/calculators/Knudsen'
import { PressureCoefficientMapperCalculator } from '@/components/calculators/PressureCoefficientMapper'
import { YPlusCalculator } from '@/components/calculators/YPlus'
import { LbmBgkStabilityVisualizerCalculator } from '@/components/calculators/LbmBgkStabilityVisualizer'
import { LewisCalculator } from '@/components/calculators/Lewis'
import { BiotCalculator } from '@/components/calculators/Biot'
import { FourierCalculator } from '@/components/calculators/Fourier'
import { WeberCalculator } from '@/components/calculators/Weber'
import { CapillaryNumberCalculator } from '@/components/calculators/CapillaryNumber'
import { BondNumberCalculator } from '@/components/calculators/BondNumber'
import { CaseMemoryEstimatorCalculator } from '@/components/calculators/CaseMemoryEstimator'
import { CavitationNumberCalculator } from '@/components/calculators/CavitationNumber'
import { CavitationRiskVisualizerCalculator } from '@/components/calculators/CavitationRiskVisualizer'
import { DiffusionCFLCalculator } from '@/components/calculators/DiffusionCFL'
import { DragPolarExplorerCalculator } from '@/components/calculators/DragPolarExplorer'
import { CellReynoldsCalculator } from '@/components/calculators/CellReynolds'
import { YPlusWallVisualizerCalculator } from '@/components/calculators/YPlusWallVisualizer'
import {
  FlatPlateSkinFrictionCalculator,
  StallSpeedEstimatorCalculator,
  ThinAirfoilLiftCurveCalculator,
  WindTunnelSimilarityCalculator,
} from '@/components/calculators/AeroUtilitySuite'
import {
  BoundaryLayerStackCalculator,
  ColebrookCalculator,
  Courant3DCalculator,
  DarcyWeisbachCalculator,
  LiftDragCalculator,
  StrouhalCalculator,
} from '@/components/calculators/EngineeringSuite'
import { MoodyChartExplorerCalculator } from '@/components/calculators/MoodyChartExplorer'
import {
  DynamicPressureCalculator,
  CfdUnitConverterCalculator,
  GciCalculator,
  HydraulicDiameterCalculator,
  OrificeFlowCalculator,
  SutherlandAirCalculator,
  ValveCvKvCalculator,
} from '@/components/calculators/FlowUtilitySuite'
import {
  FinEfficiencyCalculator,
  FlatPlateConvectionMapCalculator,
  LumpedCoolingTransientCalculator,
  PipeHeatTransferDesignerCalculator,
  RadiationHeatBalanceCalculator,
} from '@/components/calculators/HeatTransferUtilitySuite'
import {
  ArrheniusSensitivityCalculator,
  DamkohlerKarlovitzMapCalculator,
  EquivalenceRatioMixerCalculator,
  HeatReleaseTemperatureRiseCalculator,
} from '@/components/calculators/ReactingFlowSuite'
import {
  CapillaryLengthCalculator,
  DropletBreakupCalculator,
  ManningOpenChannelCalculator,
  OhnesorgeCalculator,
  ParticleSettlingCalculator,
} from '@/components/calculators/MultiphaseUtilitySuite'
import {
  BubbleRiseRegimeCalculator,
  HydraulicJumpVisualizerCalculator,
  TwoPhasePressureDropCalculator,
  VoidFractionSlipCalculator,
} from '@/components/calculators/MultiphaseAdvancedSuite'
import { FlowRegimeMapCalculator } from '@/components/calculators/RegimeMap'

export const CALCULATOR_COMPONENTS: Record<string, () => ReactElement> = {
  isentropic: IsentropicCalculator,
  'normal-shock': NormalShockCalculator,
  'oblique-shock': ObliqueShockCalculator,
  'shock-polar-visualizer': ShockPolarVisualizerCalculator,
  'fanno-flow': FannoCalculator,
  'rayleigh-flow': RayleighCalculator,
  'choked-mass-flow': ChokedMassFlowCalculator,
  'nozzle-area-mach-visualizer': NozzleAreaMachVisualizerCalculator,
  'standard-atmosphere-visualizer': StandardAtmosphereVisualizerCalculator,
  reynolds: ReynoldsCalculator,
  mach: MachCalculator,
  prandtl: PrandtlCalculator,
  froude: FroudeCalculator,
  peclet: PecletCalculator,
  schmidt: SchmidtCalculator,
  knudsen: KnudsenCalculator,
  'boundary-layer': BoundaryLayerCalculator,
  kolmogorov: KolmogorovCalculator,
  'turbulence-intensity': TurbulenceIntensityCalculator,
  'turbulence-inlet-visualizer': TurbulenceInletVisualizerCalculator,
  'les-resolution-planner': LesResolutionPlannerCalculator,
  stokes: StokesCalculator,
  'y-plus': YPlusCalculator,
  'y-plus-wall-visualizer': YPlusWallVisualizerCalculator,
  nusselt: NusseltCalculator,
  'natural-convection-regime': NaturalConvectionRegimeVisualizerCalculator,
  lewis: LewisCalculator,
  biot: BiotCalculator,
  fourier: FourierCalculator,
  'pipe-heat-transfer-designer': PipeHeatTransferDesignerCalculator,
  'flat-plate-convection-map': FlatPlateConvectionMapCalculator,
  'fin-efficiency': FinEfficiencyCalculator,
  'radiation-heat-balance': RadiationHeatBalanceCalculator,
  'lumped-cooling-transient': LumpedCoolingTransientCalculator,
  'damkohler-karlovitz-map': DamkohlerKarlovitzMapCalculator,
  'equivalence-ratio-mixer': EquivalenceRatioMixerCalculator,
  'arrhenius-sensitivity': ArrheniusSensitivityCalculator,
  'heat-release-temperature-rise': HeatReleaseTemperatureRiseCalculator,
  weber: WeberCalculator,
  'capillary-number': CapillaryNumberCalculator,
  'bond-number': BondNumberCalculator,
  'cavitation-number': CavitationNumberCalculator,
  'cavitation-risk-visualizer': CavitationRiskVisualizerCalculator,
  cfl: CFLCalculator,
  'time-step-budget': TimeStepBudgetVisualizerCalculator,
  'diffusion-cfl': DiffusionCFLCalculator,
  'cell-reynolds': CellReynoldsCalculator,
  'lbm-bgk-stability': LbmBgkStabilityVisualizerCalculator,
  'colebrook-white': ColebrookCalculator,
  'darcy-weisbach': DarcyWeisbachCalculator,
  'lift-drag-coefficients': LiftDragCalculator,
  'drag-polar-explorer': DragPolarExplorerCalculator,
  'pressure-coefficient-mapper': PressureCoefficientMapperCalculator,
  'strouhal-vortex-shedding': StrouhalCalculator,
  'vortex-shedding-street': VortexSheddingStreetVisualizerCalculator,
  'thin-airfoil-lift-curve': ThinAirfoilLiftCurveCalculator,
  'stall-speed-estimator': StallSpeedEstimatorCalculator,
  'flat-plate-skin-friction': FlatPlateSkinFrictionCalculator,
  'wind-tunnel-similarity': WindTunnelSimilarityCalculator,
  'courant-3d': Courant3DCalculator,
  'boundary-layer-stack': BoundaryLayerStackCalculator,
  'moody-chart-explorer': MoodyChartExplorerCalculator,
  'sutherland-air': SutherlandAirCalculator,
  'orifice-flow': OrificeFlowCalculator,
  'valve-cv-kv': ValveCvKvCalculator,
  'hydraulic-diameter': HydraulicDiameterCalculator,
  'dynamic-pressure': DynamicPressureCalculator,
  'grid-convergence-index': GciCalculator,
  'cfd-unit-converter': CfdUnitConverterCalculator,
  'case-memory-estimator': CaseMemoryEstimatorCalculator,
  'residual-convergence-analyzer': ResidualConvergenceAnalyzerCalculator,
  'mass-flux-balance': MassFluxBalanceVisualizerCalculator,
  'under-relaxation-planner': UnderRelaxationPlannerCalculator,
  'mesh-quality-visualizer': MeshQualityVisualizerCalculator,
  ohnesorge: OhnesorgeCalculator,
  'capillary-length': CapillaryLengthCalculator,
  'particle-settling': ParticleSettlingCalculator,
  'manning-open-channel': ManningOpenChannelCalculator,
  'droplet-breakup': DropletBreakupCalculator,
  'two-phase-pressure-drop': TwoPhasePressureDropCalculator,
  'void-fraction-slip': VoidFractionSlipCalculator,
  'bubble-rise-regime': BubbleRiseRegimeCalculator,
  'hydraulic-jump-visualizer': HydraulicJumpVisualizerCalculator,
  'flow-regime-map': FlowRegimeMapCalculator,
}
