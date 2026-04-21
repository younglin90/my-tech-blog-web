# Chap 5-3 RANS of turbulent premixed flames-1 (1)

> 원본: `turbulence/Chap 5-3 RANS of turbulent premixed flames-1 (1).pdf` (0.2MB, 4 페이지 추출)

## 페이지 1
Ch. 5 RANS of turbulent premixed flames
Mass, species, momentum and enthalpy equations
 
 

 



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
              

                                      ″  ″
  
                                  ″  ″     for 
 
                                             ″  ″                          
     
where,
                                     ″     
  
Assumptions;
1. Constant pressure in turbulent combustion (pressure 항이 들어있는 momentum 방정식)
2. Unit lewis number
3. Adiabatic condition
4. Single step chemistry with Arrhenius reaction model (for simple species equation)
Similar concept applied on laminar premixed combustion
                          : Species conservation equation
     
                  : Energy conservation equation

   
   
Where,          
   

## 페이지 2
Powerful tool for premixed combustion under the assumption;
 
Based on upon relation between species and energy equation in virtue of unit lewis number assumption governing
equations above can be reduced;


   
    

     
            ″″
            
  
                     ″″   
          
  
Unclosed term exists;
1. the turbulent stress tensor  ″ ″
 

2. the mean reaction rate 

3. the turbulent scalar transport term  ″″

Solutions to solving unclosed terms above;
1. Express unclosed terms as functions of solve quantities   → Modeling!!

- Reaction rate    , the turbulent scalar transport term  ″″ using gradient assumption
 
2. Solutions of additional conservation equation
- ex)K-ε or k-w equation in modeling turbulent viscosity 


Modeling reaction rate 

1. The 'no model' or Arrhenius approach
Remind the assumption of single step chemistry.
  
             exp  
  
  
  
This model is relevant only when chemical time scales are larger than turbulent time scales, i.e., Da << 1.
It is also called as kinetically control combustion where chemical reaction is dominant. In other words,
Reaction rate (information of chemical kinetics) << Diffusion of species (information of turbulence)
2. The eddy break up (EBU) model
- Proposed by Spalding (Imperial college and still alive, 1971)
- It is based on phenomenological analysis of turbulent combustion assuming high Re and Da
- Different from Arrhenius approach it is considered that turbulent motions control the reaction rate In other words,
Reaction rate (information of chemical kinetics) >> Diffusion of species (information of turbulence)

 
″
  
   


## 페이지 3
- The mean reaction rate is controlled by characteristic turbulent time and temperature fluctuations
- The turbulent time is estimated from the turbulence kinetic energy k and its dissipation rate ε
 ′ 
     (Eddy turn-over time) where,   

- Requires estimation for the temperature fluctuations ″
Reynolds decomposition of 
 ′    
  ″               ∵ 
∴          
   
- EBU model is generally used with k-ε turbulence model
- Doesn't include any effects of chemical kinetics.
- Non zero reaction rate at all points where Arrhenius model predicts a mean reaction rate located around  .
- For adjustments, chemical information is incorporated on the model constant  .

 ′
 
       →U L represents laminar flame speed which holds chemical information (Mantel & Borghi)
 
- Tends to overestimate the reaction rate, esp. in highly strained regions, where the ratio ε/k is large (flames-holder wakes,
walls and so on)
- Estimation of the characteristic turbulent time is quite arbitrary.
ex) Spalding developed EBU model to simulate turbulent premixed flame behind a flame holder. Characteristic time was
simply estimated from the transverse gradient of the mean axial velocity, corresponding to the strain rate induced by
large scale coherent motions.   sec

## 페이지 4
3. Models based on turbulent flame speed correlations
  ′ 




 
 
where,  are model constants close to unity.
The flame front propagation is described in terms of a 'G-equation'
 

  ∇
    
- G represents flame surface and quite similar to Z variable in diffusion flame.
- Using G equation, reaction rate doesn't have to be considered.
- Above equation leads to various numerical difficulties
- Induces flame cusps and can be avoided by adding diffusion term. But it modifies the propagation speed of the flame
front
- The coupling between the G-equation with mass-fraction or energy balance is not obvious.
: Requires the turbulent displacement speed of the flame front whereas conservation equations need the consumption
speed of the flame brush
