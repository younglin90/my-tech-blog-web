# Chap 4-2 RANS

> 원본: `turbulence/Chap 4-2 RANS.pdf` (0.3MB, 8 페이지 추출)

## 페이지 1
1. RANS simulation for turbulent combustion
Averaging the balance equations
Mass, species, momentum and enthalpy equations
 
 

 




                            
  
                            for 
 
                                                          
     
Reynolds averages
  ′
Favre averages (mass-weighted averages)

        ″   ″
averaged balance equations
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
 
 
 


 


    ″
            
  
Even though Favre averaging seems to offer a simple and efficient route for reaction flows, it must be used
with some care:
 
▪ There is no simple relation between Faver () and Reynolds () averages. A relation between these two

quantities requires the knowledge, or the modeling, of density fluctuation correlations, ′′ which remain
hidden in Favre average quantities :
      ′′

## 페이지 2

▪ Comparisons between numerical simulations, providing Favre averages, , with experimental data are not
obvious.
Unclosed term in Favre averaged balance equations

Reynolds stresses (″″)
 
Closed by turbulence model. The closure may be done directly or by deriving balance equations for the
Reynolds stresses.
 
Species (″″) and enthalpy (″ ″) turbulent fluxes
   
Closed using a classical gradient assumption

 
  ″″  
     
 
where,  is the turbulent viscosity, and  a turbulent Schmidt number for species k. Nevertheless the
 
gradient assumption is wrong in some turbulent premixed flames
Laminar diffusive fluxes for species or enthalpy
Species laminar diffusion fluxes are generally modeled as:
 
 
    ≈  
     
 

where,  is a "mean" species molecular diffusion coefficient.

Laminar heat diffusion flux:
 
 
 
 
 
 
where,  denotes a mean thermal diffusivity.

Species chemical reaction rate  .

Discussed in Chapter 5 and 6.

Pressure-velocity correlation ″
 
These term is simply neglected in most RANS codes

## 페이지 3
Classical turbulence models for the Reynolds stresses
Turbulent Reynolds stresses   ″″ are generally described using the viscous tensor  .
  
            
 ″″  ″″        
              
  
where,  is a turbulent dynamic viscosity, k is turbulence kinetic energy as:

 

  ″ ″
   

The question is now to evaluate the turbulent viscosity  .

Zero-equation model: Prandtl mixing length model




 

where,  is the mean stress tensor, define as :
        
  
 
      
 
and  is a mixing length to be given. Various empirical relations have been proposed to model  but
 
depend strongly on the flow geometry.
One-equation model: Prandtl-Kolmogorov
A more general formulation incorporates a closure of the balance equation for the turbulent kinetic energy k.
   
  
where,  is a model constant (generally chosen as  ) and  is a characteristic length to be given.
  
Two-equations model: 



  
where, the turbulent kinetic energy k and its dissipation rate  are described by closure of two balance
equations:
The source term  is given by:



   ″″ 
    

The model constants are usually:

## 페이지 4
This model is very popular because of its simplicity and cost effectiveness. Nevertheless, this model has some
well-known drawbacks:
▪ Exact balance equations for k and  may be derived but are very difficult to close without strong
assumptions. For example, two balance equations implicitly assume high Reynolds number, homogeneous
and isotropic turbulence and have to be adapted for low Reynolds number flows.
▪ Algebraic laws for Reynolds stresses and/or for certain source terms are generally required to predict
flow fields in the vicinity of walls.
▪ Velocity fluctuations due to low frequency motions associated to intermittency and flapping are
underestimated.
▪ The  model has also to be modified for compressible flows. These effects are generally taken into
account through the model constant .

▪ To provide a better description of energy exchanges between turbulent scales, multi-scale  models
have been proposed. The basic idea is to split the turbulence spectrum in several zones having their
own turbulent kinetic energy  and dissipation rate 
 
