# ANIN_C12

> 원본: `turbulence/ANIN_C12.pdf` (3.8MB, 74 페이지 추출)

## 페이지 1
ANIN_C12.qxd 29/12/2006 04:44PM Page 343
Chapter twelve CFD modelling of combustion
12.1 Introduction
Combustion is one of the most important processes in engineering, which
involves turbulent fluid flow, heat transfer, chemical reaction, radiative heat
transfer and other complicated physical and chemical processes. Typical
engineering applications include internal combustion engines, power station
combustors, aeroengines, gas turbine combustors, boilers, furnaces, and
much other combustion equipment. It is important to be able to predict the
flow, temperatures, resulting species concentrations and emissions from
various combustion systems for the design and improvement of combustion
equipment, particularly with the current concerns about CO and other
2
emission levels and their effects on the environment. CFD lends itself very
well to the modelling of combustion. Combustion processes are governed
by basic transport equations for fluid flow and heat transfer with additional
models for combustion chemistry, radiative heat transfer and other important
sub-processes. In this chapter we attempt to outline some of the popular
CFD modelling techniques used for combustion modelling. Combustion is a
complex subject, and combustion modelling therefore requires a considerable
amount of knowledge and experience. The material presented in this chapter
is very much introductory, allowing a novice combustion modeller to gain
knowledge of some basic CFD-based techniques with a view to understand-
ing more advanced and detailed techniques in the specialist literature.
There are many types of combustion processes. Gaseous fuel combustion,
liquid fuel combustion, spray combustion, solid fuel combustion, pulverised
fuel combustion are a few of the many other processes used in a wide variety
of application areas. To illustrate the application of CFD we concentrate on
gaseous combustion. For other processes the reader should consult the
relevant literature to find out how CFD has been successfully applied in areas
like spray combustion (Beck and Watkins, 2004), pulverised coal combustion
(Lockwood et al., 1980, 1986), diesel and spark ignition engines (Blunsdon
et al., 1992, 1993; Henson and Malalasekera, 2000) as a modelling tool.
Gaseous combustion involves a chemical reaction between a fuel and an
oxidant that are both in the gas phase. There are two categories of gaseous
combustion processes: premixed combustion and non-premixed combus-
tion. For example, combustion in a spark ignition internal combustion
engine (petrol engine) can be categorised as premixed combustion, as the fuel
(gasoline) is mixed with air prior to combustion, which takes place after spark
ignition. Similarly the flame in the familiar Bunsen burner is also premixed
combustion, as air is allowed to mix with gas prior to combustion. By con-
trast a jet flame where the fuel enters ambient air and is allowed to burn is an
example of a non-premixed flame. The gaseous fuel mixes with the oxidant
stream (air) and then combustion takes place where the conditions are right

## 페이지 2
ANIN_C12.qxd 29/12/2006 04:44PM Page 344
344 CHAPTER 12 CFD MODELLING OF COMBUSTION
for combustion. Non-premixed flames are also called diffusion flames
because fuel and oxygen are introduced to the combustion zone in two or
more separate streams and are subsequently brought together due to diffu-
sion and mixing prior to combustion.
The bulk of this chapter is concerned with the modelling of non-premixed
combustion. We do not intend discuss combustion theory in detail here, but
outline some important sub-topics first: (i) thermodynamics of combustion,
(ii) enthalpies of formation, (iii) transport processes, (iv) chemical kinetics,
(v) equilibrium in gases, (vi) adiabatic flame temperatures. The reader should
be familiar with the fundamentals of these basic concepts in order to appreciate
the modelling techniques used to apply CFD to combustion calculations.
The reader is referred to standard combustion texts such as Warnatz et al.
(2001), Kuo (1986), Turns (2000), Williams (1985) etc. for thorough treat-
ments of the fundamentals of combustion processes. Next we explain in
some detail the calculation of non-premixed combustion, and conclude the
chapter with a brief description of CFD modelling of premixed combustion.
12.2 Application of
the first law of We use the volume V and the absolute temperature T as the two variables
thermodynamics to a to describe the thermodynamic state of a combusting fluid system. Initially,
combustion system the system contains fuel and air as reactants – referred to by subscript R– at
a state of (V , T ). After combustion has taken place the system contains
1 1
reaction products – indicated by subscript P– at a state of (V , T ). We may
2 2
apply the first law of thermodynamics to this system. If the system bound-
aries are adiabatic and the process is a non-flow process the first law of ther-
modynamics indicates that the heat released by the chemical reaction should
be equal to the change in the internal energy Ubetween initial state ‘1’ and
final state ‘2’. In order to avoid accounting problems in the internal energy
balance the heat release is evaluated at a reference state:
U −U =(U −U ) +(U −U ) +(U −U ) (12.1)
P2 R1 P2 P0 P0 R0 R0 R1
In the above equation Uis the total internal energy and subscript ‘0’ denotes
the reference state. The reactants are first considered to be brought from
their initial state ‘1’ to state ‘0’ at which the reaction takes place and then the
resulting products are taken to state ‘2’. The term (U −U ) is called the
P0 R0
internal energy of combustion and given the notation ∆U .
0
Usually reactants and products are gaseous mixtures. In this case the
internal energy changes associated with bringing reactants from state ‘1’ to
state ‘0’ and products from state ‘0’ to state ‘2’ can be expressed in terms of
temperature by assuming mean values for the specific heat c :
v
all reactants
U −U = ∑ mc (T −T )
R0 R1 i vi 0 1
i
all products
U −U = ∑ mc (T −T )
P2 P0 i vi 2 0
i
Here m is the mass of species iin the mixture and c is the mean specific heat
i vi
at constant volume of species i.
Similarly for open systems involving flow processes we need to consider
changes of enthalpy (kinetic energy changes are small compared with the
heat released during combustion processes and can often be neglected):

## 페이지 3
ANIN_C12.qxd 29/12/2006 04:44PM Page 345
12.3 ENTHALPY OF FORMATION 345
H −H =(H −H ) +(H −H ) +(H −H ) (12.2)
P2 R1 P2 P0 P0 R0 R0 R1
where H is total enthalpy and the change of enthalpy at the reference state
(H − H ) = ∆H is called the enthalpy of combustion. Assuming mean
P0 R0 0
c-values for products and reactants we have
p
all reactants
H −H = ∑ mc (T −T )
R0 R1 i pi 0 1
i
all products
H −H = ∑ mc (T −T )
P2 P0 i pi 2 0
i
The reference state is usually taken as 25°C and 1 atm (101.3 kPa)
pressure. Property values at this standard reference state are indicated by
subscript ‘0’. For various fuels, values of ∆u and ∆h (per kmol) are available
0 0
in thermodynamic property tables such as Rogers and Mayhew (1994).
For example,
CH (vap) +O →CO +H O(vap)
4 2 2 2
From tables, heat of combustion for this reaction is ∆h =−802310 kJ/kmol,
0
at 25°C.
Depending on the phase of the products (vapour or liquid) ∆h values can
0
be different. The higher value is obtained when the components of products
such as water are in a condensed state. Since it is not possible to list ∆h for
0
all fuels and mixtures a more fundamental property known as enthalpy of
formation is widely used in combustion calculations.
12.3 Enthalpy of
formation The enthalpy of formation ∆h f is defined as the increase in enthalpy when
a compound is formed from its constituent elements in their natural forms
at standard temperature and pressure. The elements themselves have zero
enthalpy of formations in their naturally occurring states. For example,
values of ∆h for O , N , H and C are zero as they are formed from their
f 2 2 2
elements. However, CO is formed by the reaction C + O → CO .
2 (graphite) 2 2
A large amount of heat is liberated during this exothermic reaction. The
enthalpy of formation is −393520 kJ/kmol of CO . Enthalpy of formation
2
values for various reactions are available in thermodynamic and combustion
reference sources (Rogers and Mayhew, 1994; Kuo, 2005). To calculate the
enthalpy of combustion for a fuel (sometimes called the enthalpy of reaction)
we may view the reaction as a recombination of elements of the fuel. Thus,
the enthalpy of reaction may be calculated using enthalpiesofformation.
For example, combustion of CH may be broken down to
4
CH (vap) +2O →C +2H +2O →CO +2H O(vap)
4 2 2 2 2 2
∆h =(∆h +2∆h ) −(∆h +2∆h )
combustion CO HO CH O
2 2 4 2
Individual heat of formation values in kJ/kmol are
C +O →CO ∆h =−393520 kJ/kmol of CO
(graphite) 2 2 CO 2
2
1
H + O →H O(vap) ∆h =−241830 kJ/kmol of H O
2 2 2 HO 2
2 2
C +2H →CH ∆h =−74870 kJ/kmol of CH
(graphite) 2 4 CH 4
4

## 페이지 4
ANIN_C12.qxd 29/12/2006 04:44PM Page 346
346 CHAPTER 12 CFD MODELLING OF COMBUSTION
For combustion of CH
4
∆h =(−393520 −2 ×241830) −(−74870 +2 ×0)
combustion
=−802310 kJ/kmol of CH
4
12.4 Some important
relationships and Before and after combustion the gaseous volume will usually contain a mix-
properties of gaseous ture of species. It is therefore important to consider the basic properties of
mixtures such mixtures.
The mole fraction of species kin a mixture is defined as
n n
X = k = k (12.3)
k n +n +n +...+n n
1 2 3 N total
where n , n etc. indicate the number of moles of each species (k) in the
1 2
mixture, and n is the total number of moles in the mixture.
total
Partial pressure is defined as
n
p = k p=X p (12.4)
k k
n
total
where p is the total pressure (which is the sum of all partial pressures by
definition). Alternatively
p
X = k (12.5)
k
p
The mass fraction of species kin a mixture is defined as
m m
Y = k = k (12.6)
k m +m +m +...+m m
1 2 3 N total
where m , m etc. indicate the mass of each species in the mixture, and m
1 2 total
is the total mass. By definition
all species
∑ X =1 (12.7)
k
k
all species
∑ Y =1 (12.8)
k
k
The mole fractions and mass fractions are related by
(MW)
Y =X k (12.9)
k k
(MW)
mix
(MW)
X =Y mix (12.10)
k k
(MW)
k
Here (MW) stands for molecular weight of species ‘k’ and (MW) is the
k mix
molecular weight of the mixture given by
all species
(MW) = ∑ X (MW) (12.11)
mix k k
k

## 페이지 5
12.4 RELATIONSHIPS AND PROPERTIES OF GASEOUS MIXTURES 347
Alternatively
all species
1 = ∑ Y k (12.12)
(MW) (MW)
mix k k
The density of a species kis defined as
p
ρ = k (12.13)
k
R /(MW) T
u k
Here R is the universal gas constant. The density of the mixture ρis then
u
all species
ρ= ∑ ρ
k
k
all species all species
= ∑ p k = p ∑ X (MW)
k k
R /(MW) T R T
k u k u k
p
= (12.14)
R /(MW) T
u mix
The concentration of a species kis defined as the number of kilomoles of the
species per unit volume, and usually denoted by symbol C with units kmol/m3:
k
n X n
C = k = k total (12.15)
k
V V
Using the equation of state pV = n R T the concentration can also be
total u
written as
X n p p
C = k total =X = k (12.16)
k k
n R T/p R T R T
total u u u
Concentration may also be related to mass fraction using the relationships
between mole fraction and mass fraction:
Y (MW) p Y ρ
C = k mix = k (12.17)
k
(MW) R T (MW)
k u k
where ρis the density of the mixture. Alternatively
C (MW)
Y = k k (12.18)
k ρ
The enthalpy of a species with respect to the reference enthalpy at standard
pressure and temperature is defined as
T
(cid:1)
h = c dT+∆hk (12.19)
k pk 0
T0
sensible chemical
where ∆hk is the enthalpy of formation (J/kg) of the species k at standard
0
pressure and temperature. It is related to the enthalpy of formation ∆hk
f
(J/kmol) introduced earlier by means of ∆hk=∆hk/(MW) .
0 f k
1 2 3 ! @
ANIN_C12.qxd 29/12/2006 04:44PM Page 347

## 페이지 6
ANIN_C12.qxd 29/12/2006 04:44PM Page 348
348 CHAPTER 12 CFD MODELLING OF COMBUSTION
Properties such as the specific enthalpy h of a mixture may be calcu-
mix
lated from one of the following two expressions:
all species
h = ∑ Y h or (12.20)
mix k k
k
all species
P = ∑ X P (12.21)
mix k k
k
where h is the specific enthalpy (units J/kg) of species k and the overbar
k
indicates molar specific enthalpy of species k, which has units J/kmol.
12.5 Stoichiometry
In combustion calculations we often perform a simple analysis which
assumes that the fuel burns completely to form products (complete combus-
tion). Most common combustion reactions involve oxidation of hydrocarbon
fuels that have a high content of carbon (C) and hydrogen (H). When com-
bustion is complete all C atoms in the fuel are consumed to form CO and all
2
H atoms in the fuel become H O. Any other combustible elements such as
2
sulphur (S) etc. also combine with O . A chemical equation for complete
2
combustion could be written by considering an atom balance. This would
yield the exact amount of oxidiser required for complete combustion: the
so-called stoichiometric oxidiser requirement. Usually the oxidiser is air,
therefore the exact air requirement for complete combustion is called the
stoichiometric air requirement for complete combustion. We can also
calculate the air to fuel ratio necessary for complete combustion, which is
called the stoichiometric air/fuel ratio. The composition of air is con-
sidered to be 79% of N and 21% of O by volume. For each mole of O in
2 2 2
air there are 79/21 (=3.76) moles of N . By mass the ratio is 23.3% of O and
2 2
76.7% of N . The molecular weight of air is taken as 29 kg/kmol; 1 kmol of
2
O is contained in 100/21 kmol of air (i.e. 4.76 kmol of air).
2
Complete combustion of CH for example is given by the equation
4
CH +2(O +3.76N ) →CO +2H O +2 ×3.76N (12.22)
4 2 2 2 2 2
The stoichiometric air fuel/ratio by mass is
m
(A/F) = air
st
m
fuel
(MW) × number of kmol of O ×number of kmol of air per kmol of O
= air 2 2
(MW) ×number of kmol of CH
CH 4
4
29 ×2 ×4.76
= =17.255 kg air/kg fuel (12.23)
16 ×1
12.6 Equivalence ratio
Combustion with less air than the stoichiometric air requirement is fuel rich,
and combustion with air in excess of the stoichiometric air requirement is
called lean combustion. The equivalence ratio is used in combustion calcula-
tions to define the strength of a mixture with respect to the stoichiometric

## 페이지 7
ANIN_C12.qxd 29/12/2006 04:44PM Page 349
12.7 ADIABATIC FLAME TEMPERATURE 349
mixture strength. Given a fuel we may calculate the stoichiometric air/fuel
ratio as explained above; say the value is (A/F) . In the actual mixture
st
the air fuel ratio may be (A/F) . The equivalence ratio indicates the
actual
strength of a mixture with respect to the stoichiometric air/fuel ratio. It is
defined as follows:
(A/F) (F/A)
φ= st = actual (12.24)
(A/F) (F/A)
actual st
If the equivalence ratio of an air/fuel mixture is equal to unity, the mixture
is stoichiometric. A value less than 1, i.e. φ<1, indicates a lean mixture, and
if φ>1, the mixture is rich.
12.7 Adiabatic flame
temperature If a fuel/air mixture is considered to be burnt completely under constant
pressure and if no external heat or work transfer takes place then all the
energy liberated by the chemical reaction will be used to heat up the prod-
ucts. This process will achieve the maximum possible temperature, which is
called the adiabatic flame temperature. It can be calculated using the
first law of thermodynamics and enthalpies of reactants and products. When
there are no heat losses the total enthalpy of products is equal to the enthalpy
of reactants.
Example 12.1
Calculate the adiabatic flame temperature for combustion of a stoichiometric
mixture of CH and air at standard temperature and pressure.
4
The combustion equation is
Solution
CH +2(O +3.76N ) →CO +2H O +2 ×3.76N (12.25)
4 2 2 2 2 2
Application of the first law gives
H −H =(H −H ) +(H −H ) +(H −H ) (12.26)
P2 R1 P2 P0 P0 R0 R0 R1
For a constant pressure adiabatic process (neglecting kinetic energy changes)
H −H =0 (12.27)
P2 R1
It is given that the reactants start off at standard pressure and temperature
so no heat is taken up in heating the reactants to bring them to standard
temperature. Thus H −H =0, and we can simplify equation (12.26) as
R0 R1
(H −H ) =−(H −H ) (12.28)
P2 P0 P0 R0
all products
∑ m c (T −T ) =−(H −H ) (12.29)
k pk 2 0 P0 R0
k
Here temperature T is the final temperature of the products and
2
H −H =∆H is the heat of combustion of CH .
P0 R0 0 4
Before we calculate the value of T we need to consider that the change in
2
temperature during combustion will cause the values of specific heats c and
v
c to change. In simple adiabatic flame temperature calculations mean specific
p
heat values are used. To obtain mean c -values for products (CO and H O)
pk 2 2
we need a temperature range. In a calculation like this we start by assuming
a final temperature to estimate a mean temperature for products and then

## 페이지 8
ANIN_C12.qxd 29/12/2006 04:44PM Page 350
350 CHAPTER 12 CFD MODELLING OF COMBUSTION
repeat the calculation using the estimated product temperature after the
first calculation. We guess a final temperature T , say 2000 K. Then a mean
2
temperature for products would be (2000 + 298)/2 = 1149 K. For gases at
different temperatures the value of c may be calculated using an equation
pk
of the form c =a+bT+cT2+dT3(see Cengel and Boles (2002) for values
p
of the constants a, b, cand d):
c value for CO at 1149 K =1.274 kJ/kg K (12.30a)
p 2
c value for H O at 1149 K =2.384 kJ/kg K (12.30b)
p 2
c value for N at 1149 K =1.1931 kJ/kg K (12.30c)
p 2
To evaluate T from equation (12.29) we need the mass m of each of the
2 k
product species. The combustion equation in mole form (12.25) can be con-
verted into mass form by multiplying the molecular weight of each substance
by the coefficient of the molar balance equation.
In terms of mass,
16 kg CH +64 kg O +210.56 kg N
4 2 2
⎯→ 44 kg CO +36 kg H O +210.56 kg N (12.31)
2 2 2
For CH combustion the heat of combustion H − H = −50050 kJ/kg.
4 P0 R0
We use the so-called lower heating value, which assumes that H O in the
2
products is in the vapour phase. Since heat of combustion values are tabu-
lated per kg of fuel we rewrite (12.31) as follows to obtain values for the mass
of products species m :
k
1 kg CH +64/16 kg O +210.56/16 kg N
4 2 2
⎯→ 44/16 kg CO +36/16 kg H O +210.56/16 kg N
2 2 2
or
1 kg CH +4 kg O +13.16 kg N
4 2 2
⎯→ 2.75 kg CO +2.25 kg H O +13.16 kg N (12.32)
2 2 2
We use equation (12.29) with the c -values of (12.30a–c) and the values of
pk
mass of products species m from (12.32) and obtain
k
∑m c (T −T ) =[(2.75×1.274) +(2.25 ×2.384)
k pk 2 0
+(13.16 ×1.193)] ×103×(T −298)
2
=50050 ×103
which gives T =2335 K.
2
As we have used an estimated T at the start to obtain c, the calculation
2 p
has to be repeated with the new T to obtain a new mean value of tempera-
2
ture to determine a new set of mean c-values. Another iteration using this
p
new mean temperature of 1316 K for properties yields a flame temperature
of 2276 K. After a few more iterations we obtain a final value of the adiabatic
flame temperature as 2288 K. This sort of calculation can be easily per-
formed using an iterative spreadsheet with polynomial fits for c-values of the
p
species. More precise calculations require integrals for mean c which could
p
also be incorporated into a calculation using polynomial fits for c-values.
p
Knowing the adiabatic flame temperature for a given air/fuel ratio is import-
ant in CFD, because it constitutes an upper limit for predicted temperatures
in a combustion calculation. If a combustion calculation produces higher
temperatures than the adiabatic flame temperature, the procedure has to be
checked carefully and corrected. Sometimes such overpredictions can occur

