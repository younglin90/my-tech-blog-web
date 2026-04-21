# Ch. 9 Boundary conditions

> 원본: `turbulence/Ch. 9 Boundary conditions.pdf` (1.6MB, 20 페이지 추출)

## 페이지 1
1 | CHAPTER 9. BOUNDARY CONDITIONS
9. Boundary conditions
9.1 Introduction
Adequate boundary conditions for reacting flows is a critical issue in many codes, especially for
recent methods solving the unsteady Navier-Stokes equations (DNS and LES).
This chapter presents a method which is typical of many recent boundary conditions techniques
developed for the compressible Navier-Stokes equations;
 It reduces to Euler boundary conditions when viscous terms vanish. The method presented is
valid both for Euler and Navier-Stokes equations. It allows a control of the different waves
crossing the boundaries.
 No extrapolation procedure is used.
 The number of boundary conditions specified for the Navier-Stokes equations corresponds to
theoretical results.
9.2 Classification of compressible Navier-Stokes equa
tions formulations
Using FZSE leads to a partial decoupling of flow and combustion: only temperature changes
directly affect the flow field. Mass fractions variations do not modify the density or the velocity
field.

## 페이지 2
CHAPTER 9. BOUNDARY CONDITIONS | 2
9.3 Description of characteristic boundary conditions
An appealing technique for specifying boundary conditions for hyperbolic systems is to use
relations based on the analysis of the different waves crossing the boundary. This method has
been extensively studied for Euler equations and is referred to as Euler Characteristic Boundary
Conditions (ECBC). The principle of the present method is to extend the ECBC analysis to the
Navier-Stokes equations and is called Navier-Stokes Characteristic Boundary Conditions (NSCBC).
9.3.1 Theory
 Physical boundary conditions are independent of the numerical method used to solve the
relevant equation.
 Soft or numerical boundary conditions appear to be needed for the numerical methods while
not being explicitly given by the physics of the problem.
To build Navier-Stokes boundary conditions, the approach used in the NSCBC method is to take
conditions corresponding to Euler conditions (the ECBC conditions) and to supply additional relations
(the “viscous” conditions).
9.3.2 Reacting Navier-Stokes equations near a boundary
The method is derived using the FZSE assumptions
 H1 - All gases have the same constant heat capacity (C C ) and is constant. The variations
pk p
of the mean molecular weight W defined by Eq. (1.5) are neglected.
 H2 - Volume forces are neglected ( f 0) like volume heat sources (Q 0).
k
 H3. No correction velocity is needed because of assumption H1.
(1.5) (1.43)
The fluid dynamics equations derived in Ch. 1 are written (with summation convention)

## 페이지 3
3 | CHAPTER 9. BOUNDARY CONDITIONS
where E is the total energy (without chemical term) defined in Table 1.4:
The molecular fluxes of heat (q ) and of species (M ) in direction i are defined by:
i ki
Consider a boundary located at x L(Fig. 9.1). Terms in the x direction can be recast in terms
1 1
of waves propagating in the x direction to obtain:
1
The different terms of the system of equations (9.7) to (9.12) contain derivatives normal to the x
1
boundary (d tod ), derivatives parallel to thex boundary, and local viscous and reaction terms.
1 5k 1

## 페이지 4
CHAPTER 9. BOUNDARY CONDITIONS | 4
The vector d is given by characteristic analysis:
where the L ’s are the amplitudes of characteristic waves associated with each characteristic
i
velocity :
i
where c is the local speed of sound given by c2 p/.  and  are the velocities of
1 5
sound waves moving in the negative and positive x directions respectively;  is the velocity
1 2
for entropy advection while  and  are the velocities at which u and u are advected in
3 4 2 3
the x direction.  is the velocity at which the species k is advected in the x direction.
1 5k 1
TheL ’s are given by:
i

