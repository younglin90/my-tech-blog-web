# Chap 5-4 LES of turbulent premixed flames

> 원본: `turbulence/Chap 5-4 LES of turbulent premixed flames.pdf` (0.6MB, 7 페이지 추출)

## 페이지 1
5.4 LES of turbulent premixed flames
5.4.1 Introduction
- Difficult problem : thickness of a premixed flame is about 0.1 to 1 mm
- To overcome this problem :
1. Simulation of an artificially thickened flame
2. Use of a flame front tracking technique; G-equation
3. Filtering with Gaussian filter larger than the mesh size
- Developing subgrid scale model for filtered reaction rates and unresolved
scalar transport which increase the flame thickness
- Probability density function; mainly developed for diffusion flame
5.4.2 Extension of RANS models: the LES-EBU model
- Subgrid turbulent time scale; extending ITNFS formalism to LES - strain rate
induced by a pair of counter-rotating vortices
- The flame thickness problem is not taken into account
: This model is used together with a gradient model for scalar subgrid scale
transport to ensure a resolved   field in numerical simulations.

## 페이지 2
5.4.3 Artificially thickened flames
- To propagate a premixed flame on a coarse grid
- Simple theories of laminar premixed flame
- Thermal diffusivity, D , is increased by a factor F
th
- Pre exponential constant, B, is decreased by F
- Flame speed is maintained
- Flame thickness is multiplied by F
- For sufficiently large F values, the thickened flame front is resolved on the LES
computational mesh.

## 페이지 3
- Reaction rate(Arrhenius law) ; without requiring ad-hoc submodels (ignition, flame
stabilization or flame/wall interactions)
- Seems to be promising, at least when the flow scales are much larger than the
laminar flame thickness, as in combustion instabilities.
- When the flame is thickened from  to , the interaction between turbulence
 
and chemistry is modified because Da comparing turbulent and chemical time
scales is decreased by a factor F and becomes Da/F.
-   is decreased, the flame becomes more and more insensitive to turbulence
 
motions; this ratio is decreased by a factor F when the flame is thickened.
- An efficiency function E, corresponding to a subgrid scale wrinkling factor
- Flame artificially thickened by a factor F=5. This effect can be parametrized
using a subgrid scale model.

## 페이지 4
5.4.4 G-equation
- Opposite to the thickened flame approach
- 'Flame thickness is zero' and 'flame front is described as a propagating surface
tracked using a G field'
- The G-equation is written as (Kerstein et al.)
- The subgrid scale "turbulent" flame speed is needed. This closure is generally
based on following equation.
where  ′ is the subgrid scale turbulence level which may be estimated as:
where   are the components of the resolved shear stresses. The constants 

and  have to be specified.
- G-equation also induces numerical and theoretical difficulties: flame cusps avoided
adding artificial diffusivity, coupling between displacement and consumption
speeds.

## 페이지 5
5.4.5 Flame surface density LES formulations
- to filter the  (or mass fractions or temperature) balance equations:
- The filtered progress variable may be resolved using a physical space Gaussian
filter F with a filter size  larger than mesh size.
- Compared to an arbitrary G-field (G-equation), the progress variable has a main
advantage:  and related quantities, such as flame surface densities, are physically
defined and may be extracted from DNS or experimental measurements.
- ∑ is the subgrid scale flame surface density and  is the subgrid scale flame
wrinkling factor.

## 페이지 6
5.4.6 Scalar fluxes modeling in LES
- Unresolved scalar fluxes are generally described from a simple gradient
assumption:
- Depending on the turbulence level and heat release rate
- The unresolved scalar flux increases almost linearly with the filter size, but its
type does not change.
- Evaluating   ″″ using the LES fields; G > CG
- 1-D laminar steady propagating premixed flame
- An adiabatic constant pressure laminar flame with unity Lewis number

## 페이지 7
-  is the heat release factor
 
 
- The filtering operation induces unresolved counter-gradient scalar fluxes even in
a laminar flame.
- Transverse profiles of the unresolved turbulent fluxes
- A similar result is achieved for unresolved Reynolds stresses,
- Thermal expansion due to heat release, resolved velocity gradients and shear
stresses contain both information on turbulence and on thermal expansion and are
non-zero for laminar flames; not well suited to extract actual turbulence information
to model.
