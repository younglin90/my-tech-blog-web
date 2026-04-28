import type { ReactElement } from 'react'
import { BoundaryLayerCalculator } from '@/components/calculators/BoundaryLayer'
import { CFLCalculator } from '@/components/calculators/CFL'
import { FannoCalculator } from '@/components/calculators/Fanno'
import { IsentropicCalculator } from '@/components/calculators/Isentropic'
import { KolmogorovCalculator } from '@/components/calculators/Kolmogorov'
import { MachCalculator } from '@/components/calculators/Mach'
import { NormalShockCalculator } from '@/components/calculators/NormalShock'
import { NusseltCalculator } from '@/components/calculators/Nusselt'
import { ObliqueShockCalculator } from '@/components/calculators/ObliqueShock'
import { PrandtlCalculator } from '@/components/calculators/Prandtl'
import { RayleighCalculator } from '@/components/calculators/Rayleigh'
import { ReynoldsCalculator } from '@/components/calculators/Reynolds'
import { StokesCalculator } from '@/components/calculators/Stokes'
import { TurbulenceIntensityCalculator } from '@/components/calculators/TurbulenceIntensity'
import { ChokedMassFlowCalculator } from '@/components/calculators/ChokedMassFlow'
import { FroudeCalculator } from '@/components/calculators/Froude'
import { PecletCalculator } from '@/components/calculators/Peclet'
import { SchmidtCalculator } from '@/components/calculators/Schmidt'
import { KnudsenCalculator } from '@/components/calculators/Knudsen'
import { YPlusCalculator } from '@/components/calculators/YPlus'
import { LewisCalculator } from '@/components/calculators/Lewis'
import { BiotCalculator } from '@/components/calculators/Biot'
import { FourierCalculator } from '@/components/calculators/Fourier'
import { WeberCalculator } from '@/components/calculators/Weber'
import { CapillaryNumberCalculator } from '@/components/calculators/CapillaryNumber'
import { BondNumberCalculator } from '@/components/calculators/BondNumber'
import { CavitationNumberCalculator } from '@/components/calculators/CavitationNumber'
import { DiffusionCFLCalculator } from '@/components/calculators/DiffusionCFL'
import { CellReynoldsCalculator } from '@/components/calculators/CellReynolds'
import {
  BoundaryLayerStackCalculator,
  ColebrookCalculator,
  Courant3DCalculator,
  DarcyWeisbachCalculator,
  LiftDragCalculator,
  StrouhalCalculator,
} from '@/components/calculators/EngineeringSuite'
import {
  DynamicPressureCalculator,
  GciCalculator,
  HydraulicDiameterCalculator,
  OrificeFlowCalculator,
  SutherlandAirCalculator,
  ValveCvKvCalculator,
} from '@/components/calculators/FlowUtilitySuite'
import {
  CapillaryLengthCalculator,
  DropletBreakupCalculator,
  ManningOpenChannelCalculator,
  OhnesorgeCalculator,
  ParticleSettlingCalculator,
} from '@/components/calculators/MultiphaseUtilitySuite'

export const CALCULATOR_COMPONENTS: Record<string, () => ReactElement> = {
  isentropic: IsentropicCalculator,
  'normal-shock': NormalShockCalculator,
  'oblique-shock': ObliqueShockCalculator,
  'fanno-flow': FannoCalculator,
  'rayleigh-flow': RayleighCalculator,
  'choked-mass-flow': ChokedMassFlowCalculator,
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
  stokes: StokesCalculator,
  'y-plus': YPlusCalculator,
  nusselt: NusseltCalculator,
  lewis: LewisCalculator,
  biot: BiotCalculator,
  fourier: FourierCalculator,
  weber: WeberCalculator,
  'capillary-number': CapillaryNumberCalculator,
  'bond-number': BondNumberCalculator,
  'cavitation-number': CavitationNumberCalculator,
  cfl: CFLCalculator,
  'diffusion-cfl': DiffusionCFLCalculator,
  'cell-reynolds': CellReynoldsCalculator,
  'colebrook-white': ColebrookCalculator,
  'darcy-weisbach': DarcyWeisbachCalculator,
  'lift-drag-coefficients': LiftDragCalculator,
  'strouhal-vortex-shedding': StrouhalCalculator,
  'courant-3d': Courant3DCalculator,
  'boundary-layer-stack': BoundaryLayerStackCalculator,
  'sutherland-air': SutherlandAirCalculator,
  'orifice-flow': OrificeFlowCalculator,
  'valve-cv-kv': ValveCvKvCalculator,
  'hydraulic-diameter': HydraulicDiameterCalculator,
  'dynamic-pressure': DynamicPressureCalculator,
  'grid-convergence-index': GciCalculator,
  ohnesorge: OhnesorgeCalculator,
  'capillary-length': CapillaryLengthCalculator,
  'particle-settling': ParticleSettlingCalculator,
  'manning-open-channel': ManningOpenChannelCalculator,
  'droplet-breakup': DropletBreakupCalculator,
}