## 페이지 5
5 | CHAPTER 9. BOUNDARY CONDITIONS
The interpretation of L
i
L given by the linearized NS eqn for 1D inviscid acoustic waves
i
With upstream velocity, u cand wave amplitude, A  pcu, conserved along the characteristic
1 1 1
line xtconst.
1
A A A
1  1 0 or 1 L 0
t 1 x t 1
1
L : the opposite of the time variance of the wave amplitude A
1 1
By analogy, L is called the amplitude variation of the ith characteristic wave crossing the boundary.
i
9.3.3 The Local One Dimensional Inviscid (LODI) relations
At each point on the boundary such a LODI system can be constructed from the system of
equations (9.7) to (9.12), neglecting transverse, viscous, and reaction terms. The relations obtained
by this method are not “physical” conditions and are used only to specify the amplitudes of the
waves crossing the boundary.
The LODI system can be cast in many different forms depending on the choice of variables.
In terms of primitive variables, this LODI system is:
The time derivatives of the temperatureT, the flow rate u , the entropy s, or the stagnation
1
enthalpy H are:
where H E p/u2 /2C T, sC ln  p/ and M is the Mach number: M u /c
1 p v 1
All gradients normal to the boundary may be expressed as functions of the L
i

## 페이지 6
CHAPTER 9. BOUNDARY CONDITIONS | 6
Most physical boundary conditions have a corresponding LODI relation. The LODI relations are
used only to estimate the incoming wave amplitude variations L to introduce in the system of
i
conservation equations (9.7) to (9.12)
9.3.4 The NSCBC strategy for the Euler equations
The NSCBC procedure involves three steps for the Euler equations.
 Step 1. For each ECBC physical boundary condition imposed on this boundary, eliminate the
corresponding conservation equations from the system of equations (9.7) to (9.12).
 Step 2. For each conservation equation eliminated in Step 1, use the corresponding LODI relation
to express the unknown L (corresponding to incoming waves) as a function of the known L
i i
(corresponding to outgoing waves).
 Step 3. Use the remaining conservation equations of system (9.7) to (9.12) combined with the
values of the L obtained from step 2 to compute all variables which are not given by ECBC
i
boundary conditions.

## 페이지 7
7 | CHAPTER 9. BOUNDARY CONDITIONS
9.3.5 The NSCBC strategy for Navier-Stokes equations
In the NSCBC procedure, viscous conditions are applied only during Step 3 by specifying
viscous and diffusion terms in the conservation equations involving normal derivatives.

## 페이지 8
CHAPTER 9. BOUNDARY CONDITIONS | 8
SI-1: the remaining unknown, density, determined though the continuity equation.

## 페이지 9
9 | CHAPTER 9. BOUNDARY CONDITIONS
Y
M D k
k1 x
1

## 페이지 10
CHAPTER 9. BOUNDARY CONDITIONS | 10
9.3.6 Edges and corners
The treatment of corners in two-dimensional situations and of edges and corners in three-
dimensional situations requires extensions of the NSCBC procedure.
For edges, a second direction (for example x direction) has to be treated using characteristic
2
relations.
9.4 Examples of implementation
Notations are displayed in Fig. 9.1: section x 0 corresponds to the inlet and x L to the outlet
1 1
boundaries. Supersonic cases are not discussed here because they are usually simpler than subsonic
cases. For simplicity, only one species is considered:N 1.
9.4.1 A subsonic inflow with fixed velocities and temperature (SI-1)
Five physical boundary conditions (foru , u , u ,TandY) and one numerical boundary condition
1 2 3 1
(for ) are required.
Step 1. The inlet velocities u ,u and u are fixed, therefore equations (9.9), (9.10) and (9.11) are
1 2 3
not needed. The inlet temperature is fixed and the energy equation (9.8) is not needed any more.
The reactant mass fraction Y is imposed and Eq. (9.12) is also eliminated. The only remaining
1
equation is the continuity equation (9.7). L1 can be determined at this step.
Step 2. As the inlet velocity u is fixed, LODI relation (9.22) suggests the following expression for
1
the acoustic wave L entering the domain:
5
As the inlet temperature is fixed, LODI relation (9.26) gives an estimate of the entropy wave
amplitudeL :
2
Step 3. The density is obtained from Eq. (9.7):
where d is given by equation (9.13):
1
9.4.2 A subsonic non-reflecting inflow (SI-4)

i
Zero or low value The inlet behaves as a perfectly non- reflecting section.
Intermediate value The mean values oscillate around the target values but still allow acoustic

