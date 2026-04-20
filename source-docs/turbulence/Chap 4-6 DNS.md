# Chap 4-6 DNS

> 원본: `turbulence/Chap 4-6 DNS.pdf` (0.1MB, 5 페이지 추출)

## 페이지 1
4.6. Direct numerical simulation
Solving the flow equations without any turbulence model.
- Initiated in the eighties, a new way to investigate flame/turbulence interaction and significant prograss
achieved both for models and for fundamentals of turbulent combustion.
1. The role of DNS in turbulent combustion studies
A complete numerical simulation of the three-dimensional balance equations have some limitation that will
remain for some time and, accordingly, various levels of simplification are required.
=> Simplifications are also often required to understand the basic mechanisms controlling a specific
phenomenon.
2. Numerical methods for direct simulation
DNS of reacting flows differs in many ways from DNS of non-reacting situations where the fundamental
limitation is determined by the turbulence Reynolds number. The Reynolds number upper limit is also
controlled by the number of grid points, but another condition is imposed by the proper resolution of the
flame inner structure.
The following aspects are successively considered
Formulation: incompressible, low Mach number and compressible
<Incompressible>
▪ Constant density formulations yield interesting information on some mechanisms governing turbulent flames
▪ Constant density formulations limited by the absence of flame-induced flow modifications due to heat
release
<Low Mach number>
▪ A less restrictive formulation relies on the low-Mach number approximation where density may change
due to temperature variations but remains independent of pressure.
▪ Acoustic waves are eliminated so that the numerical time step is no longer limited.
▪ It cannot be retained in studying combustion instabilities where flow field, acoustic field and chemical
reaction interact.
<Compressible>
▪ Higher cost
▪ Used in many DNS of reacting flows: flame/acoustic interaction effects are captured, combustion in
high-speed flow may be studied, and an easier treatment of boundary conditions is offered.
Chemical system selection
▪ A DNS of reacting flows requires a description of chemistry.
<difficulties>
▪ hydocarbon/air flame: at least 20 species,
▪ pollutant investigation: complete chemical shceme

## 페이지 2
Initial and boundary conditions
▪ additional difficulties
<Boundary conditions>
▪ For incompressible or low Mach number formulations, the specification of boundary conditions requires a
fine tuning with the pressure solver used inside the domain.
<Initial conditions>
▪ Difficult to set and limit the possible configuration to be studied
For example, turbulence/combustion interaction
Two-dimensional versus three-dimensional DNS
▪ This approximation(2D) is generally not suitable for non-reacting flows because turbulent fluctuations are
intrinsically three-dimensional.
▪ For premixed combustion, direct simulations show that the probability of finding locally cylindrical flame
sheets is higher than the probability of finding 3D spheroidal flame surfaces.
Description of heat losses
▪ DNS of reacting flows should include a description of heat transfer by radiation and convection.
▪ Heat losses from the reactive region govern flame quenching and thus determine the combustion regime or
the flame evolution near a wall.

## 페이지 3
Numerical schemes
▪ Multiple numerical algorithms have been used for DNS of reacting flows.
Fig. 5 Example of DNS of turbulent flames

## 페이지 4
3. Spatial resolution and physical scales
DNS grids must ensure that:
▪ the calculation is performed in the largest possible domain to resolve the large scales
▪ the mesh is fine enough to resolve the smallest scales (usually Kolmogorov scales)
▪ the mesh is fine enough to resolve the inner structure of the flame
Resolution of turbulence scales
Turbulent scales are correctly resolved when the largest and smallest eddies are captured by the grid mesh.
where,
 is integral length scale (≥ ,  is typical size,  is typical cell size)
 
 is Kolmogrov cascade arguments ( ≃  ,  )
    
Resolution of chemical scales
The inner flame structure has also to be resolved on the computational mesh. Integral length scale  must be

smaller than L to provide converged statistics:
where  is flame thickness, Q is no. of grid to capture flame thickness

Ex) for hydrocarbon flames at room temp.: =0.5 mm, L~ 24mm, Q=20, then 1024^3 grids required.

The product of Reynolds number by the Damköhler number is:
where     ∼ ′ ∼
     
leading to the computational grid condition
since ∼

Ex) if N=1000, Q=20, then   from Eq(4.48) and  from (4.51)
 
for   far from most turbulent combustion models


## 페이지 5
Requirements for resolution of chemical scales impose a severe limitation on the parameter range that may be
explored using DNS.
Ex) N = 600 grid points Q = 20 grid points inside the flame front
→   but should not be exceed   to reach reasonably high Da
 
for  ′  max Da= 4.5 from Eq. (4.51)
  
and bounded N/Q=30
Fig. 9 Resolution requirements of DNS methods: N = 600 grid
points Q = 20 grid points inside the flame front
