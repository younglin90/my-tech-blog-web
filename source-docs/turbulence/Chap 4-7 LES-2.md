# Chap 4-7 LES-2

> 원본: `turbulence/Chap 4-7 LES-2.pdf` (0.2MB, 6 페이지 추출)

## 페이지 1
Simple filtered reaction rate closures
Arrhenius law based on filtered quantities
To assume perfect mixing at the subgrid scale level, neglecting subgrid scale fluctuations. The filtered reaction
rate is then:
            exp    ≪ 
      
It may be used with reasonable accuracy for reacting flows in the atmospheric boundary layer but not in
most combustion applications.
A more refined approach
where the subgrid scale segregation factor             when the fuel and oxidizer
      
are perfectly mixed at the subgrid level and   for an infinitely fast reaction.

Scale similarity assumptions
 
For a constant density flow without heat release, the filtered reaction rate  is proportional to  . The
  
unresolved reaction rate is expressed as:
The similarity constant  is found to strongly depend on the mesh size and on the Damköhler number.

Dynamic modeling in turbulent combustion
Simple models for the filtered fuel reaction rate may be expressed as:
where      is the resolved reaction rate depending only on known quantities   such as filtered


temperature and species mass fractions and on the filter size .  is a model parameter.
Germano-like identity becomes:
↓ ′  ⋯ ≫


## 페이지 2
where  vanishes leading to an ill-posed problem. This difficulty may be overcome by looking for an
exponential dependance for

 .

Germano-like identity becomes:
The dynamic determination of the  parameter is then given by:
Limit of large eddy simulations
▪ The integral length scale has to be contained in the computational domain,  .

▪    . Assuming that   with  and  
      
▪
▪ The upper limit moves upward. and the right limit does not hold any more.

## 페이지 3
Comparing large eddy simulation and experimental data
Introduction
▪ Validation of large eddy simulations against experimental data is not straightforward
▪ The instantaneous quantities cannot be directly compared to experimental flow fields.
▪ The following discussion compares statistical quantities such as means and variances in experiments and
large eddy simulations
Constant density flows
The time-averaged spatially filtered quantity 〈 〉 of any variable f is given by:
Then
The variance of the quantity f may be expressed as:
↓ 〈 〉≈〈〉 and 〈〉≈ 〈 〉
▪ When  is a velocity component,

▪ When f is a scalar such as temperature, mixture or mass fraction,
Variable density flows
For variable density flows,
↓ 〈 〉≈〈〉 and 〈〉≈〈〉
where   and  denote Favre spatial filter and averaging operators respectively.

The time average value of  is:

## 페이지 4
The variance of the quantity f may be expressed as:
↓
▪ When  is a velocity component

▪ When f denotes a scalar field such as temperature, mixture fraction or species mass fractions, the subgrid
variance     is generally not explicitly modeled in simulations.
Chemistry for turbulent combustion
Introduction
Complex chemical schemes in turbulent combustion is still impossible for three main reasons:
▪ One additional balance equation is required for each species.
▪ Chemical reaction rates and transport coefficients are complex functions of species mass fractions and
temperature. Increasing the number of chemical reactions dramatically increases the computational time.
▪ A major theoretical difficulty lies in the coupling between turbulence and combustion.
Global schemes
Assumptions
▪ Quasi-steady state approximation: some intermediate species or radicals are assumed to have reached an
equilibrium state.
▪ Partial equilibrium: some elementary reaction of the chemical scheme are assumed to have reached
equilibrium.
For example starting from an detailed mechanism proposes a four-step global chemical scheme for methane,
including seven species:
Four reaction rates are determined.

## 페이지 5
The reaction rates are written in terms of the species molar concentrations  .
  
   and  are respectively the constant rates of the elementary reactions:
   
 is the equilibrium constant of the elementary reaction:

and  and are the equilibrium constants of the global reaction (II) and (IV).
 
For hydrocarbons up to butane (n=4) leading to the four-step global chemical scheme:
Corresponding rates are given in Table
This derivation of global chemical schemes is attractive but leads to various difficulties.
▪ The identification of limiting steps, quasi-steady state species and equilibrated reactions in a complex
chemical scheme is a difficult task requiring an expert knowledge of chemistry.

## 페이지 6
▪ The reduction of the computational work is lower than expected:
Automatic reduction - Tabulated chemistries
Intrinsic Low Dimensional Manifold (ILDM)
▪ Between point M and the equilibrium composition (point E), the mass fraction  may be expressed as a

function of species A mass fraction 

Flame prolongation of ILDM - Flamelet generated manifold
▪ Low temperature regions are not well described by ILDM.
▪ This draw back may lead to difficulties, for example, to describe ignition, transient and diffusion phenomena
▪ The basic idea is to generate look-up tables from simulations of one-dimensional laminar premixed flames
using complex chemical schemes.
▪ Reaction rate and species mass fractions are then tabulated as functions of limited set of coordinates.
