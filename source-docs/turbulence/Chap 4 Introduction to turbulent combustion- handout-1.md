# Chap 4 Introduction to turbulent combustion- handout-1

> 원본: `turbulence/Chap 4 Introduction to turbulent combustion- handout-1.pdf` (0.2MB, 8 페이지 추출)

## 페이지 1
Chapter 4 Introduction to turbulent combustion
4.1 Interaction between flames and turbulence
 Turbulent combustion:
- encountered in most practical combustion systems.
⇒ an important issue to develop and improve practical systems
(i.e. to increase efficiency and reduce fuel consumption and
pollutant formation).
- difficult to handle using analytical techniques
⇒ numerical combustion for turbulent flames is a fast growing
area but complex.
- the most complex phenomenon in non-reacting fluid mechanics.
Various time and length scales are involved and the structure
and the description of turbulence remain open questions
 the two-way interaction of chemistry and turbulence. Turbulence
is modified by combustion because of the strong flow accelerations
through the flame front induced by heat release, and because of
the large changes in kinematic viscosity associated with
temperature changes. This mechanism may generate turbulence,
called “"flame-generated turbulence”"or damp it (relaminarization
due to combustion). On the other hand, turbulence alters the flame
structure, which may enhance the chemical reaction but also, in
extreme cases, completely inhibit it, leading to flame quenching

## 페이지 2
4.2 Elementary descriptions of turbulence
 Turbulence: fluctuations of all local properties
⇒ depends on velocity, system geometry.

 ′
 The turbulence strength: the turbulence intensity


′    or

′  

-   : the mean free stream velocity in boundary layer problem.

- I : 0 to tens of percent in typical wall-bounded flows
 Turbulence intensity is not a sufficient parameter to describe
turbulent combustion.
 An important issue: how the turbulence energy is distributed over
the different length scales present in the flow field and which
length scales carry enough energy to interact with the flame front.
Turbulent fluctuations: different scales ranging from the largest,
the integral length scale  , to the smallest one, the Kolmogorov

length scale  .

 The integral scale: close to the characteristic size of the flow. For
example, the duct size in a ducted flow
 A Reynolds number Re(r) : the ratio of inertia to viscous forces
- introducing each turbulent scale as:
′



where ′: the characteristic velocity
r: the motion size and : the flow kinematic viscosity.
- Integral Reynolds number:
′

  
   
. usually high (100 to 2000 in most combustion devices).
. the largest scales in a turbulent flow are mainly controlled by
inertia and are not affected by viscous dissipation.

## 페이지 3
 For homogeneous isotropic turbulence,
- The energy cascade, the energy flux from one scale to another
(due to non-linear terms  ) is constant along scales and is
 
given by the dissipation  of the kinetic energy k.
. This dissipation : the ratio of the kinetic energy, ′
divided by the time scale
′ ′
 
 
′ 
. Along the cascade, the Reynolds number  goes down
from  to values close to unity, where inertia and viscous

forces balance. ⇒ the smallest scale found in the turbulent
flow, the Kolmogorov scale  , controlled by viscosity and by

the dissipation rate  of the turbulent kinetic energy  :
 ′ 
  
    
     
. The ratio of the integral length scale, , to the Kolmogorov

length scale,  , comparing the largest and smallest turbulence

eddies;
 ′
  
    

. As with laminar flames (§ 2.6), flame strain is an important
quantity for turbulent combustion.
The strain is directly linked to velocity gradients: to first order,
the strain  induced on a flame front by an eddy of size 
may be assumed to scale with ′ which is the simplest
estimate for the velocity gradients created by this eddy.
′

′


## 페이지 4

  
     ≈
     ′  
 

′
     
     


## 페이지 5
4.3 Influence of turbulence on combustion
 The main effect of turbulence on combustion is to increase the
combustion rate
4.3.1 One-dimensional turbulent premixed flame
 Consider a statistically one-dimensional premixed flame propagating
in a turbulent flow field.
 the “mean” flame brush: a planar flame, moving relatively to the
flow field with a turbulent displacement speed  .

 The combustion rate is maximum (the combustion time is
minimum) when the reactants are mixed in stoichiometric
proportions and increases when the flow becomes turbulent. At
that time, Laffitte noted that “the turbulent flame speed was
always larger than two times the laminar flame speed.”
 The factor of two observed by Wheeler is not generic of all
turbulent flames and more precise measurements lead to empirical
relations such as Abdel-Gayed et al.and Gulder.
 ′

≈
 
 
 
where ′ is the root mean square of the velocity fluctuations (or
the square root of the turbulent kinetic energy k). This
approximate expression shows that premixed combustion is
enhanced by turbulent motions. For large values of the velocity

## 페이지 6
fluctuations, the turbulent flame speed  becomes roughly

independent of the laminar flame speed  . Experiments also show

that the mean turbulent flame brush thickness  is always larger

than the laminar flame thickness  .


## 페이지 7
4.3.2 Turbulent jet diffusion flame
 The flame length 

- first linearly increase with the fuel flow rate or the Reynolds
number Re.
- For a sufficiently high Reynolds number, the flow becomes
turbulent and the flame length  decreases before reaching a

constant value independent on the Reynolds number Re.
- The transition point between laminar and turbulent region of the
flame moves closer to the injector lip. For sufficiently high
injection velocities, the flame is lifted from the burner(“lifted
flame”) and then may be extinguished by “blow-off.”
 Since the flame length  remains constant when the Reynolds

number increases, the reaction rate per unit volume must be
enhanced by turbulence: combustion becomes more efficient when
turbulence increases, at least up to the occurrence of lift-off and
blow-off phenomena.

## 페이지 8
4.4 Computational approaches for turbulent combustion
HW 1)
Explain and compare the CFD schemes of RANS, LES, and DNS
1) strategy
2) advantage and disadvantage
3) governing equations
