# Ch. 6 Turbulent non-premixed flames

> 원본: `turbulence/Ch. 6 Turbulent non-premixed flames.pdf` (0.4MB, 13 페이지 추출)

## 페이지 1
Ch. 6 Turbulent non premixed flames
6.1 Introduction
Turbulent non-premixed flames
- Simpler to design and to build because a perfect reactant mixing is not required
- Safer to operate as they do not exhibit propagation speeds and cannot flashback
or autoignite in undesired locations
- Most mechanisms described for turbulent premixed flames are also found.(ex :
flame-generated vorticity, viscous effects, stretching)
-> Specific processes make non-premixed flames(molecular diffusion, turbulent
motions) more difficult to understand and to describe than turbulent premixed
flames.
6.2 Phenomenological description
Specific features of turbulent non-premixed flames
- Non-premixed flames do not propagate
-> Located where fuel and oxidizer meet
-> Unable to impose its own dynamics on the flow field and is more sensitive to
turbulence(more likely to quenched by turbulent fluctuations) and
stretch(small critical stretch value)
- Buoyancy, natural convection and entrainment effects

## 페이지 2
Turbulent non-premixed flame stabilization
- Flame stabilization
-> Initial ignition(ex : spark) - Continuous mixing and ignition by the hot gases
present in the chamber
-> Central design criterion for combustion chambers
-> Unsolved challenge for numerical combustion codes → Assuming infinitely
fast chemistry or any type of ignited flame structure like in flamelet models
→ Predicting stabilization and combustion for any flow rates(even very large)
- Stabilization mechanism
-> Rim-stabilized flames(Inlet speed < s 0)
L
- Stabilize directly at the splitter plate separating the fuel and oxidizer
streams
- Suffer from excessive heat transfer
- Transition depend on flow velocities and velocity gradients at the walls
-> Triple flames(Inlet speed < 5s 0)
L
- Stabilization of lifted laminar diffusion flames
- Mixing between fuel and oxidizer occurs upstream of the flame ignition point
- Two premixed flames and a diffusion flame

## 페이지 3
-> Pilot flames(Inlet speed > 10s 0)
L
- Small premixed flames are used in the vicinity of the jet exit
- Heat source or an injection of hot burnt gases from a numerical point of
view
-> Auto-ignition(Inlet speed > 10s 0)
L
- One of the fuel or oxidizer streams is sufficiently hot → Auto
ignition(independently of the inlet speeds, scramjets, diesel engines, and
staged gas turbines)
- Ignition distance δ must be as short as possible
i
- Difficult to handle because ignition mechanisms have to be incorporated in
models from a numerical point of view

## 페이지 4
-> Recirculation zone(Inlet speed > 10s 0)
L
- Create a recirculation zone which acts as a hot burnt gases tank providing
the energy to ignite incoming reactants
- Dump geometries
→ (a) Large step(bluff-body) generate recirculation zones and mixing
between fuel and oxidizer
(b) Fuel and oxidizer are injected on the same side of the bluff body
where a large recirculation of burnt products stabilizes combustion
→ Not yet well predicted using numerical simulations(Transport phenomenon
is not correctly accounted for by classical turbulent transport models)
- Swirl-stabilized flames
→ Ensure flame stabilization while minimizing pressure losses
→ Swirling the flow creates a low-speed region on the combustion chamber
axis
→ (a) Low swirl levels : Decreasing the axial velocity
(b) Higher swirl levels : Recirculation zone(negative axial velocities)
(c) Very large swirls : Lateral recirculation zones disappear and the
whole chamber is almost filled by a large axial
recirculation zone(flashback)

## 페이지 5
→ · For high values of the swirl number, the central recirculation zone may
oscillate(Precessing Vortex Core)
· Break down at the stagnation point
· Recirculation of the flow inside the spiral(large perturbations → the
source of instabilities)

## 페이지 6
An example of turbulent non-premixed flame stabilization
- Low values of the reactants flow rates
-> Lifted from the lips → Not anchored on the burner lips(finite rate chemistry)
-> Stabilization by the triple flames
- Larger propane mass flow rates
-> Lifted from the injector
-> Stabilization by recirculation zones induced by the backward facing steps
- Larger air mass flow rates
-> Flame blow-out
- Transition zones
-> Instability(Flame structure oscillate between lifted flame and extinction
regime)

## 페이지 7
6.3 Turbulent non-premixed combustion regimes
Turbulent non-premixed combustion
- Reactants have to mix before reaction and chemical reactions are generally
limited by mixing
- Non-premixed flames do not exhibit well-defined characteristic scales(no
propagation speed and local flame thickness depends on flow conditions)
6.3.1 Flame/vortex interactions in DNS
- Initial flame thickness δ
i
  



  
  ∇  
 

where z : mixture fraction
 
 



 
for
 
 
 
        
          
- Scalar dissipation rate χ at the stoichiometric point z=z at time t=0
st st
   


 
 
D : stoichiometric value of the molecular diffusion coefficient
st
- Chemical time scale τ (asymptotic theories)
c

 
   
 
Dfl : flame Damkohler number
a
- Flame velocity u
f


 
  