## 페이지 9
ANIN_C12.qxd 29/12/2006 04:44PM Page 351
12.8 EQUILIBRIUM AND DISSOCIATION 351
due to underflow and overflow errors in the computations and the computa-
tional procedure should be structured to avoid such errors.
12.8 Equilibrium and
dissociation The above analysis for adiabatic flame temperature is based on complete
combustion. In practice, however, at high temperatures some reactions occur
in the reverse direction. This phenomenon is called dissociation. Dissociation
reactions are endothermic: therefore, the actual temperature will be lower
than the adiabatic flame temperature based on complete combustion. At
typical combustion temperatures important dissociation equations are
1
CO bcg CO + O
2 2
2
1
H O bcg H + O
2 2 2
2
H O bcg H +OH
2
H bcg H +H
2
O bcg O +O
2
1 1
NO bcg N + O
2 2
2 2
As a consequence of dissociation, species like CO, H , OH, O will be pre-
2 2
sent in the products. These are called minor species since they usually occur
in much smaller concentrations than the main reaction products CO and
2
H O. Later we will see that combustion mechanisms for even simple fuels
2
are much more complicated and result in many minor species in the prod-
ucts. The assumption of complete combustion is certainly a simplification.
When concentrations of minor species in the products are known the adia-
batic flame temperature of such a mixture can be calculated by taking into
consideration all species of reactants and products.
Given the conditions for combustion and the air/fuel ratio we would like
to know what the resulting composition of the mixture is after dissociation.
When a mixture has reached chemical equilibrium, the composition of the
gas mixture can be obtained using a parameter known as the equilibrium
constant K. The equilibrium criterion is based on the second law of ther-
p
modynamics. See standard thermodynamics textbooks for the theory on the
applications of the second law to combusting systems. In the analysis the
thermodynamic property known as the Gibbs function is used. The Gibbs
function is defined as
g=h−Ts (12.33)
where h is specific enthalpy (units J/kg), T is temperature in K and s is
specific entropy (units J/kg.K). The units of specific Gibbs function g are
the same as the specific enthalpy, i.e. J/kg, and its values are available in
thermodynamic tables (Rogers and Mayhew, 1994).
It can be shown that, as a consequence of the second law, a system seeks
to maximise its entropy, so a reacting system is in equilibrium when the total
Gibbs function (units J) attains a minimum value. Mathematically, the cri-
terion is expressed in terms of
(dG) =0 (12.34)
T,p

## 페이지 10
ANIN_C12.qxd 29/12/2006 04:44PM Page 352
352 CHAPTER 12 CFD MODELLING OF COMBUSTION
When this is applied to a combustion reaction in the form
aA+bBbcgcC+dD (12.35)
where a, b, cand dare stoichiometric coefficients of the species participating
in the reaction, and these species are perfect gases and the reaction is isother-
mal, it is possible to show that the condition for equilibrium is (see e.g.
Kuo, 2005)
∆Go=−R Tln K (12.36)
T u p
where ∆Go is called the standard state Gibbs function change, K is the
T p
equilibrium constant and R is the universal gas constant.
u
Furthermore, it can be shown that
pcpd
K = C D
p papb
A B
where p , p , p etc. are partial pressures of species A, B, Cetc.
A B C
We note that each partial pressure is raised to a power corresponding to
the stoichiometric coefficient. In equation (12.36) the standardstateGibbs
functionchange∆Go may be calculated from
T
∆Go=∆Ho−T∆So (12.37)
T
These quantities may be obtained from thermodynamic property tables.
From equation (12.36) K =exp(−∆Go/RT), so K-values may be obtained
p T u p
from thermodynamic property tables or calculated from the standard state
Gibbs function change using equations (12.37) and (12.36).
If there are many reactants and products involved in the mixture in the
form
aA+bB +cC+...bcg eE+fF+... (12.38)
the equilibriumconstantK is given by
p
pepf... XeXf ...
K = E F = E F (12.39)
p papb... XaXb...
A B A B
In the equation for K products appear in the numerator and reactants
p
appear in the denominator. The equation also shows that partial pressures
can be written in terms of mole fractions.
In practical equilibrium combustion calculations many independent
reactions are involved, so we solve balance equations for overall mass or mole
conservation along with expressions written for K in terms of mole fractions
p
for each independent reaction to give a set of relationships between product
and reactant mole fractions. Additional relationships are obtained from atom
balances for each of the atomic species participating in the reaction and from
the air/fuel ratio. This set of algebraic equations is solved to obtain mole
fractions of all the molecular species. An illustrative example of this type of
equilibrium chemistry calculation is given below.
Dedicated computer codes based on the principle of Gibbs function
minimisation are used for equilibrium calculations in systems with complex
reaction mechanisms involving many species (see e.g. Morley, 2005; Kuo,
2005). Further literature on equilibrium calculations can be found in Turns
(2000) and Warnatz et al. (2001). The interested reader is also referred to
the NASA equilibrium calculation program documented by Gordon and

## 페이지 11
ANIN_C12.qxd 29/12/2006 04:44PM Page 353
12.8 EQUILIBRIUM AND DISSOCIATION 353
McBride (1994) and available via the Internet at the CEA website (see URL
under McBride, 2004).
Example 12.2
Methane and air at an equivalence ratio of φ=1.25 burn at 1600 K and 1.0 atm
pressure. Determine the composition of the products, which include H and CO.
2
The stoichiometric combustion equation is
Solution
CH +2(O +3.76N ) →CO +2H O +2 ×3.76N (12.40)
4 2 2 2 2 2
Equation (12.23) gives the stoichiometric air/fuel ratio (A/F) = 17.255.
st
Equation (12.24) allows us to calculate the actual air/fuel ratio for the given
equivalence ratio φ=1.25:
(A/F) 17.255
(A/F) = st= =13.804
φ 1.25
The actual combustion process includes dissociation. The following dissoci-
ation reactions are responsible for the creation of the species H and CO:
2
1
CO + O bcgCO
2 2
2
1
H + O bcgH O
2 2 2
2
When the fuel mixture is richer than stoichiometric (φ>1) it can be argued
that O is very low as it will be consumed by H . The two chemical equations
2 2
above can be combined into
CO +H O bcgCO +H
2 2 2
This is called the water–gas equilibrium equation.
The actualcombustion equation should therefore include these additional
product species H and CO:
2
CH +a(O +3.76N ) bcgbCO +cCO +dH O +eH +3.76aN
4 2 2 2 2 2 2
The number of moles of air acan now be calculated from the air/fuel ratio:
a×4.76 ×29
(A/F) = =13.804
1 ×16
a=1.6
Thus,
CH +1.6(O +3.76N ) bcgbCO +cCO +dH O +eH +3.76 ×1.6N
4 2 2 2 2 2 2
An atom balance for all three atomic species that participate in the combus-
tion reaction yields three equations:
Carbon (C) balance: 1 =b+c (12.41)
Oxygen (O) balance: 3.2 =2b+c+d (12.42)
Hydrogen (H) balance: 4 =2d+2e (12.43)
Since there are four unknown b, c, dand ewe need a further equation. As we have
seen, the equilibrium constant (12.39) connects the mole fractions of reactants
and products, so the equilibrium constant K supplies the fourth equation.
p

## 페이지 12
ANIN_C12.qxd 29/12/2006 04:44PM Page 354
354 CHAPTER 12 CFD MODELLING OF COMBUSTION
K for the water–gas equilibrium equation is
p
p p (b/n)(e/n)
K = CO2 H 2 = (12.44)
p
p p (c/n)(d/n)
HO CO
2
be
K = (12.45)
p
cd
where nis the total number of moles in the mixture.
Values for K for the water–gas equilibrium equation are tabulated as a
p
function of temperature in thermodynamic data tables (Rogers and Mayhew,
1994; or the JANAF tables in Chase et al., 1985). For a combustion temper-
ature of 1600 K, the tables show ln(K) = −1.091, which gives K = 0.3358
p p
and, hence,
be
0.3358 = (12.46)
cd
Now equations (12.41)–(12.43) and (12.46) are solved to obtain values of b,
c,dand e. In this case by simple elimination a quadratic equation for bcan be
obtained
0.6642b2+0.8746b−0.7387 =0
The solution gives
b=0.5848
c=0.4152
d=1.6152
e=0.3848
As mentioned earlier, dissociation reactions are endothermic and result
in incomplete combustion. At equilibrium, reactants such as CO and H are
2
present in the products. This means that the fuel has not been utilised in full
and the flame temperature will be lower than the adiabatic flame temperature
estimated on the basis of complete combustion. However, it takes time for
combustion products to achieve equilibrium. In practice, therefore, equilib-
rium calculations will give good predictions of product composition if the
residence time is long. For example, in long furnaces which operate at high
temperature the products might achieve equilibrium.
In many other combustion systems, where the flow or operating con-
ditions do not provide adequate time for equilibrium to be reached, the
product composition cannot be predicted from equilibrium alone. Other
factors, such as finite rate reaction kinetics, turbulence, transient effects etc.,
have to be taken into account. The internal combustion engine is an import-
ant example of combustion taking place in a highly transient environment.
Peak temperatures and pressures at which dissociation takes place occur
only for a very short period. The rapid drop in pressures and temperatures
immediately after the combustion phase causes the product composition to
be ‘frozen’ before equilibrium is reached. Another important non-equilibrium
phenomenon in engine combustion is pollutant formation, which is strongly
influenced by chemical kinetics. These processes will be discussed in the
next sections. Nevertheless, for many combustion systems equilibrium cal-
culations give a fair representation of final products. Such details are very
useful for the design of combustion equipment. Where applicable, CFD

## 페이지 13
ANIN_C12.qxd 29/12/2006 04:44PM Page 355
12.10 OVERALL REACTIONS AND INTERMEDIATE REACTIONS 355
calculations of combustion can be carried out with equilibrium chemistry
models (Jones and Priddin, 1978; Nazha et al., 2001). For situations where
equilibrium models are not applicable more elaborate combustion models are
required. General-purpose CFD codes obviously need to include capabilities
to deal with any situation, so composition calculations need to take into
account effects such as departure from equilibrium, turbulence, finite rate
chemistry and radiative heat transfer. The relevant modelling concepts are
discussed in sections to follow.
12.9 Mechanisms of
combustion and As mentioned earlier, combustion of a fuel does not occur in a single reac-
chemical kinetics tion, but may involve a number of different steps. In the above discussion it
was mentioned that it takes time for products to reach equilibrium. Chemical
kinetics ultimately determines how long it takes for a system to reach its
final equilibrium state. Essentially, chemical kinetics is the study of reaction
mechanisms and reaction rates.
Many combustion processes are physically controlled, i.e. the rate of com-
bustion depends on flow, turbulence and diffusion processes. Some examples
are: (i) wick flames such as candle flames and oil lamps, (ii) combustion of
pools of liquids, pool fires, (iii) droplet combustion, burning of liquid fuels
in furnaces, (iv) diesel engine combustion, (v) gas turbine combustion at low
altitude, (vi) rocket motors, (vii) laminar and turbulent jet diffusion flames,
(viii) combustion in boilers and furnaces, (ix) turbulent premixed combus-
tion in petrol engines, aeroengines etc. In situations such as these diffusion
and turbulence dominate mixing and subsequent combustion.
However, chemical kinetics can play an important role under certain con-
ditions, e.g. when the pressure is low or the supply of oxygen is restricted.
Combustion is never independent of physical processes, so ‘kinetically
influenced’ is the correct way to describe these processes. Some examples
of kinetically influenced situations are: (i) propagation of laminar flames
through premixed fuel and oxidant, (ii) aerated laminar flames such as gas
cooker and domestic boiler flames, (iii) ignition processes such as spark
ignition in petrol engines, auto-ignition in diesel engines, ignition in domes-
tic appliances, (iv) extinction processes such as extinction of gas turbines
at high altitude, petrol engines running too weak or too rich, extinction
of stabilised flames, (v) complex situations where kinetics competes with
mixing, e.g. burning of very small droplets or particles, insufficient avail-
ability of oxygen in pulverised coal flames, situations with large radiative heat
losses from coal particles and highly sheared flow situations.
12.10 Overall reactions
and intermediate In the combustion calculations which we discussed earlier we wrote the com-
reactions bustion equation as a single overall reaction or global reaction:
Fuel +Oxidant →Products (12.47)
For example,
CH +2O →CO +2H O (12.48)
4 2 2 2
In practice this reaction does not occur in this single-step fashion, since
it would require the simultaneous meeting of three different reactant

## 페이지 14
ANIN_C12.qxd 29/12/2006 04:44PM Page 356
356 CHAPTER 12 CFD MODELLING OF COMBUSTION
molecules. Chemical reactions more commonly occur due to collisions of
pairs of molecules, where chemical bonds are broken during impact and new
bonds are formed. In the process many intermediate bonds and intermediate
species are formed. Such reactions are called elementary reactions and
involve stable intermediate species and radicals. For example, some common
radicals involved in reactions are H, O, OH, CH, HO , C . These radicals are
2 2
unstable and highly reactive because they contain unpaired electrons. The
simplest and most well-documented reaction is H combustion:
2
1
H + O →H O (12.49)
2 2 2
2
Even this simple reaction involves many intermediate steps such as
H +O bcg 2OH (12.50)
2 2
H +OH bcg H O +H (12.51)
2 2
H +O bcg OH +O (12.52)
2
H O +O bcg OH +OH (12.53)
2
H +OH +M bcg H O +M (12.54)
2
The symbol ‘M’ represents a third body that can be any of the species
present in the system. The subject of chemical kinetics deals with details
of how these reactions occur. There are many mechanisms and paths of
reactions, and chemical kinetics has been a research area which has attracted
a great deal of attention. We do not intend to go on into the details here, and
the reader is referred to Turns (2000), Kuo (2005), Warnatz et al. (2001),
Bartok and Sarofim (1991), Gardiner (1984) and further references therein
for more details. Below we outline some of the basic concepts useful for CFD
combustion procedures.
12.11 Reaction rate
In combustion modelling it is required to determine rates of reactant con-
sumption and product formation. These are used as source terms in transport
equations for each of the species. It has already been mentioned that many
intermediate equations are involved in combustion, and one particular species
may be formed and consumed in a number of different reactions where some
of these reactions may be reversible. For illustration purposes let us consider
a scheme of (forward-only) reactions represented by the stoichiometric equation
N N
∑ ∑
ν′ M → ν″M for j=1, 2,...,m (12.55)
kj k kj k
k=1 k=1
ν′ are stoichiometric coefficients of reactant species M in the reaction j. ν″
kj k kj
are stoichiometric coefficients of product species M in the reaction j. N is
k
the total number of species involved and mis the total number of reactions
in the scheme.
Mass conservation enforces that
N N
∑ ∑
ν′(MW) = ν″(MW) for j=1, 2,...,m (12.56)
kj k kj k
k=1 i=1

## 페이지 15
ANIN_C12.qxd 29/12/2006 04:44PM Page 357
12.11 REACTION RATE 357
For example, consider the simple reaction
2H +O →2H O (12.57)
2 2 2
For this reaction the total number of species involved is N =3; the species
involved are M =H , M =O and M =H O.
1 2 2 2 3 2
Considering the left hand side of equation (12.57) we have
Stochiometric coefficient ν′for H =2
1 2
Stochiometric coefficient ν′ for O =1
2 2
Stochiometric coefficient ν′ for H O =0, no H O on the left hand
3 2 2
side of the equation
Considering the right hand side of equation (12.57) we have
Stochiometric coefficient ν″for H =0, no H on the right hand
1 2 2
side of the equation
Stochiometric coefficient ν″for O =0, no O on the right hand
2 2 2
side of the equation
Stochiometric coefficient ν″for H O =2
3 2
The mass conservation (12.56) can be verified for this equation as
Left hand side (2 ×2 +1 ×32) =(2 ×18) Right hand side
The law of mass action (see Kuo, 2005; Turns, 2000), which has been
confirmed by experimental observations, states that the rate of consumption
of a chemical species in a reaction is proportional to the (mathematical) prod-
uct of the concentration of the reacting species, each concentration being
raised to the powers corresponding to the stoichiometric coefficients of the
reactants.
The reactionrateRR (units kmol/m3.s) for the reaction (12.55) is given
by (see Kuo, 2005)
N
d(C ) ∏
RR = product =k f (C M )v k ′ j (12.58)
dt k
k=1
Since species M appear on both sides of equation (12.55), the netprogress
k
rate of reaction j is given by the production of the species M minus the
k
destruction of the species M :
k
N
dC ∏
L kj = M k =(ν k ″−ν k ′)k f (C M )v k ′ j (12.59)
dt k
k=1
Here C denotes the molar concentration of the species in units kmol/m3
(or gmol/cm3in CGS units) and the proportionality constant k is called the
f
specific reaction rate constant. It should be noted here that the subscript k
used to identify species is different from this k. The reaction rate constant k
f
is independent of the concentration and is usually expressed as
A E D
k =ATαexpB− a E (12.60)
f
C R TF
u
This is known as the Arrhenius law. In this expression A is called the
pre-exponential constant. Parameter αis a temperature exponent and E is
a
the activation energy. These constants are specific to a given reaction. R
u
is the universal molar gas constant (= 8.314 kJ/kmol.K) and T is absolute

## 페이지 16
ANIN_C12.qxd 29/12/2006 04:44PM Page 358
358 CHAPTER 12 CFD MODELLING OF COMBUSTION
temperature. A note about units is required here. Consider the simple
forward-only reaction
aA+bB →cC+dD (12.61)
The progress rates of reactant consumption and product formation for this
reaction can be evaluated using equation (12.59) as
dC
L = A =−ak (C )a(C )b (12.62)
A f A B
dt
dC
L = B =−bk (C )a(C )b (12.63)
B f A B
dt
dC
L = C =ck (C )a(C )b (12.64)
C f A B
dt
dC
L = D =dk (C )a(C )b (12.65)
D f A B
dt
Note that equation (12.61) is a forward-only reaction. When a backward
reaction is also present similar expressions can be written using a backward
reaction rate constant k. The units of C and C are kmol/m3. The units
b A B
of the progression rate are kmol/m3.s. Because of the involvement of
exponents in equations (12.59) it can be seen that the units of k , which is
f
given by equation (12.60), depend on the stoichiometry of the reaction. For
the reaction (12.61), the sum of the coefficients aand bis called the reaction
order n=a+b. E has units kJ/kmol. RThas the same units. The exponen-
a
tial term −E /RT does not contribute to units. The factor Tαhas units
a
depending on the value of α(see Turns, 2000). Therefore for this particular
reaction the constant Ahas units (m3/kmol)n−1/(K−αs). The units of k are
f
(m3/kmol)n−1/s. In most cases αis zero, in which case the units required for
k are the same as those for A (see e.g. Henson and Salimian, 1984).
f
For a simple reversible reaction of the form
aA+bBbcgcC +dD (12.66)
the progress rate of consumption of the reactant species A in equation
(12.66) is
dC
L = A =−a[k (C )a(C )b−k(C )c(C )d] (12.67)
A f A B b C D
dt
Similarly for a large scheme of reactions of the form
N N
∑ ∑
ν′ M bcg ν″M for j=1, 2,..., m (12.68)
kj k kj k
k=1 k=1
the most general form of the reaction progress rate for species kby reaction
jis given by
dC G ∏ N ∏ N J
L kj = dt M k =(ν k ″−ν k ′) . H I k f (C M k )ν k ′ j −k b (C M k )ν k ″ j K L (12.69)
k=1 k=1
j

