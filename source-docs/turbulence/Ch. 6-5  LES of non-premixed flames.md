# Ch. 6-5  LES of non-premixed flames

> 원본: `turbulence/Ch. 6-5  LES of non-premixed flames.pdf` (0.3MB, 4 페이지 추출)

## 페이지 1
6.5 LES of turbulent non-premixed flames
- Non-premixed flames appears to be mainly governed by turbulent mixing,
because chemistry is generally faster than turbulent times.
6.5.1 Linear Eddy Model(LEM)
- One-dimensional stochastic description of turbulence stirring and diffusion.
- LES: LEM is used to represent unresolved mixing occurring at the subgrid
scale level
1. Turbulent stirring mechanism: the scalar distribution is rearranged by
triplet map [vortex size( ), vortex location, vortex frequency)

2. Molecular diffusion and chemical processes: one dimensional balance
equation.
- LEM also provides a direct estimation of filtered mass fractions or
temperature. Nevertheless, the calculation is required in each cell, leading
to a heavy computational load.

## 페이지 2
6.5.2 Infinitely fast chemistry
- Filtered species mass fractions and reaction rates
where F denotes the LES filter

where δ denotes the Dirac-delta function(the  for z=z* and p(z*,x,t) is the

probability to find z=z* at the given location)
- this PDF may be either presumed or obtained by solving a balance
equation.
- Presumed β-function, based on filtered mixture fraction and its
unresolved fluctuations:
An exact balance equation may be derived for , but in LES,
is generally estimated from resolved quantities using a scale similarity
assumption:
where C is a model parameter to be estimated; turbulent spectrum or
Z
dynamically provided through a lagrangian formulation.

## 페이지 3
6.5.3 Finite rate chemistry
- Species mass fractions depend on both the mixture fraction and its scalar
dissipation rate.
- Relation between the mixture fraction and its scalar dissipation rate
where '0' denotes the maximum value in the strained flame.
- Flamelet libraries data is recast in terms of flamelet maximum scalar
dissipation rate:
- Assume that mixture fraction and the maximum scalar dissipation rate are
statistically independent,
(1)
- When species mass fractions are assumed to depend weakly on the scalar
dissipation rate or when the possible range for scalar dissipation rate is
not too large, (Taylor series)
(2)
substitute Eq.(2) to (1)
determined from laminar flamelet solutions

- The mean scalar dissipation rate and  are related through:

## 페이지 4
- β-function is chosen for , depending on the

filtered mixture fraction  and its fluctuations ″
- A model is then required for the scalar dissipation rate,
for example, given by De Druyn Kops et al.
where  is the filtered laminar kinematic viscosity,  the Peclet number, 
 
the subgrid scale turbulent viscosity, provided by the subgrid turbulence
model and  a turbulent Schmidt number.

