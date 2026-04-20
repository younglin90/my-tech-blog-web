# Chap 5-3 RANS of turbulent premixed flames-2

> 원본: `turbulence/Chap 5-3 RANS of turbulent premixed flames-2.pdf` (0.6MB, 12 페이지 추출)

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

  
  ″  ″


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
where          
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
- Different from Arrhenius approach it is considered that turbulent motions control the reaction rate. In other words,
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
       → U L represents laminar flame speed which holds chemical information (Mantel & Borghi)
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

## 페이지 5
4. The Bray Moss Libby (BML) model
- First proposed in 1977 by authors (Bray, Moss and Libby)
- Combined statistical approach using probability density functions(pdf) and physical analysis
- Evidenced some special features of turbulent premixed combustion and counter-gradient turbulent transport and flame
turbulent generation.
where and respectively denotes the probability to have fresh gas, burnt gas, reacting mixture at location x.
 
→and 
 
Since the model is developed assuming large Re and Da and flame is thin, the probability function to be in the reactive
mixture is low. Thus,
As the probability  to by in burning gases has been neglected, the mean reaction rate can't be estimated from this
equation.

Three main approach to close the mean reaction rate 

1. Scalar dissipation rate
2. Flame crossing frequency
3. In terms of flame surface densities.
1) Scalar dissipation rate formulation
Instantaneous balance equation for 
Bray and Moss derived a balance equation for 
Under the BML assumptions that  holds only zero or unity. Then  . Thus above equation reduces to

## 페이지 6
Averaging above equation
where
 
 is related to the scalar dissipation rate  , describing turbulent mixing and to  (characteristic chemical reaction)
  
A balance equation for the dissipation rate should be derived and solved. Simpler solution postulating linear relaxation of
the fluctuations;

where turbulent time scale is introduced. And additionally a balanced equation for ″(progress variable variance) maybe
derived and closed.
where   ″       
where turbulent time scale has been estimated from the turbulent kinetic energy k and its dissipation rate ε as  .

Compare to EBU model proposed by Spalding,               which doesn't have chemical information is
recovered by above equation through  .

2) Flame crossing frequencies
Proposed by Bray and Libby recognizing that the mean reaction rate at a given location depends more on the passage (or
crossing) frequency of the flame front at this point than on the local mean temperature or species mass fraction.
Points A(cold side of the flame brush) and B(on the hot side) exhibit very few passages of flame fronts whereas, point C
many flame front crossings are observed.
Mean reaction rate, A < B << C ??
 
  
  

## 페이지 7

where  is flame front crossing frequency and  is the reaction rate per flame crossing.
 
The flame crossing frequency is then estimated from a statistical analysis of the telegraphic equation;

where,  is a mean period of the telegraphic signal, related to turbulent motions.
- The factor 2 comes for the fact that two crossing flame are found from a signal period.(One from fresh to burnt gases
the other from burnt to the unburnt gases)

- The crossing frequency is expressed in terms of Reynolds averaged reduced temperature  which can be replaced by the
Favre-averaged temperatures.
- The crossing frequency is easy to measure in experiments and requires to record the temperature signal as a function of
time at a given location, for example using thermocouples, Mie or Rayleigh scattering

Generally above equation is closed by estimating  from a turbulent characteristic time and reaction rate per crossing
flame is modeled as
The flame transit time  measures the time require to cross a flame front and

corresponds to the time for transition between the  and 
Finally the mean reaction rate is given by
        
  
    
 
where,    and  .
   
Estimating this reaction rate per crossing flame is difficult in practise so that expression has been later recast in terms of
flame surface densities.
3) Flame surface density models
This model is to describe the mean reaction rate in term of flame surface area, as the product of the flame surface density
(i.e., the available flame surface area per unit volume) by local consumption rate per unit of flame area,  
 
where, 〈〉 is the average flame consumption speed along the surface. The flame surface density  measures
 
the flame front convolutions.
Main advantage;
Separates complex chemistry features, incorporated into the average flame speed, from turbulent/combustion interactions
modeled by the flame surface density.

## 페이지 8
Assume;
Turbulent flame → ensemble of laminar flame elements → S → computed using laminar planar stagnation point flame.
c
Flamelet library is used.   (laminar consumption rate per unit flame surface) is tabulated for;

1. stretch values
2. Fresh gases equivalence ratio
3. Temperature etc.
The mean flamelet consumption speed is given (by Vervisch and Veynante)
where p(k) is the probability to have the stretch rate on the flame surface. Bray introduces a “"stretch factor”" I to link
0
the mean flamelet consumption speed 〈〉 to the unstretched laminar flame speed  and to take into account possible
  
flame quenching:
And  is defined as;

In practical implementations, p(k) is assumed to be a Dirac function   then,

## 페이지 9
Modeling of 〈〉 has been studied, but still  is known function
 
1. Using 'Algebraic expression'
2. Deriving 'Balance equation'
1. Algebraic expressions for the flame surface density
Define flame surface density 

where  measures the number of flamelet crossings per unit length along the constant  direction. and  is the mean
 
cosine angle of the instantaneous flame front with the   iso-surface and is universal model constant  ≈

where L is the wrinkling length scale of the flame front
y
Modeling 〈〉  and assuming n=1 then,
  
⇒
 ′ corresponds to a characteristic time of integral length scale and may by modeled as  
 
Flame surface density may also be derived from fractal theories
where L and L are respectively the inner and outer cut-off length scales. D is the fractal dimensions of the flame
inner outer
surface. The cut-off scales are estimated as the turbulent Kolmogorov length scale  and the integral length scale 
 
2. Balance equation for the flame surface density
Various forms of conservation equations for the flame surface density may be found in the literature.
According to Pope
is the conditional average of for and  is the probability to find  at the given

## 페이지 10
location.
An exact balance equation for the flame surface density for the reduced temperature
LHS
1. unsteady effects,
2. the flame surface convection by the flow field
3. the normal propagation of the flame
RHS
1. the action of the tangential strain rate on the flame surface
2. combined propagation/curvature effect.
The sum of these two effects corresponds to the stretch rate 〈〉 acting on the flame surface

Comments on the balance equation
- Many effects are implicitly incorporated in the flame front propagation speed, which may differ from the laminar flame
speed.
- Derivation assumes that a single iso- surface corresponds to the flame front. True for infinitely thin flame.
- The flame density balance equation is unclosed and requires modeling for turbulent flux of flame surface, the
propagation speed, strain rate and curvature effect. Using Favre decomposition on convection and strain rate terms,
Finally the equation becomes
The closed  equation is generally written as
where, D is a consumption term (destruction term) and it is necessary  and are generally positive and without a
 
destruction term, the flame surface density balance equation would predict an infinite growth of flame area.
Various closures found in the literature and summarized here,

## 페이지 11
A simple phenomenological closure (By Marble and Broadwell)
1. The flame stretch generated by the turbulent flow may be estimated as  (dissipation/kinetic energy)
2. ∝  
〈〉 is the consumption speed computed using complex chemistry and the only chemical parameter appearing in balance
 
equations. It can be computed using 1-D laminar flame codes. Above equation is closed and assuming equilibrium between
source and sink terms,

## 페이지 12
A related approach; the level set formalism
Peters proposed a formalism based on a level-set approach, or a G-equation, for local, instantaneous flame element
Similar to  equation and flame front it identified as the surface . Details are out of the scope of this book.