## 페이지 17
ANIN_C12.qxd 29/12/2006 04:44PM Page 359
12.11 REACTION RATE 359
where k is the forward reaction rate constant and k is the backward reaction
f b
rate constant for the reaction j. This kind of compact notation is very useful
in handling large systems of kinetic schemes containing many equations
(more than 100 or so) and is used in common kinetic solution algorithms
such as CHEMKIN (Kee et al., 1996).
In complex chemical schemes involving m equations the total rate of
production rate L of a certain species kis the sum of individual rates of each
k
equation producing the species k, i.e.
m
∑
L = L (12.70)
k kj
j=1
where L is the totalreactionrateforthespecieskand L is the reaction
k kj
rate for species kfor the specific reaction j.
These reaction rates are used in the transport equations for each of the
species in the solution of combustion problems. When reaction rate expres-
sions are written for each species participating in the mechanism this yields
a system of first-order differential equations describing the progress of a
chemical system with time. Given the initial conditions (initial concentration
of the reacting species and temperature), additional equations for conservation
of mass, momentum and energy can be written, and the system of differential
equations can be numerically integrated to obtain a solution. In the solution
of such systems, when one or more variables change rapidly in comparison
with other variables, the resulting system is said to be stiff. Chemical kinetic
solution packages use special routines to deal with such stiff systems (see Kee
et al., 1996; Radhakrishnan and Pratt, 1988).
The reaction rates are used as source terms (see later) in transport equa-
tions for species mass fractions, which have the units kg/m3.s. To convert to
required units we multiply L , which is in kmol/m3.s, by the molecular
kj
weight (MW). After converting to mass rate units the usual reaction rate
sourcetermusedinspeciestransportequationsmay be written as
M =(MW) L (12.71)
k k k
where L is obtained from (12.70) and (12.69) using details of kinetic data
k
(values of constants A, α, E etc.) from Baulch et al. (1994), Turns (2000),
a
Smith et al. (2003), Kuo (2005), Gardiner (1984) and many other publica-
tions cited later. In some of the early combustion literature tabulated kinetic
data have been tabulated in CGS units. Care must be given in using these
datasets, and appropriate SI unit conversion is required when incorporating
reaction rates.
A further point to note is the link between forward and backward reaction
rate constants. When the forward reaction rate constant (k) is known, the
f
backward rate constant (k) for the jth reaction can be calculated through the
b
equilibrium constant introduced in section 12.8:
∏ ν″
k fj = k bj (C Mj ) ∑ k N =1 (ν k ″ j −ν k ′ j) = pr ∏ oduc X t
X
s i ν i
i
′ = K P (R u T/p) ∑ vi ′−∑ν i ″ (12.72)
i
reactants

## 페이지 18
ANIN_C12.qxd 29/12/2006 04:44PM Page 360
360 CHAPTER 12 CFD MODELLING OF COMBUSTION
For example, one of the reactions known as the Zel’dovich mechanism for
thermal NO formation (discussed later) is
NO +O →N +O
2
The rate coefficient (from Turns, 2000) for the forward reaction is
k =3.80 ×109T1.0exp(−20820/T) cm3/gmol.s
f
At 2300 K, the value is k = 1.029 × 109 cm3/gmol.s. For this reaction
f
(∑ν′ − ∑ν″) = 0. The K -value for the above reaction at 2300 K is
i i P
K = 1.94 × 10−4. Using equation (12.72) the backward reaction rate
P
coefficient is obtained as
1.024 ×109
k =k/K = =5.278 ×1012cm3/(gmol s)
b f P 1.94 ×10−4
Further details of chemical kinetics, the fundamental development of reac-
tion rate expressions, reaction kinetic data and how they are used in packages
like CHEMKIN are available in Turns (2000) and Kuo (2005).
To illustrate the behaviour of the reaction rate expression for a simple
reaction of the form (12.61) the rate of consumption of species A can be
written as
M =A′[Y ]a[Y ]bexp(−E/R T) (12.73)
A A B u
A ρ Da A ρ Db
where A′=(MW) a ATαB E B E
A
C(MW) F C(MW) F
A B
It should be noted that constant A′ contains density and molecular weight
terms, which arise from the conversion from molar concentrations (12.69) to
mass fractions (as used in CFD computations). According to this expression,
it can be seen that the rate increases exponentially with temperature. As
the reaction progresses, the mass fractions of reactants decrease as they get
consumed. Therefore the reaction rate decreases as species A and B are con-
sumed. The typical behaviour of the rate expression is shown in Figure 12.1.
Figure 12.1 Schematic
representation of the reaction
rate expression for a single-
step reaction