## 페이지 11
11 | CHAPTER 9. BOUNDARY CONDITIONS
waves to propagate through the inlet with little amounts of reflection.
Large value The target velocities are strictly maintained but the inlet section is reflecting.
9.4.3 Subsonic non-reflecting outflow (B2 and B3)
If the local pressure p on the outlet is different from p , a reflected wave is produced to

bring p closer to p . With perfectly non-reflecting boundary conditions this information is not

fed back into the computation and the problem might be ill-pose. Corrections may be added to
the treatment of boundary conditions to make them only partially non-reflecting and control the
mean pressure level.
Information on the mean static pressure at infinity p must be added to the boundary conditions

so that the problem remains well-posed. A convenient way to achieve this is to link the amplitude
variation L of the incoming wave to the pressure difference p p as shown below:
1 
Step 1. Only one physical boundary condition is imposed: the pressure at infinity is fixed. This
condition does not fix any of the dependent variables on the boundary and all conservation
equations must be kept in the system of equations (9.7) to (9.12).
Step 2. The amplitude of the incoming wave L is fixed at:
1
The form of the constant K was proposed by Rudy and Strikwerda454
Small  values lead to possible drifts of the mean pressure while large  induce high reflection
levels of the boundary.
Step 3. All the L with i1 may be estimated from interior points. L is given by Eq. (9.42) and
1 1
the system of equations (9.7) to (9.12) is used to advance the solution in time on the boundary.

## 페이지 12
CHAPTER 9. BOUNDARY CONDITIONS | 12
9.4.4 A subsonic reflecting outflow (B4)
Step 1. As the pressure at the outlet is fixed, energy equation (9.8) is not needed any more.
Step 2. LODI relation (9.21) suggests that the amplitude of the reflected wave should be: L L .
1 5
According to Table 9.4, constant tangential stresses and a constant normal heat flux are also
imposed. Constant species diffusion flux is imposed for reactive flow.
Step 3. All the L with i1 may be estimated from interior points. L is given by L L and
1 1 1 5
the system of equations (9.7) to (9.12) is used to obtain u , u , u , and Y on the boundary at
1 2 3 1
the next time step.
9.4.5 An isothermal no-slip wall (NSW)
Step 1. As velocities u , u and u are fixed, Eq. (9.9), (9.10) and (9.11) are not needed. As the
1 2 3
temperature is imposed, the energy equation (9.8) is also discarded.
Step 2. The LODI relation (9.22) suggests that the amplitude of the reflected wave should be
L L . The characteristic amplitudes L , L , L and L are zero because the normal velocity
1 5 2 3 4 6
u is zero (see Eq. (9.13) and Eq. (9.16) to (9.19)).
1
Step 3. Computing the value of L from interior points, L is obtained by L L in the system
5 1 1 5
of equations (9.7) to (9.12). The density  is obtained from integration of Eq. (9.7) and the reactant
mass fraction Y from Eq. (9.12).
1
For a second-order scheme, the simplest estimate of this flux, taking into account the zero value
of M is:
11 x1L
where x is the mesh size near the boundary.
1
9.4.6 An adiabatic slip wall (ASW)
Step 1. The velocity u normal to the wall is zero and equation (9.9) is not needed.
1
Step 2. The LODI relation (9.22) suggests that the amplitude of the reflected wave should be: L L .
1 5
Step 3. L is computed from interior points and L is set to L . The derivatives alongx of the
5 1 5 1
reactant diffusion flux M , of the tangential viscous stresses  ,  and of the normal heat flux
1 12 13
q at the wall are computed using the viscous conditions at the wall: M 0, q 0,  0
1 1 1 12 13
as indicated in the previous section for M . Remaining variables (,u , u , TandY ) are obtained
11 2 3 1

## 페이지 13
13 | CHAPTER 9. BOUNDARY CONDITIONS
by integration of Eq. (9.7) to (9.12) without Eq. (9.9).
9.5 Applications to steady non-reacting flows
The first example of validation corresponds to a non-reacting confined steady laminar shear layer
(Fig. 9.6b). Although all computations presented are time-dependent, steady-state solutions provide
interesting test cases. For these tests, a high-order finite difference algorithm (Lele299) is used (third-
order accurate in time and sixth-order in space).
Temperature T T
in
Axial velocity
Transverse velocity u 0
2
Density and Pressure The NSCBC procedure SI-1 described in Section 9.4.1
 B1: Condition B1 based on partial use of extrapolation (for velocities and density) and
