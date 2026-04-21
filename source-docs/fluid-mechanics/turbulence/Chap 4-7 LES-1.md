# Chap 4-7 LES-1

> 원본: `turbulence/Chap 4-7 LES-1.pdf` (0.2MB, 5 페이지 추출)

## 페이지 1
4.7 Large eddy simulations
The objective of large eddy simulations is to explicitly compute the largest structures of the flow field
whereas the effects of the smallest ones are modeled.
1. LES filters
In LES, variables are filtered in spectral space or in physical space. The filtered quantity f is defined as:
where F is the LES filter.
(a) cut-off filter in spectral space, (b) box filter in physical space, (c) gausian filter inn physical space
A cut-off filter in spectral space
where k is the spectral wave number.
A box filter in physical space
where     are the spatial coordinates of the location x.
  
A gaussian filter in physical space
All these filters are normalized
∞∞∞
      
     
∞ ∞ ∞

## 페이지 2
For variable density , a mass-weighted Favre filtering is introduced according to:
    ′′′
▪ Contrary to RANS averaging, the filtered value of a LES perturbation is not zero:  ′≠ . Filtered and
 
double filtered values are not equal in general: ≠. This is also true for Favre filtering
 
▪ The derivation of balance equations for the filtered quantities  or  requires the exchange of filter and
derivative operators.
Filtered balance equations
 
   
    

     
            ″″
            
  
                 ″″    for 
            
 
                         ″ ″               
                     
     
where,


 

 







In this set of equations, the following unclosed quantities must be modeled:
 
▪ Unresolved Reynolds stresses ( )
   
   
▪ Unresolved species fluxes () and enthalpy fluxes (  )
       
▪ Filtered laminar diffusion fluxes for species and enthalpy.
       
          and      
  
▪ Filtered chemical reaction rate   

▪ The pressure velocity term     is usually approximated by   
   

## 페이지 3
Unresolved fluxes modeling
   
To model unresolved transport terms: Reynolds stresses  , scalar fluxes () and
        
 
enthalpy fluxes (  )
   
Smagrinsky model
where  is a subgrid scale viscosity

     
      
↓   

     
    

where  is the turbulence integral length scale,  a model constant, and  the resolved shear stress
 
 depends on the flow configuration. Moreover the Smagorinsky model is known as being too dissipative,

especially near wall
Scale similarity model
This subgrid-model assumes that unresolved stresses are mainly controlled by the largest unresolved structures,
similarly to the lowest resolved ones.
This closure was found to be insufficiently dissipative, and it is generally coupled to the Smagorinsky model
to derive mixed models.

## 페이지 4
Germano dynamic model
The objective of the Germano dynamic model is to estimate small scale dissipation from the knowledge of
the resolved eddies.
  
A test filter, , having a size  larger then the LES filter (size ) is introduced. The unresolved subgrid
momentum fluxes are:
The unresolved fluxes at the test level are:
The two previous relations are combined to give the Germano identity:
from the Smagorinsky model leads to:
where C is the parameter to determine. Then, the Germano identity is rewritten as
Structure function models
These models are based on a theoretical analysis of turbulence in spectral space and on the subgrid scale
viscosity concept. The subgrid scale dynamic viscosity is determined as:
where   is the Kolmogorov constant and  the structure function defined as:
 
A filtered structure function model was proposed. The subgrid viscosity is then written:

where  is the filtered structure function.

Unresolved scalar transport

## 페이지 5
As in RANS, LES unresolved scalar fluxes are often descrived using a gradient assumption:
where  is a subgrid scale Schmidt number.

