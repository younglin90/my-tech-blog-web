# Chapter 1.  introduction of turbulence-handout (1)

> 원본: `turbulence/Chapter 1.  introduction of turbulence-handout (1).pdf` (0.5MB, 8 페이지 추출)

## 페이지 1
2014-09-15
CHAPTER
1
Turbulent Flow
1.0 Introduction
Objectives
•Understandingthecharacteristicsof turbulentflow
1-1
1

## 페이지 2
2014-09-15
1.0 Turbulent Flow
Turbulent flow
-Turbulent Jet : An Album of Fluid Motion,
M Van Dyke (1980, Stanford)
. Turbulent
. Disorder
. Not Symmetric
. Large and Small Scale Eddies
. Different Length Scale
1-2
1.0 Turbulent Flow
Basic Characteristic of Turbulence
- Disorder/ randomness ← mathematical modeling possible?
. irreproducibility in detail ⇒use statistical method
. fluctuations in space and also in time (never steady)
mean flow(steady state) +fluctuation (imagine u-t curve)
 called statistically steady or unsteady
if no average value, turbulence decays out, not sustained
(imagine u-t curve)
- Diffusivity/ Mixing
eg. cup of tea, atmospheric dispersion of air pollutants
. Greatly enhanced rate of mixing of heat, momentum, and so on)
compared to laminar flow
. Applications : Combustion, Heat Transfer, Pipe Friction, and etc.
1-3
2

## 페이지 3
2014-09-15
1.0 Turbulent Flow
Basic Characteristic of Turbulence
- Dissipation
. Viscouse shear stresses
 convert KE of turbulence to heat
. An energy source needed to maintain the turbulence, otherwise,
decay rapidly
. random wave: nondissipative, but dispersive
- Continuum
. A range of scales but smallest scales in turbulence are much
larger than molecular scales (~ mean free path), i.e. macroscopic
- Property of flow, not fluid
. depends on Re
1-4
1.0 Turbulent Flow
Why is the study of turbulence difficult ?
- Nonlinear dynamic system
u
Aadvectiveterms ( , ...) leads to great difficulty in
u
turbulence modeling x
- High sensitivity to small perturvationin IC and BC
explains apparent randomness although N-S eqs are deterministic.
- 3D, unsteady, large range of scales
1-5
3

## 페이지 4
2014-09-15
1.0 Turbulent Flow
Tools to be used
(1) Cartesian tensor algebra
-Writing eqs in form dependent of coordinate systems(…constraint)
→ independent of a arbitrary rotation of coordinate system.
(2) Dimensional analysis
- Important scale laws
← In turbulent flows, especially at high Re,
- a wide range of scale exist in both time and length
← Large scales set by geometry of flow: TKE production
Small scales set by viscosity: TKE dissipation
(3) Probability and Statistics
- Good understanding of N-S eqs, specially for incompressibe
turbulent flow
1-6
1.0 Turbulent Flow
Governing Equations
-consider continuity, momentum equations of compressible
Newtonian fluid (HW: derivation of the following equations)
 u j
 0
t x
j
u (uu p ) 
i  i j ij  ij
t x x
j j
where   u i  u j  2  u l   : viscous stress tensor
ij x x 3 ij x 
 j i l 
- consider the equations for incompressible flow at constant ρ & μ and
~
steady state u
j 0 , ~ means instantaneous value
. Continuity : x
j
u ~ 1  ~ p 2u ~
. Momentum : u i   i
j x x x x
1-7 j i j j
4

## 페이지 5
2014-09-15
1.0 Turbulent Flow
Decomposition of Governing Equations
separate instantaneous flow variable into mean + fluctuation
Different types of averages
(1) Time averaging
. u  lim 1  t 0 T udt
i TT t i
0
. independent of t
0
. can be defined only for statistically stationary turb.
(2) Space averaging
. for "homogeneous turbulence" statistics (eg. mean velocity)
independent of position
. Application : grid filter for LES
(3) Ensemble averaging (Most general)
. average over a large number (theoretically ∞) of experiment trials,
however, use time/space average when possible
1-8
1.0 Turbulent Flow
Decomposition of Governing Equations
Turbulent Kinetic Energy Eq. :
Small scale motions (contribute most to ε) have short time scale
i.e., small scales fluctuate rapidly, large scale do slowly
⇒Small scale structure tends to be independent of spatial
orientation of mean flow (S )
ij
Quickly dissipated
1-21
5

## 페이지 6
2014-09-15
1.0 Turbulent Flow
Reading assignment: SRT: 357-365
Length Scales
- L (macro scale) : Mean flow scale
4
l
- (integral scale : Taylor macroscale)
o
l
- (Taylor microscale)

AndreyNikolaevichKolmogorov
Ph.D. Moscow State University 1925
-l (Kolmogrov microscale) 1903 –1987
k
L  l or L  l or L  l
o o o
l  l  l
o  k
1-22
1.0 Turbulent Flow
-Integral scale:
the size of the largest eddies or the width of the flow

l R (r)dr
o x
0
u(0)u(r)
where R (r) : Eulerian Correlation Coefficient
x (u(0))2
1-23
6

## 페이지 7
2014-09-15
1.0 Turbulent Flow
- Taylor micro scale: related to mean strain rate, s
ij
l l
. intermediate length scale between and , but weighted to
o k
more towards the smaller scales
def. : :
. isotropic turbulence
.associated with the curvature of spatial velocity autocorrelations
1-24
1.0 Turbulent Flow
- Kolmogorov micro scale
. The smallest length scale of eddy of fluid, which activated
energy transfer from TKE to IE of fluid.
. Molecular effect (Kinematic viscosity) are significant.
1-25
7

## 페이지 8
2014-09-15
1.0 Turbulent Flow
Inertial subrange
- An intermediate range of turbulent scales or wavelengths
that is smaller than the energy-containing eddies but larger
than viscous eddies.
- In the inertial subrange, the net energy coming from the
energy-containing eddies is in equilibrium with the net
energy cascading to smaller eddies where it is dissipated. -
- Thus the slope of the energy spectrum in this range
remains constant. Kolmogorov showed that the slope is −5/
3 based on dimensional arguments
1-26
1.0 Turbulent Flow
Scale effect
Gas Turbine: 10 atm, 1500K
Turb Re :
Flow Re :
⇒
⇒ big memory required to compute high speed flow
if Re=105 ⇒ one direction
1-27
8