Riemann invariants (for pressure). It is chosen here as a reference technique because multiple
codes use this extrapolation approach. The pressure is obtained from the non-reflecting
condition:
where the term Kp p  is similar to the correction term introduced in the NSCBC

formulation in Section 9.4.3: K  1M2 c/L with 0.58.
 B2: Condition B2 is the NSCBC formulation with 0. It corresponds to perfectly non-
reflecting boundary conditions (§ 9.4.3).
 B3: Formulation B3 is the corrected non-reflecting NSCBC formulation with 0 (§ 9.4.3).
 B4: Condition B4 corresponds to a reflecting outlet maintained at a constant static pressure p

with a NSCBC procedure described in Section 9.4.4.

## 페이지 14
CHAPTER 9. BOUNDARY CONDITIONS | 14
The computation parameters : U /c0.9, U /c0.81, ReU /L/2000 and /L0.025.
2 1 2

## 페이지 15
15 | CHAPTER 9. BOUNDARY CONDITIONS
9.6 Applications to steady reacting flows
The second test case is a reacting steady layer (Fig. 9.11) where one side of the layer consists of
burnt hot gases and the other side of fresh reactants.
The transverse inlet velocities are set to zero. These profiles correspond to a laminar flame
propagating from the upper to the lower wall: combustion begins right after the inlet and the flame
propagate towards the fresh gases with a constant angle.
A single one-step reaction similar to Eq. (2.37) is used to describe chemistry. The computation
parameters are the following: Le1, 0.6, 8, U /c 0.2, ReUl/ 230.
1 1

## 페이지 16
CHAPTER 9. BOUNDARY CONDITIONS | 16
9.7 Unsteady flows and numerical waves control
9.7.1 Physical and numerical waves
The existence of numerical waves in fluid computations is often hidden by the large values of
artificial and turbulent viscosity used in most RANS codes which dissipate wiggles. For LES or DNS,
artificial viscosity is small or zero and turbulent viscosity is reduced to minimum levels (zero in DNS).
Then, numerical waves become an issue and boundary conditions have to be considered much
more precisely because they play a significant role on the evolution of numerical waves.

## 페이지 17
17 | CHAPTER 9. BOUNDARY CONDITIONS
 Physical waves (called “p” waves) have long wavelengths and correspond to valid physical
solutions of the Navier-Stokes equations such as acoustic or entropy waves.
 Numerical waves (called “q” waves) have short wavelengths (smaller than four times the mesh
size) and propagate at high speeds in the flow, usually against the physical velocity direction.
In the case of the simple one-dimensional advection equation at speed V :
Behavior of “q” waves depends on their group velocity u which is a function of the advection
g
speed V and of the spatial differencing algorithm. In general, u /V is negative: “q” waves travel
g
upstream. And the magnitude of u /V increases with the scheme order.
g

## 페이지 18
CHAPTER 9. BOUNDARY CONDITIONS | 18
Numerical “q” waves may be generated in two ways:
 Initial conditions may contain steep gradients and therefore high frequency modes. Starting
a DNS or LES computation with steep gradients leads to the formation of “q” waves which are
not dissipated at later times.
 Numerical waves can also be induced by boundary conditions. Using approximate boundary
conditions can create intense numerical waves when physical waves reach these boundaries.

## 페이지 19
19 | CHAPTER 9. BOUNDARY CONDITIONS
Two reflection coefficients must be used to characterize a given boundary condition treatment (Fig.
9.18): the reflection coefficient of physical waves A /A and the reflection coefficient of numerical
p 1
waves A / A . An adequate boundary condition treatment should minimize the amplitude of the
q 1
numerical reflected waves in any case: A /A 1 . An adequate non-reflecting boundary
q 1
condition treatment should minimize both the amplitude of numerical and physical reflected waves:
A /A 1 and A / A 1.
q 1 p 1
9.7.2 Vortex/boundary interations
This section presents a case which is more typical of unsteady flows: a vortex superimposed on a
supersonic plug flow and propagating through a non-reflecting boundary (Fig. 9.19).

## 페이지 20
CHAPTER 9. BOUNDARY CONDITIONS | 20
Vorticity field Excess axial velocityu u /u
1 0 0