## 페이지 8
-> Flame/vortex interaction regimes may then be identified in a log-log diagram
based on velocity(u'τ/δ) and length(r/δ) scale ratios
c i i
A constant Damkohler number D
a
cf) Ch. 5
-> Line of slope +1 in a (r/δ, u'τ /δ) log-log diagram
i c i
-> Higher Damkohler numbers correspond to lower lines in the diagram
A vortex Reynolds number
-> For a given initial flame thickness δ and a given chemical time τ , constant
i c
vortex Reynolds numbers correspond to lines of slope -1 in such a diagram

## 페이지 9
Laminar diffusion flame/vortex interaction spectral log-log diagram
DSE : Reference Damkohler number corresponding to the extinction of a
a
steady laminar stagnation point flame
DLFA(steady laminar flamelet assumption), D ext(extinction)
a a
: Transition Damkohler numbers

## 페이지 10
-> Sufficiently large Damkohler numbers(D > DLFA) → Case A
a a
- The flame front behaves like a laminar flame element having the same
scalar dissipation rate
- Chemistry is sufficiently fast
- Both maximum temperature and reaction rate are in very good agreement
with laminar flame theory
- DLFA = 2DSE
a a
-> Small length scale ratio → Case B
- A strong curvature of the flame front is observed and molecular and heat
diffusion along tangential direction to the flame front become non
negligible → Large discrepancies are observed
-> Dext < Da < DLFA → Case C
a a
- The Damkohler number decreases or the vortex speed u' increases
- Chemistry is not sufficiently fast
- Unsteady effects become important
- Lags results from asymptotic theories

## 페이지 11
-> Strain rate induced by the vortex on the flame front becomes too strong
(D < Dext) → Case D
a a
- Quenching occurs and strong unsteady effects are observed
- Dext = 0.4DSE
a a
-> The laminar flamelet assumption is probably valid over a larger domain than
expected from asymptotic theories because of unsteady effects
-> Spectral diagram cannot be easily used to determine turbulent non-premixed
combustion regimes because diffusion flames have no well-defined length,
time and velocity scales
6.3.2 Scales in turbulent non-premixed combustion
- Length scales
-> Diffusion layer thickness, l
d
- The thickness of the zone where the mixture fraction changes, indicating
reactants mixing(0 < z < 1)
-> Reaction zone thickness, l
r
- The region where the reaction rate is non zero
- The layer lies around the stoichiometric z=z iso-surface
st
For laminar diffusion flames
 
  ≈
     
  
Dfl : Local flame Damkohler number
a
τ : Local flow time
f
τ : Local chemical time
c
χ : mixture fraction scalar dissipation rate for the stoichiometric value
st
z=z
st

## 페이지 12
≈ 
  
llam : Local laminar diffusive layer thickness
d
D : Value of the molecular diffusivity on the stoichiometric surface
st
For turbulent non-premixed flames

 ≈  
  
      ∇ 
 

l : Mean diffusive layer thickness
d
 : Mean scalar dissipation rate of the mixture fraction conditioned on the

stoichiometric surface z = z
st
- Need additional assumptions( is unknown)

Flame structure is controlled by the strain rate due to turbulent motions
→ Local diffusion layer may be viewed as a steady constant density
strained diffusion layer
→  measures the mean local diffusive thickness l whereas  is mainly
 d
governed by pure oxidizer(z = 0) and pure fuel(z = 1) regions leading
to  → 0(F(z = 0) = F(z = 1), F(,  ″) → 0)
- Time scale(for turbulent non-premixed flames)
 ≈   
 
  ≈    
    
-> For a single chemical reaction between fuel(F) and oxidizer(O)
 →
 
By asymptotic theories proposed by Linan,
  ≈
  
  
 
→ Reaction zone is thin at high Damkohler number

## 페이지 13
6.3.3 Combustion regimes
- Non-premixed flames have no intrinsic length scales and strongly depend on
flow conditions → Need additional assumptions
- The shortest turbulent time is retained in the following analysis
Assumption : Homogeneous and isotropic turbulence
Controlled by Kolmogorov motions
→ Maximum strain rates and shortest turbulent times due to
Kolmogorov scales(viscous dissipation)
※ Negative strains(flame compression) have been neglected
 ≈ and   ≈
    
→ Unity Reynolds number for Kolmogorov structures
   
   
  
  
    
    
Fast chemistry(low τ and large D )
c a
- Very thin flame(l《 l ≈ η) → Laminar flame element(flamelet)
r d k
Finite chemistry(large τ and low D)
c a
- l ≈ η → Departures from laminar flame structures, unsteady effects,
r k
and extinctions
- Difficult to summarize on a single combustion diagram for turbulent
non-premixed combustion
-> Simple and rough description based on two characteristic rations
τ/τ = D (not local flame Damkohler number Dfl = 1/τχ)
t c a a c st
l/l → l ≈ η, l/l ≈ Re3/4(Re : turbulence Reynolds number)
t d d k t d t t
   



 
 
 


 ≈
 

  
≈  




     
→ Lines of slope 1/2 in a log-log (Re,D) for constant Dfl
t a a