## 페이지 19
ANIN_C12.qxd 29/12/2006 04:44PM Page 361
12.13 REDUCED MECHANISMS 361
The reaction rate increases almost exponentially with temperature (T) at
first because of the dominant role of the term exp(−E/RT). As Tincreases
towards the final temperature T , the reaction rate drops in spite of the
burnt
exponential term because [Y ]a[Y ]bdecreases rapidly as reactants Aand B
A B
species are consumed in the reaction. This demonstrates that the availability
of reactants (concentrations) and temperature both play major roles in deter-
mining the reaction rate.
12.12 Detailed
mechanisms There are many types of reaction: reactions of various orders (first-order,
second-order etc.), consecutive reactions, competitive reactions, opposing
reactions, chain reactions, chain branching reactions etc. For oxidation of
various fuels detailed reaction mechanisms and appropriate rate constants
for those reactions are available in the literature. For example, see Gardiner
(1984), Drake and Blint (1988), Dryer (1991), Smooke (1991), Peters (1993),
Turns (2000), Seshadri and Williams (1994), Warnatz et al. (2001), the
GRI 3.0 mechanism (Smith et al., 2003 and references therein), and also
the San Diego mechanism (2003, http://maemail.ucsd.edu/combustion/
cermech/).
Detailed mechanisms for methanol and the CO/H /O system are
2 2
available in Dryer (1991). This reference also gives one-step, two-step and
four-step mechanisms for a variety of hydrocarbon fuels. Peters (1993) is
a valuable source book which has contributions from many other authors
and contains details of multi-step and reduced mechanisms for a range
of fuels. A detailed mechanism for methane combustion, NO formation,
single-step and multi-step reaction mechanisms for common hydrocarbons
are also available in Turns (2000). A mechanism containing 46 steps for
methane combustion has been reported in Smooke et al. (1986). A very well-
known and widely used mechanism for methane combustion is GRI 2.11
(Bowman et al., 1996). The most recent version of this mechanism is GRI 3.0
(Smith et al., 2003), which includes a detailed mechanism for NO formation.
However, it has been observed in some test cases that the previous version
GRI 2.11 appears to give better NO predictions (at the time of writing this
text) than the latest version GRI 3.0 (see Kim and Huh, 2002). Further
details of detailed mechanisms can be found in Seshadri and Williams
(1994), Warnatz et al. (2001), and also at the Lawrence Livermore Laboratory
mechanisms link (http://www-cms.llnl.gov/combustion/combustion2.html).
It should be noted that rate constants of various mechanisms have been
derived on the basis of computational estimations and comparisons with
measurable combustion properties such as flame speeds, temperatures and
species mass fractions obtained in controlled experiments. For large systems
of chemical equations dedicated computer programs are required to solve
chemical kinetic problems. CHEMKIN (Kee et al., 1996), for example, is a
widely used software package for such problems, and many commercial CFD
codes allow the incorporation of its information relating to chemical reactions.
12.13 Reduced
mechanisms The computational cost of chemical kinetics evaluations and the associated
species transport equations is substantial, and grows rapidly as the reaction
mechanisms become more elaborate and detailed. Consequently, efforts have

## 페이지 20
ANIN_C12.qxd 29/12/2006 04:44PM Page 362
362 CHAPTER 12 CFD MODELLING OF COMBUSTION
been made to develop more practical reaction schemes involving fewer reac-
tions to represent combustion of basic fuels. These simplified schemes are
called reduced mechanisms and consist of a few key equations to predict
major and important minor species (see e.g. Dryer, 1991; Seshadri and
Williams, 1994). For example, the detailed mechanism for H oxidation given
2
in Conaire et al. (2004) consists of 19 reactions. Massias et al. (1999) give a
five-step reduced mechanism for H combustion including NO formation
2
(Table 12.1).
Table 12.1
1 H bcg 2H
2
2 H +O bcg HO
2 2
3 4H +O bcg 2HO
2 2
4 N +O bcg 2NO
2 2
5 N +O bcg NO
2 2
The detailed chemical–kinetic mechanism for methane combustion
shown in Seshadri and Williams (1994) consists of 39 elementary reactions
involving 17 chemical species including N . A five-step reduced mechanism
2
by Hewson and Bollig (1996) for CH combustion is shown in Table 12.2.
4
The same reference gives a 52-step, 13-species reaction detailed mechanism
for nitrogen chemistry (species NO, NH , HCN etc.) and a reduced six-step
3
reduced mechanism for nitrogen chemistry.
Table 12.2
1 CH +2H +HO bcg 4H +CO
4 2 2
2 HO +CO bcg H +CO
2 2 2
3 2H bcg H
2
4 O +3H bcg 2HO +2H
2 2 2
5 H +2CO bcg CH +O
2 2 2 2
Rate constants and further data for the reduced mechanisms shown
in Tables 12.1 and 12.2 can be obtained from the above cited references.
Extensive studies have been made of most practically important combustion
reactions, resulting in a vast body of publications with proposals for detailed
and reduced mechanisms. Some detailed mechanisms involve many equa-
tions – the above-mentioned GRI 3.0 mechanism for natural gas combus-
tion including NO chemistry, for example, consists of 325 reactions and
x
53 species. The accuracy of reduced mechanisms has been compared with
detailed mechanisms for many practically important combustion reactions
(see e.g. Barlow et al., 2001; Massias et al., 1999). The choice of a reduced
mechanism is always a trade-off between computational cost and accuracy
required. The user should carefully select a suitable mechanism depend-
ing on the particular application and available resources. When results are
interpreted it should also be noted that some reduced mechanisms have
been tuned for specific temperature ranges and specific types of combustion
processes.

## 페이지 21
ANIN_C12.qxd 29/12/2006 04:44PM Page 363
12.14 GOVERNING EQUATIONS FOR COMBUSTING FLOWS 363
12.14 Governing
equations for So far we have discussed thermodynamics, chemical equilibrium and chem-
combusting flows ical kinetics without any reference to flow conditions. In many combustion
situations fluid flow is an integral part of the combustion process. In non-
premixed combustion situations such as furnaces, fuel and air streams are
mixed by fluid flow and turbulence, and the resulting combustion tempera-
tures, species concentrations and distribution of species are very much con-
trolled by fluid flow. Similarly, in premixed combustion, e.g. a spark ignition
IC engine, the geometry, fluid flow and turbulence created by the induction
and compression processes prior to ignition play an important role in the
combustion characteristics of the engine. We now present the transport
equations governing gaseous fuel combustion. We quote all equations in
compact suffix notation, introduced first in Chapter 3.
The governing equations of continuity and momentum developed in
Chapter 2 can be used in unchanged form.
Continuity
The continuity equation is
∂ρ ∂
+ (ρu) =0 (12.74)
∂t ∂x i
i
It should be noted that density in combusting flows is a variable, and depends
on pressure, temperature and species concentration.
Momentum equations
As in other flows the velocity field is governed by momentum equations
∂ ∂ ∂p ∂τ
(ρu) + (ρuu) =− + ij +F (12.75)
∂t i ∂x i j ∂x ∂x i
i i i
where τ is the viscous stress tensor and F is the body force (which includes
ij i
gravity):
A∂u ∂u 2 ∂u D
τ =µB i + j − δ kE (12.76)
ij C∂x ∂x 3 ij∂x F
j i k
The first transport equation that is specific to reacting flows is the equation
for the conservation of mass of a species k. It can be easily developed from
the general transport equation (2.39) by setting φ=Y . In suffix notation the
k
statement is as follows.
Transport equations for species (k)
∂ ∂ ∂ A ∂Y D
(ρY ) + (ρuY ) = BρD kE +M (12.77)
∂t k ∂x i k ∂x C k ∂x F k
i i i
Rate of Net rate of Net rate of Net rate of
change of decrease of mass increase of mass increase of mass
+ = +
mass of of species kdue of species kdue of species kdue
species k to convection to diffusion to sources

## 페이지 22
ANIN_C12.qxd 29/12/2006 04:44PM Page 364
364 CHAPTER 12 CFD MODELLING OF COMBUSTION
In equation (12.77) D is the species diffusion coefficient (units m2/s). The
k
volumetric rate of generation (or destruction) of a species due to chemical
reactions appears as the source (or sink) term M in each of their transport
k
equations. For kinetically controlled combustion this term takes the form of
(12.71) or (12.73). A wide variety of different models are available for phys-
ically controlled combustion. The most important ones will be discussed in
the remaining sections of this chapter.
It is common practice to assume a single diffusion coefficient for all
species. This simplifies equation (12.77) to
∂ ∂ ∂A ∂Y D
(ρY ) + (ρuY ) = BρD kE +M (12.78)
∂t k ∂x i k ∂x C ∂x F k
i i i
Whilst the single D assumption is not always accurate (and may in fact be
quite inaccurate) it is very attractive, since it enables far-reaching simplifica-
tion of combustion calculations.
Energy equation
In combusting flows the temperature depends on the thermodynamic state
and the composition of the mixture. Some combustion models do not require
a transport equation for enthalpy: for example, in the laminar flamelet model
the temperature is obtained from the laminar flamelet library curves. Other
combustion submodels, however, require the solution of the transport equa-
tion for enthalpy. Chemical energy is released as heat during combustion,
and the resulting enthalpy is obtained by solving its transport equation:
∂ ∂ ∂ G µ ∂h A 1 1 D ∑ N ∂Y J ∂p
(ρh) + (ρuh) = H +µB − E h kK + +S (12.79)
∂t ∂x i i ∂x i I σ h ∂x i CSc k σ h F k=1 k ∂x i L ∂t rad
Net rate of Net rate of
Net rate of Net rate of
Net rate of increase of increase of
Rate of increase of increase of
decrease of enthalpy due enthalpy due to
change of + = + + enthalpy due + enthalpy due
enthalpy due to diffusion mass diffusion
enthalpy to pressure to radiative
to convection along gradients along gradients of
work heat transfer
of enthalpy species concentration
In equation (12.79) the source term of the transport equation for enthalpy
S is the radiation loss or gain. Viscous energy dissipation is normally
rad
assumed to be negligible in low Mach number combusting flows. Here his
the mixture enthalpy per unit mass and h is the specific enthalpy of species
k
k, and the summation is carried out over all N species considered in the
chosen reaction mechanism. The mixture Prandtl number is σ, and Sc is
h k
the species Schmidt number, Sc ≡µ/ρD .
k k
The Prandtl number (σ) is defined as
h
c µ Rate of momentum transport
σ = p =
h
k Rate of energy transport

## 페이지 23
ANIN_C12.qxd 29/12/2006 04:44PM Page 365
12.14 GOVERNING EQUATIONS FOR COMBUSTING FLOWS 365
The Lewis number is defined as
k Rate of energy transport
Le ≡ =
k ρcD Rate of mass transport
p k
The Schmidt number is defined as
µ Rate of momentum transport
Sc = =
k ρD Rate of mass transport
k
=Leσ
h
If a single diffusion coefficient is used, i.e. D =Dfor k=1, 2,..., N, as in
k
equation (12.78), equation (12.79) can be written as
∂ ∂ ∂ G µ ∂h µ A σ D
∑
N ∂Y J
(ρh) + (ρuh) = H + B h − 1E h kK
∂t ∂x i i ∂x i I σ h ∂x i σ h C Sc F k=1 k ∂x i L
∂p
+ +S (12.80)
∂t rad
This can be rewritten as
∂ ∂ ∂ G µ ∂h µA 1 D ∑ N ∂Y J
(ρh) + (ρuh) = H + B − 1E h kK
∂t ∂x i i ∂x i I σ h ∂x i σ h CLe F k=1 k ∂x i L
∂p
+ +S (12.81)
∂t rad
Therefore for the case where the Lewis number is unity the enthalpy equa-
tion simplifies to
∂ ∂ ∂ G µ ∂hJ ∂p
(ρh) + (ρuh) = H K + +S (12.82)
∂t ∂x i ∂x Iσ ∂x L ∂t rad
i i h i
For low-speed flows ∂p/∂t can be neglected, so under the assumptions of
low-speed flow, single diffusion coefficient and unity Lewis number, the
enthalpy equation has exactly the same form as the general transport equa-
tion (2.39). Furthermore, if the radiation source term S is also small, the
rad
enthalpy is a conserved or passive scalar.
It should be noted that the thermal conductivity of individual species is a
function of temperature and can be evaluated using a polynomial expression
in the form k=a+bT +cT2+dT3, where coefficients are available in Reid
et al. (1987), for example. The binary diffusion coefficient D between two
ij
species depends on the concentration of components, temperature and pres-
sure. Key equations which can be used to calculate D and then a single
ij
diffusion coefficient D (diffusion coefficient of a single species to the rest
k
of mixture) are also available in the above reference. D also depends on
k
individual species concentrations, temperature and pressure. The reader is
also referred to Paul and Warnatz (1998), who describe transport models
for species properties. In combustion modelling the required diffusion co-
efficients and other transport properties are calculated (in detailed chemistry

## 페이지 24
ANIN_C12.qxd 29/12/2006 04:44PM Page 366
366 CHAPTER 12 CFD MODELLING OF COMBUSTION
models) using packages such as CHEMKIN (Kee et al., 1996). Just to quote
some rough values, thermal conductivities of H , H O and CO at 1000 K are
2 2 2
0.4 W/mK, 0.097 W/mK and 0.068 W/mK respectively. Approximate
values of binary diffusion coefficient for mixtures with N at 1000 K reported
2
in Paul and Warnatz (1998) are: for H–N , 10 cm2/s; for OH–N , 2 cm2/s;
2 2
and for O –N , 1.5 cm2/s. Lewis numbers for species in an H /air mixture
2 2 2
in a one-dimensional laminar flame calculation evaluated at the maximum
species mass fraction location are shown in Table 12.3. Apart from species H
and H , other species have Lewis numbers close to 1.0. These values are
2
presented for information only, and the actual values should be evaluated
case by case depending on local conditions. The reader is also referred to
Clarke (2002) for further details on the calculation of Lewis numbers for
various fuel/air mixtures.
Table 12.3 Lewis numbers for species evaluated in H/air combustion
2
N O H OH O H HO HO
2 2 2 2 2 2
0.920 1.052 0.200 0.726 0.700 0.175 0.995 1.005
Other relationships
The total of mass fractions of fuel, oxidant and inert species is equal to 1, so
all species
∑
Y =1 (12.83)
k
k
where krepresents species.
The temperature can be calculated from the enthalpy by means of
fuel species
∑
h − Y ∆h
k fk
T= k (12.84)
O
p
where ∆h is the enthalpy of combustion.
fu
The average value of the specific heat O is defined as follows:
p
T
(cid:1)
1
O = c dT (12.85)
p (T−T ) p
ref
T0
Here
all species
∑
c ≡ Y c
p k p,k
k
and c is the specific heat of species k. Polynomial fits for temperature-
p,k
dependent c for various species are available in various texts: see for
p,k
example Cengel and Boles (2002).
The local density of the mixture is dependent on pressure, reactant and
product concentrations and on the mixture temperature. Its value can be
calculated from the following equation of state:

## 페이지 25
ANIN_C12.qxd 29/12/2006 04:44PM Page 367
12.15 THE SIMPLE CHEMICAL REACTING SYSTEM 367
p
ρ=
all species
R T ∑ Y k (12.86)
u
(MW)
k k
where (MW) is the molecular weight of species kand R is the universal gas
k u
constant (8.314 kJ/kmol.K).
The flow field is in turn affected by changes in temperature and density,
so in addition to the species and enthalpy equations we must solve all the
flow equations. The resultant set of transport equations can be very large.
Models that consider many intermediate reactions require vast computing
resources, so simple models that incorporate only a few reactions are often
preferred in CFD-based combustion procedures. The simplest known pro-
cedure is the simple chemical reacting system (SCRS; see Spalding, 1979),
which is described below in some detail. Other approaches of modelling
turbulent combustion, such as the eddy break-up model and the laminar
flamelet model, are discussed later.
12.15 The simple
If we are concerned with the global nature of the combustion process
chemical reacting
and with final major species concentrations only, the detailed kinetics is
system (SCRS)
unimportant and a global one-step, infinitely fast, chemical reaction can be
assumed where oxidant combines with fuel in stoichiometric proportions to
form products:
1 kg of fuel +skg of oxidant →(1 +s) kg of products (12.87)
For methane combustion the equation becomes
CH +2O →CO +2H O
4 2 2 2
1 mol of CH 2 mol of O 1 mol of CO 2 mol of H O
4 2 2 2
64 A 64D
1 kg of CH + kg of O → B1 + E kg of products
4 2
16 C 16F
The stoichiometric oxygen/fuel ratio by mass s is equal to 64/16 = 4 for
methane combustion. However, equation (12.87) also shows that the rate of
consumption of fuel during stoichiometric combustion is 1/stimes the rate
of consumption of oxygen, i.e.
1
M = M
fu ox
s
In the SCRS infinitely fast chemical reactions are assumed and the inter-
mediate reactions are ignored. The transport equations for fuel and oxygen
mass fraction are written as
∂(ρY )
fu +div(ρY u) =div(Γ grad Y ) +M (12.88)
∂t fu fu fu fu
∂(ρY )
ox +div(ρY u) =div(Γ grad Y ) +M (12.89)
∂t ox ox ox ox
where Γ =ρD and Γ =ρD .
fu fu ox ox

## 페이지 26
ANIN_C12.qxd 29/12/2006 04:44PM Page 368
368 CHAPTER 12 CFD MODELLING OF COMBUSTION
The oxidant stream will have nitrogen which remains unaffected during
simple combustion; the mass fraction of inert species (Y ) remains the same
in
before and after combustion. Local values of Y are determined by mixing
in
only, since the inert species does not take part in combustion (unless forma-
tion of NO is considered). Since the mass fraction of products Y =1 −(Y
pr fu
+Y +Y ) it is unnecessary to solve a separate equation for Y .
ox in pr
It is possible to reduce the number of transport equations even further by
introducing a variable defined as follows:
φ=sY −Y (12.90)
fu ox
Application of the single diffusion coefficient assumption, Γ =Γ =ρD=Γ ,
fu ox φ
allows us to subtract equation (12.89) from stimes equation (12.88) and com-
bine the result into a single transport equation for φ:
∂(ρφ)
+div(ρφu) =div(Γ grad φ) +(sM −M ) (12.91)
∂t φ fu ox
From the one-step reaction assumption (12.87), we have M = (1/s)M ,
fu ox
giving (sM −M ) =0, and equation (12.91) reduces to
fu ox
∂(ρφ)
+div(ρφu) =div(Γ grad φ) (12.92)
∂t φ
Hence, φis a passive scalar; it obeys the scalar transport equation without
source terms. A non-dimensional variable ξcalled the mixture fraction
may be defined in terms of φas follows:
φ−φ
ξ= 0 (12.93)
φ −φ
1 0
where suffix 0 denotes the oxidant stream and 1 denotes the fuel stream. The
local value of ξequals 0 if the mixture at a point contains only oxidant and
equals 1 if it contains only fuel.
Equation (12.93) may be written in expanded form as
[sY −Y ] −[sY −Y ]
ξ= fu ox fu ox 0 (12.94)
[sY −Y ] −[sY −Y ]
fu ox 1 fu ox 0
If the fuel streamhas fuel onlywe have
[Y ] =1 [Y ] =0 (12.95)
fu 1 ox 1
and if the oxidant stream contains no fuelwe have
[Y ] =0 [Y ] =1 (12.96)
fu 0 ox 0
In such conditions equation (12.94) may be simplified as follows:
[sY −Y ] −[−Y ] sY −Y +Y
ξ= fu ox ox 0= fu ox ox,0 (12.97)
[sY ] −[−Y ] sY +Y
fu 1 ox 0 fu,1 ox,0
In a stoichiometric mixture neither fuel nor oxygen is present in the prod-
ucts, and the stoichiometricmixturefractionξ may be defined as
st

## 페이지 27
ANIN_C12.qxd 29/12/2006 04:44PM Page 369
12.15 THE SIMPLE CHEMICAL REACTING SYSTEM 369
Y
ξ = ox,0 (12.98)
st sY +Y
fu,1 ox,0
Fast chemistry implies that, at a certain location with a leanmixture, there
is an excess of oxidant and no fuel is present in the products. Hence Y =0
fu
if Y >0, so
ox
−Y +Y
if ξ<ξ then ξ= ox ox,0 (12.99)
st sY +Y
fu,1 ox,0
Conversely, in a richmixturethere is a local excess of fuel in the mixture
and there is no oxidant in the products. Hence Y =0 if Y >0, so
ox fu
sY +Y
if ξ>ξ then ξ= fu ox,0 (12.100)
st sY +Y
fu,1 ox,0
The above formulae show that the mass fractions of the fuel Y and oxygen
fu
Y are linearly related to the mixture fraction ξ. This is illustrated graph-
ox
ically in Figure 12.2.
Figure 12.2 Mixing and
fast reaction between fuel
and oxidant streams
(SCRC relationships)
By equation (12.93) ξis linearly related to φso the mixturefractionis
also a passive scalar and obeys the transportequation
∂(ρξ)
+div(ρξu) =div(Γ grad ξ) (12.101)
∂t ξ
Written in suffix notation the transport equation for the mixture fraction is
∂ ∂ ∂ A ∂ξD
(ρξ) + (ρuξ) = BΓ E (12.102)
∂t ∂x i ∂x C ξ∂x F
i i i
To obtain the distribution of ξwe solve equation (12.101) subject to suitable
boundary conditions, e.g. mixture fractions of fuel and oxidant inlet streams
are known, zero normal flux of ξacross solid walls and zero-gradient out-
flow conditions. Given the resulting mixture fraction we can rearrange

## 페이지 28
ANIN_C12.qxd 29/12/2006 04:44PM Page 370
370 CHAPTER 12 CFD MODELLING OF COMBUSTION
equations (12.98)–(12.100) to give values for oxygen and fuel mass fractions
after combustion:
ξ−ξ
ξ ≤ξ<1: Y =0 Y = stY (12.103)
st ox fu 1 −ξ fu,1
st
ξ −ξ
0 <ξ<ξ: Y =0 Y = st Y (12.104)
st fu ox ξ ox,0
st
The reactants may be accompanied by inert species such as N , which do not
2
take part in the reaction. The mass fraction of inert species in the mixture
varies linearly with ξ, as illustrated in Figure 12.2. Simple geometry gives the
total mass fraction of the inert species Y after combustion at any value of ξas
in
Y =Y (1 −ξ) +Y ξ (12.105)
in in,0 in,1
The mass fraction of products (Y ) of combustion may be obtained from
pr
Y =1 −(Y +Y +Y ) (12.106)
pr fu ox in
The above equations, (12.101) and (12.103)–(12.106), represent the SCRS
model.
When the reaction products contain two or more species, the ratio of the
mass fraction of each component to the total product mass fraction is known
from the equation for the chemical reaction and can be used to deduce the
mass fraction of different product components. For example, consider the
burning of methane with O :
2
CH + 2O ⎯→ CO + 2H O
4 2 2 2
1 mol of CH 2 mol of O 1 mol of CO 2 mol of H O
4 2 2 2
16 kg 64 kg 44 kg 36 kg
Ratio of CO in products by mass (r ) =44/80
2 CO
Ratio of H O in products by mass (r 2) =36/80
2 HO
2
If the product mass fraction from equation (12.106) is Y then the CO mass
pr 2
fraction in the products is Y r and the H O mass fraction is Y r .
pr CO 2 pr HO
The SCRS model has made th2e following simplifications: (i) singl2e-step
reaction between fuel and oxidant, and (ii) one reactant which is locally in
excess causes all the other reactant to be consumed stoichiometrically to
form reaction products. These assumptions fix algebraic relationships between
the mixture fraction ξand all the mass fractions Y , Y , Y and Y . As a
fu ox in pr
consequence of the additional assumption that the mass diffusion coefficients
of all species are equal, it is only necessary to solve one partial differential
equation for ξto calculate combusting flows rather than individual partial
differential equations for the mass fraction of each species. An example which
uses this approach for combustion calculations is presented below.
12.16 Modelling of a
laminar diffusion The SCRS model can be readily applied to calculate temperatures and
flame --- an example species distribution in laminar diffusion flames. For example, consider the
axisymmetric laminar non-premixed diffusion flame geometry shown in

## 페이지 29
ANIN_C12.qxd 29/12/2006 04:44PM Page 371
12.16 MODELLING OF A LAMINAR DIFFUSION FLAME 371
Figure 12.3 Schematic of the
problem considered
Figure 12.3. The geometry considered here is an experimental configuration
which has been used by a number of studies documented in the combustion
literature (Bennett and Smooke, 1998; Smooke et al., 1990; Smooke, 1991).
For illustrative purposes we use our own operating conditions to formulate
the problem in this example. The radius of the fuel jet (r) is 0.2 cm and the
i
radius (r) of the co-flowing air jet is 2.5 cm. The thickness of the wall
o
between fuel and air streams is 0.05 cm. Let us consider burning of a pure
methane jet with co-flowing air. Both fuel and air velocities are taken as
0.2 m/s (20 cm/s) and enter at a temperature of 25°C (298 K). We would
like to calculate the resulting flame temperature and major species distribu-
tion field for this flame.
For calculation convenience we turn the actual geometry shown in Fig-
ure 12.3 through 90°. The axisymmetry of the problem allows us to adopt
a cylindrical x,r coordinate system to formulate the problem as shown in
Figure 12.4. Here we use uto represent the velocity component in the (axial)
x-direction and vto represent the velocity component in the (radial) r-direction.
Figure 12.4 A part of the
computational geometry
The governing equations for steady laminar flow in cylindrical coordinates
in expanded form are as follows (see section 2.3 and section 12.14 above).
Continuity
∂(ρu) 1∂(ρrv)
+ =0 (12.107)
∂x r ∂r

## 페이지 30
ANIN_C12.qxd 29/12/2006 04:44PM Page 372
372 CHAPTER 12 CFD MODELLING OF COMBUSTION
Momentum equations
u-momentum equation:
∂ ∂ ∂ ∂ ∂p
(ρruu) + (ρruv) = (rτ ) + (rτ ) −r (12.108)
∂x ∂r ∂x xx ∂r rx ∂x
v-momentum equation
∂ ∂ ∂ ∂ ∂p
(ρruv) + (ρrvv) = (rτ ) + (rτ) −r (12.109)
∂x ∂r ∂x rx ∂r rr ∂r
The shear stress terms are
G ∂u 2 J
τ =µH2 − (div u)K (12.110)
xx I ∂x 3 L
G ∂v 2 J
τ =µH2 − (div u)K (12.111)
rr I ∂r 3 L
G ∂u ∂vJ
τ =µH2 + K (12.112)
rx I ∂r ∂xL
∂u 1 ∂
div u= + (rv) (12.113)
∂x r ∂r
The momentum equations can be rearranged in the usual form as follows:
u-momentum equation:
∂ ∂ ∂A ∂uD ∂A ∂uD ∂p
(ρruu) + (ρruv) = Brµ E + Brµ E −r +S (12.114)
∂x ∂r ∂xC ∂xF ∂rC ∂rF ∂x u
v-momentum equation:
∂ ∂ ∂A ∂vD ∂A ∂vD ∂p
(ρruv) + (ρrvv) = Brµ E + Brµ E −r +S (12.115)
∂x ∂r ∂xC ∂xF ∂rC ∂rF ∂r v
where S and S contain the additional terms arising from the shear stress terms.
u v
Enthalpy equation
∂ ∂ ∂A ∂hD ∂A ∂hD
(rρuh) + (rρvh) = BrD E + BrD E +S (12.116)
∂x ∂r ∂xC h∂xF ∂rC h∂rF rad
where D is the diffusion coefficient for enthalpy (i.e. D ≡α=k/ρC) and
h h p
S is the radiation source (or sink) term.
rad
Combustion model
Here we use the SCRC model described in section 12.15. The assumption of
fast chemistry gives the stoichiometric equation
CH +2(O +3.76N ) ⎯→CO +2H O +2 ×3.76N (12.117)
4 2 2 2 2 2

## 페이지 31
ANIN_C12.qxd 29/12/2006 04:44PM Page 373
12.16 MODELLING OF A LAMINAR DIFFUSION FLAME 373
The stoichiometric oxygen/fuel ratio by mass is
s=2 ×(MW) /(MW) =2 ×32/16 =4
O CH
2 4
The mass fraction of fuel in the fuel stream is
Y =1.0
fu,1
The mass fraction of oxygen in the air stream is
Y =0.233 (see section 12.5)
ox,0
The mass fraction of inert (N ) in the air stream is
2
Y =0.767
in,0
We solve the following equation for the mixture fraction:
∂ ∂ ∂A ∂ξD ∂A ∂ξD
(rρuξ) + (rρvξ) = BrΓ E + BrΓ E (12.118)
∂x ∂r ∂xC ξ∂xF ∂rC ξ∂rF
The mass fractions for the fuel and oxidant streams are as follows.
Since the fuel stream has fuel only we have
[Y ] =1 [Y ] =0 (12.119)
fu 1 ox 1
The oxidant stream contains no fuel but oxygen and nitrogen (inert), so
we have
[Y ] =0 [Y ] =0.233 [Y ] =0.767 (12.120)
fu 0 ox 0 in 0
The stoichiometric mixture fraction from equation (12.98) is
0.233
ξ = =0.055 (12.121)
st 4 ×1 +0.233
If heat loss by radiation is considered in the calculation then solution of
the enthalpy equation is required. If radiation is considered to be negligible
then it can be seen that from equation (12.116) when S =0 the transport
rad
equation for enthalpy becomes another conserved scalar equation like the
mixture fraction equation. Therefore the enthalpy and mixture fraction are
both scalars and linearly related. The relationship can be further illustrated
as below.
Taking the reference temperature as zero, enthalpy is defined as
h=Y ∆h +cT (12.122)
fu fuel p
Enthalpy of the fuel stream where ξ=1 is
h =Y ×∆h +Y c ×T
fu,in fu,in fuel fu p fu,in
where ∆h is the enthalpy or formation of fuel. Enthalpy of the air stream
fuel
where ξ=0 is
h =c ×T
air,in p air,in
If we define a non-dimensional enthalpy as
h−h
h* = air,in (12.123)
h −h
fu,in air,in
we can see that when ξ=0, Y =0, h* =0 and when ξ=1, Y =1, h* =1. If
fu fu
we make the usual simplifying assumptions – single diffusion coefficient, unity

## 페이지 32
ANIN_C12.qxd 29/12/2006 04:44PM Page 374
374 CHAPTER 12 CFD MODELLING OF COMBUSTION
Lewis number, negligible pressure work and radiation source – for enthalpy
transport, the governing transport equations for the enthalpy and mixture
fraction are the same (both variables are passive scalars). The resulting spatial
distributions of non-dimensional enthalpy h* and mixture fraction will be
the same (it is easy to verify that the boundary conditions for both variables
are also identical in this problem). Therefore, we do not need to solve a sep-
arate transport equation for enthalpy, but can calculate this variable from
h−h
ξ=h* = air,in (12.124)
h −h
fu,in air,in
Once the enthalpy value and mass fraction of fuel Y are known from SCRC
fu
relationships, the temperature is obtained from
h−Y (∆h )
T= fu fu (12.125)
O
p
The boundary conditions for the problem are: at the inlet, u =0.2 m/s
in
for both fuel and air streams; ξ = 1.0 for the fuel stream; and ξ = 0.0
fu air
for the air stream. Zero-velocity and zero-mixture-fraction-gradient wall
boundary conditions are used at all solid walls and a constant pressure
boundary condition is imposed on open boundaries with pressure set to
ambient. At the symmetry axis all gradients are set to zero.
Solution of the fluid flow equations and the mixture fraction equation
gives the distribution of mixture fraction which defines the flame structure
and species distribution. Equations (12.103) and (12.104) are used to obtain
species mass fractions. Equations (12.124) and (12.125) give the enthalpy and
temperature fields. Using pressure and temperature the density field is
obtained from (12.86). Because of the coupled nature of the equations, the
entire solution process is iterative. Figure 12.5 shows some typical results
obtained from this simulation. To highlight the consequences of the fast
chemistry assumption of the SCRS model we show radial profiles of tem-
perature and species mass fraction at three different points along the axis as
well as the temperature contours in Figure 12.5. The stoichiometric contour
corresponds with the contour of maximum temperature and defines the
flame. In the region inside the stoichiometric contour ξ>ξ, so by condition
st
(12.103) fuel exists here without oxidant. On the other hand, outside the
stoichiometric contour ξ<ξ, so by (12.104) no fuel can exist. At the axial
st
location (a) where ξ>ξ the radial profiles show no oxygen near the axis, and
st
fuel which gets completely consumed at the ξ contour. At axial location (b)
st
where centreline ξ=ξ neither fuel nor oxygen is present and the tempera-
st
ture is at a maximum. At axial location (c) where centreline ξ< ξ no fuel
st
exists and the temperature is lower.
Calculations with finite rate chemistry
To include finite rate and detailed chemistry in this combustion calculation
one has to consider a detailed mechanism and solve many species transport
equations of the form
∂ ∂ ∂A ∂Y D ∂A ∂Y D
(rρuY ) + (rρvY ) = BrρD kE + BrρD kE+rM (12.126)
∂x k ∂x k ∂xC k ∂x F ∂rC k ∂r F k
where M is the rate of generation of species k, which is determined from
k
chemical kinetic expressions such as (12.69)–(12.71). Numerical solutions

## 페이지 33
ANIN_C12.qxd 29/12/2006 04:44PM Page 375
12.16 MODELLING OF A LAMINAR DIFFUSION FLAME 375
Figure 12.5 Calculated flame structure of a laminar diffusion flame
including detailed and finite rate chemistry result in some variations to the
curves shown in Figure 12.5. The main difference is an overlap of fuel and
oxygen profiles and small curvature around the stoichiometric mixture frac-
tion showing a corresponding drop in temperature: see Warnatz et al. (2001).
Comprehensive combustion calculations for this geometry (for different
operating conditions) including detailed chemistry can be found in Smooke
et al. (1990), Bennett and Smooke (1998), Smooke and Bennett (2001).
The method presented above illustrates how CFD can be used for laminar
non-premixed combustion calculations. Unfortunately, the fast chemistry
assumption does not give adequate details of minor species, since it is neces-
sary to include more detailed chemistry and finite rate kinetics for a more
comprehensive account of combustion. Prediction of pollutants, such as
NO discussed later in this chapter, inevitably requires inclusion of transport
x
equations for the most important minor species.

## 페이지 34
ANIN_C12.qxd 29/12/2006 04:44PM Page 376
376 CHAPTER 12 CFD MODELLING OF COMBUSTION
12.17 CFD calculation
of turbulent non- The CFD calculation of turbulent non-premixed combustion is not as
premixed combustion straightforward as laminar calculations, even with the fast chemistry assump-
tion. In Chapter 3 we showed that Reynolds averaging and modelling of
the resulting averages of fluctuating product terms made it possible to
predict incompressible turbulent flow fields. Equations governing turbulent
non-premixed combustion also require averaging and modelling. The first
problem that needs to be addressed is the fact that strong and highly localised
heat generation in combusting flows causes the density to vary as a function
of position in combusting flows. There will also be density fluctuations if the
flow is turbulent. The Reynolds decomposition of a general flow variable is
as follows:
φ=2+φ′
For the variables in a reacting flow this yields
u =R +u′
i i i
p=Q+p′
ρ=4+ρ′
h=P+h′
T=E+T′
Y =F +Y′
k k k
It is easy to demonstrate that the presence of density fluctuations gives
rise to additional terms when Reynolds averaging is used. For example,
consider the instantaneous continuity equation in suffix notation:
∂ρ ∂(ρu)
+ i =0 (12.127)
∂t ∂x
i
After substituting for uand ρthe Reynolds-averaged equation is
∂4 ∂(4R) ∂(ρ′u′)
+ i + i =0 (12.128)
∂t ∂x ∂x
i i
Compare this with the Reynolds-averaged equation for a constant density
flow:
∂ρ ∂
+ (ρR) =0 (12.129)
∂t ∂x i
i
The additional term ∂(ρ′u′)/∂x in equation (12.128) arises from correla-
i i
tions between the velocity and density fluctuations in a reacting flow and
has to be modelled. Many more terms of this type appear in the Reynolds-
averaged momentum, scalar and species transport equations.
To reduce the number of separate terms requiring modelling in reacting
flows with variable density, we use a density-weighted averaging procedure
known as Favreaveraging (Favre, 1969; Jones and Whitelaw, 1982).
In Favre averaging the density-weighted mean velocity is defined as
follows:
ρu
U= (12.130)
4

## 페이지 35
ANIN_C12.qxd 29/12/2006 04:44PM Page 377
12.17 CFD OF TURBULENT NON-PREMIXED COMBUSTION 377
The instantaneous velocity uis written as
ρu
u=U+u″= +u″ (12.131)
4
In contrast to the Reynolds decomposition, where u′represents a turbulent
velocity fluctuation, the quantity u″ also includes effects of density fluctu-
ations. If the flow is incompressible, the density is constant, so U = R and
u″≡u′.
In the convective term of the continuity equation we require the Favre
average of the product ρu. Multiplying equation (12.131) by ρwe obtain
i
ρu=ρ(U+u″) =ρU+ρu″ (12.132)
Time averaging equation (12.132) we get
ρu=4U+ ρu″ (12.133)
By definition of Favre averaging (12.130) and equation (12.131) we have
ρu″ =0. Now the Favre-averaged continuity equation can be obtained:
∂4 ∂(4U)
+ i =0 (12.134)
∂t ∂x
i
Unlike Reynolds-averaged continuity equation (12.128), this equation has
the same form as the original continuity equation (12.127) and Reynolds-
averaged constant densityequation (12.129), except that the mean velocity is
the density-weighted Favre-averaged velocity.
The Favre-averaging procedure considerably reduces the number of
additional terms in the other flow equations arising from density fluctua-
tions. For example, Reynolds averaging of the convective term ρuu in the
i j
momentum equation gives
ρuu = (ρ+ρ′)(R +u′)(R +u′)
i j i i j j
=4RR +4u′v′ +R ρ′u′+Rρ′u′+ ρ′u′u′ (12.135)
i j i j j i i j
Favre averaging of the same term leads to
ρuu = ρ(U +u″)(U +u″)
i j i i j j
=4UU + ρu″u″ (12.136)
i j i j
This clearly highlights the reduced number of unknown correlations
(products of fluctuating quantities) which is the main advantage of Favre
averaging. However, care must be taken when comparing results obtained
by solving Favre-averaged equations with experimental data which are often
time averaged. Therefore, conversion of Favre-averaged quantities to time-
averaged quantities is necessary. In order to do this we need to know more
about the turbulent fluctuations first. In section 12.19 we look at descriptions
of turbulent fluctuations in terms of probability density functions and address
the conversion problem.
Favre averaging of other governing equations, i.e. momentum, energy,
scalar transport and species transport, yields the same form of equations as
those for turbulent constant density flows. Without presenting the deriva-
tions we give the set of Favre-averaged equations used to model turbulent
combusting flows as follows:

## 페이지 36
ANIN_C12.qxd 29/12/2006 04:44PM Page 378
378 CHAPTER 12 CFD MODELLING OF COMBUSTION
Continuity
∂4 ∂
+ 4U =0 (12.137)
∂t ∂x i
i
Momentum
∂ ∂ ∂Q ∂
(4U) + (4UU) =− + (8 − ρu″u″) (12.138)
∂t i ∂x i j ∂x ∂x ij i j
j i j
Enthalpy
∂ ∂ ∂ A ∂âD
(4â) + (4Uâ) = BΓ E +D (12.139)
∂t ∂x j ∂x C h∂x F h
j j j
where Γ =(µ/σ+µ/σ), σ =turbulent Prandtl number
h t h h
Mixture fraction in conserved scalar transport model for combustion
∂ ∂ ∂ A ∂7D
(47) + (4U7) = BΓ E (12.140)
∂t ∂x j ∂x C ξ∂x F
j j j
where Γ =(µ/σ+µ/σ), σ =turbulent Schmidt number
ξ t ξ ξ
In the two equations (12.139) and (12.140) the familiar gradient diffusion
treatment has been used to model averages of products of fluctuating quan-
tities, which we first encountered in section 3.7, where it was used to model
the diffusion of turbulence quantities kand ε.
Species conservation (used in more detailed combustion models) is
given by
∂ ∂ ∂ A ∂J D ∂ A ∂Y″D
(4J ) + (4UJ ) = B4D k − ρY″u″E + B4D kE +Ä (12.141)
∂t k ∂x j k ∂x C k ∂x k j F ∂x C k ∂x F k
j j j j j
where Ä is the Favre-averaged reaction rate.
k
Again applying gradient diffusion assumption gives
µ ∂J
ρY″u″ = t k
k i σ ∂x
k j
where σ is the turbulent Schmidt number for species k, and like other
k
equations we may write the transport equation for species as
∂ ∂ ∂A ∂J D ∂ A ∂Y″D
(4J ) + (4UJ ) = BΓ kE + B4D kE +Ä (12.142)
∂t k ∂x j k ∂x C k ∂x F ∂x C k ∂x F k
j j j j j
where Γ =(µ/σ+µ/σ). Note here that subscript kstands for species and
k t k
should not be confused with the similar effective diffusion coefficient used in
the turbulent kinetic energy equation.

## 페이지 37
ANIN_C12.qxd 29/12/2006 04:44PM Page 379
12.17 CFD OF TURBULENT NON-PREMIXED COMBUSTION 379
It should be noted that the Favre-averaged forms of the continuity,
enthalpy and mixture fraction equations do not include terms involving
density fluctuations. The Reynolds stress terms in the momentum equations
are modelled using the same turbulence modelling approach used for time-
averaged equations. For example, the k–εmodel may be applied with Favre-
averaged transport equations for k and ε. The species equation has been
simplified as much as possible, but the involvement of species and density in
the reaction rate term still poses a problem.
The main problem in turbulent combusting flows arises from the averag-
ing of the species generation term N . In section 12.11 it was shown that for
k
a simple single-step reaction of the form
Fuel +s Oxident →(1 +s)Products (12.143)
A −E D
M =ATαC Cs expB aE (12.144)
fu fu ox
CR TF
u
For the simplest case where s = 1, and after converting concentrations into
mass fractions (see (12.73)), the generation or consumption of the species
fuel may be written as
A −E D
M =A′ρ2TαY Y expB aE (12.145)
fu fu ox
CR TF
u
where ‘fuel’ and ‘oxidant’ are the reactants, and A′ is an appropriately
modified constant. This expression can be written in a slightly different
form as
A−T D
M =A′ρ2TαY Y expB AE (12.146)
fu fu ox
C T F
where T = E /R is called the activation temperature and ρis density.
A a u
As the reaction rate is highly non-linear, the average reaction rate N cannot
fu
be easily expressed as a function of Favre-averaged mass fractions J , J ,
fu ox
the mean density 4and mean temperature E. A Taylor series expansion may
be used for the exponential term as an attempt to obtain an averaged expres-
sion for N . Using such an approach, the averaged reaction rate may be
fu
expressed as (Veynante and Vervisch, 2002)
A−T D
N =−A42HαJ J expB AE
fu fu ox C H F
G Y″Y″ AY″T″ Y″T″D
× H1 + fu ox + (P +Q )B fu + ox E
I J J 1 1 C J H J H F
fu ox fu ox
AY″T″2 Y″T″2D J
+(P +Q +P Q )B fu + ox E +...K (12.147)
2 2 1 1 C J H2 J H2F L
fu ox
In this expression P , Q , P , Q etc. are terms of a series defined in Veynante
1 1 2 2
and Vervisch (2002). We do not intend to describe the details here; the
expression is shown just to highlight the complexity of the attempt to find an

## 페이지 38
ANIN_C12.qxd 29/12/2006 04:44PM Page 380
380 CHAPTER 12 CFD MODELLING OF COMBUSTION
average. It can be seen that the averaged N term in this way involves corre-
fu
lations such as Y″T″, Y″T″, Y″T″2etc. and many others that are unknown
fu ox fu
and have to be modelled. The above expression is for a single-step reaction.
When realistic chemical schemes are introduced involving many reactions
and species, it is not possible to model these correlations. Therefore, a
considerable amount of effort in turbulent combustion modelling has been
directed towards the development of models which avoid the solution of
averaged species mass fraction equations (12.142).
12.18 SCRS model
for turbulent Given the difficulties associated with modelling of the source term in the
combustion Favre-averaged species transport equation (12.142) it is useful to examine
the effect of turbulent fluctuations on the SCRS model. It was shown earlier
how the fast chemical reaction using a single-step reaction could be used to
develop a transport equation for the mixture fraction. In turbulent flows the
mixture fraction equation (12.102) applies in Favre-averaged form (12.140).
A Favre-averaged equation for enthalpy is also solved in cases where radi-
ation effects and other heat losses are significant. However, the calculation
of mean species and temperature using the field values of 7 and â is not
as straightforward as in the laminar case. The linear relationships between
species mass fractions and mixture fraction relate to instantaneous mixture
fraction ξand not to 7. The same applies to the temperature–enthalpy
relationship. To calculate mean values of J and H we need to know the
i
statistics of the variables (T, Y, ρ) as a function of ξ. This is where an
i
approach known as the probability density function method is used in
turbulent combustion calculations.
12.19 Probability
density function We introduce a statistical approach to calculate mean quantities using the
approach probability density function (pdf) for fluctuating scalars (in this case the mix-
ture fraction). Mathematical descriptions of probability density functions
can be found in popular mathematics textbooks (see e.g. Evans et al., 2000)
and we do not attempt to describe the fundamentals here. The reader is also
referred to Kuo (1986) for further details and applications to the theory of
turbulent combustion.
For a random variable φ, the probability function F (ψ) is defined as
φ
F (ψ) =Prob{φ<ψ} (12.148)
φ
where Prob{φ<ψ} is the probability that φis smaller than given value ψ.
Then the probabilitydensityfunctionP (ψ) is defined as the deriva-
φ
tive of the distribution function F (ψ):
φ
dF (ψ)
P (ψ) = φ (12.149)
φ dψ
The properties of a probability density function or pdf are
(i) P (ψ) ≥0
φ
∞
(cid:1)
(ii) P (ψ)dψ=1
φ
−∞

## 페이지 39
ANIN_C12.qxd 29/12/2006 04:44PM Page 381
12.19 PROBABILITY DENSITY FUNCTION APPROACH 381
The probability density function P(ψ) can be used to calculate the meanof
any property q(ψ) which also depends on ψin the following manner (see
Kuo, 1986):
∞
(cid:1)
á= q(ψ)P(ψ)dψ (12.150)
−∞
In the context of combustion calculations we need to define the density-
weighted probability density function G(ξ) for the mixture fraction ξat every
location. The density-weighted pdf G(ξ) and unweighted pdf P(ξ) are related
as follows:
ρ(ξ)
G(ξ) = P(ξ) (12.151)
4
According to Jones and Whitelaw (1982), the density-weighted average of
any scalar quantity φ, which is itself a function of ξ, may now be obtained
from
1
(cid:1)
É= φ(ξ)G(ξ)dξ (12.152)
0
For example, the density-weighted average of the mass fraction of species i
is given by
1
(cid:1)
J = Y (ξ)G(ξ)dξ (12.153)
k k
0
In the SCRC model the relationship between Y and ξ, i.e. Y = Y (ξ), is
k k k
known from the fast chemistry assumptions (equations (12.103)–(12.106))
or in graphical form as shown in Figure 12.2. To obtain the density-weighted
average J it is necessary to perform the integration (12.153), for which we
k
need to know the pdf G(ξ) at all locations. The form of the pdf varies for dif-
ferent types of flows. Figure 12.6 (see Bilger, 1980) shows observed pdfs at
Figure 12.6 Schematic forms of
pdfs in a turbulent jet flame

## 페이지 40
ANIN_C12.qxd 29/12/2006 04:44PM Page 382
382 CHAPTER 12 CFD MODELLING OF COMBUSTION
various locations in a jet flame. Different analytical pdfs have been used
to approximate measured distributions, but the clipped Gaussian and beta
functions have been most successful. The interested reader is referred to
Bilger and Kent (1974), Lockwood and Naguib (1975), Bilger (1976), Pope
(1976), Lockwood and Monib (1980) and Pope (1985), among others, for
further details. The beta probability function for G(ξ) is currently the most
popular among modellers and has been incorporated in combustion model-
ling procedures of all the leading commercial CFD codes. Some details of
the beta function approach are given below.
A further point to note is that problems arise when CFD results from
Favre-averaged flow equations are compared with time-averaged experimen-
tal data. Suppose, however, that we know the pdf G(ξ) and the relationships
φ(ξ) and ρ(ξ). Now we can replace u by φ/ρin definition (12.130). This
enables us to compute the time-averaged mean of scalar 2and time-averaged
density 4as follows:
1
(cid:1) φ(ξ)
2=4 G(ξ)dξ (12.154)
ρ(ξ)
0
and, using φ=1 in (12.154),
G (cid:1) 1 G(ξ) J −1
4= H dξK (12.155)
I ρ(ξ) L
0
12.20 Beta pdf
The beta pdf (β-pdf) is defined as
ξα−1(1 −ξ)β−1Γ(α+β)
G(ξ) = (12.156)
Γ(α)Γ(β)
Here Γ(z) denotes the gamma function (see Evans et al., 2000; Abramowitz
and Stegun, 1970). The shape of the β-pdf depends on the values of para-
meters αand β, which must both be positive (α> 0 and β> 0). This is
illustrated in Figure 12.7, which shows that it is possible to vary αand βto
give a reasonable match with measured pdfs such as those in Figure 12.6.
It can be shown that αand βcan be determined from the mean and vari-
ance of ξas follows:
G7(1 −7) J
α=7H −1K
I 7″2 L
α
β=(1 −7) (12.157)
7
where 7is the Favre mean of ξand 7″2is the Favre-averaged variance of ξ.
DNS calculations of pdfs in turbulent combusting flows also support the
use of a β-pdf: see for example Swaminathan and Bilger (1999). The reader
is also referred to Warnatz et al. (2001), Libby and Williams (1994), Lentini

## 페이지 41
ANIN_C12.qxd 29/12/2006 04:44PM Page 383
12.20 BETA PDF 383
Figure 12.7 Behaviour of the
beta function for different values
of αand β
(1994) and Liu et al. (2002) for further details on pdf-based combustion
calculations.
To generate the β-pdf using (12.156) and (12.157) it is necessary to solve
the Favre-averaged equation for mean mixture fraction 7 (12.140) as well
as a further transport equation for mixture fraction variance 7″2. Without
derivation we write the modelled transport equation for 7″2in suffix notation
(see Lockwood, 1977):
∂ ∂ ∂ A ∂7″2D A∂7″2D2 6
(47″2) + (4U 7″2) = BΓ E +C µB E −C ρ7″2 (12.158)
∂t ∂x j ∂x C ξ ∂x F g1 t C ∂x F g2ã
j j j j
On the left hand side of this equation we have the transient and convective
terms. All terms on the right hand side are modelled. The first term rep-
resents turbulent diffusion of mixture fraction variance along its gradients.
We note that this model takes the diffusion coefficient for mixture fraction
variance to be the same as the diffusion coefficient for mixture fraction. The
second and third terms are the source and sink terms, respectively, where
C and C are dimensionless model constants with values of 2.0 and 2.8
g1 g2
respectively.
Combining the β-pdf with the definition (12.152) of the density-weighted
mean Éof any scalar flow variable φwe may now write
1 1
(cid:1) Γ(α+β) (cid:1)
É= φ(ξ)G(ξ)dξ= φ(ξ)ξα−1(1 −ξ)β−1dξ (12.159)
Γ(α)Γ(β)
0 0
If the relationship between variable φand the instantaneous mixture frac-
tion ξis somehow known (e.g. Figure 12.2 for species mass fractions),

## 페이지 42
ANIN_C12.qxd 29/12/2006 04:44PM Page 384
384 CHAPTER 12 CFD MODELLING OF COMBUSTION
equation (12.159) can be numerically integrated for specified values of αand
β. We normally use Romberg’s method with the midpoint approximation
(Press et al., 1993). At the end points of the integration interval (ξ=0, 1) the
integrand becomes singular when the parameters αand βare less than 1.0.
This singularity can be eliminated analytically using the method suggested
by Bray et al. (1994) and Chen et al. (1994), which involves approximation of
the integration as follows:
1 1−η
(cid:1) ηα (cid:1)
É= φ(ξ)G(ξ)dξ≅ φ(0) + φ(ξ)ξα−1(1 −ξ)β−1dξ
α
0 η
ηβ
+ φ(1) (12.160)
α
where ηis a very small number (say 10−30).
Another numerical difficulty is that computed values of αand βin equa-
tions (12.157) may approach magnitudes of several hundred thousand in the
iteration process (Chen et al., 1994). This problem leads to overflow in the
calculation of G(ξ). According to the characteristics of the beta function,
G(ξ) is close to a delta function when either values of exponents αand βare
sufficiently large. To avoid the overflow when αand βare large (say above
500) we approximate G(ξ) by a delta function: G(ξ) =δ(ξ−7). The density-
weighted mean Éof scalar flow variable φis now given by
1 1
(cid:1) (cid:1)
É= φ(ξ)G(ξ)dξ= φ(ξ)δ(ξ−7)dξ=φ(7) (12.161)
0 0
Since the pdf is an assumed one – the β-pdf – this type of calculation is
sometimes called the presumed pdf approach. There are more elaborate
methods which solve transport equations to obtain the pdf. The interested
reader is referred to Pope (1990) and Dopazo (1994) for details. Although
these models are perceived to be more accurate they are currently too com-
putationally expensive to be used in engineering calculations. In contrast, the
simple fast chemistry model with presumed β-pdf provides reasonable esti-
mates of temperature and major species in turbulent combusting flows. The
main assumption in SCRS is that combustion takes place due to a one-step
irreversible reaction with fast chemistry and complete combustion. Fuel and
oxygen combine and burn completely on the stoichiometry surface: therefore
the model is also known as the flame-sheetmodel. The stoichiometric sur-
face is also the maximum temperature surface in the flame. The main disad-
vantage of the flame-sheet model is the fact that intermediate products such
as CO and H are not predicted. The absence of endothermic dissociation
2
reactions generating the minor species may lead to a substantial overpredic-
tion of temperature and major species. A discussion of the modifications to
this model to include minor species is available in Peters (1984).
12.21 The chemical
equilibrium model In section 12.8 we discussed how chemical equilibrium is used to calculate
species concentrations using simple chemical reactions. The methodology

## 페이지 43
ANIN_C12.qxd 29/12/2006 04:44PM Page 385
12.22 EDDY BREAK-UP MODEL OF COMBUSTION 385
can be extended to turbulent combustion calculations by considering inter-
mediate reactions. Dedicated chemical equilibrium calculation pro-
grams, such as CHEMKIN, can be employed to predict equilibrium species
concentrations including minor species. Species concentration profiles as
a function of mixture fraction can be generated with the aid of such equilib-
rium programs and used as an alternative to fast chemistry relationships
(Peters, 1984; Warnatz et al., 2001).
This method has been successfully used by Kent and Bilger (1973)
to predict hydrocarbon flames. Application of the equilibrium model to
gas turbine combustors by Jones and Priddin (1978) has shown overpredic-
tion of CO and H levels in fuel-rich regions. This is caused by the fact
2
that the local turbulent and diffusion time scales in practical combustor
applications are much smaller than the time required to achieve equilib-
rium. Hence, predictions based on the built-in assumption that the minor
species reactions reach equilibrium tend to overestimate minor species
levels. As a general rule, the chemical equilibrium model should only be
used in situations where the residence time is sufficiently long. However,
it is useful since minor species can be predicted and implementation
is straightforward. An alternative to the equilibrium model is the partial
equilibrium model, which assumes partial equilibrium for some species and
non-equilibrium for others. The reader is referred to Eickhoff and Grethe
(1979) for further details.
12.22 Eddy break-up
model of Another simple and very efficient model used in combustion calculations is
combustion the eddy break-up model due to Spalding (1971). In the eddy break-up
model, the rate of consumption of fuel is specified as a function of local flow
properties. The mixing-controlled rate of reaction is expressed in terms of
the turbulence time scale k/ε, where k is the turbulent kinetic energy and
εis the rate of dissipation of k. The reaction rate is equal to the turbulent
dissipation rate, which, for fuel, oxygen and products, may be expressed as
follows:
ε
Ä =−C 4J (12.162)
fu R fu
k
J ε
Ä =−C 4 ox (12.163)
ox R
s k
J ε
Ä =−C′4 pr (12.164)
pr R (1 +s)k
Note that the above expressions describe the Favre-averaged reaction rates.
The eddy break-up model solves one transport equation for the mass frac-
tion of fuel J . The individual dissipation rates (12.162)–(12.164) of fuel,
fu
oxygen and products are considered, and the model takes the actual reaction
rate of fuel to be equal to the slowest of these dissipation rates:
ε G J J J
Ä =−4 minHC J ,C ox, C′ pr K (12.165)
fu k I R fu R s R 1 +sL

## 페이지 44
ANIN_C12.qxd 29/12/2006 04:44PM Page 386
386 CHAPTER 12 CFD MODELLING OF COMBUSTION
where C and C′ are model constants. Using a different constant for the
R R
products allows the existence of the burnt gases to be taken into account.
Typical values used in the literature are C = 1.0 and C′ = 0.5. Since the
R R
above expressions contain mass fractions of fuel, oxidant and products,
initialisation of these mass fractions is required to start the calculation. In
addition to the equation for J a transport equation for mixture fraction 7is
fu
also solved to deduce the product and oxygen mass fractions using relation-
ships such as (12.103), (12.104) and (12.106).
Figures 12.8a and b show the results of Magnussen and Hjertager (1976),
who obtained good predictions of the temperature field in furnace configura-
tions with the eddy break-up model. Figure 12.9 shows a further application
of the eddy break-up approach combined with the pdf method to account for
scalar fluctuations by Gosman et al. (1978) in furnace simulations, and again
the prediction comparesvery well with the experimental data.
Figure 12.8 Results of the eddy break-up model (Magnussen and Hjertager, 1976): (a) comparison of experimental
(Lockwood and Odidi, 1975) and eddy break-up model predictions of local mean temperatures of a city gas diffusion
flame (Re=24000); (b) experimental mean temperatures on the axis of the city gas diffusion flame (Re=24000)
compared with prediction by Lockwood and Naguib (1975) and the prediction of the eddy break-up model
Source: Magnussen and Hjertager (1976)
The eddy break-up model can also accommodate kinetically controlled
reaction terms. When the combustion processes are kinetically controlled,
the fuel dissipation rate may be expressed by the Arhennius kinetic rate
expression
Ä =−A 4aJbJc exp(−E /R H) (12.166)
fu,kinetic 1 fu ox a u
where A is the pre-exponential constant for the Arrhenius reaction rate; a,
1
band care model constants; Tis the temperature in K; E is the activation
a
energy; and R is the universal gas constant.
u

## 페이지 45
ANIN_C12.qxd 29/12/2006 04:44PM Page 387
12.22 EDDY BREAK-UP MODEL OF COMBUSTION 387
Figure 12.9 Comparison of predictions and experimental data in a furnace simulation (Case 6): radial temperature and
oxygen concentration profiles
Source: Gosman et al. (1978)
Now the reaction rate of fuel is given by
G ε ε J ε J J
Ä =−minH4 C J , 4 C ox, 4 C′ pr , −Ä K (12.167)
fu I k R fu k R s k R 1 +s fu,kineticL
Nickjooy et al. (1988) used the above approach by considering a two-step
global reaction model which included CO formation to predict combusting
flows in axisymmetric combustors. The model constants C , C′, a, b and
R R
c used in their study for the different cases considered can be found in the
above reference. Figure 12.10 shows the predictions reported by Nikjooy
et al. (1988).
The eddy break-up model makes reasonably good predictions and is
fairly straightforward to implement in CFD procedures. However, due to
the dependence of the fuel dissipation rate on the turbulence time scale k/ε,
the quality of the predictions depends on the performance of the turbulence
model. Where a turbulence model fails to make accurate flow predictions the
quality of combustion simulations will, of course, also be limited.

## 페이지 46
ANIN_C12.qxd 29/12/2006 04:44PM Page 388
388 CHAPTER 12 CFD MODELLING OF COMBUSTION
Figure 12.10 A comparison of the calculated and measured mixture fraction (above centre line), fuel and CO (below
centre line) for the Lewis and Smoot (1981) experiment
Source: Nikjooy et al. (1988)
12.23 Eddy dissipation
concept A modified version of the eddy break-up (EBU) model is known as the
eddy dissipation concept (EDC) of Ertesvag and Magnussen (2000). The
EDC model attempts to incorporate the significance of fine structures in a
turbulent reacting flow in which combustion chemistry is important. A com-
prehensive review of the EDC model can be found in Magnussen (2005).
Without giving the conceptual details the model may be summarised as
follows.
In the EDC model the mass fraction occupied by the fine structures is
defined as
AνεD1/2
γ* =4.6B E (12.168)
Ck2F
Here νis kinematic viscosity, kand εare turbulent kinetic energy and dis-
sipation, and 4.6 is a model constant. The reacting fraction of the fine
structure is defined as
J /(1 +s)
χ= pr (12.169)
J +J /(1 +s)
min pr
where J is the product mass fraction and, as in the EBU model,
pr
J =min(J ,J /s). Then the reaction rate for fuel is obtained from
min fu ox
ε A J D A χ D
Ä =−4 C minBJ , oxE B E. (12.170)
fu k EDC C fu s F C1 −γ*χF
Here C is a model constant with a recommended value of 11.2.
EDC
12.24 Laminar flamelet
model All the above models except the equilibrium model either use single-step
combustion or accommodate only a limited degree of combustion chemistry
and do not predict intermediate and minor species. We now discuss the

## 페이지 47
ANIN_C12.qxd 29/12/2006 04:44PM Page 389
12.24 LAMINAR FLAMELET MODEL 389
laminar flamelet model, which is a compromise between simplicity and the
need to account for detailed chemistry. The model views the turbulent flame
as consisting of an ensemble of stretched laminar flamelets. Figure 12.11
shows a schematic sketch of the laminar flamelet concept. Turbulent flames
are described as wrinkled, moving laminar sheets of reaction, and major heat
release is considered to occur in narrow regions in the vicinity of stoichio-
metric surfaces. These are called flamelets, which are considered to be
embedded within the turbulent flow. The approach is based on the notion
that, if the chemical time scales are much shorter than the characteristic
turbulence time scales, the fuel and oxidant react in locally thin one-
dimensional structures normal to the stoichiometric contour, as illustrated
in the inset of Figure 12.11. These structures are assumed to resemble the
flame sheets responsible for combustion in a laminar flame: hence the name
laminar flamelets. In a turbulent flow the flamelets are considered to
be stretched and strained by flow and turbulence. These effects are incor-
porated in the modelling by including appropriate parameters, as we will
see below.
Figure 12.11 Schematic
representation of the laminar
flamelet concept
The properties of laminar flamelets, e.g. the temperature, density and
species mass fractions as a function of the mixture fraction ξ, are evaluated
once and for all outside the flow field calculation to yield a so-called lami-
narflameletlibrary. A library of such relationships used in a calculation is
shown later in an example (see Figure 12.16). The library comprises a set of
relationships φ(ξ) between scalar flow properties φand the mixture fraction
ξ. Their form is similar to Figure 12.2, but turbulence causes the flames to
be stretched, which alters the details of the relationships φ(ξ). To accommo-
date the effect of flame stretching due to the flow field in an actual turbulent
flame, it is common practice to incorporate as a parameter either the strain
rateor the scalardissipationrate, both of which are flow properties, into
the laminar flamelet library calculations.
A key advantage of the laminar flamelet methodology is that detailed
chemistry can be incorporated relatively economically within the calculations,
because the library contains information relating to major species, minor
species, density and temperature. This enables us to evaluate important
aspects of the combustion process such as the formation of pollutants.
Without detailed chemistry it is only possible to calculate flow and approx-
imate energy release due to combustion.
In section 12.25 we give an overview of the methods used to generate
a laminar flamelet library. In section 12.26 we show how Favre-averaged

## 페이지 48
ANIN_C12.qxd 29/12/2006 04:44PM Page 390
390 CHAPTER 12 CFD MODELLING OF COMBUSTION
values of a scalar variable in a turbulent flow field can be calculated from a
knowledge of the values of the mixture fraction ξand the scalar dissipation
rate χand the pdfs G(ξ) and G(χ). In sections 12.27 to 12.29 we discuss how
the formation of pollutants such as NO can be modelled within the laminar
flamelet framework. Finally, in section 12.30 we give an illustrative example
to demonstrate the strengths and weaknesses of the laminar flamelet model.
We summarise the main aspects of the laminar flamelet method from the
work of Peters (1984, 1986), Bray and Peters (1994), Pitsch and Peters
(1998), Williams (2000) and Veynante and Vervisch (2002). The interested
reader is directed to these publications for further details of laminar flamelet
theory for non-premixed combustion.
12.25 Generation of
laminar flamelet Laminar flamelets are generated by solving the one-dimensional governing
libraries equations of non-premixed combustion. The simplest model for counter-flow
diffusion flames assumes a steady state, laminar, stagnation-point flow. The
governing equations for continuity, momentum, chemical species and energy
can be written and solved without much effort. A simple one-dimensional
non-premixed combustion situation is shown in Figure 12.12a, where fuel
and oxidant streams are opposed jets. There are two main methods of pro-
ducing laminar flamelet libraries:
• Method 1: the physical (x–y) co-ordinate system is used to solve
governing equations for opposed flow diffusion flames
• Method 2: the governing equations of opposed flow diffusion flames are
transformed into mixture fraction space and solved
Method 1: Opposed flow diffusion flame configuration
Consider the opposed flow diffusion flame situation shown in Figure 12.12a.
Such a flow might be created using two concentric axisymmetric opposing
nozzles, one delivering fuel and the other delivering oxidant. The configura-
tion produces an axisymmetric flow field with a stagnation plane between
the nozzles as shown. The location of the stagnation plane depends on the
velocities of the two streams, and can be adjusted by varying the velocity of
one stream and keeping the other constant. A diffusion flame is established
between the two nozzles close to the stagnation plane. The position of this
thin flat flame depends on the velocities of the two streams and the proper-
ties of the fuel and oxidant. Since most fuels require more air than fuel by
mass the diffusion flame usually sits on the oxidiser side of the stagnation
plane as shown. For calculation purposes the configuration is considered to
be infinitely wide and axisymmetric. The co-ordinate system used in the
Method 1 formulation is shown in Figure 12.12a. The oxidiser jet is located
at y = ∞ and the fuel jet at y = −∞. The model assumes the flow to be
laminar, stagnation-point flow in cylindrical co-ordinates.
The structure of the flame is obtained by the solution of steady boundary
layer equations written along the stagnation streamline (see Smooke et al.,
1986; Lutz et al., 1997). The method looks for self-similar solutions that
are functions of the co-ordinate perpendicular to the flame, i.e.yonly (note

## 페이지 49
ANIN_C12.qxd 29/12/2006 04:44PM Page 391
12.25 GENERATION OF LAMINAR FLAMELET LIBRARIES 391
Figure 12.12 (a) An opposed
flow flame; (b) Tsuji burner
configuration (after Tsuji and
Yamaoka, 1967)
that y is the axial co-ordinate in this case). In the usual notation the vari-
ables are
ρ=ρ(y)
T =T(y)
Y =Y (y), k=1,..., N
k k

## 페이지 50
ANIN_C12.qxd 29/12/2006 04:44PM Page 392
392 CHAPTER 12 CFD MODELLING OF COMBUSTION
If ydenotes the axial direction and xdenotes the radial direction the steady
state conservation of mass is as follows:
∂(ρux) ∂(ρvx)
+ =0 (12.171)
∂x ∂y
The radial momentum equation is
∂u ∂u ∂G ∂uJ ∂p
ρu +ρv = Hµ K − (12.172)
∂x ∂y ∂yI ∂yL ∂x
The species conservation equation is
∂Y ∂Y ∂
ρu k +ρv k+ (ρY V ) −M =0 k=1, 2,..., N (12.173)
∂x ∂y ∂y k k k
The energy equation is
∂T ∂T 1 ∂A ∂TD ρ ∑ N ∂T
ρu +ρv − Bk E + c YV
∂x ∂y c ∂yC ∂yF c pk k k ∂y
p p k=1
N
1 ∑
+ h M =0 k=1, 2,...,N (12.174)
k k
c
pk=1
The system is closed with the ideal gas law
p(MW)
ρ= mix (12.175)
R T
u
In equations (12.173) and (12.174) the parameter V is known as the
k
diffusion velocity, which considers the diffusion of species. For a multi-
component system the diffusion velocities are given by (see Lutz et al., 1997;
Turns, 2000)
1 ∑ N dX DT 1 ∂T
V =− (MW)D j − k (12.176)
k X (MW) j kj dx ρY T ∂x
k mixj=1 k
where the X denote mole fractions, (MW) molecular weights and D the
k kj
multi-component diffusion coefficient, and DT is an equivalent diffusion
k
coefficient of species k into the rest of the mixture. Since calculations of
laminar flames attempt to consider detailed chemistry, these fine details are
retained in the equations, and detailed transport properties and thermo-
dynamic data calculation routines are also employed in the calculations (see
Rogg and Wang, 1997).
In an opposing flow the free stream radial and axial velocities at the edge
of the boundary layer are given by u = ax and v = −2ay, where a is the
∞ ∞
strain rate. We may now introduce
u u
U(y) = = (12.177)
u ax
∞
V(y) =ρv (12.178)

## 페이지 51
ANIN_C12.qxd 29/12/2006 04:44PM Page 393
12.25 GENERATION OF LAMINAR FLAMELET LIBRARIES 393
Introduction of equations (12.177) and (12.178) transforms the set of equa-
tions (12.171)–(12.175) into a system of ordinary differential equations valid
along the stagnation-point streamline x=0:
dV
+2aρU=0 (12.179)
dy
d G dUJ dU
Hµ K −V +a(ρ −ρU2) =0 (12.180)
∞
dyI dyL dy
d dY
− (ρY V ) −V k +M =0 k=1, 2,..., N (12.181)
k k k
dy dy
∂A ∂TD ∂T ∑ N dT ∑ N
Bk E −cV − ρc Y V − h M =0 (12.182)
∂yC ∂yF p ∂y pk k k dy k k
k=1 k=1
Smooke et al. (1986) stated that the appropriate boundary conditions for the
fuel (fu) and oxidizer (ox) streams are as follows:
Fuel stream, y=−∞: V=V U= ρ /ρ T=T Y =Y
fu ox fu fu k k,fu
Oxidiser stream, y=∞: U=1 T=T Y =Y
ox k k,∞
Symmetry plane, y =0: V=0
The distances y = −∞ and y = +∞ refer to fuel and oxidiser steams. In
practice the infinite interval is truncated and boundary data are supplied at
y = −L (the fuel jet) and y = +L (the oxidiser jet), where the separation
fu ox
distance is 2L=L +L (see Smooke et al., 1986).
fu ox
Inspection of the above equations shows that the velocity gradient or
strain rate a is a parameter of the system of ordinary differential equations
(12.179)–(12.182) – the other quantities are the dependent and independent
variables and thermodynamic or transport properties. To generate laminar
flamelet profiles in the physical space the system is solved for a series of
prescribed values of a corresponding to stretch conditions in practical tur-
bulent flows (a = 0.1 to 5000 s−1). Normally, finite difference techniques
and Newton’s iteration method are used to solve the set of equations.
Another commonly used experimental situation for creating one-
dimensional non-premixed flames is the Tsuji burner shown in Figure
12.12b (after Tsuji and Yamaoka, 1967). An alternative formulation of the
flamelet equations based on Tsuji’s burner configuration, which yields a
slightly different set of ordinary differential equations, is also a popular
method for laminar flamelet calculations.
There are many programs available for laminar flamelet calculations.
RUN1DL (Rogg, 1993; Rogg and Wang, 1997) is widely used for the gener-
ation of laminarflameletprofilesinphysicalspace. Another computer
program for solving counter-flow diffusion flames is the OPPDIF code of
Lutz et al. (1997). By solving the opposed flow laminar flame problem in
physical space the results obtained will give temperature, density, major and
minor species as a function of distance from the stagnation point. A typical
set of calculation results is given in Figure 12.13, which shows the tempera-
ture, density and all species concentrations for an opposed flow laminar flame
with a 1:1 mixture of CH and H as fuel for a strain rate of a =20 s−1.
4 2 s

## 페이지 52
ANIN_C12.qxd 29/12/2006 04:44PM Page 394
394 CHAPTER 12 CFD MODELLING OF COMBUSTION
Figure 12.13 Laminar flamelet
structure of an opposed flow
CH:H (1:1) laminar flame, air
4 2
and fuel temperatures 300 K,
strain rate a=20 s−1, fuel left
hand side, air right hand side,
domain size −15 mm to +15 mm
In combustion procedures we solve the transport equations for mixture
fraction and mixture fraction variance. Flame property relationships, such
as those in Figure 12.2, lack detailed chemistry. The laminar flamelet model
uses the laminar flamelet library as a series of relationships Y = Y (ξ),
k k
T = T(ξ), ρ= ρ(ξ) etc. in the form of a look-up table. This requires us
to convert the solutions of (12.179)–(12.182) in physical space Y = Y (y),
k k
T=T(y), ρ=ρ(y) into the mixture fraction co-ordinate. We note that if we
go in Figure 12.13 from the fuel stream (y=−15 mm) to the oxidiser stream
(y=+15 mm), the mixture fraction will vary from 1 to 0. In between these
extremes the mixture fraction will gradually change. For each flame and
each specific value of the strain rate there will be a one-to-one correspond-
ence between the values of the y-co-ordinate and the local mixture fraction
ξ= ξ(y). For example, the flame is located in the high-temperature region
around y=+5 mm, where the mixture fraction will be close to its stoichio-
metric value, so ξ =ξ(y=5 mm). Thus, the results in Figure 12.13 can in
st
principle be replotted using the mixture fraction as the abscissa.
The most common method of evaluating the mixture fraction ξin com-
busting flows with an arbitrary number of fuel and oxidiser inlet streams is
known as Bilger’smixturefractionformula(Bilger, 1988). It is based on
the notion that species are consumed or produced during chemical reactions,
but chemical elements are conserved during reactions. Mass fractions Z of
chemical elements (e.g. C, H, O) can be obtained from the mass fractions Y
of species containing these elements:
N
∑a W
Z = ij jY (12.183)
j i
MW
i=1 i

## 페이지 53
ANIN_C12.qxd 29/12/2006 04:44PM Page 395
12.25 GENERATION OF LAMINAR FLAMELET LIBRARIES 395
where MW is the molecular weight of species i, W is the atomic weight of
i j
element j, and a is the number of atoms of element j in a molecule of
ij
species i. The summation is carried out over all Nmolecular species. Using
these element mass fractions, Bilger’s formula for the mixture fraction for
the case of a fuel stream that contains only fuel and an oxidiser stream that
contains only element O is as follows:
2Z /W +Z /2W −2(Z −Z )/W
ξ= C C H H O O,ox O (12.184)
2Z /W +Z /2W +2Z /W
C,fu C H,fu H O,ox O
Here fu and oxrefer to fuel and oxidant streams.
If both the fuel and oxygen streams contain the elements C, H, O this can
be written in a slightly modified form as
2(Z −Z )/W +(Z −Z )/2W −2(Z −Z )/W
ξ= C C,ox C H H,ox H O O,ox O (12.185)
2(Z −Z )/W +(Z −Z )/2W −2(Z −Z )/W
C,fu C,ox C H,fu H,ox H O,fu O,ox O
Equation (12.185) can be used at every point of the one-dimensional calcula-
tion domain to obtain the mixture fraction from profiles of species mass
fraction such as those in Figure 12.13. In turn, this enables us to plot tem-
perature, density and species mass fractions as a function of ξ.
These definitions have also been widely used for the interpretation of
experimental data in terms of mixture fraction (Masri et al., 1996; Dally et al.,
1998b; Barlow et al., 2001) as well as in computational studies (Smooke et al.,
1990; Barlow et al., 2000; Hossain and Malalasekera, 2003) and offer a
consistent way of defining mixture fractions, especially for obtaining mixture
fractions from experimental data. Smooke et al. (1986) and Sick et al. (1991)
have used experimental data for strained laminar flame configurations, e.g.
using the Tsuji-type burner or similar to compare with numerical results and
validate the methodology for generating laminar flamelet libraries.
Method 2: Flamelet equations in mixture fraction space
The flamelet equations for temperature and species mass fraction of a
one-dimensional flame can also be derived by using co-ordinate transforma-
tion (of the Crocco type) using mixture fraction ξas the independent
co-ordinate. An opposed-flow diffusion flame is an example of a flame that
can be entirely mapped into mixture fraction space. For details of the devel-
opment of these equations in mixture fraction space the reader is referred to
Peters (1984, 1986), who reviewed laminar flamelet concepts for turbulent
combustion. Without proof we quote from these references the flamelet
equations in mixture fraction space:
∂Y χ∂2Y
Species ρ k −ρ k−M =0 (12.186)
∂t 2 ∂ξ2 k
∂T χ∂2T 1 ∂p ∑ N h
Temperature ρ −ρ − + kM =0 (12.187)
∂t 2 ∂ξ2 c ∂t c k
p k=1 p
The boundary conditions are
Fuel stream, ξ=1.0: T=T Y =Y k=1,..., N
fu k k,fu
Oxidiser stream, ξ=0.0: T=T Y =Y k=1,..., N
ox k k,ox

## 페이지 54
ANIN_C12.qxd 29/12/2006 04:44PM Page 396
396 CHAPTER 12 CFD MODELLING OF COMBUSTION
The initial conditions are known temperatures and mass fraction of the
species at t =0, i.e. T=T , Y =0.233, Y =0.767, Y mass fractions
ambient O N fu
(e.g. Y , Y etc.) are specified us2ing the given2 fuel composition and mass
CH H
fractions 4for al2l other species are set to zero.
In equations (12.186) and (12.187) χis the so-called scalar dissipation rate
(units s−1) and is a parameter of this set of flamelet equations. The equations
are solved in pseudo-transient form, i.e. the transient term is retained, but
we are only interested in the final steady state solution; this model is known
as the steady laminar flamelet model (SLFM).
Equations (12.186)–(12.187) use a mixture fraction defined on the basis
of two streams, fuel and oxidiser, as a co-ordinate whose direction is normal
to the stoichiometric surface ξ=ξ, as shown in Figure 12.12a. In turbulent
st
non-premixed combustion, the reaction zone is considered to be in the im-
mediate vicinity of the high-temperature region close to the stoichiometric
mixture and convected and diffused with the mixture fraction field (Bray and
Peters, 1994).
When the method is used in a CFD computation, influence of the flow
field on the flamelet structure is represented in the above equations by the
local scalar dissipation rate, defined by
G
H
A∂ξD2 A∂ξD2 A∂ξD2J
K
χ=2D ξH
I
B
C∂x
E
F
+ B
C∂y
E
F
+ B
C∂z
E
F
K
L
(12.188)
where x, y, z are the co-ordinate directions and D = Γ /ρis the diffusion
ξ ξ
coefficient for the mixture fraction. The scalar dissipation is the variable
which controls mixing, and represents the gradient of mixture fraction,
which is related to strain. When the flame strain increases, the scalar dissi-
pation rate increases. The scalar dissipation rate implicitly incorporates
convection–diffusion effects normal to the surface of the stoichiometric
mixture (Peters, 1984), and it can be considered as the parameter which
describes the departure from equilibrium chemistry. The reciprocal of scalar
dissipation χ−1is a measure of diffusive time τ. As this time decreases (i.e.
χ
as the value of χincreases) the heat and mass transfer through the stoichio-
metric surface are enhanced (Veynante and Vervisch, 2002). Furthermore, if
χexceeds a critical value a flame extinguishes as heat losses becomes larger
than chemical heat release.
To generate laminar flamelet profiles in mixture fraction space the set
of governing partial differential equations (12.186) and (12.187) is solved
for given initial and boundary conditions for fuel concentration and tem-
perature for a series of prescribed values of the scalar dissipation rate χ.
Different scalar dissipation levels give different flame structures. A very low
scalar dissipation rate (i.e. long diffusion time) means that the combustion
takes place in conditions that are close to equilibrium, whereas a very high
rate means a highly strained flame (close to extinction). Figure 12.16 below
shows a set of flamelet relationships produced by this type of calculation.
The arrows drawn indicate the direction of increasing scalar dissipation rate.
The resulting flamelet library is a collection of temperature, species and
density profiles in the mixture fraction space for different scalar dissipation
rates T(ξ, χ), Y(ξ, χ). The computer program known as FlameMaster by
i
Pitsch (1998) can be used for this.
Finally, it should be noted that equations (12.186)–(12.187) have been
derived neglecting many higher-order terms involving convection and cur-

## 페이지 55
ANIN_C12.qxd 29/12/2006 04:44PM Page 397
12.25 GENERATION OF LAMINAR FLAMELET LIBRARIES 397
vature along the mixture fraction surface. Nevertheless, they have been used
widely (Mauss et al., 1990; Seshadri et al., 1990; Lentini, 1994) to generate
flamelets in mixture fraction space. A more accurate formulation which does
not rely on the above-mentioned assumptions has been presented by Pitsch
and Peters (1998). This new formulation uses a conserved scalar which does
not depend on the two-stream formulation for mixture fraction and also
allows us to incorporate non-unity Lewis numbers.
An example of laminar flamelet relationships
In this example we consider an experimental dataset available in the literature
(and on the Internet, Barlow, 2000) and show how a laminar flamelet library
can be generated for particular flame conditions. The resulting state relation-
ships are compared with experimental data to demonstrate the accuracy and
usefulness of the laminar flamelet relationships. The calculation of field quanti-
ties using the laminar flamelet model will be demonstrated in section 12.30.
We use two popular codes – FlameMaster (Pitsch, 1998) and RUN-1DL
(Rogg, 1993; Rogg and Wang, 1997) – to generate flamelets. The Flame-
Master code uses Method 2 described above; we have used Method 1 with
the RUN-1DL code, i.e. the calculations are performed in physical space. In
RUN-1DL flamelets are generated using physical co-ordinates it is necessary
to convert the results obtained in physical co-ordinates to mixture fraction
space using Bilger’s mixture fraction formula (12.184). The chemical mech-
anism used in the calculation is the detailed mechanism for fuels up to pro-
pane by Peters (1993). The same chemical mechanism was used in both codes.
The experimental dataset considered here is the turbulent flame experi-
ment, Flame B, of Barlow et al. (2000). This experiment and other datasets
have been widely discussed in the ‘Turbulent Non-premixed Flames’ (TNF)
forums. The fuel used is CO/H /N with a volume ratio of 40/30/30. Flow-
2 2
dependent effects are represented by two different parameters, strain rate
and scalar dissipation rate. The scalar dissipation rate χis used in mixture
fraction space and the strain rate ais used in physical space. The expression
which is used to link scalar dissipation rate χ(in axisymmetric cases) to strain
rate ais (Peters, 2000)
2a
χ = sexp{−2[erfc−1(2ξ)]2} (12.189)
st π st
Here χ is the scalar dissipation rate at the location where the mixture frac-
st
tion is stoichiometric and a is the corresponding strain rate in physical space.
s
An alternative expression used for small values of ξis
χ =4aξ2[erfc−1(2ξ)]2 (12.190)
st s st st
where erfc−1 is the inverse of the complementary error function (not the
reciprocal). Barlow et al. (2000) compared laminar flamelet relationships
with their experimental results using two chosen strain rates, a =10 s−1and
s
100 s−1, corresponding to stoichiometric scalar dissipation rates χ =4.6 s−1
st
and 46 s−1, respectively. We have repeated their calculations and show the
comparison between the laminar flamelet relationships and experimental
data at two axial locations of the flame, x/D=20 and 30. The comparison is
made in mixture fraction space.

## 페이지 56
ANIN_C12.qxd 29/12/2006 04:44PM Page 398
398 CHAPTER 12 CFD MODELLING OF COMBUSTION
Figures 12.14a and b show the laminar flamelet relationships for tem-
perature and species mole fractions as functions of the mixture fraction.
Experimentally measured conditional mean and r.m.s. fluctuation values of
temperature and species mole fractions are shown as symbols and error bars,
respectively. The solid lines represent the calculation results. Figure 12.14a
shows the results obtained using the FlameMaster code and Figure 12.14b
shows the results obtained using the RUN-1DL code. It can be seen that
the two methods give remarkably similar results. The agreement between
flamelet profiles and experimental data is excellent at both locations and well
within the experimental error bars. The key inputs for the generation of a
flamelet library are the fuel composition and scalar dissipation rates or strain
rates. The locations and strain rates used here are those quoted by Barlow
et al. (2000). No attempt was made to find the most suitable strain rate for
a given dataset. The close match between the experimental and calculated
values clearly demonstrates the usefulness and accuracy of laminar flamelets
as a means of providing state relationships for combustion calculations in a
turbulent flame.
Figure 12.14 Comparison of laminar flamelet relationships with experimental conditional means for temperature, CO,
2
HO, H and CO for flame B of Barlow et al. (2000): (a) FlameMaster calculations; (b) RUN-1DL calculations
2 2

## 페이지 57
ANIN_C12.qxd 29/12/2006 04:44PM Page 399
12.26 STATISTICS OF THE NON-EQUILIBRIUM PARAMETER 399
12.26 Statistics of the
non-equilibrium In the laminar flamelet model, the thermochemical composition of the
parameter turbulent flame is completely determined by two parameters: (i) the mixture
fraction ξand (ii) a non-equilibrium parameter, the scalar dissipation rate
χ. In turbulent flow fields, these parameters are statistically distributed. To
evaluate mean temperature, density and species mass fractions, it is therefore
necessary to know the statistical distribution of the mixture fraction and the
scalar dissipation rate in the form of a joint pdf G(ξ, χ). The mean scalar
variables are then evaluated from
∞ 1
(cid:1) (cid:1)
É= φ(ξ, χ)G(ξ, χ)dξdχ (12.191)
0 0
In the current laminar flamelet model formulations, it is assumed that the
mixture fraction and the scalar dissipation rate are statistically independent.
This assumption simplifies the formulations, because the average value of a
scalar variable φin a turbulent flow field is now given by
∞ 1
(cid:1) (cid:1)
É= φ(ξ, χ)G(ξ)G(χ)dξdχ (12.192)
0 0
The pdf for mixture fraction is assumed to be a beta function. The pdf of the
scalar dissipation rate is assumed to be a log-normal function, an assump-
tion that is justified by experimental evidence presented in Effelsberg
and Peters (1988). Thus, the two independent pdfs are the beta pdf for the
mixture fraction
ξα−1(1 −ξ)β−1Γ(α+β)
G(ξ) =
Γ(α)Γ(β)
where parameters αand βare calculated using (12.157), and the log-normal
pdf for the scalar dissipation
1 A 1 D
G(χ) = expB− (ln χ−µ)2E
χσ 2ππ C 2σ2 F
where the parameters µand σare related to the first and second moment of
χvia
A 1 D
9=expBµ+ σ2E (12.193)
C 2 F
9″2=92[exp(σ2) −1] (12.194)
The variance 9″2 is not available in this model. Therefore to obtain µand
σit is necessary to specify 9. The mean scalar dissipation rate 9 is usually
modelled as
ε
9=C 7″2 (12.195)
χ
k

## 페이지 58
ANIN_C12.qxd 29/12/2006 04:44PM Page 400
400 CHAPTER 12 CFD MODELLING OF COMBUSTION
Here the model constant C is assigned a value of C =2.0. The variance σ2
χ χ
in the log-normal distribution is set equal to σ2=2.0. Further details of these
two model constants can be found in Peters (1984). By calculating 9 from
equation (12.195) and with the specified value of σ2, the pdf G(χ) can be
evaluated.
A different expression proposed by Bray and Peters (1994) for the scalar
dissipation rate is
ε
9=C (∆ξ) (12.196)
χ st
k
With C =2.0 and (∆ξ) as the range of mixture fraction values within which
χ st
the scalar dissipation process is concentrated, then (∆ξ) is an indication
st
of the thickness of the reaction zone. With the reaction zone centred at the
location ξ=ξ, the thickness of the reaction zone is approximated as
st
(∆ξ) ≈2ξ (12.197)
st st
where ξ is the stoichiometric mixture fraction. This expression has proved
st
to be successful in predicting lift-off heights in jet flames.
To calculate the mean of a variable it is required to evaluate the integral
(12.192). Integration of the β-pdf was discussed before in section 12.20. The
same procedure applies here. Integration with the log-normal pdf G(χ) can
be carried out using the approximation of Lentini (1994). More details of
the origin and the theory of laminar flamelet models can be found in Peters
(1984, 1986), Bray and Peters (1994) and Veynante and Vervisch (2002).
12.27 Pollutant
formation in NO x , SO x , heavy-metal compounds and particles are the main pollutants
combustion formed in combustion. The amount and nature of pollutants formed depend
on the type of fuel, combustion equipment and temperatures used in the
combustion process.
Among the combustion gases:
• NO and SO contribute to acid rain and other environmental effects
x x
• CO contributes to the greenhouse effect
2
NO is of particular concern:
x
• It has an impact on the formation of ozone
• It is linked to the formation of smog
• It is directly responsible for acid rain
• It has a considerable impact on human health since it causes conditions
such as acute respiratory diseases and respiratory infections
The species NO, NO and N O are collectively known as NO and result
2 2 x
from two sources:
• Molecular N (air)
2
• Fuel-bound nitrogen
Formation mechanisms of NO in the combustion process are further
x
classified as follows:

## 페이지 59
ANIN_C12.qxd 29/12/2006 04:44PM Page 401
12.28 MODELLING OF THERMAL NO FORMATION IN COMBUSTION 401
• Thermal NO : This is formed by the direct reaction of molecular
x
nitrogen and oxygen at high flame temperatures, the formation of
which is described by the Zel’dovich mechanism. This will be
discussed further below.
• Prompt NO : This is formed by oxidation of atmospheric nitrogen
x
in the flame front. Prompt NO formation occurs by the reaction of
x
molecular nitrogen with hydrocarbon free radicals in oxygen-deficient
regions of the flame. The mechanism often used to describe prompt NO
formation is called the Fenimore (1970) mechanism, which considers
the rapid formation of NO long before the time required to form
thermal NO. More detailed description of the mechanism and further
details can be found in Turns (2000) and Kuo (2005).
• Fuel NO : This arises due to the presence of nitrogen in the fuels
x
such as heavy oil and coal. Fuel NO formation reactions are not well
x
understood. The principal reaction process appears to be devolatilisation
of fuel nitrogen, forming intermediate compounds such as NO, NO ,
2
NH and HCN. Subsequent N or NO formation depends strongly on
3 2
the fuel/air ratio. In general, a fuel with lower nitrogen content typically
produces less total NO than a fuel with higher nitrogen content.
x
For further details see Kuo (2005).
In addition to these, there is a further route known as the N O intermediate
2
mechanism, which is only important in high pressures. The relative contribu-
tion of different pathways depends on fuel type, temperature, pressure and
residence time. Out of these, thermal NO appears to be the main contributor
in most practical combustion situations. For a more detailed discussion of
NO formation in combustion the reader is referred to Turns (1995, 2000),
x
Warnatz et al. (2001) and Kuo (2005).
12.28 Modelling of
thermal NO Among the NO x components NO is the main pollutant. Thermal NO is
formation in formed by N 2 in the air stream reacting with O 2 at high temperature. The
combustion reaction mechanism of thermal NO formation is well known as the
Zel’dovich mechanism. The key reactions are
(1) O +N bk 1cgNO +N (12.198)
2
(2) N +O bk 2cgNO +O (12.199)
2
(3) N +OH bck 3gNO +H (12.200)
Forward and backward reaction rate constants for these three key reactions
are given in Table 12.4 (Turns, 2000).
Table 12.4
Reaction Forwardreactionrate Backwardreactionrate
constant(m3/(kmol)(s)) constant(m3/(kmol)(s))
1 k =1.8 ×1011exp(−38370/T) k =3.8 ×1010exp(−425/T)
1,f 1,b
2 k =1.8 ×107Texp(−4680/T) k =3.8 ×106T exp(−20820/T)
2,f 2,b
3 k =7.1 ×1010exp(−450/T) k =1.7 ×1011exp(−24560/T)
1,f 1,b

## 페이지 60
ANIN_C12.qxd 29/12/2006 04:44PM Page 402
402 CHAPTER 12 CFD MODELLING OF COMBUSTION
Compare the reaction rate constant of reaction (1) with the reaction
rate constant of a typical intermediate combustion reaction H + O bcg
2
OH + O (see section 12.10). This reaction has a forward reaction rate
constant of k =2.00 ×1014exp(−70.3/T)cm3/mol.s (see Kuo, 2005), requir-
f
ing an activation energy of −585 kJ/kmol. Reaction (1) of the above mech-
anism by contrast has a very high activation energy (E =−319027 kJ/mol)
a
and is sufficiently fast only at high temperatures. It has the slowest rate of the
reaction in the Zel’dovich mechanism and therefore it is the rate-limiting
reaction in the formation of NO. Because of this high-temperature depend-
ence it is a common practice to assume that the thermal NO mechanism is
unimportant below 1800 K. Thermal NO reactions (1)–(3) are much slower
than other combustion reactions, so NO formation takes too long to achieve
equilibrium. Hence, NO concentrations cannot be calculated using equilib-
rium chemistry. The rate of conversion is governed by the gas temperature
(exponentially), residence time of the gas in high-temperature regions, and
excess air levels (affecting oxygen availability). The use of laminar flamelet
concepts for combustion assumes relatively fast chemistry. Even in the
absence of other NO production mechanisms the inclusion of the above
NO equations in a laminar flamelet library calculation does not produce
experimentally observed NO levels (see Drake and Blint, 1989; Sanders and
Gökalap, 1995; Vranos et al., 1992). Laminar flamelet modelling of thermal
NO requires some special treatment, which is explained below. As noted
above, the other two principal mechanisms of NO formation are prompt
(or Fenimore) NO formation and fuel-bound NO formation. These are not
included in the method outlined below.
12.29 Flamelet-based
NO modelling As explained earlier, attempts to obtain concentrations of thermal NO from
a flamelet library can be inaccurate. One way around this problem is to
include an accurate account of the effects of residence time on NO formation
by using the Zel’dovich mechanism in conjunction with a transport equation
for the mass fraction of NO:
∂ ∂ ∂ A µ ∂J D
(4J ) + (4UJ ) = B eff NOE +N (12.201)
∂t NO ∂x j NO ∂x Cσ ∂x F NO
j j NO j
where σ is the turbulent Schmidt number, usually assigned a value of
NO
0.7. The average source term N of the transport equation represents
NO
the mean rate of production of NO, which can be evaluated using the pdf
approach:
∞ 1
(cid:1) (cid:1)
N =4 M (ξ, χ)G(ξ)G(χ)dξdχ (12.202)
NO NO
0 0
where G(ξ) and G(χ) are pdfs introduced in section 12.26. The NO source
term M (ξ, χ) can be generated using the rate constants of equations
NO
(12.198)–(12.200) and (12.69) and (12.71). It is stored in the laminar flamelet
library alongside the flamelet relationships for temperature T(ξ, χ) and
species mass fraction Y(ξ, χ).
i

## 페이지 61
ANIN_C12.qxd 29/12/2006 04:44PM Page 403
12.30 AN EXAMPLE 403
12.30 An example to
illustrate laminar We consider an experimental flame configuration for which a set of well-
flamelet modelling and documented experimental data is available and show the predictions of
NO modelling of a temperature, major and minor species and NO using the laminar flamelet
turbulent flame calculation methodology explained in the above sections. The problem
considered here is the bluff-body CH /H flame experimentally studied by
4 2
Dally et al. (1996, 1998b). This experimental flame is designated as HM1 in the
dataset. The experimental data were provided by Masri (1996) via the Sydney
University website. The bluff body considered here has an outer diameter of
D =50 mm and a concentric fuel jet diameter of D =3.6 mm. The fuel com-
B j
position is 50% by volume CH and 50% by volume H . The mean velocity
4 2
of the fuel jet is 118 m/s and the mean air velocity is 40 m/s. A schematic
diagram of the flame and important zones is shown in Figure 12.15. Further
experimental details are available in the aforementioned references.
Figure 12.15 Schematic
drawing of the bluff body
stabilised flame and measurement
locations
Computational details
The governing differential equations (continuity, momentum, turbulence
variables kand ε, mixture fraction, mixture fraction variance) were solved in
Favre-averaged form by means of an in-house finite volume code based on
the SIMPLE algorithm. The k–εturbulence model was used for turbulence
closure. In section 3.7.2 it was noted that the standard k–εmodel overpredicts
the decay rate and the spreading rate of a round jet. Several modifications to

## 페이지 62
ANIN_C12.qxd 29/12/2006 04:44PM Page 404
404 CHAPTER 12 CFD MODELLING OF COMBUSTION
the k–εmodel are available for correcting this problem (McGuirk and Rodi,
1979; Pope, 1978). In this study the value of constant C in the ε-transport
1ε
equation is modified from 1.44 to 1.60 following the work of Dally et al.
(1998b) and Hossain et al. (2001). Following the International Workshop
on Measurements and Computations of Turbulent Nonpremixed Flames
(TNF) this modification is now recommended practice for modelling bluff-
body flames.
The computational domain has a size of 170 mm in the radial direction
and 216 mm in the axial direction. A grid arrangement with 89 radial and 99
axial nodes was used in all the calculations presented here. Sensitivity tests
were carried out to establish that the grid was sufficiently fine to give accur-
ate results. A fully developed velocity profile was specified as the boundary
condition at the air and fuel inlets.
Prediction of flame structure
The laminar flamelet library for different scalar dissipation rates was generated
using the RUN-1DL program mentioned earlier. The calculations presented
here have been performed using unity Lewis number. Figure 12.16 shows
examples of the laminar flamelet relationships for temperature, CO , H O
2 2
and OH mass fractions. Turbulent combustion calculations are carried out
Figure 12.16 A sample of laminar flamelet profiles

## 페이지 63
ANIN_C12.qxd 29/12/2006 04:44PM Page 405
12.30 AN EXAMPLE 405
by following the methodology explained in sections 12.25 and 12.26. Local
values of the scalar dissipation rate were obtained using the approximate
relationship (12.196)–(12.197). The library stores relationships at discrete
values of scalar dissipation rate χ. Local values of χare likely to be inter-
mediate between those of the library. The appropriate flamelet relationships
required in the calculation process are obtained by linear interpolation of
values from neighbouring library look-up tables.
To illustrate the effectiveness of the laminar flamelet model we present in
Figures 12.17–12.26 a comparison of numerical predictions with a selection
of experimental data in the near field of the burner (i.e. in the region closest
•
Figure 12.17 Mean axial velocity profiles: , measurements; , calculations

## 페이지 64
ANIN_C12.qxd 29/12/2006 04:44PM Page 406
406 CHAPTER 12 CFD MODELLING OF COMBUSTION
to the inlets). To start, we note that it is essential that the flow field is
adequately represented in the simulation, because the mixture fraction stat-
istics completely determine the thermochemical state of the flame. It is even
more important for this CH /H flame, because it has a low stoichiometric
4 2
mixture fraction (ξ = 0.05). As a result, a small error in the flow field will
st
lead to a large error in temperature, species concentrations and location of
the flame front. Figures 12.17 and 12.18 show a comparison between mea-
sured and computed radial profiles of mean axial and radial velocities plotted
at different near-field locations. The mean axial velocity measurements are
•
Figure 12.18 Mean radial velocity profiles: , measurements; , calculations

## 페이지 65
ANIN_C12.qxd 29/12/2006 04:44PM Page 407
12.30 AN EXAMPLE 407
well predicted. The mean radial velocity measurements, which are much
smaller in magnitude, are also well reproduced at all near-field locations.
There is some deviation at locations further downstream (not shown here).
The mean radial velocity measurements show some scatter, which may be
attributed to the inaccuracies in the radial component measurements, as
discussed in Dally et al. (1998b).
Figure 12.19 shows the radial mixture fraction profiles at four axial locations.
The mixture fraction profiles are in excellent agreement with measurements
in the near field (x/D < 0.9). Here D is the bluff-body diameter. Further
•
Figure 12.19 Mean mixture fraction profiles: , measurements; , calculations

## 페이지 66
ANIN_C12.qxd 29/12/2006 04:44PM Page 408
408 CHAPTER 12 CFD MODELLING OF COMBUSTION
downstream (x/D>1.3), the mixture fraction near the axis is underpredicted
(not all the results are shown here). This error can be attributed to the known
overestimation of the spreading rate of the round jet by the k–εturbulence
model as explained earlier. Clearly, the decay rate is not well represented
even after modifying the constant C . Radial profiles of the mixture fraction
1ε
variance are shown in Figure 12.20. Mixture fraction variance is slightly
overpredicted in the near field (x/D<1.3). However, the location of the peak
in the near field is well reproduced.
•
Figure 12.20 Mean mixture fraction variance profiles: , measurements; , calculations

## 페이지 67
ANIN_C12.qxd 29/12/2006 04:44PM Page 409
12.30 AN EXAMPLE 409
Radial temperature profiles are shown in Figure 12.21. The mean tem-
perature distribution is fairly well predicted by the laminar flamelet model.
Further downstream results show a slight overprediction. It is worth men-
tioning that a significant overprediction at x/D=0.26 was also observed by
Dally et al. (1998a). They noted that this might not be due to shortcomings
of the simulation, but caused by averaging effects in the temperature meas-
urements as a result of the intermittency in the flame at these locations.
•
Figure 12.21 Mean temperature profiles: , measurements; , calculations

## 페이지 68
ANIN_C12.qxd 29/12/2006 04:44PM Page 410
410 CHAPTER 12 CFD MODELLING OF COMBUSTION
Radial distributions of the mass fractions of major species CO and
2
H O are shown in Figures 12.22 and 12.23 respectively. Again reasonable
2
agreement with the experimental data is obtained. As mentioned earlier, the
inclusion of detailed chemistry in the laminar flamelet calculation allows us
to predict minor species such as OH and CO. Radial profiles of the mass frac-
tion of OH, which is formed by dissociation in the high-temperature region
of the flame, are shown in Figure 12.24. The experimental data show that the
reaction zone of OH is thin in the near field. The thickness of the reaction
zone increases further downstream. This illustrates that the flamelet model
•
Figure 12.22 Mean CO mass fraction profiles: , measurements; , calculations
2

## 페이지 69
ANIN_C12.qxd 29/12/2006 04:44PM Page 411
12.30 AN EXAMPLE 411
•
Figure 12.23 Mean HO mass fraction profiles: , measurements; , calculations
2
is able to capture the general trends of increasing thickness of the OH reac-
tion zone and the rate of decay of OH in the downstream direction.
Prediction of NO
We have also applied the thermal NO prediction procedure explained in
section 12.29. Figure 12.25 shows the NO source terms N /4as a function
NO
of mixture fraction for different stretch conditions. The figure shows that the
source term is very sensitive to the scalar dissipation rate. At χ=0.064 s−1,

## 페이지 70
ANIN_C12.qxd 29/12/2006 04:44PM Page 412
412 CHAPTER 12 CFD MODELLING OF COMBUSTION
•
Figure 12.24 Mean OH mass fraction profiles: , measurements; , calculations
the source term is negative in the fuel-rich zone (ξ>0.055), indicating con-
sumption of NO. At χ= 0.428 s−1, the negative zone of the source term
almost vanishes, but the peak value remains constant. At scalar dissipation
rates higher than χ=0.428 s−1, the decrease of temperature is more promin-
ent and this reduces the source term rapidly. As the scalar dissipation rate
increases further to χ=77.01 s−1the formation of NO has almost completely
ceased.

## 페이지 71
ANIN_C12.qxd 29/12/2006 04:44PM Page 413
12.30 AN EXAMPLE 413
Figure 12.25 Flamelet profiles
of the NO source term for
different scalar dissipation rates
The comparison between the predictions and the measurements for the
radial mass fraction of NO is shown in Figure 12.26. The flamelet model
seems to underpredict the NO profiles, but it should be noted that we have
only considered thermal NO formed through the Zel’dovich mechanism.
Even though Chen and Chang (1996) have shown that the Zel’dovich mech-
anism is the dominant pathway for the production of NO in a turbulent
CH /H jet flame, it appears that calculations conducted with the thermal
4 2
NO mechanism alone do not give correct NO levels in this flame. This is
further illustrated in this example by considering a more elaborate NO
x
mechanism. Shown by dashed lines in Figure 12.26 is a repeat of the NO
x
calculation using the GRI 2.11 mechanism, which consists of 49 species and
279 reactions. This mechanism includes reactions to represent both thermal
and prompt NO chemistry. It can be seen that the dashed lines are in better
x
agreement with the experimental data than the thermal-only predictions
(solid lines). The trend is also well predicted. There is still some degree of
over-prediction further away from the burner exit. This could be due to dis-
crepancies in temperature predictions seen earlier. Given that the NO mass
fractions are very small, the degree of agreement from the GRI 2.11 predic-
tions seen here could considered to be very good (see Murthy et al., 2006, for
further details).
In summary, we have illustrated how the laminar flame model can be used
to predict important flame properties such as temperature, major species,
minor species and NO. The predictions were compared against reported
experimental data. In the laminar flamelet model, the mean temperature,
density and composition in the turbulent field are obtained by appropriate
averaging of the flamelets. The concentration of NO, however, is calculated
by solving its own transport equation with a source term obtained from the
flamelet library. The flow field is reasonably well reproduced in the calcula-
tion. The temperature and concentration of major and minor species are
also well reproduced by the flamelet model with unity Lewis number. The
prediction of NO is not as good as other species, and it is suggested that
inclusion of other NO production mechanisms can improve NO predictions.

## 페이지 72
ANIN_C12.qxd 29/12/2006 04:44PM Page 414
414 CHAPTER 12 CFD MODELLING OF COMBUSTION
•
Figure 12.26 Mean NO mass fraction profiles: , measurements; , predictions (thermal NO only), ,
predictions including prompt NO
x
Further details of this example and the effects of using differential diffusion
(non-unity Lewis numbers) can be found in Hossain and Malalasekera
(2003) and Hossain (1999). The quality of the results presented in this exam-
ple is very similar to that of Kim and Huh (2002), who used the conditional
moment closure (CMC) method. Overall, laminar flamelet model predic-
tions are very good, and the ability to incorporate detailed chemistry at an
acceptable cost allows us to predict minor species and pollutants, which is a
major advantage over simpler models such as SCRC.

## 페이지 73
ANIN_C12.qxd 29/12/2006 04:44PM Page 415
12.32 MODELLING OF PREMIXED COMBUSTION 415
12.31 Other models
for non-premixed There are several other modelling concepts available for non-premixed
combustion combustion modelling. Among them, the conditional moment closure (CMC)
model, pdf transport models and flame surface density models have been
demonstrated to be successful in predicting turbulent combustion. It is
beyond the scope of this chapter to describe these models in detail. The
interested reader should consult the relevant literature. For the CMC model,
Bilger (1993), Smith et al. (1992), Klimenko and Bilger (1999) and Kim and
Huh (2002); for pdf transport models, Pope (1985, 1990, 1991) and Dopazo
(1994); and for the flame surface density models, Marble and Broadwell (1977),
Blunsdon et al. (1996), Beeri et al. (1996) and Veynante and Vervisch (2002)
provide details and example applications. There is also growing interest in
large eddy simulation (LES) models for turbulent combustion. Details can
be found in Poinsot and Veynante, (2005), DesJardin and Frankel (1998),
Cook and Riley (1998), Branley and Jones (2001) and Selle et al. (2004).
12.32 Modelling
of premixed As mentioned in the introduction to this chapter, fuel and air are mixed prior
combustion to combustion in premixed combustion. The strength of the mixture may be
expressed by the equivalence ratio. During combustion in a premixed flame,
the flame front propagates at a certain speed and leaves burnt products
behind the flame front. In premixed combustion, laminar and turbulent
flame speeds and a parameter known as the reaction progress variable are
used to formulate models. If we define T as the temperature of unburnt gas,
u
T as the temperature of burnt gas and Tas the flame temperature, then the
b
reaction progress variable cis defined as
T−T
c= u (12.203)
T −T
b u
Sometimes the same reaction progress variable (c) is defined as
Y −Yu
c= F F (12.204)
Yb−Yu
F F
where Y, Yu and Yb are local, unburnt and burnt fuel mass fractions,
F F F
respectively. With these definitions the value of the reaction progress vari-
able is zero where the mixture is unburnt and unity where the mixture is fully
burnt. It can be shown that, like mixture fraction in non-premixed combus-
tion, the reaction progress variable cin premixed combustion is governed by
the following transport equation (see Veynante and Vervisch, 2002):
∂ ∂ ∂A ∂cD
ρc+ ρuc= BρD E +M (12.205)
∂t ∂x i ∂x C ∂xF
i i i
Special variants of the main combustion models for diffusion flames
(presumed-pdf, laminar flamelet, flame surface density, eddy break-up model
etc.) have been formulated for premixed combustion. As we mentioned
at the beginning of this chapter, we do not intend to describe the details of
premixed combustion models here, and the interested reader is referred,
among others, to Peters (1986), Veynante and Vervisch (2002) and Poinsot
and Veynante (2005) for further details.

## 페이지 74
ANIN_C12.qxd 29/12/2006 04:44PM Page 416
416 CHAPTER 12 CFD MODELLING OF COMBUSTION
12.33 Summary
At the start of this chapter we introduced some basic thermodynamic and
chemical kinetics concepts useful for the CFD combustion modeller. We
have shown in detail how the fast chemistry assumption can be used to
simplify combustion calculations, and demonstrated and its direct applica-
tion to a laminar flame was demonstrated. The basics of chemical kinetics
and reaction rates were introduced, and the advantage of using reduced
mechanisms over detailed chemical mechanisms was discussed. The com-
plexities arising from turbulent non-premixed combustion modelling were
discussed, and the advantages of employing Favre-averaged equations were
explained. The probability density function approach for the calculation of
mean quantities in turbulent combusting flows was discussed in detail. We
have also shown how the fast chemistry assumption can be used in conjunc-
tion with the pdf approach to calculate mean temperatures and species mass
fractions. Some other approaches, such as the eddy break-up model, equi-
librium models etc., were briefly discussed, and the need to incorporate some
degree of detailed chemistry in order to be able to predict minor species was
highlighted. Finally, we introduced the concepts of the laminar flamelet
model, which allows the use of detailed chemistry. We discussed in some
detail the methods for generating laminar flamelet libraries and calculating
mean variables in the laminar flamelet method and showed how pollutant
concentrations could be evaluated. A complete example illustrating the use
of the laminar flamelet model was presented. Other models available for
turbulent combustion were mentioned, along with a brief description of the
main features of models for premixed combustion. This chapter should be
useful for novice combustion modellers wishing to gain some overall under-
standing of the basic approach used in CFD. In the interest of brevity many
intermediate details have been omitted in the presentation of various con-
cepts. The reader should follow up appropriate references and gather full
details in order to understand the finer points of various models.