A first attempt to close mean reaction rates
Consider a simple irreversible reaction between fuel and oxidizer
→

The fuel mass reaction rate  is expressed from the Arrhenius law as:

  
           exp    
where A is the pre-exponential constant and  the activation temperature. Assuming a constant pressure p,

this reaction rate is rewritten, using the perfect gas law ().
                exp       
 
The averaged reaction rate  cannot be easily expressed as a function of the mean mass fractions  and
 
  , the mean density  and the mean temperature  . To expand the mean reaction rate    as a Taylor
 
series of the temperature fluctuation ″, using:

## 페이지 5
The mean reaction rate   becomes, using    :

Above equation leads to various difficulties.
First, new quantities such as  ″″,  ″ and  ″″ have to be closed, using algebraic expressions
  
or transport equations. Because of non linearities, large truncation errors are also introduced when only few
terms of the series expansion are taken into account. This equation is complicated but is only valid for a
simple irreversible reaction: it cannot be extended to realistic chemical schemes.
Nevertheless, this approach is used in some practical simulations where chemical times are not negligible
compared to flow times, for example in supersonic reacting flow fields or to describe chemical reactions in
atmospheric boundary layer where the temperature T may be roughly assumed to be constant. In these
 
situations, a segregation factor  ″″ is introduced to write the mean reaction rate as:
    
              exp   
    
The segregation factor  measures the mixing between fuel and oxidizer.

Physical approaches to model turbulent combustion
Most combustion models are derived from one of the three following approaches illustrated in Fig. 1.
Fig. 11 Modeling approaches for turbulent combustion: geometrical
analysis, mixing description or pure statistical approach

## 페이지 6
Geometric analysis
The flame front is identified as a geometrical surface evolving in the turbulent flow field. This formalism is
usually combined with flamelet assumption (each flame element is assumed to behave as a laminar flame).
Turbulent mixing
Under the assumption that chemical time scales are shorter than turbulent time scales, reaction rates are
controled by turbulent mixing rates.
One-point statistics
Mean reaction rates are expressed combining instantaneous reaction rate given from Arrhenius law with the
joint probability density function
A challenge for turbulent combustion modeling: flame flapping and intermittency
Considering a turbulent premixed flame brush.
Fig. 12 Turbulent flame brush
The flame is wrinkled and displaced by the incoming turbulence
=> Simply looking at a turbulent flame reveals flame brushes of a few cm.

## 페이지 7
The mean temperature transverse profiles at a given axial location.
Fig. 13 Comparison of laminar and turbulent profiles for
temperature and reaction rates along a transverse axis
Characteristics of instantaneous and averaged flame are very different:
▪ Mean temperature profiles are much broader than instantaneous temperature profiles.
▪ Mean reaction rate profiles are also broader than instantaneous reaction rate profiles. Since the mean
reaction non zero at every location reached by the flame during its flapping movements
Fig. 14 Reaction rate profiles versus temperature in a turbulent
flame brush.
Mean reaction rate profiles in space are much broader than laminar ones.
=> This finding has strong implications for numerical resolution: while a code solving laminar flame equations
must resolve front of 0.1mm thickness, RANS turbulent combustion solvers have to resolve fronts which are
much thicker and less demanding in terms of grid resolution

## 페이지 8
Fig. 15 Passage of flame structures for infinitely fast
chemistry
Assuming a sufficiently thin flame front.
Temperature measurements at a given location produce a telegraphic signal as a function of time.
Consequences for RANS modeling:

▪ Averaged temperatures  are not representative of instantaneous temperatures
▪ RANS closures have to take into account intermittency phenomena between fresh and burnt gases in
turbulent premixed flames or between fuel and oxidizer streams in non-premixed situations
▪ Knowing that the mean temperature at a given point is low does not mean that very high levels of
temperature cannot be reached for short durations at this point
The main conceptual difference between RANS and LES modeling lies in intermittency phenomena.
