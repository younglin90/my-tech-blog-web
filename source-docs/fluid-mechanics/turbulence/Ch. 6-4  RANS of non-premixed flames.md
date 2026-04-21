# Ch. 6-4  RANS of non-premixed flames

> 원본: `turbulence/Ch. 6-4  RANS of non-premixed flames.pdf` (0.5MB, 13 페이지 추출)

## 페이지 1
6.4 RANS of turbulent non-premixed flames
6.4.1 Assumptions and averaged equations
- · H1 - The thermodynamic pressure is constant and Mach numbers are small
· H2 - Species heat capacities are equal and constant(c = c )
pk p
· H3 - Molecular diffusion follows Fick's law and molecular diffusivities D are
k
equal for all species(D = D)
k
· H4 - Lewis numbers are equal to unity(Le = λ/ρc D = 1)
p
· H5 - Fuel and oxidizer streams are separately introduced into the combustion
chamber with reference state (T 0, Y 0) for fuel and (T 0, Y 0) for
F F O O
oxidizer
- For a single one-step chemistry in adiabatic flows
Only balance equations for   and  are needed →   and   are determined
 
- The simplified equation set
- Unclosed terms
 
. Turbulent fluxes : ″″, ″″ and ″″
    

. Reaction terms :


  
. Reynolds stresses(″″) and turbulent scalar transport(″″ and ″″)
    
are closed using classical turbulence models(Ch. 4.5.3 - 0, 1 or 2 equations
model) and gradient assumption(Ch. 4.5.2)

.

is the key difficulty


## 페이지 2
- Turbulent diffusion flame computations

→ · Mixing problem providing   and some of its higher moments(″ )

· Flame structure problem where , , and  are expressed as functions
 
of z → Formulated as conditional average( ,  ) because  or 
 
may depend on multiple parameters in a turbulent flow
→ If p(z) is known,  ,  , and    are given by
 
→ Primitive variable method(Ch. 6.4.2 and 5)
- Assumptions are made on the flame structure to provide conditional
quantities
 
and
 
from flamelet libraries or balance

equations(CMC modeling → Ch. 6.4.5)
→ Eq. 6.22 are no longer required(less time-consuming than the reaction

rate approach) and

are not modeled

· Reaction rate approach(Ch. 6.4.4 and 6)

- Eq. 6.22 are solved →

have to be modeled(Modeling is based on Eq.

6.25 and use flamelet libraries for
 


, This method is able to take

into account various additional effects such as compressibility, heat losses
or secondary reactants injections when
 


can be modeled)


## 페이지 3
6.4.2 Models for primitive variables with infinitely fast chemistry
- For Eq. 6.24
in terms of mass-weighted probability density ftn,

→ Determination of   and   reduces to the determination of  → Presume

the shape of the PDF using simple analytical functions
- β function(Ch. 5.3.7)

The pdf parameters a and b are determined from

and its variance
″

## 페이지 4
→ 0 < (z, θ) < 1 - Intermediate maximum
z, θ = 0 or 1 - · Singularity problem
→ · Reynolds stresses and turbulent fluxes:   determined with k-ε
 
turbulence model

·
″
is derived and closed(next section)

## 페이지 5
6.4.3 Mixture fraction variance and scalar dissipation rate
- For turbulent premixed flames
Conservative form
Non conservative form
(Eq. 5.101)×θ +(Eq. 5.102)×θ
Similarly, a balance equation is derived for
 
(Averaged Eq. 5.103) - (Eq. 5.104) →  ″      
→ Molecular diffusion terms are generally neglected, assuming large Re
→ Turbulent transport and production term → gradient assumptions(S and S :
ct1 ct2
Turbulent Schmidt number)
→ Scalar dissipation rate of the θ fluctuations → τ
t
→ Reaction term → PDF

## 페이지 6
- For turbulent non-premixed flames
HW: Derive the eq. (6.33)
No reaction term → z is a passive scalar
→ In the homogeneous flows(no

gradients)
→ Total scalar dissipation rate

For constant density
Neglecting mean gradients against fluctuations gradients

## 페이지 7
→ Closure schemes

- Decay of the mixture fraction fluctuations

(= dissipation rate of the kinetic energy, ε)
→ (scalar dissipation time) ∝ (turbulence dissipation time)
6.4.4 Models for mean reaction rate with infinitely fast chemistry
- Eddy Dissipation Concept(EDC)
→ Devised by Magnussen and Mjertager (1976)
→    depends on   ,   ,   , and  ≈ 
    
→ C , β, and τ → need to be adjusted on a case by case
mag t
※ Eddy Break Up(EBU) model ← Turbulent premixed flames
→ C - Chemical information is incorporated
EBU
- Flame structure analysis
→ Submodel should be provided for    →    ≈ 
 

## 페이지 8
6.4.5 Models for primitive variables with finite rate chemistry
- Finite rate chemistry modeling based on flamelet approaches
→ T(z, χ ) and Y (z, χ ) are stored in flamelet libraries
st k st
For statistical independence
in terms of mass-weighted probability density ftn,
   
 
. mixture fraction pdf : presumed using -function based on

 and″
→  : log normal distributions by Effelsberg and Peters (1998)

where μ is linked to


and σ is the variance of ln(χ)

## 페이지 9
Compared to infinitely fast chemistry, finite rate chemistry effects are
measured through scalar dissipation rates at the stoichiometric conditions.
These scalar dissipation rates have to be correlated to available resolved
quantities (usually mixture fraction distribution and turbulent time scale) as
described in Section 6.4.3

## 페이지 10
- Conditional Momentum Closure(CMC)
→ Klimenko and Bilger(1999) proposed more refined description of turbulent
combustion
→ To derive, close and solve exact balance equations for conditional species
mass fractions
 

→ · An additional equation is needed for each z* level
· Since the equations contain 2nd order derivatives, required a large number
of conditioning values z* for sufficient precision

· p(z*) presumed from  and ″
→ very high computational cost.

## 페이지 11
6.4.6 Models for mean reaction rate with finite rate chemistry
- Presumed PDF flamelet models

→     are stored in flamelet libraries
 

## 페이지 12
- Flame surface density flamelet models
→ Reaction rate integrated along the normal direction of a strained laminar
diffusion flame is stored in flamelet libraries

: Flame surface density(convolution of flame front, high flame surface
density → high turbulent reaction rate)

   : Local reaction rate per unit of flame area
 
→ For a thin flame front

→ The derivation of is a main issue(Proposed by Marble and Broadwell)
κ : mean strain rate acting on the flame surface
α, β : model constant
V , V : fuel and oxidizer consumption speed
F O
: consumption term(or flamelet mutual annihilation term)
→ Proportional to the reaction rate
 
( ,  )
 
→ Inversely proportional to the reaction rate
   
( ,  )
 
※ Flame surface density models ← Turbulent premixed flames
ρ - Fresh gases density
0
<s > - Average flame consumption speed along the surface
c s

→ Need to model → Algebraic expression and balance equation

Since only integrated reaction rates Ω   are required, the corresponding
 
libraries are smaller. However, conservation equations for all species must
be solved, limiting this approach to few species.

## 페이지 14
- Full statistical point models
→ Assumptions on the flame structure are no longer required
→ Be able to handle complex chemical schemes but the estimate of
is the challenge
→ Presumed PDF models(Shape is assumed and determined), Transported
PDF models(Balance equation is derived for the joint PDF)
→ Unfortunately practical simulations show that it is very difficult to presume
the shape of a joint pdf depending on more than two variables.
